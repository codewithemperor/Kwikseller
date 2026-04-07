// KWIKSELLER Super Admin Panel
// Platform management dashboard

'use client'

import { 
  Shield, 
  Users, 
  Store, 
  DollarSign, 
  Package, 
  AlertTriangle,
  Settings,
  Bell,
  LogOut,
  Activity,
  Crown
} from 'lucide-react'
import { Card, Button, Chip } from '@heroui/react'
import { AdminProtectedRoute, RoleBadge } from '@/components/auth'
import { useAuthStore, useAuth } from '@kwikseller/utils'

function AdminPanelContent() {
  const { logout } = useAuth()
  const user = useAuthStore((state) => state.user)

  const platformStats = [
    { title: 'Total Users', value: '45,231', icon: Users, change: '+12%' },
    { title: 'Active Vendors', value: '3,847', icon: Store, change: '+8%' },
    { title: 'Total Revenue', value: '₦89.4M', icon: DollarSign, change: '+23%' },
    { title: 'Products Listed', value: '156,892', icon: Package, change: '+15%' },
  ]

  const pendingTasks = [
    { task: 'KYC Verifications', count: 23, priority: 'high' },
    { task: 'Withdrawal Requests', count: 15, priority: 'medium' },
    { task: 'Dispute Resolutions', count: 8, priority: 'high' },
    { task: 'Product Approvals', count: 47, priority: 'low' },
  ]

  const recentActivity = [
    { action: 'New vendor registered', time: '2 minutes ago', type: 'vendor' },
    { action: 'KYC approved for Store XYZ', time: '15 minutes ago', type: 'kyc' },
    { action: 'Withdrawal processed ₦500,000', time: '1 hour ago', type: 'finance' },
    { action: 'New dispute opened #DIS-1234', time: '2 hours ago', type: 'dispute' },
  ]

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar + Header Layout */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">KWIKSELLER</span>
            </div>
            
            <nav className="space-y-2">
              <Button variant="ghost" className="w-full justify-start bg-sidebar-accent">
                <Activity className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
              <Button variant="ghost" className="w-full justify-start hover:bg-sidebar-accent">
                <Users className="mr-2 h-4 w-4" />
                Users
              </Button>
              <Button variant="ghost" className="w-full justify-start hover:bg-sidebar-accent">
                <Store className="mr-2 h-4 w-4" />
                Vendors
              </Button>
              <Button variant="ghost" className="w-full justify-start hover:bg-sidebar-accent">
                <DollarSign className="mr-2 h-4 w-4" />
                Finance
              </Button>
              <Button variant="ghost" className="w-full justify-start hover:bg-sidebar-accent">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Disputes
              </Button>
              <Button variant="ghost" className="w-full justify-start hover:bg-sidebar-accent">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {/* Header */}
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
            <div className="flex h-16 items-center justify-between px-6">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold">Admin Dashboard</h1>
                {user && <RoleBadge role={user.role} />}
              </div>
              <div className="flex items-center gap-4">
                <Button isIconOnly variant="ghost">
                  <Bell className="w-5 h-5" />
                </Button>
                <Button isIconOnly variant="ghost" onPress={handleLogout}>
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </header>

          {/* Dashboard Content */}
          <div className="p-6">
            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
              {platformStats.map((stat, index) => (
                <Card key={index} className="p-4">
                  <div className="flex flex-row items-center justify-between pb-2">
                    <span className="text-sm font-medium text-default-500">
                      {stat.title}
                    </span>
                    <stat.icon className="h-4 w-4 text-default-500" />
                  </div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-success">{stat.change} from last month</p>
                </Card>
              ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Pending Tasks */}
              <Card className="p-4">
                <div className="mb-4">
                  <h3 className="font-semibold">Pending Tasks</h3>
                  <p className="text-sm text-default-500">Items requiring your attention</p>
                </div>
                <div className="space-y-4">
                  {pendingTasks.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Chip 
                          size="sm"
                          color={item.priority === 'high' ? 'danger' : item.priority === 'medium' ? 'warning' : 'default'}
                        >
                          {item.count}
                        </Chip>
                        <span className="text-sm">{item.task}</span>
                      </div>
                      <Button variant="ghost" size="sm">View</Button>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Recent Activity */}
              <Card className="p-4">
                <div className="mb-4">
                  <h3 className="font-semibold">Recent Activity</h3>
                  <p className="text-sm text-default-500">Latest platform events</p>
                </div>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>{activity.action}</span>
                      <span className="text-default-500">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function AdminPanel() {
  return (
    <AdminProtectedRoute>
      <AdminPanelContent />
    </AdminProtectedRoute>
  )
}
