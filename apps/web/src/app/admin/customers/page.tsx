'use client'

import React, { useState } from 'react'
import { Bell, Search, Users, Activity, BarChart2, Gift, Settings as SettingsIcon, ScanLine } from 'lucide-react'

// Import components
import { AIAssistantPanel } from './components/AIAssistantPanel'
import { CustomerOverviewHero } from './components/CustomerOverviewHero'
import { CustomerKPIGrid } from './components/CustomerKPIGrid'
import { CustomerDataTable } from './components/CustomerDataTable'
import { CustomerProfileDrawer } from './components/CustomerProfileDrawer'
import { CustomerAnalytics } from './components/CustomerAnalytics'
import { LoyaltyAndReviews } from './components/LoyaltyAndReviews'

type Tab = 'overview' | 'directory' | 'analytics' | 'loyalty' | 'settings'

export default function AdminCustomersPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)

  const handleRowClick = (id: string) => {
    setSelectedCustomerId(id)
    setDrawerOpen(true)
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CustomerOverviewHero />
            <CustomerKPIGrid />
          </div>
        )
      case 'directory':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CustomerDataTable onRowClick={handleRowClick} />
          </div>
        )
      case 'analytics':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CustomerAnalytics />
          </div>
        )
      case 'loyalty':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <LoyaltyAndReviews />
          </div>
        )
      case 'settings':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex items-center justify-center h-96 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
            <p className="text-gray-500 font-medium">Settings & Communication Center under construction.</p>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex w-full min-h-[calc(100vh-3rem)] bg-[#F8FAFC]">
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Sticky Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Customers</h1>
            
            {/* Global Search */}
            <div className="hidden md:flex relative group">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search customers, phones, emails..."
                className="pl-9 pr-4 py-2 w-72 lg:w-96 bg-gray-100/50 border-transparent rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
              <ScanLine className="w-4 h-4" /> Scan QR
            </button>
            <button className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 text-white flex items-center justify-center font-semibold text-sm shadow-sm cursor-pointer border border-white">
              KA
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="px-6 py-3 border-b border-gray-200/50 bg-white/50 backdrop-blur-md sticky top-[73px] z-20 flex overflow-x-auto hide-scrollbar">
          <div className="flex space-x-1">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'directory', label: 'Customer Directory', icon: Users },
              { id: 'analytics', label: 'Analytics & Trends', icon: BarChart2 },
              { id: 'loyalty', label: 'Loyalty & Feedback', icon: Gift },
              { id: 'settings', label: 'Settings & Comms', icon: SettingsIcon }
            ].map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                    isActive 
                      ? 'bg-blue-50 text-blue-700 shadow-sm shadow-blue-500/10' 
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-[1600px] mx-auto">
            {renderTabContent()}
          </div>
        </div>

      </div>

      {/* AI Assistant Sidebar (Sticky Right) */}
      <AIAssistantPanel />

      {/* Profile Drawer */}
      <CustomerProfileDrawer 
        isOpen={drawerOpen} 
        onClose={() => {
          setDrawerOpen(false)
          setSelectedCustomerId(null)
        }} 
      />

    </div>
  )
}
