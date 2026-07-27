import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { UtensilsCrossed, LogOut, ArrowRight, ShieldAlert } from 'lucide-react'
import Link from 'next/link'

export default async function RootPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/login')
  }

  const role = (session.user as any).role

  if (role === 'manager') {
    redirect('/admin/dashboard')
  } else if (role === 'server') {
    redirect('/staff/orders')
  } else if (role === 'kitchen') {
    redirect('/kitchen/display')
  } else {
    // Elegant unauthorized / unassigned role page
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 relative overflow-hidden">
        
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="bg-white p-10 rounded-3xl shadow-xl shadow-gray-200/50 max-w-lg w-full text-center relative z-10 border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="mx-auto w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 border border-amber-100 shadow-inner">
            <ShieldAlert className="w-8 h-8 text-amber-500" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-3">Role Unassigned</h1>
          
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            You are successfully authenticated with <span className="font-semibold text-gray-900">KitchenSync</span>, but your account hasn't been assigned a specific restaurant role yet (Manager, Kitchen, or Server).
          </p>

          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-left mb-8">
            <h3 className="font-semibold text-gray-900 text-sm mb-2">What to do next?</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                Contact your restaurant administrator to have a role assigned to this account.
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                If you are a customer, please visit your restaurant's specific digital menu link directly.
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link 
              href="/api/auth/signout"
              className="px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-gray-900/20"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </Link>
            <button 
              className="px-6 py-3 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
              onClick={() => window.location.reload()}
            >
              Refresh Status
            </button>
          </div>

        </div>
      </div>
    )
  }
}
