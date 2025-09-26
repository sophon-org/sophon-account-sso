import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { ERC20Approval } from './test-hooks/erc20-approval';
import { GasEstimation } from './test-hooks/gas-estimation';
import { GetSwapStatus } from './test-hooks/get-swap-status';
import { GetSwapTransaction } from './test-hooks/get-swap-transaction';

type TabType = 'swap' | 'status' | 'approval' | 'gas';

interface Tab {
  id: TabType;
  label: string;
  component: React.ReactNode;
}

export const TestDashboard = () => {
  const [activeTab, setActiveTab] = useState<TabType>('swap');

  const tabs: Tab[] = [
    {
      id: 'swap',
      label: 'Swap Transaction',
      component: <GetSwapTransaction />,
    },
    {
      id: 'status',
      label: 'Swap Status',
      component: <GetSwapStatus />,
    },
    {
      id: 'approval',
      label: 'ERC20 Approval',
      component: <ERC20Approval />,
    },
    {
      id: 'gas',
      label: 'Gas Estimation',
      component: <GasEstimation />,
    },
  ];

  return (
    <View className="flex-1 bg-white">
      {/* Tab Navigation */}
      <View className="bg-gray-800 border-b border-gray-700">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row"
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              className={`px-6 py-4 ${
                activeTab === tab.id
                  ? 'bg-violet-500 border-b-2 border-violet-500'
                  : 'hover:bg-gray-700'
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  activeTab === tab.id ? 'text-white' : 'text-gray-300'
                }`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab Content */}
      <View className="flex-1 bg-gray-100">
        {tabs.find((tab) => tab.id === activeTab)?.component}
      </View>
    </View>
  );
};
