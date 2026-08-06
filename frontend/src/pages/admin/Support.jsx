import React, { useState } from 'react';
import { Tag, Layers } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VoucherTypes from './VoucherTypes';
import AccountSetup from './AccountSetup';

const Support = () => {
  const [activeTab, setActiveTab] = useState('voucher-types');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/80 to-white">
      <div className="max-w-8xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Support</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Configure voucher types and account mappings for your financial workflows
            </p>
          </div>
          <div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="inline-flex h-10 items-center text-white rounded-xs p-1">
                <TabsTrigger
                  value="voucher-types"
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-sm font-medium rounded-xs px-4 py-1.5 data-[state=active]:bg-gray-100/80 data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-white transition-all duration-200"
                >
                  <Tag className="h-4 w-4" />
                  Voucher Types
                </TabsTrigger>
                <TabsTrigger
                  value="account-setup"
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-sm font-medium rounded-xs px-4 py-1.5 data-[state=active]:bg-gray-100/80 data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-white transition-all duration-200"
                >
                  <Layers className="h-4 w-4" />
                  Account Setup
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'voucher-types' ? <VoucherTypes /> : <AccountSetup />}
        </div>
      </div>
    </div>
  );
};

export default Support;