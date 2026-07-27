import React from 'react'
import { Sparkles, Send, Activity, UserPlus, Gift, AlertTriangle } from 'lucide-react'

export function AIAssistantPanel() {
  return (
    <aside className="w-80 border-l border-gray-200/80 bg-white/50 backdrop-blur-xl flex flex-col h-full overflow-hidden shadow-[-4px_0_24px_-12px_rgba(0,0,0,0.1)]">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm shadow-blue-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">CRM AI</h3>
            <p className="text-[10px] text-gray-500 font-medium">Powered by KitchenSync</p>
          </div>
        </div>
      </div>

      {/* Suggested Prompts */}
      <div className="p-4 space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Ask about</p>
        {[
          "Who is my highest spending customer?",
          "Which customers are likely to churn?",
          "Generate offers for VIP members",
          "Show birthday customers this week"
        ].map((prompt, i) => (
          <button
            key={i}
            className="w-full text-left p-3 text-xs text-gray-700 bg-gray-50/80 hover:bg-white hover:shadow-sm hover:-translate-y-0.5 border border-gray-100 rounded-xl transition-all duration-200"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Live Activity Feed */}
      <div className="flex-1 overflow-y-auto p-4 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-emerald-500" />
          <h4 className="font-semibold text-gray-900 text-sm">Live Activity</h4>
        </div>
        
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
          
          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-5 h-5 rounded-full border border-white bg-blue-100 text-blue-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
            </div>
            <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.25rem)] p-3 rounded-xl border border-gray-100 bg-white shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <div className="font-medium text-slate-900 text-xs">VIP Upgrade</div>
                <time className="text-[10px] font-medium text-blue-500">Just now</time>
              </div>
              <div className="text-[10px] text-slate-500">Sarah Jenkins reached Gold Tier</div>
            </div>
          </div>

          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-5 h-5 rounded-full border border-white bg-emerald-100 text-emerald-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
            </div>
            <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.25rem)] p-3 rounded-xl border border-gray-100 bg-white shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <div className="font-medium text-slate-900 text-xs text-emerald-700">Reservation Created</div>
                <time className="text-[10px] font-medium text-slate-400">2m ago</time>
              </div>
              <div className="text-[10px] text-slate-500">Table 4, Party of 2 (Michael Ross)</div>
            </div>
          </div>

          <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-5 h-5 rounded-full border border-white bg-amber-100 text-amber-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
            </div>
            <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.25rem)] p-3 rounded-xl border border-gray-100 bg-white shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <div className="font-medium text-slate-900 text-xs">Review Submitted</div>
                <time className="text-[10px] font-medium text-slate-400">15m ago</time>
              </div>
              <div className="text-[10px] text-slate-500">5 stars - "Excellent service!"</div>
            </div>
          </div>

        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="relative">
          <input
            type="text"
            placeholder="Ask AI about customers..."
            className="w-full bg-gray-50 border border-gray-200 rounded-full pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          <button className="absolute right-1.5 top-1.5 bottom-1.5 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/30">
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
