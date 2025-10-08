import { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function SettingsTab() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [exportPassword, setExportPassword] = useState('');
  const [importData, setImportData] = useState('');
  const [importPassword, setImportPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleExportKeypair = async () => {
    if (!exportPassword) {
      setError('Please enter a password to encrypt the export');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/api/export-keypair`, {
        password: exportPassword,
      });

      // Create a download link
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `freepress-keypair-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);

      setSuccess('Keypair exported successfully');
      setShowExportDialog(false);
      setExportPassword('');
    } catch (err: any) {
      console.error('Failed to export keypair:', err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImportKeypair = async () => {
    if (!importData || !importPassword) {
      setError('Please provide both the import data and password');
      return;
    }

    try {
      setLoading(true);
      const parsed = JSON.parse(importData);
      await axios.post(`${API_URL}/api/import-keypair`, {
        data: parsed,
        password: importPassword,
      });

      setSuccess('Keypair imported successfully');
      setShowImportDialog(false);
      setImportData('');
      setImportPassword('');
    } catch (err: any) {
      console.error('Failed to import keypair:', err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNukeData = async () => {
    const confirmed = window.confirm(
      '⚠️ WARNING: This will permanently delete your keypair and all local data. This action cannot be undone. Are you absolutely sure?'
    );

    if (!confirmed) return;

    const doubleConfirm = window.prompt(
      'Type "DELETE EVERYTHING" to confirm this destructive action:'
    );

    if (doubleConfirm !== 'DELETE EVERYTHING') {
      setError('Confirmation text did not match. Operation cancelled.');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API_URL}/api/nuke-data`);
      setSuccess('All data has been wiped. Please refresh the page.');
      setPublicKey(null);
    } catch (err: any) {
      console.error('Failed to nuke data:', err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPublicKey = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/keypair`);
      setPublicKey(response.data.publicKey);
    } catch (err) {
      console.error('No keypair found');
    }
  };

  useState(() => {
    fetchPublicKey();
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard');
    setTimeout(() => setSuccess(null), 2000);
  };

  return (
    <div className="p-6 sm:p-8 md:p-10 lg:p-12">
      <h2 className="text-2xl font-semibold text-[#37322F] mb-6 font-sans">Settings</h2>

      {/* Notifications */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-xs text-red-600 underline mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* Identity Section */}
      <div className="mb-8 p-6 bg-[#F7F5F3] rounded-lg border border-[#E0DEDB]">
        <h3 className="text-lg font-semibold text-[#37322F] mb-4 font-sans">Identity & Keypair</h3>
        
        {publicKey ? (
          <div>
            <p className="text-sm text-[#605A57] mb-2">Your Public Key (Identity):</p>
            <div className="flex items-center gap-2 p-3 bg-white rounded-md border border-[#E0DEDB] mb-4">
              <code className="flex-1 text-xs font-mono text-[#37322F] break-all">
                {publicKey}
              </code>
              <button
                onClick={() => copyToClipboard(publicKey)}
                className="px-3 py-1.5 bg-[#F7F5F3] text-[#37322F] rounded text-xs font-medium hover:bg-[#E0DEDB] transition-colors"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-[#828387] mb-4">
              This is your public identifier on the FreePress network. Share this with others so they can verify your publications.
            </p>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowExportDialog(true)}
                className="px-4 py-2 bg-white text-[#37322F] rounded-full text-sm font-medium hover:bg-[#E0DEDB] transition-colors border border-[#E0DEDB]"
              >
                Export Keypair
              </button>
              <button
                onClick={() => setShowImportDialog(true)}
                className="px-4 py-2 bg-white text-[#37322F] rounded-full text-sm font-medium hover:bg-[#E0DEDB] transition-colors border border-[#E0DEDB]"
              >
                Import Keypair
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-[#605A57] mb-4">
              No keypair found. Generate one in the Publish tab to establish your identity.
            </p>
          </div>
        )}
      </div>

      {/* Export Dialog */}
      {showExportDialog && (
        <div className="mb-8 p-6 bg-white rounded-lg border-2 border-[#37322F]">
          <h3 className="text-lg font-semibold text-[#37322F] mb-4 font-sans">Export Keypair</h3>
          <p className="text-sm text-[#605A57] mb-4">
            Your keypair will be encrypted with a password before export. Store this file safely and remember your password.
          </p>
          <input
            type="password"
            placeholder="Enter encryption password"
            value={exportPassword}
            onChange={(e) => setExportPassword(e.target.value)}
            className="w-full px-4 py-2 border border-[#E0DEDB] rounded-md text-sm focus:outline-none focus:border-[#37322F] mb-4"
          />
          <div className="flex gap-2">
            <button
              onClick={handleExportKeypair}
              disabled={loading}
              className="px-4 py-2 bg-[#37322F] text-white rounded-full text-sm font-medium hover:bg-[#49423D] transition-colors disabled:bg-[#E0DEDB] disabled:text-[#828387]"
            >
              {loading ? 'Exporting...' : 'Export'}
            </button>
            <button
              onClick={() => {
                setShowExportDialog(false);
                setExportPassword('');
              }}
              className="px-4 py-2 bg-white text-[#37322F] rounded-full text-sm font-medium hover:bg-[#E0DEDB] transition-colors border border-[#E0DEDB]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="mb-8 p-6 bg-white rounded-lg border-2 border-[#37322F]">
          <h3 className="text-lg font-semibold text-[#37322F] mb-4 font-sans">Import Keypair</h3>
          <p className="text-sm text-[#605A57] mb-4">
            Paste the contents of your exported keypair file and enter the password you used to encrypt it.
          </p>
          <textarea
            placeholder="Paste keypair JSON here"
            value={importData}
            onChange={(e) => setImportData(e.target.value)}
            className="w-full px-4 py-2 border border-[#E0DEDB] rounded-md text-sm focus:outline-none focus:border-[#37322F] mb-3 font-mono h-32"
          />
          <input
            type="password"
            placeholder="Enter decryption password"
            value={importPassword}
            onChange={(e) => setImportPassword(e.target.value)}
            className="w-full px-4 py-2 border border-[#E0DEDB] rounded-md text-sm focus:outline-none focus:border-[#37322F] mb-4"
          />
          <div className="flex gap-2">
            <button
              onClick={handleImportKeypair}
              disabled={loading}
              className="px-4 py-2 bg-[#37322F] text-white rounded-full text-sm font-medium hover:bg-[#49423D] transition-colors disabled:bg-[#E0DEDB] disabled:text-[#828387]"
            >
              {loading ? 'Importing...' : 'Import'}
            </button>
            <button
              onClick={() => {
                setShowImportDialog(false);
                setImportData('');
                setImportPassword('');
              }}
              className="px-4 py-2 bg-white text-[#37322F] rounded-full text-sm font-medium hover:bg-[#E0DEDB] transition-colors border border-[#E0DEDB]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Node Settings */}
      <div className="mb-8 p-6 bg-white rounded-lg border border-[#E0DEDB]">
        <h3 className="text-lg font-semibold text-[#37322F] mb-4 font-sans">Node Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#37322F] mb-2">
              Backend API URL
            </label>
            <input
              type="text"
              defaultValue={API_URL}
              className="w-full px-4 py-2 border border-[#E0DEDB] rounded-md text-sm focus:outline-none focus:border-[#37322F]"
              disabled
            />
            <p className="text-xs text-[#828387] mt-1">
              The backend API endpoint for this dashboard
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#37322F] mb-2">
              IPFS Gateway
            </label>
            <input
              type="text"
              defaultValue="https://ipfs.io"
              className="w-full px-4 py-2 border border-[#E0DEDB] rounded-md text-sm focus:outline-none focus:border-[#37322F]"
            />
            <p className="text-xs text-[#828387] mt-1">
              Public IPFS gateway for viewing content
            </p>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="p-6 bg-red-50 rounded-lg border-2 border-red-200">
        <h3 className="text-lg font-semibold text-red-900 mb-4 font-sans">⚠️ Danger Zone</h3>
        <p className="text-sm text-red-800 mb-4">
          These actions are permanent and cannot be undone. Proceed with extreme caution.
        </p>
        <button
          onClick={handleNukeData}
          disabled={loading}
          className="px-6 py-3 bg-red-600 text-white rounded-full text-sm font-medium hover:bg-red-700 transition-colors disabled:bg-red-300"
        >
          {loading ? 'Deleting...' : 'Delete All Data & Keys'}
        </button>
        <p className="text-xs text-red-700 mt-2">
          This will delete your keypair, all settings, and cached data. You will lose your identity on the network.
        </p>
      </div>

      {/* About */}
      <div className="mt-8 p-6 bg-white rounded-lg border border-[#E0DEDB]">
        <h3 className="text-lg font-semibold text-[#37322F] mb-3 font-sans">About FreePress</h3>
        <div className="space-y-2 text-sm text-[#605A57]">
          <p><strong className="text-[#37322F]">Version:</strong> 0.1.0-alpha</p>
          <p><strong className="text-[#37322F]">License:</strong> MIT</p>
          <p><strong className="text-[#37322F]">Repository:</strong> <a href="https://github.com/freepress" className="text-[#37322F] underline">github.com/freepress</a></p>
        </div>
      </div>
    </div>
  );
}

export default SettingsTab;

