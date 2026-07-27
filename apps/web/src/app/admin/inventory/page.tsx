'use client'

import React, { useState } from 'react'
import { Bell, Search, LogOut, Package, BarChart2, Truck, Settings as SettingsIcon } from 'lucide-react'

// Import new components
import { AIAssistantPanel } from './components/AIAssistantPanel'
import { InventoryOverviewHero } from './components/InventoryOverviewHero'
import { KPIGrid } from './components/KPIGrid'
import { InventoryDataTable } from './components/InventoryDataTable'
import { IngredientDetailDrawer } from './components/IngredientDetailDrawer'
import { Live86EngineView } from './components/Live86EngineView'
import { AnalyticsCharts } from './components/AnalyticsCharts'
import { InventoryForecast } from './components/InventoryForecast'
import { SupplierManagement } from './components/SupplierManagement'

type Tab = 'overview' | 'inventory' | 'analytics' | 'suppliers' | 'settings'

export default function AdminInventoryPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [drawerOpen, setDrawerOpen] = useState(false) // Triggered from table in real app

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <InventoryOverviewHero />
            <KPIGrid />
            {/* We could place the Live86Engine view or Priority Alerts here too */}
          </div>
        )
      case 'inventory':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <InventoryDataTable />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Placeholders for Expiry Tracking and Storage Locations */}
              <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">Expiry Tracking</h3>
                <p className="text-sm text-gray-500">List of expiring items would go here...</p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">Storage Locations</h3>
                <p className="text-sm text-gray-500">Map or list of storage locations...</p>
              </div>
            </div>
          </div>
        )
      case 'analytics':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <InventoryForecast />
            <AnalyticsCharts />
          </div>
        )
      case 'suppliers':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SupplierManagement />
          </div>
        )
      case 'settings':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Live86EngineView />
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
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Inventory</h1>
            
            {/* Global Search */}
            <div className="hidden md:flex relative group">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search inventory, POs, suppliers..."
                className="pl-9 pr-4 py-2 w-72 lg:w-96 bg-gray-100/50 border-transparent rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
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
              { id: 'overview', label: 'Overview', icon: Package },
              { id: 'inventory', label: 'Stock & Items', icon: Package },
              { id: 'analytics', label: 'Analytics & Forecast', icon: BarChart2 },
              { id: 'suppliers', label: 'Suppliers & POs', icon: Truck },
              { id: 'settings', label: '86 Engine & Settings', icon: SettingsIcon }
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

      {/* Detail Drawer (Normally triggered by clicking a row in the DataTable, mocked to be togglable here if needed, or controlled by state) */}
      {/* Set isOpen to true manually to see it, or pass setDrawerOpen to DataTable */}
      <IngredientDetailDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      
      {/* Floating button for demo purposes to open the drawer */}
      <button 
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-6 right-[340px] px-4 py-2 bg-gray-900 text-white rounded-full shadow-xl shadow-gray-900/20 text-sm font-medium hover:scale-105 transition-transform z-30 flex items-center gap-2 border border-gray-700"
      >
        Demo: Open Ingredient Drawer
      </button>

    </div>
  )
}
