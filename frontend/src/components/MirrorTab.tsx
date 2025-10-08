import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface MirroredContent {
  cid: string;
  site_cid: string;
  pubkey: string;
  title?: string;
  size?: number;
  pinned_at: number;
}

function MirrorTab() {
  const [mirrors, setMirrors] = useState<MirroredContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchMirrors();
  }, []);

  const fetchMirrors = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/manifests`);
      setMirrors(response.data.manifests || []);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch mirrors:', err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMirror = async (manifestCid: string) => {
    try {
      setActionLoading(manifestCid);
      await axios.post(`${API_URL}/api/mirror`, { cid: manifestCid });
      await fetchMirrors();
      setError(null);
    } catch (err: any) {
      console.error('Failed to mirror content:', err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnpin = async (cid: string) => {
    if (!confirm('Are you sure you want to stop mirroring this content?')) {
      return;
    }

    try {
      setActionLoading(cid);
      await axios.delete(`${API_URL}/api/mirror/${cid}`);
      await fetchMirrors();
      setError(null);
    } catch (err: any) {
      console.error('Failed to unpin content:', err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="p-6 sm:p-8 md:p-10 lg:p-12">
      <h2 className="text-2xl font-semibold text-[#37322F] mb-6 font-sans">Mirror Management</h2>

      <div className="mb-8 p-6 bg-[#F7F5F3] rounded-lg border border-[#E0DEDB]">
        <h3 className="text-lg font-semibold text-[#37322F] mb-3 font-sans">What is Mirroring?</h3>
        <p className="text-sm text-[#605A57] mb-3">
          When you mirror a publication, you pin its content to your local IPFS node. This helps keep the content available on the network, even if the original publisher goes offline.
        </p>
        <p className="text-sm text-[#605A57]">
          You're helping build a resilient, censorship-resistant network by becoming a mirror for content you value.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#37322F]"></div>
        </div>
      ) : mirrors.length === 0 ? (
        <div className="text-center py-12 px-6 bg-white rounded-lg border border-[#E0DEDB]">
          <p className="text-[#605A57] text-base mb-2">No mirrored content yet</p>
          <p className="text-[#828387] text-sm mb-6">
            Visit the Explore tab to discover and mirror publications
          </p>
          <button
            onClick={() => window.location.hash = 'explore'}
            className="px-6 py-2 bg-[#37322F] text-white rounded-full font-medium text-sm hover:bg-[#49423D] transition-colors"
          >
            Explore Network
          </button>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-[#F7F5F3] rounded-lg border border-[#E0DEDB]">
              <p className="text-xs text-[#828387] mb-1">Total Mirrors</p>
              <p className="text-2xl font-semibold text-[#37322F]">{mirrors.length}</p>
            </div>
            <div className="p-4 bg-[#F7F5F3] rounded-lg border border-[#E0DEDB]">
              <p className="text-xs text-[#828387] mb-1">Total Storage</p>
              <p className="text-2xl font-semibold text-[#37322F]">
                {formatBytes(mirrors.reduce((acc, m) => acc + (m.size || 0), 0))}
              </p>
            </div>
            <div className="p-4 bg-[#F7F5F3] rounded-lg border border-[#E0DEDB]">
              <p className="text-xs text-[#828387] mb-1">Status</p>
              <p className="text-2xl font-semibold text-green-600">Active</p>
            </div>
          </div>

          {/* Mirrored Content List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#37322F] font-sans">Your Mirrors</h3>
            {mirrors.map((mirror) => (
              <div
                key={mirror.cid}
                className="p-5 bg-white rounded-lg border border-[#E0DEDB] hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-[#37322F] mb-2 font-sans">
                      {mirror.title || 'Untitled Publication'}
                    </h4>
                    <div className="flex flex-wrap gap-3 text-xs text-[#828387]">
                      <span>Size: {formatBytes(mirror.size)}</span>
                      <span>•</span>
                      <span>Pinned: {new Date(mirror.pinned_at * 1000).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUnpin(mirror.cid)}
                      disabled={actionLoading === mirror.cid}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                        actionLoading === mirror.cid
                          ? 'bg-[#E0DEDB] text-[#828387] cursor-not-allowed border-[#E0DEDB]'
                          : 'bg-white text-red-600 hover:bg-red-50 border-red-200'
                      }`}
                    >
                      {actionLoading === mirror.cid ? 'Unpinning...' : 'Stop Mirroring'}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-[#828387] mb-1">Site CID:</p>
                    <code className="block text-xs font-mono text-[#605A57] bg-[#F7F5F3] p-2 rounded border border-[#E0DEDB] break-all">
                      {mirror.site_cid}
                    </code>
                  </div>
                  <div>
                    <p className="text-xs text-[#828387] mb-1">Publisher:</p>
                    <code className="block text-xs font-mono text-[#605A57] bg-[#F7F5F3] p-2 rounded border border-[#E0DEDB] break-all">
                      {mirror.pubkey}
                    </code>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-[#E0DEDB]">
                  <a
                    href={`https://ipfs.io/ipfs/${mirror.site_cid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#37322F] underline hover:text-[#49423D]"
                  >
                    View on IPFS Gateway →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Mirror Settings */}
      <div className="mt-8 p-6 bg-white border border-[#E0DEDB] rounded-lg">
        <h3 className="text-base font-semibold text-[#37322F] mb-4 font-sans">Mirror Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-[#F7F5F3] rounded-md">
            <div>
              <p className="text-sm font-medium text-[#37322F]">Auto-mirror from curators</p>
              <p className="text-xs text-[#828387]">Automatically mirror content from trusted curators</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#37322F]"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-[#F7F5F3] rounded-md">
            <div>
              <p className="text-sm font-medium text-[#37322F]">Storage limit</p>
              <p className="text-xs text-[#828387]">Maximum storage for mirrored content</p>
            </div>
            <select className="px-3 py-1.5 border border-[#E0DEDB] rounded-md text-sm bg-white">
              <option>10 GB</option>
              <option>25 GB</option>
              <option>50 GB</option>
              <option>100 GB</option>
              <option>Unlimited</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MirrorTab;

