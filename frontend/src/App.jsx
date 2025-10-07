import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function App() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStatus();
    // Refresh status every 10 seconds
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/status`);
      setStatus(response.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch status:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (serviceStatus) => {
    if (serviceStatus === 'healthy') return 'bg-green-500';
    if (serviceStatus === 'initializing') return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusText = (serviceStatus) => {
    if (serviceStatus === 'healthy') return 'Healthy';
    if (serviceStatus === 'initializing') return 'Initializing';
    return 'Unhealthy';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">FreePress</h1>
              <p className="mt-1 text-sm text-gray-600">
                Publish Without Permission - Private, Censorship-Proof, Autonomous
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span
                className={`h-3 w-3 rounded-full ${
                  loading ? 'bg-yellow-500' : error ? 'bg-red-500' : 'bg-green-500'
                } animate-pulse`}
              ></span>
              <span className="text-sm text-gray-600">
                {loading ? 'Connecting...' : error ? 'Disconnected' : 'Connected'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome to FreePress
          </h2>
          <p className="text-gray-600 mb-4">
            Your local resilient, anonymous publishing node is running. Check the service
            status below and start publishing content that can't be taken down.
          </p>
          <div className="flex space-x-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
              Generate Keypair
            </button>
            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition">
              View Documentation
            </button>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">System Status</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <p className="text-red-800">
                Failed to connect to backend: {error}
              </p>
            </div>
          )}

          {loading && !status ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : status ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Backend Status */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">Backend API</h3>
                  <span
                    className={`h-3 w-3 rounded-full ${getStatusColor(
                      status.services?.backend?.status
                    )}`}
                  ></span>
                </div>
                <p className="text-sm text-gray-600">
                  Status: {getStatusText(status.services?.backend?.status)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Version: {status.services?.backend?.version || 'N/A'}
                </p>
              </div>

              {/* IPFS Status */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">IPFS Node</h3>
                  <span
                    className={`h-3 w-3 rounded-full ${getStatusColor(
                      status.services?.ipfs?.status
                    )}`}
                  ></span>
                </div>
                <p className="text-sm text-gray-600">
                  Status: {getStatusText(status.services?.ipfs?.status)}
                </p>
                {status.services?.ipfs?.error && (
                  <p className="text-xs text-red-500 mt-1">
                    {status.services.ipfs.error}
                  </p>
                )}
              </div>

              {/* Tor Status */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">Tor Service</h3>
                  <span
                    className={`h-3 w-3 rounded-full ${getStatusColor(
                      status.services?.tor?.status
                    )}`}
                  ></span>
                </div>
                <p className="text-sm text-gray-600">
                  Status: {getStatusText(status.services?.tor?.status)}
                </p>
                {status.services?.tor?.error && (
                  <p className="text-xs text-red-500 mt-1">
                    {status.services.tor.error}
                  </p>
                )}
              </div>

              {/* WordPress Status */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">WordPress</h3>
                  <span className="h-3 w-3 rounded-full bg-green-500"></span>
                </div>
                <p className="text-sm text-gray-600">Status: Running</p>
                <a
                  href="http://localhost:8080"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-block"
                >
                  Open WordPress →
                </a>
              </div>
            </div>
          ) : null}

          {/* System Info */}
          {status && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Uptime</p>
                  <p className="font-semibold text-gray-900">
                    {Math.floor(status.uptime || 0)}s
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Last Updated</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(status.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Environment</p>
                  <p className="font-semibold text-gray-900">Development</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              📝 Publish
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Create and publish content to your anonymous node
            </p>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Start Publishing →
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              🔍 Discover
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Explore content from other publishers on the network
            </p>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Explore Network →
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ⚙️ Settings
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Manage your keys, mirrors, and node configuration
            </p>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Open Settings →
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            FreePress v0.1.0 - Private, Censorship-Proof Publishing
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;

