import { useState } from 'react'
import { X, Plus, Pencil, Trash2, Check } from 'lucide-react'
import { useStore } from '@/store/useStore'
import type { FuelType } from '@/types'
import { cn } from '@/lib/utils'

const fuelTypes: FuelType[] = ['汽油', '柴油', '电动', '混动']
const vehicleColors = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#06b6d4']

interface VehicleFormData {
  brand: string
  plateNumber: string
  displacement: string
  fuelType: FuelType
  color: string
}

const defaultForm: VehicleFormData = {
  brand: '',
  plateNumber: '',
  displacement: '',
  fuelType: '汽油',
  color: '#f59e0b',
}

export default function Vehicles() {
  const { vehicles, activeVehicleId, setActiveVehicle, addVehicle, updateVehicle, deleteVehicle } = useStore()
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<VehicleFormData>(defaultForm)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const openAdd = () => {
    setEditingId(null)
    setForm(defaultForm)
    setShowModal(true)
  }

  const openEdit = (id: string) => {
    const v = vehicles.find((v) => v.id === id)
    if (!v) return
    setEditingId(id)
    setForm({
      brand: v.brand,
      plateNumber: v.plateNumber,
      displacement: String(v.displacement),
      fuelType: v.fuelType,
      color: v.color,
    })
    setShowModal(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      brand: form.brand.trim(),
      plateNumber: form.plateNumber.trim(),
      displacement: parseFloat(form.displacement) || 0,
      fuelType: form.fuelType,
      color: form.color,
    }
    if (!data.brand || !data.plateNumber) return
    if (editingId) {
      updateVehicle(editingId, data)
    } else {
      addVehicle(data)
    }
    setShowModal(false)
  }

  const handleDelete = (id: string) => {
    deleteVehicle(id)
    setDeleteConfirmId(null)
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-100">我的车辆</h2>
          <p className="mt-1 text-sm text-zinc-500">管理你的车辆信息，点击选择当前活跃车辆</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-black transition-all hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/20"
        >
          <Plus className="h-4 w-4" />
          添加车辆
        </button>
      </div>

      {vehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700/50 py-20">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/50">
            <Plus className="h-8 w-8 text-zinc-500" />
          </div>
          <p className="text-sm text-zinc-400">还没有车辆信息</p>
          <p className="mt-1 text-xs text-zinc-600">点击上方按钮添加你的第一辆车</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => {
            const isActive = vehicle.id === activeVehicleId
            return (
              <div
                key={vehicle.id}
                onClick={() => setActiveVehicle(vehicle.id)}
                className={cn(
                  'group relative cursor-pointer overflow-hidden rounded-xl border transition-all duration-300',
                  isActive
                    ? 'border-amber-500/30 bg-zinc-800/80 shadow-lg shadow-amber-500/5'
                    : 'border-zinc-800/50 bg-zinc-900/50 hover:border-zinc-700/50 hover:bg-zinc-800/50'
                )}
              >
                <div
                  className="absolute left-0 top-0 h-full w-1"
                  style={{ backgroundColor: vehicle.color }}
                />
                {isActive && (
                  <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20">
                    <Check className="h-3 w-3 text-amber-400" />
                  </div>
                )}
                <div className="p-5 pl-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-100">{vehicle.brand}</h3>
                      <p className="mt-1 font-data text-sm tracking-wider text-zinc-400">
                        {vehicle.plateNumber}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-md bg-zinc-800 px-2.5 py-1 text-xs text-zinc-400">
                      {vehicle.displacement}L
                    </span>
                    <span className="rounded-md bg-zinc-800 px-2.5 py-1 text-xs text-zinc-400">
                      {vehicle.fuelType}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        openEdit(vehicle.id)
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-700/50 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteConfirmId(vehicle.id)
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-700/50 text-zinc-400 transition-colors hover:bg-red-500/20 hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl border border-zinc-800 bg-[#1a1a2e] p-6">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-100">
                {editingId ? '编辑车辆' : '添加车辆'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">品牌型号</label>
                <input
                  type="text"
                  value={form.brand}
                  onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                  placeholder="例如：丰田卡罗拉"
                  className="w-full rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">车牌号</label>
                <input
                  type="text"
                  value={form.plateNumber}
                  onChange={(e) => setForm((f) => ({ ...f, plateNumber: e.target.value.toUpperCase() }))}
                  placeholder="例如：京A12345"
                  className="w-full rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3.5 py-2.5 text-sm font-data tracking-wider text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">排量 (L)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={form.displacement}
                    onChange={(e) => setForm((f) => ({ ...f, displacement: e.target.value }))}
                    placeholder="1.5"
                    className="w-full rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">燃油类型</label>
                  <select
                    value={form.fuelType}
                    onChange={(e) => setForm((f) => ({ ...f, fuelType: e.target.value as FuelType }))}
                    className="w-full rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3.5 py-2.5 text-sm text-zinc-100 outline-none transition-colors focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
                  >
                    {fuelTypes.map((ft) => (
                      <option key={ft} value={ft}>{ft}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">标识颜色</label>
                <div className="flex gap-2">
                  {vehicleColors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, color: c }))}
                      className={cn(
                        'h-8 w-8 rounded-full border-2 transition-all',
                        form.color === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg border border-zinc-700/50 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-amber-500 py-2.5 text-sm font-medium text-black transition-all hover:bg-amber-400"
                >
                  {editingId ? '保存修改' : '添加车辆'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-zinc-800 bg-[#1a1a2e] p-6">
            <h3 className="text-lg font-semibold text-zinc-100">确认删除</h3>
            <p className="mt-2 text-sm text-zinc-400">
              删除后将同时清除该车辆的所有加油记录，此操作不可撤销。
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 rounded-lg border border-zinc-700/50 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 rounded-lg bg-red-500/80 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-500"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
