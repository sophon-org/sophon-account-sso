'use client';

import { useSophonAccount } from '@sophon-labs/account-react';
import { useState } from 'react';
import { ConnectButton } from '../../components/connect-button';
import { Logo } from '../../components/logo';
import { ProfilePanel } from '../../components/profile.panel';
import { ERC20Approval } from '../../components/react-hooks/erc20-approval';
import { GasEstimation } from '../../components/react-hooks/gas-estimation';
import { GetSwapTransaction } from '../../components/react-hooks/get-swap-transaction';
import { GetSwapTransactionStatus } from '../../components/react-hooks/get-swap-transaction-status';

type TabType = 'swap' | 'status' | 'approval' | 'gas';

export default function Home() {
  const { isConnected } = useSophonAccount();
  const [showHookTabs, setShowHookTabs] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('swap');

  const tabs = [
    {
      id: 'swap' as TabType,
      label: 'Swap Transaction',
      component: <GetSwapTransaction />,
    },
    {
      id: 'status' as TabType,
      label: 'Swap Status',
      component: <GetSwapTransactionStatus />,
    },
    {
      id: 'approval' as TabType,
      label: 'ERC20 Approval',
      component: <ERC20Approval />,
    },
    {
      id: 'gas' as TabType,
      label: 'Gas Estimation',
      component: <GasEstimation />,
    },
  ];

  return (
    <div className="flex justify-center items-center">
      <div className="flex flex-col gap-2  w-full items-center">
        <Logo className="mb-4" />
        {isConnected ? <ProfilePanel /> : <ConnectButton />}

        <button
          className="mb-4 bg-violet-500/30 text-white border border-violet-500/50 px-4 py-2 rounded-md hover:bg-violet-500/50 transition-all duration-300 hover:cursor-pointer"
          type="button"
          onClick={() => setShowHookTabs(!showHookTabs)}
        >
          {showHookTabs ? 'Hide Hook Testing' : 'Test React Hooks'}
        </button>

        {showHookTabs && (
          <div className="w-full">
            {/* Tabs */}
            <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden border border-gray-700">
              {/* Tab Navigation */}
              <div className="flex border-b border-gray-700">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 px-6 py-4 text-sm font-medium transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'bg-violet-500 text-white border-b-2 border-violet-500'
                        : 'text-gray-300 hover:text-violet-400 hover:bg-gray-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-6 bg-gray-800/50">
                {tabs.find((tab) => tab.id === activeTab)?.component}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
