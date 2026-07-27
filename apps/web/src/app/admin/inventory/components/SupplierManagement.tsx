import React from 'react'
import { Truck, Star, Phone, Mail, ChevronRight, CheckCircle2, Clock } from 'lucide-react'

const SUPPLIERS = [
  { id: '1', name: 'FreshFarms Produce', categories: ['Vegetables', 'Fruits', 'Herbs'], rating: 4.8, onTime: '98%', avgDelivery: '24h', lastOrder: '2 days ago', outstanding: 1, preferred: true },
  { id: '2', name: 'DairyKing Wholesale', categories: ['Dairy', 'Eggs'], rating: 4.5, onTime: '95%', avgDelivery: '48h', lastOrder: '5 days ago', outstanding: 0, preferred: true },
  { id: '3', name: 'PremiumMeats Corp', categories: ['Meat', 'Poultry'], rating: 4.9, onTime: '100%', avgDelivery: '24h', lastOrder: 'Yesterday', outstanding: 2, preferred: true },
  { id: '4', name: 'GourmetImports', categories: ['Pantry', 'Oils', 'Spices'], rating: 4.2, onTime: '85%', avgDelivery: '3-5 days', lastOrder: '1 week ago', outstanding: 0, preferred: false },
]

export function SupplierManagement() {
  return (
    <div className="space-y-6">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-500" />
            Supplier Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">Manage vendor relationships, track performance, and view outstanding orders.</p>
        </div>
        <button className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm">
          Add Supplier
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {SUPPLIERS.map((supplier) => (
          <div key={supplier.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            
            {supplier.preferred && (
              <div className="absolute top-0 right-0">
                <div className="bg-gradient-to-bl from-amber-400 to-amber-500 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-8 shadow-sm rotate-45 translate-x-6 -translate-y-2">
                  Preferred
                </div>
              </div>
            )}

            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-xl font-bold text-gray-400 shrink-0">
                {supplier.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{supplier.name}</h3>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {supplier.categories.map((cat, i) => (
                    <span key={i} className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-6 border-y border-gray-50 py-4">
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Rating</p>
                <p className="font-bold text-gray-900 flex items-center justify-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> {supplier.rating}
                </p>
              </div>
              <div className="text-center border-l border-gray-50">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">On-Time</p>
                <p className={`font-bold ${supplier.onTime >= '95%' ? 'text-emerald-600' : 'text-orange-500'}`}>
                  {supplier.onTime}
                </p>
              </div>
              <div className="text-center border-l border-gray-50">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Avg Time</p>
                <p className="font-bold text-gray-900">{supplier.avgDelivery}</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-2"><Clock className="w-4 h-4" /> Last Order</span>
                <span className="font-medium text-gray-900">{supplier.lastOrder}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Outstanding POs</span>
                <span className="font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{supplier.outstanding}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-gray-50">
              <button className="flex-1 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors flex items-center justify-center gap-2">
                <Mail className="w-4 h-4" />
              </button>
              <button className="flex-1 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors flex items-center justify-center gap-2">
                <Phone className="w-4 h-4" />
              </button>
              <button className="flex-[2] py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors flex items-center justify-center gap-1">
                Details <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        ))}
      </div>

    </div>
  )
}
