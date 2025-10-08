import type { SystemStatus } from '../Dashboard';

interface StatusTabProps {
  status: SystemStatus | null;
  loading: boolean;
  error: string | null;
}

function StatusTab({ status, loading, error }: StatusTabProps) {
  const getStatusColor = (serviceStatus?: string) => {
    if (serviceStatus === 'healthy') return 'bg-green-500';
    if (serviceStatus === 'initializing') return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusText = (serviceStatus?: string) => {
    if (serviceStatus === 'healthy') return 'Healthy';
    if (serviceStatus === 'initializing') return 'Initializing';
    return 'Unhealthy';
  };

  return (
    <div className="p-6 sm:p-8 md:p-10 lg:p-12">
      <h2 className="text-2xl font-semibold text-[#37322F] mb-6 font-sans">System Status</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-800 text-sm">
            Failed to connect to backend: {error}
          </p>
        </div>
      )}

      {loading && !status ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#37322F]"></div>
        </div>
      ) : status ? (
        <>
          {/* Service Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* Backend Status */}
            <div className="border border-[#E0DEDB] rounded-lg p-5 bg-[#F7F5F3]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-[#37322F] text-base">Backend API</h3>
                <span
                  className={`h-3 w-3 rounded-full ${getStatusColor(
                    status.services?.backend?.status
                  )}`}
                ></span>
              </div>
              <p className="text-sm text-[#605A57]">
                Status: {getStatusText(status.services?.backend?.status)}
              </p>
              <p className="text-xs text-[#828387] mt-1">
                Version: {status.services?.backend?.version || 'N/A'}
              </p>
            </div>

            {/* IPFS Status */}
            <div className="border border-[#E0DEDB] rounded-lg p-5 bg-[#F7F5F3]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-[#37322F] text-base">IPFS Node</h3>
                <span
                  className={`h-3 w-3 rounded-full ${getStatusColor(
                    status.services?.ipfs?.status
                  )}`}
                ></span>
              </div>
              <p className="text-sm text-[#605A57]">
                Status: {getStatusText(status.services?.ipfs?.status)}
              </p>
              {status.services?.ipfs?.error && (
                <p className="text-xs text-red-500 mt-1">
                  {status.services.ipfs.error}
                </p>
              )}
            </div>

            {/* Tor Status */}
            <div className="border border-[#E0DEDB] rounded-lg p-5 bg-[#F7F5F3]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-[#37322F] text-base">Tor Service</h3>
                <span
                  className={`h-3 w-3 rounded-full ${getStatusColor(
                    status.services?.tor?.status
                  )}`}
                ></span>
              </div>
              <p className="text-sm text-[#605A57]">
                Status: {getStatusText(status.services?.tor?.status)}
              </p>
              {status.services?.tor?.onionUrl && (
                <p className="text-xs text-[#37322F] mt-2 font-mono break-all">
                  {status.services.tor.onionUrl}
                </p>
              )}
              {status.services?.tor?.error && (
                <p className="text-xs text-red-500 mt-1">
                  {status.services.tor.error}
                </p>
              )}
            </div>

            {/* WordPress Status */}
            <div className="border border-[#E0DEDB] rounded-lg p-5 bg-[#F7F5F3]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-[#37322F] text-base">WordPress CMS</h3>
                <span className="h-3 w-3 rounded-full bg-green-500"></span>
              </div>
              <p className="text-sm text-[#605A57]">Status: Running</p>
              <a
                href="http://localhost:8080"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#37322F] underline hover:text-[#49423D] mt-2 inline-block"
              >
                Open WordPress →
              </a>
            </div>
          </div>

          {/* System Info */}
          <div className="pt-6 border-t border-[#E0DEDB]">
            <h3 className="text-lg font-semibold text-[#37322F] mb-4 font-sans">System Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-[#F7F5F3] rounded-lg">
                <p className="text-[#828387] text-xs mb-1">Uptime</p>
                <p className="font-semibold text-[#37322F] text-lg">
                  {Math.floor(status.uptime || 0)}s
                </p>
              </div>
              <div className="p-4 bg-[#F7F5F3] rounded-lg">
                <p className="text-[#828387] text-xs mb-1">Last Updated</p>
                <p className="font-semibold text-[#37322F] text-lg">
                  {status.timestamp ? new Date(status.timestamp).toLocaleTimeString() : 'N/A'}
                </p>
              </div>
              <div className="p-4 bg-[#F7F5F3] rounded-lg">
                <p className="text-[#828387] text-xs mb-1">Environment</p>
                <p className="font-semibold text-[#37322F] text-lg">Development</p>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

export default StatusTab;

