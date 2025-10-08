import { useState } from 'react';
import { Link } from 'react-router';
import { useWakuDiscovery } from '../hooks/useWakuDiscovery';

function LandingPage() {
  // Use Waku for discovery (with simulation enabled for testing)
  const { manifests, isLoading, error, nodeStatus, simulatePublish } = useWakuDiscovery(false);
  
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
    <div className="w-full min-h-screen relative bg-[#F7F5F3] overflow-x-hidden flex flex-col justify-start items-center">
      <div className="relative flex flex-col justify-start items-center w-full">
        {/* Main container */}
        <div className="w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-0 lg:max-w-[1060px] lg:w-[1060px] relative flex flex-col justify-start items-start min-h-screen">
          {/* Left vertical line */}
          <div className="w-[1px] h-full absolute left-4 sm:left-6 md:left-8 lg:left-0 top-0 bg-[rgba(55,50,47,0.12)] shadow-[1px_0px_0px_white] z-0"></div>

          {/* Right vertical line */}
          <div className="w-[1px] h-full absolute right-4 sm:right-6 md:right-8 lg:right-0 top-0 bg-[rgba(55,50,47,0.12)] shadow-[1px_0px_0px_white] z-0"></div>

          <div className="self-stretch pt-[9px] overflow-hidden flex flex-col justify-center items-center gap-4 sm:gap-6 md:gap-8 relative z-10">
            {/* Navigation Header */}
            <div className="w-full h-12 sm:h-14 md:h-16 lg:h-[84px] absolute left-0 top-0 flex justify-center items-center z-20 px-6 sm:px-8 md:px-12 lg:px-0">
              <div className="w-full h-0 absolute left-0 top-6 sm:top-7 md:top-8 lg:top-[42px] border-t border-[rgba(55,50,47,0.12)] shadow-[0px_1px_0px_white]"></div>

              <div className="w-full max-w-[calc(100%-32px)] sm:max-w-[calc(100%-48px)] md:max-w-[calc(100%-64px)] lg:max-w-[700px] lg:w-[700px] h-10 sm:h-11 md:h-12 py-1.5 sm:py-2 px-3 sm:px-4 md:px-4 pr-2 sm:pr-3 bg-[#F7F5F3] backdrop-blur-sm shadow-[0px_0px_0px_2px_white] overflow-hidden rounded-[50px] flex justify-between items-center relative z-30">
                <div className="flex justify-center items-center">
                  <div className="flex justify-start items-center">
                    <div className="flex flex-col justify-center text-[#2F3037] text-sm sm:text-base md:text-lg lg:text-xl font-medium leading-5 font-sans">
                      FreePress
                    </div>
                  </div>
                  <div className="pl-3 sm:pl-4 md:pl-5 lg:pl-5 flex justify-start items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${
                      isLoading ? 'bg-yellow-500' : error ? 'bg-red-500' : 'bg-green-500'
                    } animate-pulse`}></div>
                    <div className="flex flex-col justify-center text-[rgba(49,45,43,0.80)] text-xs md:text-[13px] font-medium leading-[14px] font-sans">
                      Waku: {nodeStatus}
                    </div>
                  </div>
                </div>
                <div className="h-6 sm:h-7 md:h-8 flex justify-start items-start gap-2 sm:gap-3">
                  <Link 
                    to="/dashboard"
                    className="px-2 sm:px-3 md:px-[14px] py-1 sm:py-[6px] bg-[#37322F] text-white shadow-[0px_1px_2px_rgba(55,50,47,0.12)] overflow-hidden rounded-full flex justify-center items-center hover:bg-[#49423D] transition-colors"
                  >
                    <div className="flex flex-col justify-center text-xs md:text-[13px] font-medium leading-5 font-sans">
                      Publisher Dashboard →
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Hero Section */}
            <div className="pt-16 sm:pt-20 md:pt-24 lg:pt-[120px] pb-8 sm:pb-12 md:pb-16 flex flex-col justify-start items-center px-2 sm:px-4 md:px-8 lg:px-0 w-full">
              <div className="w-full max-w-[937px] lg:w-[937px] flex flex-col justify-center items-center gap-3 sm:gap-4 md:gap-5 lg:gap-6 mb-12">
                <div className="text-center flex justify-center flex-col text-[#37322F] text-[24px] xs:text-[28px] sm:text-[36px] md:text-[52px] lg:text-[64px] font-normal leading-[1.1] sm:leading-[1.15] md:leading-[1.2] font-serif px-2 sm:px-4 md:px-0">
                  Discover the Uncensored Web
                </div>
                <div className="text-center flex justify-center flex-col text-[rgba(55,50,47,0.80)] sm:text-lg md:text-xl leading-[1.4] sm:leading-[1.45] md:leading-[1.5] font-sans px-2 sm:px-4 md:px-0 lg:text-base font-medium text-sm">
                  Explore publications from the FreePress network — resilient, censorship-proof content that can't be taken down.
                </div>
              </div>

              {/* Publish Controls */}
              <div className="w-full max-w-[960px] lg:w-[960px] mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
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
                    className="px-6 py-3 bg-blue-600 text-white rounded-full font-medium text-sm hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    📢 {nodeStatus === 'simulation' ? 'Simulate' : 'Publish'}
                  </button>
                </div>
              </div>

              {/* Search and Filter */}
              <div className="w-full max-w-[960px] lg:w-[960px] mb-8 flex flex-col sm:flex-row gap-4">
                <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                  <input
                    type="text"
                    placeholder="Search by tag..."
                    value={searchTag}
                    onChange={(e) => setSearchTag(e.target.value)}
                    className="flex-1 px-6 py-3 border border-[#E0DEDB] rounded-full text-sm focus:outline-none focus:border-[#37322F] bg-white shadow-[0px_0px_0px_2px_rgba(255,255,255,0.08)]"
                  />
                  <button
                    type="submit"
                    className="px-8 py-3 bg-[#37322F] text-white rounded-full font-medium text-sm hover:bg-[#49423D] transition-colors shadow-[0px_0px_0px_2.5px_rgba(255,255,255,0.08)_inset]"
                  >
                    Search
                  </button>
                </form>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'timestamp' | 'mirrors')}
                  className="px-6 py-3 border border-[#E0DEDB] rounded-full text-sm focus:outline-none focus:border-[#37322F] bg-white shadow-[0px_0px_0px_2px_rgba(255,255,255,0.08)]"
                >
                  <option value="timestamp">Sort by Recent</option>
                  <option value="mirrors">Sort by Mirrors</option>
                </select>
              </div>

              {/* Error Display */}
              {error && (
                <div className="w-full max-w-[960px] lg:w-[960px] mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Waku node error: {error.toString()}. Using simulated data for testing.
                  </p>
                </div>
              )}

              {/* Loading State */}
              {isLoading ? (
                <div className="w-full max-w-[960px] lg:w-[960px] flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#37322F]"></div>
                </div>
              ) : sortedManifests.length === 0 ? (
                <div className="w-full max-w-[960px] lg:w-[960px] text-center py-20 px-6 bg-white rounded-lg border border-[#E0DEDB] shadow-[0px_0px_0px_0.9056603908538818px_rgba(0,0,0,0.08)]">
                  <h3 className="text-[#605A57] text-xl mb-3 font-semibold">No publications discovered yet</h3>
                  <p className="text-[#828387] text-base mb-8">
                    Publications will appear here once they're announced to the network
                  </p>
                  <Link
                    to="/dashboard"
                    className="inline-block px-8 py-3 bg-[#37322F] text-white rounded-full font-medium text-sm hover:bg-[#49423D] transition-colors"
                  >
                    Publish Your Own Content →
                  </Link>
                </div>
              ) : (
                <div className="w-full max-w-[960px] lg:w-[960px] grid grid-cols-1 gap-6">
                  {sortedManifests.map((manifest) => (
                    <div
                      key={manifest.cid}
                      className="p-8 bg-white rounded-lg border border-[#E0DEDB] hover:shadow-lg transition-shadow shadow-[0px_0px_0px_0.9056603908538818px_rgba(0,0,0,0.08)]"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                        <div className="flex-1">
                          <h2 className="text-2xl font-semibold text-[#37322F] mb-3 font-serif">
                            {manifest.title || 'Untitled Publication'}
                          </h2>
                          {manifest.description && (
                            <p className="text-base text-[#605A57] mb-4 leading-relaxed">{manifest.description}</p>
                          )}
                          <div className="flex flex-wrap gap-2 mb-4">
                            {manifest.tags && manifest.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-4 py-1.5 bg-[#F7F5F3] rounded-full text-xs font-medium text-[#37322F] border border-[#E0DEDB]"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 sm:items-end">
                          <span className="text-sm text-[#828387]">
                            {new Date(manifest.timestamp * 1000).toLocaleDateString()}
                          </span>
                          {manifest.mirror_count !== undefined && (
                            <span className="text-sm text-[#605A57] bg-[#F7F5F3] px-4 py-1.5 rounded-full border border-[#E0DEDB]">
                              🪞 {manifest.mirror_count} mirrors
                            </span>
                          )}
                        </div>
                      </div>

                      {/* CIDs - Collapsible */}
                      <details className="mb-6">
                        <summary className="cursor-pointer text-sm text-[#605A57] hover:text-[#37322F] mb-2 font-medium">
                          View Technical Details
                        </summary>
                        <div className="space-y-3 mt-4 p-4 bg-[#F7F5F3] rounded-lg">
                          <div>
                            <p className="text-xs text-[#828387] mb-1">Site CID:</p>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 text-xs font-mono text-[#37322F] bg-white p-2 rounded border border-[#E0DEDB] break-all">
                                {manifest.site_cid}
                              </code>
                              <button
                                onClick={() => copyToClipboard(manifest.site_cid)}
                                className="px-3 py-1.5 bg-white text-[#37322F] rounded text-xs font-medium hover:bg-[#E0DEDB] transition-colors border border-[#E0DEDB]"
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
                      </details>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-3">
                        <a
                          href={`https://ipfs.io/ipfs/${manifest.site_cid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-6 py-3 bg-[#37322F] text-white rounded-full text-sm font-medium hover:bg-[#49423D] transition-colors shadow-[0px_0px_0px_2.5px_rgba(255,255,255,0.08)_inset]"
                        >
                          Read on IPFS →
                        </a>
                        {manifest.onion_url && (
                          <button
                            onClick={() => copyToClipboard(manifest.onion_url!)}
                            className="px-6 py-3 bg-white text-[#37322F] rounded-full text-sm font-medium hover:bg-[#E0DEDB] transition-colors border border-[#E0DEDB]"
                          >
                            Copy .onion URL
                          </button>
                        )}
                        <Link
                          to="/dashboard"
                          className="px-6 py-3 bg-white text-[#37322F] rounded-full text-sm font-medium hover:bg-[#E0DEDB] transition-colors border border-[#E0DEDB]"
                        >
                          🪞 Mirror This
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Info Box */}
              <div className="w-full max-w-[960px] lg:w-[960px] mt-12 p-8 bg-white border border-[#E0DEDB] rounded-lg shadow-[0px_0px_0px_0.9056603908538818px_rgba(0,0,0,0.08)]">
                <h3 className="text-xl font-semibold text-[#37322F] mb-4 font-sans">About the Network</h3>
                <p className="text-base text-[#605A57] mb-4 leading-relaxed">
                  FreePress is a decentralized publishing network where content lives on IPFS and is discovered through <strong>Waku</strong> (libp2p pubsub). Each publication is cryptographically signed by its publisher, ensuring authenticity without central authorities.
                </p>
                <p className="text-base text-[#605A57] mb-6 leading-relaxed">
                  When you mirror content, you help keep it available even if the original publisher goes offline. Together, we build a resilient, censorship-resistant web.
                </p>
                <Link
                  to="/dashboard"
                  className="inline-block px-8 py-3 bg-[#37322F] text-white rounded-full font-medium text-sm hover:bg-[#49423D] transition-colors shadow-[0px_0px_0px_2.5px_rgba(255,255,255,0.08)_inset]"
                >
                  Start Publishing →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-[rgba(55,50,47,0.12)] bg-white py-8 mt-16">
        <div className="max-w-[1060px] mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="text-sm text-[#605A57] mb-1">
                FreePress v0.1.0 - Private, Censorship-Proof Publishing
              </p>
              <p className="text-xs text-[#828387]">
                Built with IPFS, libp2p, Tor, and Ed25519 signatures
              </p>
            </div>
            <div className="flex gap-4">
              <Link to="/dashboard" className="text-sm text-[#37322F] hover:underline">
                Publisher Dashboard
              </Link>
              <a href="#" className="text-sm text-[#37322F] hover:underline">
                Documentation
              </a>
              <a href="#" className="text-sm text-[#37322F] hover:underline">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;

