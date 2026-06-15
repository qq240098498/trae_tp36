import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Vehicle, RefuelRecord, MaintenanceRecord, MaintenanceReminder, PriceAlertSetting, GasStationAvgPrice, WeekdayPrice } from '@/types'

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
  maintenanceRecords: MaintenanceRecord[]
  priceAlertSettings: PriceAlertSetting[]
  activeVehicleId: string | null

  setActiveVehicle: (id: string) => void
  addVehicle: (vehicle: Omit<Vehicle, 'id' | 'createdAt'>) => void
  updateVehicle: (id: string, data: Omit<Vehicle, 'id' | 'createdAt'>) => void
  deleteVehicle: (id: string) => void

  addRefuelRecord: (record: Omit<RefuelRecord, 'id' | 'consumption' | 'costPerKm' | 'isAnomaly' | 'anomalyPercentage'>) => void
  deleteRefuelRecord: (id: string) => void

  addMaintenanceRecord: (record: Omit<MaintenanceRecord, 'id' | 'createdAt'>) => void
  updateMaintenanceRecord: (id: string, data: Partial<Omit<MaintenanceRecord, 'id' | 'vehicleId' | 'createdAt'>>) => void
  deleteMaintenanceRecord: (id: string) => void

  addPriceAlert: (alert: Omit<PriceAlertSetting, 'id' | 'createdAt'>) => void
  updatePriceAlert: (id: string, data: Partial<Omit<PriceAlertSetting, 'id' | 'vehicleId' | 'createdAt'>>) => void
  deletePriceAlert: (id: string) => void

  getActiveVehicle: () => Vehicle | undefined
  getRecordsForVehicle: (vehicleId: string) => RefuelRecord[]
  getMaintenanceRecordsForVehicle: (vehicleId: string) => MaintenanceRecord[]
  getCurrentMileage: (vehicleId: string) => number
  getMaintenanceReminders: () => MaintenanceReminder[]
  getGasStationAvgPrices: (vehicleId?: string) => GasStationAvgPrice[]
  getWeekdayPrices: (vehicleId?: string) => WeekdayPrice[]
  getPriceAlerts: () => PriceAlertSetting[]
  checkPriceAlerts: (record: RefuelRecord) => PriceAlertSetting[]
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      vehicles: [],
      refuelRecords: [],
      maintenanceRecords: [],
      priceAlertSettings: [],
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
          const maintenanceRecords = state.maintenanceRecords.filter((r) => r.vehicleId !== id)
          const activeVehicleId =
            state.activeVehicleId === id
              ? vehicles[0]?.id || null
              : state.activeVehicleId
          return { vehicles, refuelRecords, maintenanceRecords, activeVehicleId }
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

      addMaintenanceRecord: (record) => {
        const newRecord: MaintenanceRecord = {
          ...record,
          id: generateId(),
          createdAt: Date.now(),
        }
        set((state) => ({
          maintenanceRecords: [...state.maintenanceRecords, newRecord],
        }))
      },

      updateMaintenanceRecord: (id, data) => {
        set((state) => ({
          maintenanceRecords: state.maintenanceRecords.map((r) =>
            r.id === id ? { ...r, ...data } : r
          ),
        }))
      },

      deleteMaintenanceRecord: (id) => {
        set((state) => ({
          maintenanceRecords: state.maintenanceRecords.filter((r) => r.id !== id),
        }))
      },

      addPriceAlert: (alert) => {
        const newAlert: PriceAlertSetting = {
          ...alert,
          id: generateId(),
          createdAt: Date.now(),
        }
        set((state) => ({
          priceAlertSettings: [...state.priceAlertSettings, newAlert],
        }))
      },

      updatePriceAlert: (id, data) => {
        set((state) => ({
          priceAlertSettings: state.priceAlertSettings.map((a) =>
            a.id === id ? { ...a, ...data } : a
          ),
        }))
      },

      deletePriceAlert: (id) => {
        set((state) => ({
          priceAlertSettings: state.priceAlertSettings.filter((a) => a.id !== id),
        }))
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

      getMaintenanceRecordsForVehicle: (vehicleId) => {
        return get()
          .maintenanceRecords.filter((r) => r.vehicleId === vehicleId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      },

      getCurrentMileage: (vehicleId) => {
        const state = get()
        const refuelRecords = state.refuelRecords.filter((r) => r.vehicleId === vehicleId)
        const maintenanceRecords = state.maintenanceRecords.filter((r) => r.vehicleId === vehicleId)
        
        let maxMileage = 0
        
        refuelRecords.forEach((r) => {
          if (r.mileage > maxMileage) maxMileage = r.mileage
        })
        maintenanceRecords.forEach((r) => {
          if (r.currentMileage > maxMileage) maxMileage = r.currentMileage
        })
        
        return maxMileage
      },

      getMaintenanceReminders: () => {
        const state = get()
        const reminders: MaintenanceReminder[] = []
        const reminderKmThreshold = 500
        const reminderDaysThreshold = 15

        state.vehicles.forEach((vehicle) => {
          const currentMileage = state.getCurrentMileage(vehicle.id)
          const records = state.getMaintenanceRecordsForVehicle(vehicle.id)
          
          records.forEach((record) => {
            if (record.nextMaintenanceMileage && currentMileage > 0) {
              const remainingKm = record.nextMaintenanceMileage - currentMileage
              if (remainingKm <= reminderKmThreshold && remainingKm > 0) {
                reminders.push({
                  vehicleId: vehicle.id,
                  type: 'mileage',
                  remainingKm,
                  maintenanceId: record.id,
                })
              }
            }
            
            if (record.nextMaintenanceDate) {
              const nextDate = new Date(record.nextMaintenanceDate)
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              const diffTime = nextDate.getTime() - today.getTime()
              const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
              
              if (remainingDays <= reminderDaysThreshold && remainingDays >= 0) {
                reminders.push({
                  vehicleId: vehicle.id,
                  type: 'date',
                  remainingDays,
                  maintenanceId: record.id,
                })
              }
            }
          })
        })

        return reminders
      },

      getGasStationAvgPrices: (vehicleId) => {
        const state = get()
        let records = state.refuelRecords
        
        if (vehicleId) {
          records = records.filter((r) => r.vehicleId === vehicleId)
        }

        records = records.filter((r) => r.gasStation && r.gasStation.trim() !== '')

        const stationMap = new Map<string, { prices: number[]; count: number }>()

        records.forEach((record) => {
          const station = record.gasStation
          if (!stationMap.has(station)) {
            stationMap.set(station, { prices: [], count: 0 })
          }
          const data = stationMap.get(station)!
          data.prices.push(record.unitPrice)
          data.count++
        })

        const result: GasStationAvgPrice[] = []
        stationMap.forEach((data, station) => {
          result.push({
            gasStation: station,
            avgPrice: data.prices.reduce((a, b) => a + b, 0) / data.prices.length,
            recordCount: data.count,
            minPrice: Math.min(...data.prices),
            maxPrice: Math.max(...data.prices),
          })
        })

        return result.sort((a, b) => a.avgPrice - b.avgPrice)
      },

      getWeekdayPrices: (vehicleId) => {
        const state = get()
        let records = state.refuelRecords
        
        if (vehicleId) {
          records = records.filter((r) => r.vehicleId === vehicleId)
        }

        const weekdayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
        const weekdayMap = new Map<number, { prices: number[]; count: number }>()

        for (let i = 0; i < 7; i++) {
          weekdayMap.set(i, { prices: [], count: 0 })
        }

        records.forEach((record) => {
          const date = new Date(record.date)
          const weekday = date.getDay()
          const data = weekdayMap.get(weekday)!
          data.prices.push(record.unitPrice)
          data.count++
        })

        const result: WeekdayPrice[] = []
        weekdayMap.forEach((data, weekday) => {
          if (data.count > 0) {
            result.push({
              weekday,
              weekdayName: weekdayNames[weekday],
              avgPrice: data.prices.reduce((a, b) => a + b, 0) / data.prices.length,
              recordCount: data.count,
            })
          }
        })

        return result.sort((a, b) => a.avgPrice - b.avgPrice)
      },

      getPriceAlerts: () => {
        return get().priceAlertSettings
      },

      checkPriceAlerts: (record) => {
        const state = get()
        const triggeredAlerts: PriceAlertSetting[] = []

        state.priceAlertSettings.forEach((alert) => {
          if (!alert.enabled) return
          if (alert.gasStation && alert.gasStation !== record.gasStation) return
          if (record.unitPrice <= alert.threshold) {
            triggeredAlerts.push(alert)
          }
        })

        return triggeredAlerts
      },
    }),
    {
      name: 'car-maintenance-storage',
    }
  )
)
