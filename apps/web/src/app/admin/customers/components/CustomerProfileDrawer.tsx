import React, { useState } from 'react'
import { X, Edit2, Phone, Mail, MessageSquare, Calendar, CreditCard, Tag, Star, Clock, Gift } from 'lucide-react'

interface CustomerProfileDrawerProps {
  isOpen: boolean
  onClose: () => void
}

type ProfileTab = 'overview' | 'orders' | 'reservations' | 'preferences'

export function CustomerProfileDrawer({ isOpen, onClose }: CustomerProfileDrawerProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview')

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        ></div>
      )}

      {/* Drawer */}
      <div 
        className={`fixed inset-y-0 right-0 w-full max-w-2xl bg-[#F8FAFC] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header (Profile Summary) */}
        <div className="bg-white border-b border-gray-200">
          <div className="flex items-start justify-between p-6 pb-4">
            <div className="flex gap-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm flex items-center justify-center text-3xl font-bold text-white shrink-0">
                SJ
              </div>
              <div className="pt-1">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-bold text-gray-900">Sarah Jenkins</h2>
                  <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wide border border-blue-200 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-blue-700" /> VIP
                  </span>
                </div>
                <p className="text-sm text-gray-500 font-medium">Customer since Mar 2024 • ID: CUST-8091</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 border border-gray-200 rounded-lg text-xs font-medium text-gray-700">
                    <Phone className="w-3 h-3" /> +91 98765 43210
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 border border-gray-200 rounded-lg text-xs font-medium text-gray-700">
                    <Mail className="w-3 h-3" /> sarah.j@example.com
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 bg-white border border-gray-200 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Internal Tabs */}
          <div className="px-6 flex space-x-4 border-t border-gray-50">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'orders', label: 'Order History' },
              { id: 'reservations', label: 'Reservations' },
              { id: 'preferences', label: 'Preferences' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ProfileTab)}
                className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Total Spend</span>
                  <span className="text-2xl font-bold text-gray-900">₹54.2K</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Total Orders</span>
                  <span className="text-2xl font-bold text-gray-900">42</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Loyalty Points</span>
                  <span className="text-2xl font-bold text-blue-600">4,250</span>
                </div>
              </div>

              {/* Personal Info & Tags */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"><Tag className="w-4 h-4 text-gray-400" /> Tags & Segments</h3>
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold">Wine Lover</span>
                  <span className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold">Frequent Diner</span>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold">High Value</span>
                </div>

                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" /> Important Dates</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Birthday</p>
                    <p className="font-semibold text-gray-900">14 October</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Anniversary</p>
                    <p className="font-semibold text-gray-900">22 May</p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-900">Recent Orders</h3>
                <button className="text-sm font-medium text-blue-600 hover:text-blue-700">View All 42 Orders</button>
              </div>
              
              {/* Order Timeline Item */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">Order #ORD-{9082 - i}</p>
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><Clock className="w-3 h-3" /> {i} days ago • Table {12 + i}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">₹1,450</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-md text-[10px] font-semibold uppercase">Completed</span>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-gray-50 flex items-center gap-2 overflow-x-auto pb-1">
                    <span className="shrink-0 px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-lg text-xs text-gray-600">Truffle Pasta x1</span>
                    <span className="shrink-0 px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-lg text-xs text-gray-600">Garlic Bread x2</span>
                    <span className="shrink-0 px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-lg text-xs text-gray-600">Red Wine Glass x2</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4 border-b border-gray-100 pb-3">Dietary & Allergies</h3>
                <div className="flex gap-3 mb-6">
                  <span className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Peanut Allergy
                  </span>
                  <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-sm font-medium flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Vegetarian Preference
                  </span>
                </div>

                <h3 className="font-bold text-gray-900 mb-4 border-b border-gray-100 pb-3">Dining Preferences</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Preferred Table</p>
                    <p className="font-medium text-gray-900">Window seating (Quiet area)</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Favorite Cuisine</p>
                    <p className="font-medium text-gray-900">Italian / Mediterranean</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Typical Dining Time</p>
                    <p className="font-medium text-gray-900">Dinner (7:30 PM - 9:00 PM)</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Preferred Payment</p>
                    <p className="font-medium text-gray-900 flex items-center gap-2"><CreditCard className="w-4 h-4 text-gray-400"/> Card ending in 4242</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reservations' && (
             <div className="flex items-center justify-center h-40 text-gray-500 text-sm">
               Reservation history timeline would render here.
             </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 bg-white flex flex-wrap gap-3">
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm flex-1">
            <Calendar className="w-4 h-4" />
            Reserve Table
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm flex-1">
            <Gift className="w-4 h-4" />
            Send Offer
          </button>
          <button className="flex items-center justify-center w-11 h-11 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
            <MessageSquare className="w-4 h-4" />
          </button>
          <button className="flex items-center justify-center w-11 h-11 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
            <Edit2 className="w-4 h-4" />
          </button>
        </div>

      </div>
    </>
  )
}
