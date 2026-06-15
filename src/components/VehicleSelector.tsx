import { useState, useRef, useEffect } from 'react'
import { Car, ChevronDown, Check } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import type { Vehicle } from '@/types'

interface VehicleSelectorProps {
  showLabel?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export default function VehicleSelector({
  showLabel = true,
  size = 'md',
  className = '',
}: VehicleSelectorProps) {
  const { vehicles, activeVehicleId, setActiveVehicle } = useStore()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const activeVehicle = vehicles.find((v) => v.id === activeVehicleId)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (vehicles.length === 0) return null

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-3 rounded-lg border border-zinc-700/50 bg-zinc-800/50 transition-colors hover:bg-zinc-800',
          size === 'sm' ? 'px-3 py-1.5' : 'px-4 py-2.5'
        )}
      >
        <div
          className={cn(
            'flex items-center justify-center rounded-md',
            size === 'sm' ? 'h-6 w-6' : 'h-8 w-8'
          )}
          style={{ backgroundColor: activeVehicle?.color + '20' }}
        >
          <Car
            className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'}
            style={{ color: activeVehicle?.color }}
          />
        </div>
        {showLabel && (
          <div className="text-left">
            <p
              className={cn(
                'font-medium text-zinc-100',
                size === 'sm' ? 'text-xs' : 'text-sm'
              )}
            >
              {activeVehicle?.brand || '选择车辆'}
            </p>
            <p
              className={cn(
                'font-data text-zinc-500',
                size === 'sm' ? 'text-[10px]' : 'text-xs'
              )}
            >
              {activeVehicle?.plateNumber || ''}
            </p>
          </div>
        )}
        <ChevronDown
          className={cn(
            'text-zinc-400 transition-transform',
            isOpen && 'rotate-180',
            size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-zinc-700/50 bg-[#1a1a2e] shadow-2xl">
          <div className="px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">
              选择车辆
            </p>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {vehicles.map((v) => (
              <button
                key={v.id}
                onClick={() => {
                  setActiveVehicle(v.id)
                  setIsOpen(false)
                }}
                className={cn(
                  'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-zinc-800/50',
                  v.id === activeVehicleId && 'bg-amber-500/5'
                )}
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-md"
                  style={{ backgroundColor: v.color + '20' }}
                >
                  <Car className="h-4 w-4" style={{ color: v.color }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-200">{v.brand}</p>
                  <p className="font-data text-xs text-zinc-500">{v.plateNumber}</p>
                </div>
                {v.id === activeVehicleId && (
                  <Check className="h-4 w-4 text-amber-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function VehicleBadge({
  vehicle,
  size = 'sm',
}: {
  vehicle: Vehicle | undefined
  size?: 'sm' | 'md'
}) {
  if (!vehicle) return null
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-1',
        size === 'sm' ? 'text-xs' : 'text-sm'
      )}
      style={{ backgroundColor: vehicle.color + '15', color: vehicle.color }}
    >
      <Car className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      <span className="font-medium">{vehicle.brand}</span>
      <span className="font-data opacity-70">{vehicle.plateNumber}</span>
    </div>
  )
}
