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
