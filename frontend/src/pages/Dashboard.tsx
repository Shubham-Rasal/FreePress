import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import axios from 'axios';
import StatusTab from '../components/StatusTab';
import PublishTab from '../components/PublishTab';
import MirrorTab from '../components/MirrorTab';
import SettingsTab from '../components/SettingsTab';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export type ServiceStatus = {
  backend?: { status: string; version?: string };
  ipfs?: { status: string; error?: string };
  tor?: { status: string; error?: string; onionUrl?: string };
  wordpress?: { status: string };
};

export type SystemStatus = {
  services?: ServiceStatus;
  uptime?: number;
  timestamp?: string;
};

function Dashboard() {
  const [activeTab, setActiveTab] = useState<'status' | 'publish' | 'mirror' | 'settings'>('publish');
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/status`);
      setStatus(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch status:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'publish', label: 'Publish', icon: '📝' },
    { id: 'mirror', label: 'Mirror', icon: '🪞' },
    { id: 'status', label: 'Status', icon: '📊' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ] as const;

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
                      loading ? 'bg-yellow-500' : error ? 'bg-red-500' : 'bg-green-500'
                    } animate-pulse`}></div>
                    <div className="flex flex-col justify-center text-[rgba(49,45,43,0.80)] text-xs md:text-[13px] font-medium leading-[14px] font-sans">
                      {loading ? 'Connecting...' : error ? 'Disconnected' : 'Connected'}
                    </div>
                  </div>
                </div>
                <div className="h-6 sm:h-7 md:h-8 flex justify-start items-start gap-2 sm:gap-3">
                  <Link 
                    to="/"
                    className="px-2 sm:px-3 md:px-[14px] py-1 sm:py-[6px] bg-white shadow-[0px_1px_2px_rgba(55,50,47,0.12)] overflow-hidden rounded-full flex justify-center items-center"
                  >
                    <div className="flex flex-col justify-center text-[#37322F] text-xs md:text-[13px] font-medium leading-5 font-sans">
                      ← Explore
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Dashboard Content */}
            <div className="pt-16 sm:pt-20 md:pt-24 lg:pt-[120px] pb-8 sm:pb-12 md:pb-16 flex flex-col justify-start items-center px-2 sm:px-4 md:px-8 lg:px-0 w-full">
              {/* Dashboard Title */}
              <div className="w-full max-w-[937px] lg:w-[937px] flex flex-col justify-center items-center gap-3 sm:gap-4 md:gap-5 lg:gap-6 mb-8">
                <div className="text-center flex justify-center flex-col text-[#37322F] text-[24px] xs:text-[28px] sm:text-[36px] md:text-[52px] lg:text-[64px] font-normal leading-[1.1] sm:leading-[1.15] md:leading-[1.2] font-serif px-2 sm:px-4 md:px-0">
                  Publisher Dashboard
                </div>
                <div className="text-center flex justify-center flex-col text-[rgba(55,50,47,0.80)] sm:text-lg md:text-xl leading-[1.4] sm:leading-[1.45] md:leading-[1.5] font-sans px-2 sm:px-4 md:px-0 lg:text-base font-medium text-sm">
                  Publish content, manage mirrors, and configure your node
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="w-full max-w-[960px] lg:w-[960px] mb-6 border-b border-[rgba(55,50,47,0.12)]">
                <div className="flex justify-start items-center gap-1 overflow-x-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 sm:px-6 py-3 text-sm sm:text-base font-medium leading-5 font-sans transition-all whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'text-[#37322F] border-b-2 border-[#37322F]'
                          : 'text-[rgba(55,50,47,0.60)] hover:text-[#37322F]'
                      }`}
                    >
                      <span className="mr-2">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="w-full max-w-[960px] lg:w-[960px] bg-white shadow-[0px_0px_0px_0.9056603908538818px_rgba(0,0,0,0.08)] rounded-[9.06px] overflow-hidden">
                {activeTab === 'publish' && <PublishTab />}
                {activeTab === 'mirror' && <MirrorTab />}
                {activeTab === 'status' && <StatusTab status={status} loading={loading} error={error} />}
                {activeTab === 'settings' && <SettingsTab />}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-[rgba(55,50,47,0.12)] bg-white py-6 mt-12">
        <div className="max-w-[1060px] mx-auto px-4 text-center">
          <p className="text-sm text-[#605A57]">
            FreePress v0.1.0 - Private, Censorship-Proof Publishing
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Dashboard;

