import { useState, useEffect } from 'react';
import axios from 'axios';
import { useWakuDiscovery } from '../hooks/useWakuDiscovery';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const IPFS_API = import.meta.env.VITE_IPFS_API_URL || 'http://localhost:5001';

interface PublishResult {
  site_cid?: string;
  manifest_cid?: string;
  onion_url?: string;
}

interface WordPressMirror {
  id: string;
  name: string;
  path: string;
  createdAt: number;
  size: number;
  fileCount?: number;
  ipfsCid?: string;
  isPinned?: boolean;
}

interface MirrorJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: number;
  completedAt?: number;
  error?: string;
}

function PublishTab() {
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasKeypair, setHasKeypair] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  
  // WordPress Mirror state
  const [wpMirrors, setWpMirrors] = useState<WordPressMirror[]>([]);
  const [selectedMirror, setSelectedMirror] = useState<string | null>(null);
  const [currentJob, setCurrentJob] = useState<MirrorJob | null>(null);
  const [mirrorLoading, setMirrorLoading] = useState(false);
  const [mirrorError, setMirrorError] = useState<string | null>(null);
  
  // Onion URL state
  const [onionUrl, setOnionUrl] = useState<string | null>(null);
  const [onionLoading, setOnionLoading] = useState(true);

  // Publication metadata
  const [publicationTitle, setPublicationTitle] = useState<string>('');
  const [publicationDescription, setPublicationDescription] = useState<string>('');
  const [publicationTags, setPublicationTags] = useState<string>('');

  // Waku discovery hook
  const { publishManifest, nodeStatus, error: wakuError } = useWakuDiscovery(false);

  useEffect(() => {
    fetchWordPressMirrors();
    fetchOnionUrl();
  }, []);

  // Fetch onion URL from backend
  const fetchOnionUrl = async () => {
    try {
      setOnionLoading(true);
      const response = await axios.get(`${API_URL}/api/mirror/onion-url`);
      if (response.data.success && response.data.onionUrl) {
        setOnionUrl(response.data.onionUrl);
      }
    } catch (err: any) {
      console.error('Failed to fetch onion URL:', err);
      // Don't show error, onion service might not be ready yet
    } finally {
      setOnionLoading(false);
    }
  };

  // Get CID from IPFS using the onion address
  const getCIDFromIPFS = async (): Promise<string | null> => {
    try {
      // The IPFS container adds content to MFS at /site/{onion_address}
      // We need to get the onion address to construct the correct path
      
      // First, get the onion URL if we don't have it cached
      let currentOnionUrl = onionUrl;
      if (!currentOnionUrl) {
        try {
          const onionResponse = await axios.get(`${API_URL}/api/mirror/onion-url`);
          if (onionResponse.data.success && onionResponse.data.onionUrl) {
            currentOnionUrl = onionResponse.data.onionUrl;
          }
        } catch (err) {
          console.log('Could not fetch onion URL for CID lookup');
          return null;
        }
      }
      
      if (!currentOnionUrl) {
        console.log('No onion URL available for CID lookup');
        return null;
      }
      
      // Extract onion address (remove http:// and .onion)
      const onionAddress = currentOnionUrl.replace('http://', '').replace('.onion', '').trim();
      const mfsPath = `/site/${onionAddress}.onion`;
      
      console.log(`Querying IPFS MFS path: ${mfsPath}`);
      
      // Try to get the CID from MFS (Mutable File System)
      const response = await axios.post(`${IPFS_API}/api/v0/files/stat?arg=${encodeURIComponent(mfsPath)}`);
      
      if (response.data && response.data.Hash) {
        console.log(`✓ Got CID for ${mfsPath}:`, response.data.Hash);
        return response.data.Hash;
      }
      return null;
    } catch (err: any) {
      // MFS path might not exist yet
      console.log(`No CID yet for mirror:`, err.message);
      return null;
    }
  };

  // Fetch WordPress mirrors from backend and enrich with IPFS CIDs
  const fetchWordPressMirrors = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/mirror/sites`);
      const sites = response.data.sites || [];
      
      // Fetch IPFS CID (same for all mirrors since they share the same onion address)
      const cid = await getCIDFromIPFS();
      
      const sitesWithCIDs = sites.map((site: WordPressMirror) => ({
        ...site,
        ipfsCid: cid || site.ipfsCid, // Use fetched CID or existing one
        isPinned: !!cid, // If we got a CID, it's pinned
      }));
      
      setWpMirrors(sitesWithCIDs);
      
      // Auto-select the most recent mirror if available
      if (sitesWithCIDs.length > 0) {
        setSelectedMirror(sitesWithCIDs[0].id);
      }
    } catch (err: any) {
      console.error('Failed to fetch WordPress mirrors:', err);
      // Don't set error here, mirrors might not exist yet
    }
  };

  // Start WordPress mirror
  const startWordPressMirror = async () => {
    try {
      setMirrorLoading(true);
      setMirrorError(null);
      const response = await axios.post(`${API_URL}/api/mirror/start`);
      
      if (response.data.success) {
        const jobId = response.data.jobId;
        
        // Poll job status
        pollJobStatus(jobId);
      }
    } catch (err: any) {
      console.error('Failed to start mirror:', err);
      setMirrorError(err.response?.data?.message || err.message || 'Failed to start mirror');
      setMirrorLoading(false);
    }
  };

  // Poll job status
  const pollJobStatus = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`${API_URL}/api/mirror/status/${jobId}`);
        const job = response.data;
        setCurrentJob(job);

        if (job.status === 'completed') {
          clearInterval(interval);
          setCurrentJob(null);
          setMirrorLoading(false);
          // Refresh the list
          await fetchWordPressMirrors();
        } else if (job.status === 'failed') {
          clearInterval(interval);
          setMirrorError(job.error || 'Mirror job failed');
          setCurrentJob(null);
          setMirrorLoading(false);
        }
      } catch (err) {
        console.error('Failed to poll job status:', err);
        clearInterval(interval);
        setCurrentJob(null);
        setMirrorLoading(false);
      }
    }, 2000);
  };

  const handleGenerateKeypair = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/generate-keypair`);
      setPublicKey(response.data.publicKey);
      setHasKeypair(true);
      setError(null);
    } catch (err: any) {
      console.error('Failed to generate keypair:', err);
      setError(err.response?.data?.error || err.message);
    }
  };

  const handlePublish = async () => {
    if (!hasKeypair && !publicKey) {
      setError('Please generate a keypair first');
      return;
    }

    if (!selectedMirror) {
      setError('Please create a WordPress mirror first');
      return;
    }

    if (!publicationTitle.trim()) {
      setError('Please provide a title for your publication');
      return;
    }

    console.log(selectedMirror);

    // Get the selected mirror's IPFS CID
    let mirror = wpMirrors.find(m => m.id === selectedMirror);
    
    // If no CID yet, try fetching it directly from IPFS
    if (!mirror?.ipfsCid) {
      console.log('No CID found, fetching from IPFS...');
      const cid = await getCIDFromIPFS();
      if (cid && mirror) {
        // Update the mirror with the fetched CID
        const updatedMirror: WordPressMirror = { ...mirror, ipfsCid: cid, isPinned: true };
        mirror = updatedMirror;
        // Update state
        setWpMirrors(prev => prev.map(m => m.id === selectedMirror ? updatedMirror : m));
      }
    }


    try {
      setPublishing(true);
      setError(null);

      // Step 1: Sign manifest and publish to IPFS (on-chain)
      console.log('📝 Step 1: Signing manifest and publishing to IPFS...');
      const signResponse = await axios.post(`${API_URL}/api/sign-manifest`, {
        site_cid: mirror?.ipfsCid,
      });

      const manifestCid = signResponse.data.manifest_cid;
      const siteCid = mirror?.ipfsCid;
      const signature = signResponse.data.signature;
      const onionUrlFromBackend = signResponse.data.onion_url;

      console.log('✅ Manifest signed and published to IPFS:', manifestCid);

      // Step 2: Announce via Waku discovery network
      console.log('📡 Step 2: Announcing to Waku discovery network...');
      
      // Parse tags from comma-separated string
      const parsedTags = publicationTags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      try {
        await publishManifest({
          cid: manifestCid,
          site_cid: siteCid || '',
          pubkey: publicKey || signResponse.data.manifest.publisher,
          signature: signature,
          title: publicationTitle.trim(),
          description: publicationDescription.trim() || undefined,
          tags: parsedTags.length > 0 ? parsedTags : undefined,
          onion_url: onionUrlFromBackend,
          mirror_count: 0,
        });
        console.log('✅ Announced to Waku network');
      } catch (wakuErr: any) {
        console.error('⚠️ Waku announcement failed (continuing anyway):', wakuErr);
        // Don't fail the whole process if Waku fails
      }

      setPublishResult({
        site_cid: siteCid,
        manifest_cid: manifestCid,
        onion_url: onionUrlFromBackend,
      });
      
      // Clear publication metadata after successful publish
      setPublicationTitle('');
      setPublicationDescription('');
      setPublicationTags('');
      
      // Refresh mirrors to show updated status
      await fetchWordPressMirrors();
    } catch (err: any) {
      console.error('Failed to publish:', err);
      setError(err.response?.data?.error || err.response?.data?.message || err.message);
    } finally {
      setPublishing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="p-6 sm:p-8 md:p-10 lg:p-12">
      <h2 className="text-2xl font-semibold text-[#37322F] mb-6 font-sans">Publish Content</h2>

      {/* Onion URL Display */}
      <div className="mb-8 p-6 bg-[#F7F5F3] rounded-lg border border-[#E0DEDB]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-[#37322F] mb-2 font-sans flex items-center gap-2">
              <span className="text-xl">🧅</span>
              Tor Onion Address
            </h3>
            {onionLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#37322F]"></div>
                <span className="text-sm text-[#605A57]">Fetching onion address...</span>
              </div>
            ) : onionUrl ? (
              <>
                <div className="flex items-center gap-2 p-3 bg-white rounded-md border border-[#E0DEDB] mb-2">
                  <code className="flex-1 text-sm font-mono text-[#37322F] break-all">
                    {onionUrl}
                  </code>
                  <button
                    onClick={() => copyToClipboard(onionUrl)}
                    className="px-3 py-1.5 bg-[#E0DEDB] text-[#37322F] rounded text-xs font-medium hover:bg-[#EAE8E3] transition-colors flex-shrink-0"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-[#605A57]">
                  Your WordPress site is accessible via Tor at this address. Share this with readers who want anonymous access.
                </p>
              </>
            ) : (
              <p className="text-sm text-[#605A57]">
                Onion service not available yet. Make sure the onionize container is running.
              </p>
            )}
          </div>
          <button
            onClick={fetchOnionUrl}
            disabled={onionLoading}
            className="px-4 py-2 bg-[#37322F] text-white rounded-full text-sm font-medium hover:bg-[#49423D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            {onionLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* WordPress Mirror Section */}
      <div className="mb-8 p-6 bg-[#F7F5F3] rounded-lg border border-[#E0DEDB]">
        <h3 className="text-lg font-semibold text-[#37322F] mb-4 font-sans">Step 1: Mirror WordPress Site</h3>
        <p className="text-sm text-[#605A57] mb-4">
          First, create a static mirror of your WordPress site. This will download all pages and assets.
        </p>

        {mirrorError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{mirrorError}</p>
          </div>
        )}

        {currentJob && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Mirroring in progress...
                </p>
                <p className="text-xs text-blue-700">
                  Status: {currentJob.status}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <button
            onClick={startWordPressMirror}
            disabled={mirrorLoading}
            className={`px-6 py-3 rounded-full font-medium text-sm transition-colors ${
              mirrorLoading
                ? 'bg-[#E0DEDB] text-[#828387] cursor-not-allowed'
                : 'bg-[#37322F] text-white hover:bg-[#49423D]'
            }`}
          >
            {mirrorLoading ? 'Mirroring...' : 'Create New Mirror'}
          </button>

          {wpMirrors.length > 0 && (
            <div className="flex-1">
              <label className="block text-xs text-[#828387] mb-2">
                Or select existing mirror:
              </label>
              <select
                value={selectedMirror || ''}
                onChange={(e) => setSelectedMirror(e.target.value)}
                className="w-full px-3 py-2 border border-[#E0DEDB] rounded-md text-sm bg-white"
              >
                {wpMirrors.map((mirror) => (
                  <option key={mirror.id} value={mirror.id}>
                    {mirror.name} - {formatBytes(mirror.size)} - {formatDate(mirror.createdAt)}
                    {mirror.ipfsCid ? ' ✓ Published' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {wpMirrors.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#E0DEDB]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-[#828387]">Available Mirrors:</p>
              <button
                onClick={fetchWordPressMirrors}
                className="text-xs text-[#37322F] underline hover:text-[#49423D]"
              >
                Refresh CIDs
              </button>
            </div>
            <div className="space-y-2">
              {wpMirrors.slice(0, 3).map((mirror) => (
                <div key={mirror.id} className="flex items-center justify-between p-2 bg-white rounded border border-[#E0DEDB]">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#37322F]">{mirror.name}</p>
                    <p className="text-xs text-[#828387]">
                      {formatBytes(mirror.size)} • {mirror.fileCount || 0} files • {formatDate(mirror.createdAt)}
                    </p>
                    {mirror.ipfsCid && (
                      <p className="text-xs text-[#828387] mt-1 font-mono">
                        CID: {mirror.ipfsCid.substring(0, 20)}...
                      </p>
                    )}
                  </div>
                  {mirror.ipfsCid ? (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      ✓ Published
                    </span>
                  ) : (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                      Pending
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Keypair Section */}
      <div className="mb-8 p-6 bg-[#F7F5F3] rounded-lg border border-[#E0DEDB]">
        <h3 className="text-lg font-semibold text-[#37322F] mb-4 font-sans">Step 2: Identity & Keys</h3>
        
        {!hasKeypair && !publicKey ? (
          <div>
            <p className="text-sm text-[#605A57] mb-4">
              Generate an Ed25519 keypair to sign your publications and establish your identity.
            </p>
            <button
              onClick={handleGenerateKeypair}
              className="px-6 py-3 bg-[#37322F] text-white rounded-full font-medium text-sm hover:bg-[#49423D] transition-colors"
            >
              Generate Keypair
            </button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-[#605A57] mb-2">Public Key (Identity):</p>
            <div className="flex items-center gap-2 p-3 bg-white rounded-md border border-[#E0DEDB]">
              <code className="flex-1 text-xs font-mono text-[#37322F] break-all">
                {publicKey || 'Generated'}
              </code>
              <button
                onClick={() => publicKey && copyToClipboard(publicKey)}
                className="px-3 py-1.5 bg-[#F7F5F3] text-[#37322F] rounded text-xs font-medium hover:bg-[#E0DEDB] transition-colors"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-[#828387] mt-2">
              ✓ Keypair generated and stored securely
            </p>
          </div>
        )}
      </div>

      {/* Publishing Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-[#37322F] mb-4 font-sans">Step 3: Sign & Announce</h3>
        <p className="text-sm text-[#605A57] mb-4">
          Your mirror is automatically published to IPFS every 60 seconds. The CID is fetched directly from IPFS. Create a signed manifest and announce your content to the discovery network.
        </p>

        {/* Waku Status Indicator */}
        <div className="mb-4 p-3 bg-white border border-[#E0DEDB] rounded-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              nodeStatus === 'healthy' ? 'bg-green-500' :
              nodeStatus === 'minimal' ? 'bg-yellow-500' :
              nodeStatus === 'unhealthy' ? 'bg-red-500' :
              'bg-gray-400'
            }`}></div>
            <span className="text-xs text-[#605A57]">
              Waku Discovery Network: {
                nodeStatus === 'healthy' ? '🟢 Connected & Healthy' :
                nodeStatus === 'minimal' ? '🟡 Connected (Minimal)' :
                nodeStatus === 'unhealthy' ? '🔴 Disconnected' :
                '⚪ Connecting...'
              }
            </span>
          </div>
          {wakuError && (
            <span className="text-xs text-red-600">
              Error: {wakuError.message}
            </span>
          )}
        </div>

        {/* Publication Metadata */}
        <div className="mb-4 p-4 bg-white border border-[#E0DEDB] rounded-md">
          <h4 className="text-sm font-semibold text-[#37322F] mb-3">Publication Metadata</h4>
          <p className="text-xs text-[#605A57] mb-3">
            Add details about your publication. This information will be included in the signed manifest and visible in the discovery network.
          </p>
          
          <div className="space-y-3">
            {/* Title */}
            <div>
              <label className="block text-xs text-[#828387] mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={publicationTitle}
                onChange={(e) => setPublicationTitle(e.target.value)}
                placeholder="e.g., My WordPress Blog"
                className="w-full px-3 py-2 border border-[#E0DEDB] rounded-md text-sm focus:outline-none focus:border-[#37322F] bg-white"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs text-[#828387] mb-1">
                Description (optional)
              </label>
              <textarea
                value={publicationDescription}
                onChange={(e) => setPublicationDescription(e.target.value)}
                placeholder="e.g., A censorship-resistant blog covering technology and freedom"
                rows={2}
                className="w-full px-3 py-2 border border-[#E0DEDB] rounded-md text-sm focus:outline-none focus:border-[#37322F] bg-white resize-none"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs text-[#828387] mb-1">
                Tags (optional, comma-separated)
              </label>
              <input
                type="text"
                value={publicationTags}
                onChange={(e) => setPublicationTags(e.target.value)}
                placeholder="e.g., blog, technology, freedom"
                className="w-full px-3 py-2 border border-[#E0DEDB] rounded-md text-sm focus:outline-none focus:border-[#37322F] bg-white"
              />
              <p className="text-xs text-[#828387] mt-1">
                Separate tags with commas. Tags help others discover your content.
              </p>
            </div>
          </div>
        </div>
        
        {!selectedMirror && wpMirrors.length === 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              ⚠️ Please create a WordPress mirror first (Step 1)
            </p>
          </div>
        )}

        <button
          onClick={handlePublish}
          disabled={publishing || (!hasKeypair && !publicKey) || !selectedMirror || !publicationTitle.trim()}
          className={`px-6 py-3 rounded-full font-medium text-sm transition-colors ${
            publishing || (!hasKeypair && !publicKey) || !selectedMirror || !publicationTitle.trim()
              ? 'bg-[#E0DEDB] text-[#828387] cursor-not-allowed'
              : 'bg-[#37322F] text-white hover:bg-[#49423D]'
          }`}
        >
          {publishing ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Signing & Announcing...
            </span>
          ) : (
            'Sign & Announce'
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Publish Results */}
      {publishResult && (
        <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-lg font-semibold text-green-900 mb-4 font-sans">
            ✓ Signed & Announced Successfully!
          </h3>
          
          <div className="space-y-4">
            {publishResult.site_cid && (
              <div>
                <p className="text-sm text-green-800 font-medium mb-2">Site CID:</p>
                <div className="flex items-center gap-2 p-3 bg-white rounded-md border border-green-300">
                  <code className="flex-1 text-xs font-mono text-green-900 break-all">
                    {publishResult.site_cid}
                  </code>
                  <button
                    onClick={() => copyToClipboard(publishResult.site_cid!)}
                    className="px-3 py-1.5 bg-green-100 text-green-900 rounded text-xs font-medium hover:bg-green-200 transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <a
                  href={`https://ipfs.io/ipfs/${publishResult.site_cid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-green-700 underline mt-1 inline-block"
                >
                  View on IPFS Gateway →
                </a>
              </div>
            )}

            {publishResult.manifest_cid && (
              <div>
                <p className="text-sm text-green-800 font-medium mb-2">Manifest CID:</p>
                <div className="flex items-center gap-2 p-3 bg-white rounded-md border border-green-300">
                  <code className="flex-1 text-xs font-mono text-green-900 break-all">
                    {publishResult.manifest_cid}
                  </code>
                  <button
                    onClick={() => copyToClipboard(publishResult.manifest_cid!)}
                    className="px-3 py-1.5 bg-green-100 text-green-900 rounded text-xs font-medium hover:bg-green-200 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}

            {publishResult.onion_url && (
              <div>
                <p className="text-sm text-green-800 font-medium mb-2">Tor Onion URL:</p>
                <div className="flex items-center gap-2 p-3 bg-white rounded-md border border-green-300">
                  <code className="flex-1 text-xs font-mono text-green-900 break-all">
                    {publishResult.onion_url}
                  </code>
                  <button
                    onClick={() => copyToClipboard(publishResult.onion_url!)}
                    className="px-3 py-1.5 bg-green-100 text-green-900 rounded text-xs font-medium hover:bg-green-200 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}

            <p className="text-sm text-green-700 pt-4 border-t border-green-200">
              Your content has been published and announced to the discovery network. Other nodes can now discover and mirror your publication.
            </p>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 p-6 bg-white border border-[#E0DEDB] rounded-lg">
        <h3 className="text-base font-semibold text-[#37322F] mb-3 font-sans">How it works</h3>
        <ol className="space-y-2 text-sm text-[#605A57]">
          <li className="flex items-start gap-2">
            <span className="font-semibold text-[#37322F]">1.</span>
            <span>Your WordPress site is mirrored as static files using wget via Tor</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-[#37322F]">2.</span>
            <span>The static files are automatically added to IPFS and pinned (synced every 60 seconds)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-[#37322F]">3.</span>
            <span>You generate an Ed25519 keypair for signing your publications</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-[#37322F]">4.</span>
            <span>You add publication metadata (title, description, tags) to help others discover your content</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-[#37322F]">5.</span>
            <span>A manifest.json is created with your metadata and signed with your private key</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-[#37322F]">6.</span>
            <span>The signed manifest is published to IPFS (on-chain storage)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-[#37322F]">7.</span>
            <span>The manifest is announced to the Waku discovery network via ReliableChannel</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-[#37322F]">8.</span>
            <span>Discovery nodes fetch, verify, and pin your content for resilience</span>
          </li>
        </ol>
      </div>
    </div>
  );
}

export default PublishTab;

