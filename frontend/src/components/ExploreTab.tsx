import { useState } from 'react';
import { useWakuDiscovery } from '../hooks/useWakuDiscovery';

function ExploreTab() {
  // Use Waku for discovery (with simulation enabled for testing)
  const { manifests, isLoading, error, nodeStatus, simulatePublish } = useWakuDiscovery(true);
  
  const [searchTag, setSearchTag] = useState('');
  const [sortBy, setSortBy] = useState<'timestamp' | 'mirrors'>('timestamp');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Filter will be applied in sortedManifests below
  };

  // Filter by tag and sort
  const filteredManifests = searchTag
    ? manifests.filter(m => m.tags?.some(tag => tag.toLowerCase().includes(searchTag.toLowerCase())))
    : manifests;

  const sortedManifests = [...filteredManifests].sort((a, b) => {
    if (sortBy === 'timestamp') {
      return b.timestamp - a.timestamp;
    } else {
      return (b.mirror_count || 0) - (a.mirror_count || 0);
    }
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="p-6 sm:p-8 md:p-10 lg:p-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-[#37322F] font-sans">Explore Network</h2>
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${
            isLoading ? 'bg-yellow-500' : error ? 'bg-red-500' : 'bg-green-500'
          } animate-pulse`}></div>
          <span className="text-xs text-[#605A57]">Waku: {nodeStatus}</span>
        </div>
      </div>

      {/* Publish Controls */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm text-blue-800 font-semibold mb-1">
              {nodeStatus === 'simulation' ? '🧪 Simulation Mode' : '🌐 Waku Network'}
            </p>
            <p className="text-xs text-blue-700">
              Total discovered: <strong>{manifests.length}</strong> publications
              {nodeStatus !== 'simulation' && ` • Status: ${nodeStatus}`}
            </p>
          </div>
          <button
            onClick={simulatePublish}
            className="px-5 py-2 bg-blue-600 text-white rounded-full font-medium text-sm hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
          >
            📢 {nodeStatus === 'simulation' ? 'Simulate' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <input
            type="text"
            placeholder="Search by tag..."
            value={searchTag}
            onChange={(e) => setSearchTag(e.target.value)}
            className="flex-1 px-4 py-2 border border-[#E0DEDB] rounded-full text-sm focus:outline-none focus:border-[#37322F] bg-white"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-[#37322F] text-white rounded-full font-medium text-sm hover:bg-[#49423D] transition-colors"
          >
            Search
          </button>
        </form>
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'timestamp' | 'mirrors')}
          className="px-4 py-2 border border-[#E0DEDB] rounded-full text-sm focus:outline-none focus:border-[#37322F] bg-white"
        >
          <option value="timestamp">Sort by Recent</option>
          <option value="mirrors">Sort by Mirrors</option>
        </select>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Waku node: {error.toString()}. Using simulated data.
          </p>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#37322F]"></div>
        </div>
      ) : sortedManifests.length === 0 ? (
        <div className="text-center py-12 px-6 bg-[#F7F5F3] rounded-lg border border-[#E0DEDB]">
          <p className="text-[#605A57] text-base mb-2">No publications discovered yet</p>
          <p className="text-[#828387] text-sm">
            Publications will appear here once they're announced to the network
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {sortedManifests.map((manifest) => (
            <div
              key={manifest.cid}
              className="p-6 bg-[#F7F5F3] rounded-lg border border-[#E0DEDB] hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#37322F] mb-2 font-sans">
                    {manifest.title || 'Untitled Publication'}
                  </h3>
                  {manifest.description && (
                    <p className="text-sm text-[#605A57] mb-3">{manifest.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {manifest.tags && manifest.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-white rounded-full text-xs font-medium text-[#37322F] border border-[#E0DEDB]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:items-end">
                  <span className="text-xs text-[#828387]">
                    {new Date(manifest.timestamp * 1000).toLocaleDateString()}
                  </span>
                  {manifest.mirror_count !== undefined && (
                    <span className="text-xs text-[#605A57] bg-white px-3 py-1 rounded-full border border-[#E0DEDB]">
                      🪞 {manifest.mirror_count} mirrors
                    </span>
                  )}
                </div>
              </div>

              {/* CIDs */}
              <div className="space-y-2 mb-4">
                <div>
                  <p className="text-xs text-[#828387] mb-1">Site CID:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs font-mono text-[#37322F] bg-white p-2 rounded border border-[#E0DEDB] break-all">
                      {manifest.site_cid}
                    </code>
                    <button
                      onClick={() => copyToClipboard(manifest.site_cid)}
                      className="px-2 py-1 bg-white text-[#37322F] rounded text-xs font-medium hover:bg-[#E0DEDB] transition-colors border border-[#E0DEDB]"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-[#828387] mb-1">Publisher (Public Key):</p>
                  <code className="block text-xs font-mono text-[#605A57] bg-white p-2 rounded border border-[#E0DEDB] break-all">
                    {manifest.pubkey}
                  </code>
                </div>

                {manifest.onion_url && (
                  <div>
                    <p className="text-xs text-[#828387] mb-1">Tor Onion URL:</p>
                    <code className="block text-xs font-mono text-[#605A57] bg-white p-2 rounded border border-[#E0DEDB] break-all">
                      {manifest.onion_url}
                    </code>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <a
                  href={`https://ipfs.io/ipfs/${manifest.site_cid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[#37322F] text-white rounded-full text-sm font-medium hover:bg-[#49423D] transition-colors"
                >
                  View on IPFS →
                </a>
                {manifest.onion_url && (
                  <button
                    onClick={() => copyToClipboard(manifest.onion_url!)}
                    className="px-4 py-2 bg-white text-[#37322F] rounded-full text-sm font-medium hover:bg-[#E0DEDB] transition-colors border border-[#E0DEDB]"
                  >
                    Copy Onion URL
                  </button>
                )}
                <button
                  className="px-4 py-2 bg-white text-[#37322F] rounded-full text-sm font-medium hover:bg-[#E0DEDB] transition-colors border border-[#E0DEDB]"
                >
                  🪞 Become a Mirror
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="mt-8 p-6 bg-white border border-[#E0DEDB] rounded-lg">
        <h3 className="text-base font-semibold text-[#37322F] mb-3 font-sans">About Discovery with Waku</h3>
        <p className="text-sm text-[#605A57] mb-3">
          Publications are announced to the network via <strong>Waku</strong> (a privacy-preserving libp2p pubsub protocol). Discovery nodes listen for announcements, fetch and verify manifests, then pin the content to IPFS.
        </p>
        <p className="text-sm text-[#605A57] mb-3">
          Each publication is cryptographically signed by the publisher's Ed25519 key, ensuring authenticity and preventing tampering.
        </p>
        <p className="text-xs text-[#828387]">
          Waku provides store-and-relay capabilities, allowing nodes to retrieve historical messages even when publishers are offline.
        </p>
      </div>
    </div>
  );
}

export default ExploreTab;

