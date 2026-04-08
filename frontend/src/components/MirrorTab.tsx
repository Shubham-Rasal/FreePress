import { useState, useEffect } from 'react';
import axios from 'axios';

const IPFS_API_URL = 'http://localhost:5001';
const BACKEND_API_URL = 'http://localhost:4000';

interface MirroredContent {
  cid: string;
  site_cid: string;
  pubkey: string;
  title?: string;
  size?: number;
  pinned_at: number;
}

interface IPFSFileLink {
  Name: string;
  Hash: string;
  Size: number;
  Type: number;
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

function MirrorTab() {
  const [mirrors] = useState<MirroredContent[]>([]);
  const [ipfsFiles, setIpfsFiles] = useState<IPFSFileLink[]>([]);
  const [, setWpMirrors] = useState<WordPressMirror[]>([]);
  // const [currentJob, setCurrentJob] = useState<MirrorJob | null>(null);
  // const [loading, setLoading] = useState(true);
  const [ipfsLoading, setIpfsLoading] = useState(true);
  const [, setWpLoading] = useState(true);
  const [error] = useState<string | null>(null);
  const [ipfsError, setIpfsError] = useState<string | null>(null);
  const [, setWpError] = useState<string | null>(null);
  const [actionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchIPFSFiles();
    fetchWordPressMirrors();
  }, []);



  // Fetch WordPress mirrors from backend
  const fetchWordPressMirrors = async () => {
    try {
      setWpLoading(true);
      const response = await axios.get(`${BACKEND_API_URL}/api/mirror/sites`);
      setWpMirrors(response.data.sites || []);
      setWpError(null);
    } catch (err: any) {
      console.error('Failed to fetch WordPress mirrors:', err);
      setWpError(err.response?.data?.message || err.message || 'Failed to connect to backend');
    } finally {
      setWpLoading(false);
    }
  };

  const fetchIPFSFiles = async () => {
    try {
      setIpfsLoading(true);
      
      // Step 1: Get MFS /site directory stat to get the directory CID
      const statResponse = await axios.post(
        `${IPFS_API_URL}/api/v0/files/stat?arg=/site`,
        null,
        {
          headers: {
            'Accept': '*/*',
            'Origin': 'http://localhost:5173'
          }
        }
      );

      console.log('IPFS stat response:', statResponse.data);

      // Step 2: If it's a directory, list its contents using the Hash
      const files: IPFSFileLink[] = [];
      
      if (statResponse.data && statResponse.data.Type === 'directory' && statResponse.data.Hash) {
        const dirCID = statResponse.data.Hash;
        
        // Use /api/v0/ls to list directory contents
        const lsResponse = await axios.post(
          `${IPFS_API_URL}/api/v0/ls?arg=${dirCID}`,
          null,
          {
            headers: {
              'Accept': '*/*'
            }
          }
        );

        console.log('IPFS ls response:', lsResponse.data);

        // Parse the ls response - format: { Objects: [{ Hash: "...", Links: [...] }] }
        if (lsResponse.data && lsResponse.data.Objects && lsResponse.data.Objects.length > 0) {
          const rootObject = lsResponse.data.Objects[0];
          if (rootObject.Links && Array.isArray(rootObject.Links)) {
            rootObject.Links.forEach((link: IPFSFileLink) => {
              files.push({
                Name: link.Name,
                Hash: link.Hash,
                Size: link.Size,
                Type: link.Type
              });
            });
          }
        }
      }
      
      setIpfsFiles(files);
      setIpfsError(null);
    } catch (err: any) {
      console.error('Failed to fetch IPFS files:', err);
      
      // Handle case where /site directory doesn't exist yet
      if (err.response?.data?.Message?.includes('file does not exist') || 
          err.response?.data?.Message?.includes('no link named')) {
        setIpfsFiles([]);
        setIpfsError(null); // Not an error, just empty directory
      } else {
        setIpfsError(err.response?.data?.Message || err.message || 'Failed to connect to IPFS node');
      }
    } finally {
      setIpfsLoading(false);
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
      
        <>

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
                        onClick={() => {}}
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
                  <p className="text-xs text-[#828387] mb-2">View content on:</p>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={`https://ipfs.io/ipfs/${mirror.site_cid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#37322F] underline hover:text-[#49423D]"
                    >
                      ipfs.io →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      

      {/* IPFS Added Content */}
      <div className="mt-8 p-6 bg-white border border-[#E0DEDB] rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-[#37322F] font-sans">IPFS Added Content</h3>
          <button
            onClick={fetchIPFSFiles}
            disabled={ipfsLoading}
            className="px-4 py-2 text-sm bg-[#37322F] text-white rounded-full hover:bg-[#49423D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {ipfsLoading ? 'Refreshing...' : 'Refresh Files'}
          </button>
        </div>

        {ipfsError && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              ⚠️ {ipfsError}
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              Make sure the IPFS node is running and accessible at {IPFS_API_URL}
            </p>
          </div>
        )}

        {ipfsLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#37322F]"></div>
          </div>
        ) : ipfsFiles.length === 0 ? (
          <div className="text-center py-8 px-6 bg-[#F7F5F3] rounded-lg">
            <p className="text-[#605A57] text-sm">No files found in IPFS MFS /site directory</p>
            <p className="text-xs text-[#828387] mt-2">
              The mirrored WordPress site will appear here automatically (synced every 60 seconds)
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-[#605A57] mb-3">
              Total files: <span className="font-semibold text-[#37322F]">{ipfsFiles.length}</span>
            </p>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {ipfsFiles.map((file, index) => (
                <div
                  key={`${file.Hash}-${index}`}
                  className="p-4 bg-[#F7F5F3] rounded-md border border-[#E0DEDB] hover:bg-[#F0EDEA] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          file.Type === 1 
                            ? 'bg-blue-100 text-blue-800' 
                            : file.Type === 2
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {file.Type === 1 ? 'Directory' : file.Type === 2 ? 'File' : `Type ${file.Type}`}
                        </span>
                        <span className="text-xs text-[#828387]">
                          {formatBytes(file.Size)}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-[#37322F] mb-1">
                        {file.Name}
                      </p>
                      <code className="block text-xs font-mono text-[#605A57] break-all mb-2">
                        {file.Hash}
                      </code>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <a
                          href={`https://ipfs.io/ipfs/${file.Hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#37322F] hover:text-[#49423D] underline"
                          title="View on ipfs.io gateway"
                        >
                          ipfs.io →
                        </a>
                       
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

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

