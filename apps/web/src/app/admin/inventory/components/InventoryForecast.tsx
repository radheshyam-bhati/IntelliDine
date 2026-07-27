import React from 'react'
import { Sparkles, CalendarClock, ShoppingCart, AlertTriangle, ArrowRight } from 'lucide-react'

// Mock Data for Forecast
const FORECAST_DATA = [
  { id: '1', ingredient: 'Truffle Oil', runOut: 'Tomorrow', predCons: '0.5 L', confidence: 92, recPurchase: '2 L', supplier: 'GourmetImports', priority: 'High', urgency: 'Critical' },
  { id: '2', ingredient: 'Fresh Basil', runOut: 'Tomorrow', predCons: '0.8 kg', confidence: 88, recPurchase: '1.5 kg', supplier: 'FreshFarms', priority: 'High', urgency: 'Critical' },
  { id: '3', ingredient: 'Roma Tomatoes', runOut: '3 Days', predCons: '8.5 kg', confidence: 95, recPurchase: '20 kg', supplier: 'FreshFarms', priority: 'Medium', urgency: 'Warning' },
  { id: '4', ingredient: 'Mozzarella Cheese', runOut: 'Next Week', predCons: '12 kg', confidence: 82, recPurchase: '15 kg', supplier: 'DairyKing', priority: 'Low', urgency: 'Normal' },
]

export function InventoryForecast() {
  return (
    <div className="space-y-6">
      
      <div className="flex flex-col md:flex-row justify-between gap-4 md:items-end">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            AI Inventory Forecast
          </h2>
          <p className="text-sm text-gray-500 mt-1">Predictive analysis of upcoming stock shortages and recommended purchases.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button className="px-4 py-1.5 rounded-lg bg-white shadow-sm text-sm font-medium text-gray-900 transition-all">Tomorrow</button>
          <button className="px-4 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900 transition-all">Next Week</button>
          <button className="px-4 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900 transition-all">Next Month</button>
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <CalendarClock className="w-32 h-32 text-indigo-600" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <h3 className="text-indigo-900 font-bold text-lg mb-2">Tomorrow's Purchase Recommendations</h3>
            <p className="text-indigo-700/80 text-sm mb-4">Based on expected reservations and historical consumption trends, you have 2 critical shortages predicted for tomorrow.</p>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium shadow-sm hover:bg-indigo-700 transition-colors inline-flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" /> Auto-Generate PO for Critical Items
            </button>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-white/60 backdrop-blur-sm border border-white/50 p-4 rounded-xl flex flex-col items-center justify-center min-w-[120px]">
              <span className="text-3xl font-bold text-indigo-700">92%</span>
              <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mt-1">Avg Confidence</span>
            </div>
            <div className="bg-white/60 backdrop-blur-sm border border-white/50 p-4 rounded-xl flex flex-col items-center justify-center min-w-[120px]">
              <span className="text-3xl font-bold text-red-600">2</span>
              <span className="text-xs font-semibold text-red-500 uppercase tracking-wider mt-1">Critical</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {FORECAST_DATA.map((item) => (
          <div key={item.id} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col lg:flex-row lg:items-center justify-between gap-6 group">
            
            <div className="flex items-start gap-4 lg:w-1/3">
              <div className={`p-3 rounded-xl flex-shrink-0 ${item.urgency === 'Critical' ? 'bg-red-50 text-red-600' : item.urgency === 'Warning' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                {item.urgency === 'Critical' ? <AlertTriangle className="w-6 h-6" /> : <CalendarClock className="w-6 h-6" />}
              </div>
              <div>
                <h4 className="font-bold text-gray-900">{item.ingredient}</h4>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                  Depletes <strong className={item.urgency === 'Critical' ? 'text-red-600' : 'text-gray-900'}>{item.runOut}</strong>
                </p>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-3 gap-4 border-l border-r border-gray-50 px-6">
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Predicted Need</p>
                <p className="font-semibold text-gray-900">{item.predCons}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">AI Confidence</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${item.confidence}%` }}></div>
                  </div>
                  <span className="text-xs font-medium text-gray-600">{item.confidence}%</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Supplier</p>
                <p className="text-xs font-medium text-blue-600 truncate">{item.supplier}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 lg:w-1/4 justify-between lg:justify-end">
              <div className="text-right">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Recommended</p>
                <p className="font-bold text-emerald-600 text-lg">{item.recPurchase}</p>
              </div>
              <button className="w-10 h-10 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-colors">
                <ShoppingCart className="w-4 h-4" />
              </button>
            </div>

          </div>
        ))}
      </div>
      
    </div>
  )
}
