import { useState, useMemo } from 'react'
import { X, Plus, Trash2, Fuel, AlertTriangle, Gauge, DollarSign } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'

interface RefuelFormData {
  date: string
  volume: string
  unitPrice: string
  totalCost: string
  mileage: string
}

const defaultForm: RefuelFormData = {
  date: new Date().toISOString().split('T')[0],
  volume: '',
  unitPrice: '',
  totalCost: '',
  mileage: '',
}

export default function Refuel() {
  const { activeVehicleId, vehicles, getActiveVehicle, getRecordsForVehicle, addRefuelRecord, deleteRefuelRecord } = useStore()
  const activeVehicle = getActiveVehicle()
  const records = activeVehicleId ? getRecordsForVehicle(activeVehicleId) : []
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<RefuelFormData>(defaultForm)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const prevMileage = useMemo(() => {
    if (!activeVehicleId) return 0
    const sorted = [...records].sort((a, b) => a.mileage - b.mileage)
    return sorted.length > 0 ? sorted[sorted.length - 1].mileage : 0
  }, [records, activeVehicleId])

  const previewCalc = useMemo(() => {
    const volume = parseFloat(form.volume) || 0
    const mileage = parseFloat(form.mileage) || 0
    const totalCost = parseFloat(form.totalCost) || 0
    const distance = mileage - prevMileage

    if (distance > 0 && volume > 0) {
      return {
        consumption: ((volume / distance) * 100).toFixed(1),
        costPerKm: (totalCost / distance).toFixed(2),
        distance,
      }
    }
    return null
  }, [form, prevMileage])

  const handleVolumeOrPriceChange = (field: 'volume' | 'unitPrice', value: string) => {
    setForm((f) => {
      const updated = { ...f, [field]: value }
      const vol = parseFloat(updated.volume) || 0
      const price = parseFloat(updated.unitPrice) || 0
      if (vol > 0 && price > 0) {
        updated.totalCost = (vol * price).toFixed(2)
      }
      return updated
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeVehicleId) return

    addRefuelRecord({
      vehicleId: activeVehicleId,
      date: form.date,
      volume: parseFloat(form.volume) || 0,
      unitPrice: parseFloat(form.unitPrice) || 0,
      totalCost: parseFloat(form.totalCost) || 0,
      mileage: parseFloat(form.mileage) || 0,
    })

    setShowModal(false)
    setForm(defaultForm)
  }

  const openAdd = () => {
    setForm(defaultForm)
    setShowModal(true)
  }

  if (vehicles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700/50 py-20">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/50">
          <Fuel className="h-8 w-8 text-zinc-500" />
        </div>
        <p className="text-sm text-zinc-400">请先添加车辆信息</p>
        <p className="mt-1 text-xs text-zinc-600">在"车辆管理"页面中添加车辆后即可记录加油</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-100">加油记录</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {activeVehicle
              ? `当前车辆：${activeVehicle.brand} ${activeVehicle.plateNumber}`
              : '请选择一辆车'}
          </p>
        </div>
        <button
          onClick={openAdd}
          disabled={!activeVehicleId}
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
            activeVehicleId
              ? 'bg-amber-500 text-black hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/20'
              : 'cursor-not-allowed bg-zinc-800 text-zinc-500'
          )}
        >
          <Plus className="h-4 w-4" />
          添加记录
        </button>
      </div>

      {records.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700/50 py-20">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/50">
            <Fuel className="h-8 w-8 text-zinc-500" />
          </div>
          <p className="text-sm text-zinc-400">暂无加油记录</p>
          <p className="mt-1 text-xs text-zinc-600">点击上方按钮开始记录</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record, index) => {
            const showConsumption = record.consumption > 0
            return (
              <div
                key={record.id}
                className={cn(
                  'group relative overflow-hidden rounded-xl border transition-all',
                  record.isAnomaly
                    ? 'border-red-500/20 bg-red-500/5'
                    : 'border-zinc-800/50 bg-zinc-900/50'
                )}
              >
                <div className="flex items-stretch">
                  <div className="flex flex-col items-center justify-center px-4 py-5">
                    <span className="font-data text-2xl font-bold text-zinc-200">
                      {new Date(record.date).getDate()}
                    </span>
                    <span className="text-[10px] uppercase text-zinc-500">
                      {new Date(record.date).toLocaleDateString('zh-CN', { month: 'short' })}
                    </span>
                  </div>
                  <div className="flex-1 border-l border-zinc-800/50 py-4 pl-5 pr-4">
                    <div className="flex items-start justify-between">
                      <div className="grid flex-1 grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-zinc-500">加油量</p>
                          <p className="font-data text-sm font-semibold text-zinc-200">
                            {record.volume}<span className="ml-0.5 text-xs text-zinc-500">L</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-zinc-500">单价</p>
                          <p className="font-data text-sm font-semibold text-zinc-200">
                            {record.unitPrice.toFixed(2)}<span className="ml-0.5 text-xs text-zinc-500">元/L</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-zinc-500">总金额</p>
                          <p className="font-data text-sm font-semibold text-zinc-200">
                            {record.totalCost.toFixed(2)}<span className="ml-0.5 text-xs text-zinc-500">元</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-zinc-500">里程</p>
                          <p className="font-data text-sm font-semibold text-zinc-200">
                            {record.mileage.toLocaleString()}<span className="ml-0.5 text-xs text-zinc-500">km</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {showConsumption && (
                      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-zinc-800/50 pt-3">
                        <div className="flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2.5 py-1">
                          <Gauge className="h-3.5 w-3.5 text-amber-400" />
                          <span className="font-data text-xs font-semibold text-amber-400">
                            {record.consumption} L/100km
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2.5 py-1">
                          <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="font-data text-xs font-semibold text-emerald-400">
                            {record.costPerKm} 元/km
                          </span>
                        </div>
                        {record.isAnomaly && (
                          <div className="flex items-center gap-1.5 rounded-md bg-red-500/10 px-2.5 py-1">
                            <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                            <span className="text-xs font-semibold text-red-400">
                              油耗偏高 {record.anomalyPercentage}%
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {!showConsumption && index === records.length - 1 && (
                      <p className="mt-3 border-t border-zinc-800/50 pt-3 text-xs text-zinc-600">
                        首次加油，尚无法计算油耗
                      </p>
                    )}
                  </div>

                  <div className="flex items-center pr-3 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => setDeleteConfirmId(record.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
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
              <h3 className="text-lg font-semibold text-zinc-100">添加加油记录</h3>
              <button
                onClick={() => setShowModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {prevMileage > 0 && (
              <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3.5 py-2.5">
                <p className="text-xs text-amber-400/80">
                  上次记录里程：<span className="font-data font-semibold">{prevMileage.toLocaleString()}</span> km
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">加油日期</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3.5 py-2.5 text-sm text-zinc-100 outline-none transition-colors focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">加油量 (L)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.volume}
                    onChange={(e) => handleVolumeOrPriceChange('volume', e.target.value)}
                    placeholder="42.5"
                    className="w-full rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">单价 (元/L)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.unitPrice}
                    onChange={(e) => handleVolumeOrPriceChange('unitPrice', e.target.value)}
                    placeholder="7.89"
                    className="w-full rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">总金额 (元)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.totalCost}
                  onChange={(e) => setForm((f) => ({ ...f, totalCost: e.target.value }))}
                  placeholder="自动计算或手动输入"
                  className="w-full rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">当前总里程 (km)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={form.mileage}
                  onChange={(e) => setForm((f) => ({ ...f, mileage: e.target.value }))}
                  placeholder={prevMileage > 0 ? `上次 ${prevMileage.toLocaleString()} km` : '输入当前里程'}
                  className="w-full rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
                  required
                />
              </div>

              {previewCalc && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                  <p className="mb-2 text-xs font-medium text-amber-400/80">预估计算</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-[10px] uppercase text-zinc-500">行驶距离</p>
                      <p className="font-data text-sm font-bold text-amber-400">{previewCalc.distance} km</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-zinc-500">百公里油耗</p>
                      <p className="font-data text-sm font-bold text-amber-400">{previewCalc.consumption} L</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-zinc-500">每公里成本</p>
                      <p className="font-data text-sm font-bold text-amber-400">{previewCalc.costPerKm} 元</p>
                    </div>
                  </div>
                </div>
              )}

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
                  保存记录
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
            <p className="mt-2 text-sm text-zinc-400">确定要删除这条加油记录吗？此操作不可撤销。</p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 rounded-lg border border-zinc-700/50 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800"
              >
                取消
              </button>
              <button
                onClick={() => {
                  deleteRefuelRecord(deleteConfirmId)
                  setDeleteConfirmId(null)
                }}
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
