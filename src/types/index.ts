export type FuelType = '汽油' | '柴油' | '电动' | '混动'

export interface Vehicle {
  id: string
  brand: string
  plateNumber: string
  displacement: number
  fuelType: FuelType
  color: string
  createdAt: number
}

export interface RefuelRecord {
  id: string
  vehicleId: string
  date: string
  volume: number
  unitPrice: number
  totalCost: number
  mileage: number
  consumption: number
  costPerKm: number
  isAnomaly: boolean
  anomalyPercentage: number
}

export type MaintenanceItem =
  | '换机油'
  | '换机滤'
  | '换空气滤芯'
  | '换空调滤芯'
  | '换汽油滤芯'
  | '换火花塞'
  | '换变速箱油'
  | '换刹车油'
  | '换冷却液'
  | '轮胎换位'
  | '四轮定位'
  | '刹车片更换'
  | '刹车盘更换'
  | '正时皮带'
  | '蓄电池更换'
  | '大保养'
  | '其他'

export interface MaintenanceRecord {
  id: string
  vehicleId: string
  date: string
  items: MaintenanceItem[]
  customItems?: string
  totalCost: number
  currentMileage: number
  nextMaintenanceMileage?: number
  nextMaintenanceDate?: string
  notes?: string
  receiptImage?: string
  createdAt: number
}

export interface MaintenanceReminder {
  vehicleId: string
  type: 'mileage' | 'date'
  remainingKm?: number
  remainingDays?: number
  maintenanceId: string
}
