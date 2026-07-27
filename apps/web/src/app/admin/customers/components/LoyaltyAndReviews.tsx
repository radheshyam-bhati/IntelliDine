import React from 'react'
import { Gift, Star, Award, Shield, Crown, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react'

export function LoyaltyAndReviews() {
  return (
    <div className="space-y-6">
      
      {/* Header section for this tab */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Gift className="w-5 h-5 text-pink-500" />
            Loyalty & Feedback
          </h2>
          <p className="text-sm text-gray-500 mt-1">Manage membership tiers, reward redemptions, and monitor customer reviews.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Loyalty Program Section */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2"><Award className="w-5 h-5 text-blue-500" /> Loyalty Tiers Breakdown</h3>
            
            <div className="space-y-4">
              
              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-blue-200 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center border-2 border-white shadow-sm">
                    <Shield className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Silver Member</h4>
                    <p className="text-xs text-gray-500">Base Tier • 0 - 5,000 pts</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">1,240 <span className="text-xs font-medium text-gray-500">users</span></p>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">52% of base</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-amber-50/50 border border-amber-100 hover:border-amber-300 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-200 to-amber-400 flex items-center justify-center border-2 border-white shadow-sm">
                    <Star className="w-5 h-5 text-white fill-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Gold Member</h4>
                    <p className="text-xs text-gray-500">Premium Tier • 5,000 - 20,000 pts</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">425 <span className="text-xs font-medium text-gray-500">users</span></p>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">18% of base</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-400 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center border-2 border-white shadow-sm">
                    <Crown className="w-5 h-5 text-slate-200" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Platinum Member</h4>
                    <p className="text-xs text-gray-500">VIP Tier • 20,000+ pts</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">128 <span className="text-xs font-medium text-gray-500">users</span></p>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase">5% of base</p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-900 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-emerald-500" /> Recent Reviews</h3>
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700">View All 842</button>
            </div>
            
            <div className="space-y-4 flex-1">
              
              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map(star => <Star key={star} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />)}
                    </div>
                    <span className="text-xs font-semibold text-gray-900">David Smith</span>
                  </div>
                  <span className="text-[10px] font-medium text-gray-400">2 days ago</span>
                </div>
                <p className="text-sm text-gray-600 italic">"The truffle pasta was absolutely amazing. Service was quick and the staff was very friendly. Highly recommend!"</p>
                <div className="mt-3 flex items-center gap-4">
                  <button className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-900"><ThumbsUp className="w-3.5 h-3.5"/> Reply</button>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-red-100 bg-red-50/30">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1,2].map(star => <Star key={star} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />)}
                      {[3,4,5].map(star => <Star key={star} className="w-3.5 h-3.5 text-gray-300 fill-gray-300" />)}
                    </div>
                    <span className="text-xs font-semibold text-gray-900">Anonymous</span>
                  </div>
                  <span className="text-[10px] font-medium text-gray-400">4 days ago</span>
                </div>
                <p className="text-sm text-gray-600 italic">"Wait time for a table was over 45 minutes despite having a reservation. Food was okay but cold."</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wide">Action Required</span>
                  <button className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-blue-600 hover:text-blue-800 ml-auto">Resolve Issue</button>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>

    </div>
  )
}
