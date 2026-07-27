import { redirect } from 'next/navigation'
import { auth } from '@/auth'

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 text-center">
        <div className="bg-white p-8 rounded-lg shadow max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4">Welcome to KitchenSync!</h1>
          <p className="text-gray-600 mb-6">
            You are logged in, but you don't have a staff role assigned yet. 
            Please contact an administrator to assign you a role, or visit a specific restaurant's menu page directly.
          </p>
        </div>
      </div>
    )
  }
}
