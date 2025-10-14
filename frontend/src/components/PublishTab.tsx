import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

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

  useEffect(() => {
    fetchWordPressMirrors();
  }, []);

  // Fetch WordPress mirrors from backend
  const fetchWordPressMirrors = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/mirror/sites`);
      setWpMirrors(response.data.sites || []);
      
      // Auto-select the most recent mirror if available
      if (response.data.sites && response.data.sites.length > 0) {
        setSelectedMirror(response.data.sites[0].id);
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

    // Get the selected mirror's IPFS CID
    const mirror = wpMirrors.find(m => m.id === selectedMirror);
    if (!mirror?.ipfsCid) {
      setError('Mirror not yet published to IPFS. Please wait for automatic IPFS sync (happens every 60 seconds).');
      return;
    }

    try {
      setPublishing(true);
      setError(null);

      // Sign manifest with the automatically published IPFS CID
      const signResponse = await axios.post(`${API_URL}/api/sign-manifest`, {
        site_cid: mirror.ipfsCid,
      });

      setPublishResult({
        site_cid: mirror.ipfsCid,
        manifest_cid: signResponse.data.manifest_cid,
        onion_url: signResponse.data.onion_url,
      });
      
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
            <p className="text-xs text-[#828387] mb-2">Available Mirrors:</p>
            <div className="space-y-2">
              {wpMirrors.slice(0, 3).map((mirror) => (
                <div key={mirror.id} className="flex items-center justify-between p-2 bg-white rounded border border-[#E0DEDB]">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#37322F]">{mirror.name}</p>
                    <p className="text-xs text-[#828387]">
                      {formatBytes(mirror.size)} • {mirror.fileCount || 0} files • {formatDate(mirror.createdAt)}
                    </p>
                  </div>
                  {mirror.ipfsCid && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Published
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
          Your mirror is automatically published to IPFS every 60 seconds. Create a signed manifest and announce your content to the discovery network.
        </p>
        
        {!selectedMirror && wpMirrors.length === 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              ⚠️ Please create a WordPress mirror first (Step 1)
            </p>
          </div>
        )}

        <button
          onClick={handlePublish}
          disabled={publishing || (!hasKeypair && !publicKey) || !selectedMirror}
          className={`px-6 py-3 rounded-full font-medium text-sm transition-colors ${
            publishing || (!hasKeypair && !publicKey) || !selectedMirror
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
            <span>Your WordPress site is mirrored as static files using wget</span>
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
            <span>A manifest.json is created with metadata and signed with your private key</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-[#37322F]">5.</span>
            <span>The manifest is announced to the discovery network via libp2p pubsub</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-[#37322F]">6.</span>
            <span>Discovery nodes fetch, verify, and pin your content for resilience</span>
          </li>
        </ol>
      </div>
    </div>
  );
}

export default PublishTab;

