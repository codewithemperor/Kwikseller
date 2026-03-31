'use client'

import { 
  Bike, 
  Package, 
  DollarSign, 
  Star, 
  MapPin, 
  Phone,
  Navigation,
  Camera,
  Clock,
  ArrowRight
} from 'lucide-react'
import { Button, Card, Chip } from '@heroui/react'

export default function RiderApp() {
  // Mock data for demo
  const riderStats = {
    todayDeliveries: 8,
    todayEarnings: 4500,
    weeklyDeliveries: 42,
    weeklyEarnings: 28500,
    rating: 4.8,
    totalDeliveries: 156,
  }

  const pendingDeliveries = [
    {
      id: '1',
      pickup: '23 Admiralty Way, Lekki',
      dropoff: '15 Banana Island Road, Ikoyi',
      distance: '5.2 km',
      estimatedPay: 850,
      customer: 'Adebayo O.',
    },
    {
      id: '2',
      pickup: '45 Allen Avenue, Ikeja',
      dropoff: '78 Opebi Road, Ikeja',
      distance: '2.1 km',
      estimatedPay: 500,
      customer: 'Chioma N.',
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Bike className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-lg">KWIKSELLER</h1>
                <p className="text-xs text-white/80">Rider App</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Chip size="sm" className="bg-white/20 text-white">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span>Online</span>
                </div>
              </Chip>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-24">
        {/* Stats Cards */}
        <section className="px-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-primary/20 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{riderStats.todayDeliveries}</p>
                  <p className="text-xs text-default-500">Today&apos;s Deliveries</p>
                </div>
              </div>
            </Card>
            <Card className="border-success/20 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">₦{riderStats.todayEarnings.toLocaleString()}</p>
                  <p className="text-xs text-default-500">Today&apos;s Earnings</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Rating Card */}
          <Card className="mt-3 border-warning/20 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Star className="w-5 h-5 text-warning fill-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{riderStats.rating}</p>
                  <p className="text-xs text-default-500">Your Rating</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">{riderStats.totalDeliveries}</p>
                <p className="text-xs text-default-500">Total Deliveries</p>
              </div>
            </div>
          </Card>
        </section>

        {/* Available Deliveries */}
        <section className="px-4 py-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg">Available Deliveries</h2>
            <Chip size="sm">{pendingDeliveries.length} new</Chip>
          </div>
          
          <div className="space-y-3">
            {pendingDeliveries.map((delivery) => (
              <Card key={delivery.id} className="overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Chip size="sm" color="success" variant="soft">
                        ₦{delivery.estimatedPay}
                      </Chip>
                      <Chip size="sm" variant="soft">{delivery.distance}</Chip>
                    </div>
                    <span className="text-sm text-default-500">
                      {delivery.customer}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-primary">P</span>
                      </div>
                      <div>
                        <p className="text-xs text-default-500">Pickup</p>
                        <p className="text-sm font-medium">{delivery.pickup}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-success">D</span>
                      </div>
                      <div>
                        <p className="text-xs text-default-500">Drop-off</p>
                        <p className="text-sm font-medium">{delivery.dropoff}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex border-t border-divider">
                  <Button variant="ghost" className="flex-1 rounded-none h-12">
                    <Navigation className="w-4 h-4 mr-2" />
                    Navigate
                  </Button>
                  <Button className="flex-1 rounded-none h-12 bg-primary text-primary-foreground">
                    Accept
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="px-4 py-4 mt-2">
          <h2 className="font-semibold text-lg mb-3">Quick Actions</h2>
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: Clock, label: 'History', color: 'bg-primary/10 text-primary' },
              { icon: DollarSign, label: 'Earnings', color: 'bg-success/10 text-success' },
              { icon: Camera, label: 'Proof', color: 'bg-secondary/10 text-secondary' },
              { icon: Phone, label: 'Support', color: 'bg-warning/10 text-warning' },
            ].map((action, index) => (
              <button
                key={index}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-default/50 hover:bg-default transition-colors"
              >
                <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t z-40">
        <div className="flex items-center justify-around py-2">
          {[
            { icon: Package, label: 'Deliveries', active: true },
            { icon: MapPin, label: 'Map', active: false },
            { icon: DollarSign, label: 'Earnings', active: false },
            { icon: Star, label: 'Profile', active: false },
          ].map((item, index) => (
            <button
              key={index}
              className={`flex flex-col items-center gap-1 px-4 py-2 ${
                item.active ? 'text-primary' : 'text-default-500'
              }`}
            >
              <item.icon className={`w-5 h-5 ${item.active ? 'stroke-[2.5]' : ''}`} />
              <span className={`text-xs ${item.active ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
