import { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface PublishResult {
  site_cid?: string;
  manifest_cid?: string;
  onion_url?: string;
}

function PublishTab() {
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasKeypair, setHasKeypair] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);

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

    try {
      setPublishing(true);
      setError(null);

      // Step 1: Export and add to IPFS
      const exportResponse = await axios.post(`${API_URL}/api/publish`);
      
      // Step 2: Sign manifest
      const signResponse = await axios.post(`${API_URL}/api/sign-manifest`, {
        site_cid: exportResponse.data.site_cid,
      });

      setPublishResult({
        site_cid: exportResponse.data.site_cid,
        manifest_cid: signResponse.data.manifest_cid,
        onion_url: exportResponse.data.onion_url,
      });
    } catch (err: any) {
      console.error('Failed to publish:', err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setPublishing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="p-6 sm:p-8 md:p-10 lg:p-12">
      <h2 className="text-2xl font-semibold text-[#37322F] mb-6 font-sans">Publish Content</h2>

      {/* Keypair Section */}
      <div className="mb-8 p-6 bg-[#F7F5F3] rounded-lg border border-[#E0DEDB]">
        <h3 className="text-lg font-semibold text-[#37322F] mb-4 font-sans">Identity & Keys</h3>
        
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
        <h3 className="text-lg font-semibold text-[#37322F] mb-4 font-sans">Publish to IPFS</h3>
        <p className="text-sm text-[#605A57] mb-4">
          Export your WordPress content, add it to IPFS, and create a signed manifest. Your content will be announced to the discovery network.
        </p>
        
        <button
          onClick={handlePublish}
          disabled={publishing || (!hasKeypair && !publicKey)}
          className={`px-6 py-3 rounded-full font-medium text-sm transition-colors ${
            publishing || (!hasKeypair && !publicKey)
              ? 'bg-[#E0DEDB] text-[#828387] cursor-not-allowed'
              : 'bg-[#37322F] text-white hover:bg-[#49423D]'
          }`}
        >
          {publishing ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Publishing...
            </span>
          ) : (
            'Publish Now'
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
            ✓ Published Successfully!
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
            <span>Your WordPress site is exported as static files</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-[#37322F]">2.</span>
            <span>Files are added to IPFS and pinned locally</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-[#37322F]">3.</span>
            <span>A manifest.json is created with metadata and signed with your private key</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-[#37322F]">4.</span>
            <span>The manifest is announced to the discovery network via libp2p pubsub</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-[#37322F]">5.</span>
            <span>Discovery nodes fetch, verify, and pin your content for resilience</span>
          </li>
        </ol>
      </div>
    </div>
  );
}

export default PublishTab;

