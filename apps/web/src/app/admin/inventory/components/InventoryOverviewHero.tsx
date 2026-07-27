import React from 'react'
import { AlertCircle, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react'

export function InventoryOverviewHero() {
  return (
    <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-black rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden mb-8">
      
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl"></div>

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        
        {/* Left Side: Score & Primary Info */}
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-medium text-blue-200 mb-6">
            <TrendingUp className="w-4 h-4" />
            <span>Inventory Health Score: 92/100</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
            ₹2,84,650
          </h2>
          <p className="text-slate-400 text-sm md:text-base font-medium flex items-center gap-2">
            Total Inventory Value
            <span className="text-emerald-400 text-xs bg-emerald-400/10 px-2 py-0.5 rounded-full">+2.4% this week</span>
          </p>
        </div>

        {/* Right Side: Status Breakdown */}
        <div className="w-full md:w-auto grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
          
          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 mb-2" />
            <span className="text-2xl font-bold text-white">218</span>
            <span className="text-[10px] uppercase tracking-wider text-emerald-200/70 font-semibold mt-1">Healthy</span>
          </div>

          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <AlertTriangle className="w-6 h-6 text-yellow-400 mb-2" />
            <span className="text-2xl font-bold text-white">14</span>
            <span className="text-[10px] uppercase tracking-wider text-yellow-200/70 font-semibold mt-1">Low Stock</span>
          </div>

          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <AlertCircle className="w-6 h-6 text-orange-400 mb-2" />
            <span className="text-2xl font-bold text-white">5</span>
            <span className="text-[10px] uppercase tracking-wider text-orange-200/70 font-semibold mt-1">Critical</span>
          </div>

          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <AlertCircle className="w-6 h-6 text-red-400 mb-2" />
            <span className="text-2xl font-bold text-white">2</span>
            <span className="text-[10px] uppercase tracking-wider text-red-200/70 font-semibold mt-1">Out of Stock</span>
          </div>

        </div>

      </div>
    </div>
  )
}
