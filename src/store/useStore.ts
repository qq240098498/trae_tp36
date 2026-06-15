import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Vehicle, RefuelRecord } from '@/types'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function calculateAnomalies(records: RefuelRecord[]): RefuelRecord[] {
  const withConsumption = records.filter((r) => r.consumption > 0)
  if (withConsumption.length === 0) return records

  const avgConsumption =
    withConsumption.reduce((sum, r) => sum + r.consumption, 0) /
    withConsumption.length

  return records.map((r) => {
    if (r.consumption <= 0) return { ...r, isAnomaly: false, anomalyPercentage: 0 }
    const pct = ((r.consumption - avgConsumption) / avgConsumption) * 100
    const isAnomaly = pct > 20
    return { ...r, isAnomaly, anomalyPercentage: Math.round(pct * 10) / 10 }
  })
}

interface AppState {
  vehicles: Vehicle[]
  refuelRecords: RefuelRecord[]
  activeVehicleId: string | null

  setActiveVehicle: (id: string) => void
  addVehicle: (vehicle: Omit<Vehicle, 'id' | 'createdAt'>) => void
  updateVehicle: (id: string, data: Omit<Vehicle, 'id' | 'createdAt'>) => void
  deleteVehicle: (id: string) => void

  addRefuelRecord: (record: Omit<RefuelRecord, 'id' | 'consumption' | 'costPerKm' | 'isAnomaly' | 'anomalyPercentage'>) => void
  deleteRefuelRecord: (id: string) => void

  getActiveVehicle: () => Vehicle | undefined
  getRecordsForVehicle: (vehicleId: string) => RefuelRecord[]
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      vehicles: [],
      refuelRecords: [],
      activeVehicleId: null,

      setActiveVehicle: (id) => set({ activeVehicleId: id }),

      addVehicle: (vehicle) => {
        const newVehicle: Vehicle = {
          ...vehicle,
          id: generateId(),
          createdAt: Date.now(),
        }
        set((state) => {
          const vehicles = [...state.vehicles, newVehicle]
          const activeVehicleId = state.activeVehicleId || newVehicle.id
          return { vehicles, activeVehicleId }
        })
      },

      updateVehicle: (id, data) => {
        set((state) => ({
          vehicles: state.vehicles.map((v) =>
            v.id === id ? { ...v, ...data } : v
          ),
        }))
      },

      deleteVehicle: (id) => {
        set((state) => {
          const vehicles = state.vehicles.filter((v) => v.id !== id)
          const refuelRecords = state.refuelRecords.filter((r) => r.vehicleId !== id)
          const activeVehicleId =
            state.activeVehicleId === id
              ? vehicles[0]?.id || null
              : state.activeVehicleId
          return { vehicles, refuelRecords, activeVehicleId }
        })
      },

      addRefuelRecord: (record) => {
        const state = get()
        const vehicleRecords = state.refuelRecords
          .filter((r) => r.vehicleId === record.vehicleId)
          .sort((a, b) => a.mileage - b.mileage)

        const prevRecord = vehicleRecords.length > 0
          ? vehicleRecords[vehicleRecords.length - 1]
          : null

        let consumption = 0
        let costPerKm = 0

        if (prevRecord && record.mileage > prevRecord.mileage) {
          const distance = record.mileage - prevRecord.mileage
          consumption = (record.volume / distance) * 100
          costPerKm = record.totalCost / distance
        }

        const newRecord: RefuelRecord = {
          ...record,
          id: generateId(),
          consumption: Math.round(consumption * 100) / 100,
          costPerKm: Math.round(costPerKm * 100) / 100,
          isAnomaly: false,
          anomalyPercentage: 0,
        }

        set((state) => {
          const updated = [...state.refuelRecords, newRecord]
          const recalculated = calculateAnomalies(updated)
          return { refuelRecords: recalculated }
        })
      },

      deleteRefuelRecord: (id) => {
        set((state) => {
          const updated = state.refuelRecords.filter((r) => r.id !== id)
          const recalculated = calculateAnomalies(updated)
          return { refuelRecords: recalculated }
        })
      },

      getActiveVehicle: () => {
        const state = get()
        return state.vehicles.find((v) => v.id === state.activeVehicleId)
      },

      getRecordsForVehicle: (vehicleId) => {
        return get()
          .refuelRecords.filter((r) => r.vehicleId === vehicleId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      },
    }),
    {
      name: 'car-maintenance-storage',
    }
  )
)
