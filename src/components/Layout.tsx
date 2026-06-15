import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Car, Fuel, BarChart3, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/vehicles', label: '车辆管理', icon: Car },
  { path: '/refuel', label: '加油记录', icon: Fuel },
  { path: '/analysis', label: '油耗分析', icon: BarChart3 },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0f0f1a]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
              <Car className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-zinc-100">
                养车记录
              </h1>
              <p className="text-[10px] font-medium uppercase tracking-widest text-amber-500/60">
                Fuel Tracker
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              )
            })}
          </nav>

          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-zinc-200 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <nav className="border-t border-white/5 px-4 py-2 md:hidden">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path)
                    setMobileMenuOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'text-zinc-400 hover:bg-white/5'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              )
            })}
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 lg:px-8">{children}</main>
    </div>
  )
}
