// KWIKSELLER Vendor Dashboard - Landing Page
// For vendors to manage their online store

'use client'

import { Store, Package, ShoppingCart, DollarSign, TrendingUp, Bell, Settings, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function VendorDashboard() {
  const stats = [
    { title: 'Total Revenue', value: '₦1,234,567', change: '+12.5%', icon: DollarSign },
    { title: 'Orders', value: '145', change: '+8.2%', icon: ShoppingCart },
    { title: 'Products', value: '89', change: '+3', icon: Package },
    { title: 'Conversion', value: '3.2%', change: '+0.5%', icon: TrendingUp },
  ]

  const recentOrders = [
    { id: 'ORD-001', customer: 'John Doe', amount: '₦15,000', status: 'Processing' },
    { id: 'ORD-002', customer: 'Jane Smith', amount: '₦28,500', status: 'Shipped' },
    { id: 'ORD-003', customer: 'Mike Johnson', amount: '₦9,800', status: 'Delivered' },
    { id: 'ORD-004', customer: 'Sarah Wilson', amount: '₦45,000', status: 'Pending' },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Store className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">KWIKSELLER</span>
              <span className="text-sm text-muted-foreground ml-2">Vendor Dashboard</span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Bell className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Welcome back! 👋</h1>
          <p className="text-muted-foreground">Here&apos;s what&apos;s happening with your store today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-green-600">{stat.change} from last month</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest orders from your store</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{order.id}</p>
                    <p className="text-sm text-muted-foreground">{order.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{order.amount}</p>
                    <p className="text-sm text-muted-foreground">{order.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
