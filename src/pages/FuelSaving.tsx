import { useState, useMemo } from 'react'
import {
  Lightbulb,
  TrendingDown,
  Calendar,
  Bell,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Fuel,
  X,
  ChevronDown,
  ChevronUp,
  MapPin,
  Layers,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import VehicleSelector from '@/components/VehicleSelector'
import { cn } from '@/lib/utils'
import type { PriceAlertSetting, FuelType, GasStationLocation } from '@/types'

type GroupBy = 'station' | 'city' | 'district'

interface AlertFormData {
  location: GasStationLocation
  fuelType: FuelType
  threshold: string
  enabled: boolean
}

const defaultAlertForm: AlertFormData = {
  location: {
    name: '',
    city: '',
    district: '',
    address: '',
  },
  fuelType: '汽油',
  threshold: '',
  enabled: true,
}

function getLocationDisplay(location: GasStationLocation, groupBy?: GroupBy): string {
  if (groupBy === 'city') {
    return location.city || location.name || '未知城市'
  }
  if (groupBy === 'district') {
    const parts = []
    if (location.city) parts.push(location.city)
    if (location.district) parts.push(location.district)
    if (parts.length === 0 && location.name) parts.push(location.name)
    return parts.length > 0 ? parts.join(' · ') : '未知区域'
  }
  const parts = []
  if (location.city) parts.push(location.city)
  if (location.district) parts.push(location.district)
  if (location.name) parts.push(location.name)
  return parts.length > 0 ? parts.join(' · ') : '未填写加油站'
}

function getLocationSubtitle(location: GasStationLocation): string | null {
  if (location.address) return location.address
  if (location.name && (location.city || location.district)) {
    const parts = []
    if (location.city) parts.push(location.city)
    if (location.district) parts.push(location.district)
    return parts.join(' · ')
  }
  return null
}

const groupByOptions: { value: GroupBy; label: string; description: string }[] = [
  { value: 'station', label: '按加油站', description: '按具体加油站统计' },
  { value: 'district', label: '按区域', description: '按城市+区域统计' },
  { value: 'city', label: '按城市', description: '按城市统计' },
]

export default function FuelSaving() {
  const {
    activeVehicleId,
    vehicles,
    getActiveVehicle,
    getGasStationAvgPrices,
    getWeekdayPrices,
    getPriceAlerts,
    addPriceAlert,
    updatePriceAlert,
    deletePriceAlert,
  } = useStore()

  const activeVehicle = getActiveVehicle()
  const [showAlertModal, setShowAlertModal] = useState(false)
  const [alertForm, setAlertForm] = useState<AlertFormData>(defaultAlertForm)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [showAllStations, setShowAllStations] = useState(false)
  const [groupBy, setGroupBy] = useState<GroupBy>('station')
  const [showAlertLocationDetails, setShowAlertLocationDetails] = useState(false)

  const stationPrices = useMemo(() => {
    if (activeVehicleId) {
      return getGasStationAvgPrices(activeVehicleId, groupBy)
    }
    return getGasStationAvgPrices(undefined, groupBy)
  }, [activeVehicleId, getGasStationAvgPrices, groupBy])

  const weekdayPrices = useMemo(() => {
    if (activeVehicleId) {
      return getWeekdayPrices(activeVehicleId)
    }
    return getWeekdayPrices()
  }, [activeVehicleId, getWeekdayPrices])

  const priceAlerts = useMemo(() => {
    return getPriceAlerts()
  }, [getPriceAlerts])

  const cheapestStation = stationPrices[0]
  const cheapestWeekday = weekdayPrices[0]

  const displayedStations = showAllStations ? stationPrices : stationPrices.slice(0, 5)

  const handleAddAlert = (e: React.FormEvent) => {
    e.preventDefault()
    if (!alertForm.threshold) return

    addPriceAlert({
      location: {
        name: alertForm.location.name,
        city: alertForm.location.city,
        district: alertForm.location.district,
        address: alertForm.location.address,
      },
      fuelType: alertForm.fuelType,
      threshold: parseFloat(alertForm.threshold) || 0,
      enabled: alertForm.enabled,
    })

    setShowAlertModal(false)
    setAlertForm(defaultAlertForm)
    setShowAlertLocationDetails(false)
  }

  const toggleAlert = (id: string, enabled: boolean) => {
    updatePriceAlert(id, { enabled })
  }

  const openAddAlert = () => {
    setAlertForm(defaultAlertForm)
    setShowAlertLocationDetails(false)
    setShowAlertModal(true)
  }

  if (vehicles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700/50 py-20">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/50">
          <Lightbulb className="h-8 w-8 text-zinc-500" />
        </div>
        <p className="text-sm text-zinc-400">请先添加车辆信息</p>
        <p className="mt-1 text-xs text-zinc-600">在"车辆管理"页面中添加车辆后即可查看省钱建议</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-100">加油省钱建议</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {activeVehicle
              ? `${activeVehicle.brand} ${activeVehicle.plateNumber} — 智能分析加油数据，帮您省钱`
              : '选择车辆查看省钱建议'}
          </p>
        </div>
        <VehicleSelector />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800/50 bg-gradient-to-br from-emerald-500/10 to-transparent p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
              <TrendingDown className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium uppercase tracking-wider text-emerald-400/80">
                {groupBy === 'city' ? '最划算城市' : groupBy === 'district' ? '最划算区域' : '最划算加油站'}
              </p>
              {cheapestStation ? (
                <>
                  <p className="mt-1 text-lg font-bold text-zinc-100">
                    {getLocationDisplay(cheapestStation.gasStation, groupBy)}
                  </p>
                  {getLocationSubtitle(cheapestStation.gasStation) && groupBy === 'station' && (
                    <p className="mt-1 text-xs text-zinc-500">
                      {getLocationSubtitle(cheapestStation.gasStation)}
                    </p>
                  )}
                  <p className="mt-2 font-data text-2xl font-bold text-emerald-400">
                    {cheapestStation.avgPrice.toFixed(2)}
                    <span className="ml-1 text-sm text-zinc-500">元/L</span>
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">
                    共 {cheapestStation.recordCount} 条记录 · 最低 {cheapestStation.minPrice.toFixed(2)} 元
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-zinc-500">暂无数据</p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800/50 bg-gradient-to-br from-amber-500/10 to-transparent p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20">
              <Calendar className="h-6 w-6 text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium uppercase tracking-wider text-amber-400/80">最便宜加油日</p>
              {cheapestWeekday ? (
                <>
                  <p className="mt-1 text-lg font-bold text-zinc-100">{cheapestWeekday.weekdayName}</p>
                  <p className="mt-2 font-data text-2xl font-bold text-amber-400">
                    {cheapestWeekday.avgPrice.toFixed(2)}
                    <span className="ml-1 text-sm text-zinc-500">元/L</span>
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">
                    共 {cheapestWeekday.recordCount} 条记录 · 建议{cheapestWeekday.weekdayName}加油更划算
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-zinc-500">暂无足够数据分析</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-200">均价排行</h3>
            <p className="text-xs text-zinc-500">按均价从低到高排序</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-zinc-700/30 bg-zinc-800/30 p-1">
            {groupByOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setGroupBy(opt.value)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  groupBy === opt.value
                    ? 'bg-amber-500/15 text-amber-400'
                    : 'text-zinc-400 hover:text-zinc-200'
                )}
              >
                {opt.value === 'station' ? (
                  <MapPin className="h-3.5 w-3.5" />
                ) : (
                  <Layers className="h-3.5 w-3.5" />
                )}
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {stationPrices.length === 0 ? (
          <div className="py-8 text-center">
            <Fuel className="mx-auto mb-3 h-10 w-10 text-zinc-700" />
            <p className="text-sm text-zinc-500">暂无加油站数据</p>
            <p className="mt-1 text-xs text-zinc-600">添加加油记录时填写加油站名称即可统计</p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayedStations.map((station, index) => {
              const subtitle = getLocationSubtitle(station.gasStation)
              return (
                <div
                  key={station.locationKey}
                  className={cn(
                    'flex items-center gap-4 rounded-xl px-4 py-3 transition-colors',
                    index === 0
                      ? 'bg-emerald-500/10 border border-emerald-500/20'
                      : 'bg-zinc-800/30 border border-zinc-800/50'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold flex-shrink-0',
                      index === 0
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-zinc-700/50 text-zinc-400'
                    )}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-200">
                      {getLocationDisplay(station.gasStation, groupBy)}
                    </p>
                    <p className="truncate text-xs text-zinc-500">
                      {subtitle && groupBy === 'station' ? `${subtitle} · ` : ''}
                      {station.recordCount} 条记录 · {station.minPrice.toFixed(2)} - {station.maxPrice.toFixed(2)} 元
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={cn(
                      'font-data text-lg font-bold',
                      index === 0 ? 'text-emerald-400' : 'text-zinc-300'
                    )}>
                      {station.avgPrice.toFixed(2)}
                      <span className="ml-1 text-xs text-zinc-500">元/L</span>
                    </p>
                  </div>
                </div>
              )
            })}

            {stationPrices.length > 5 && (
              <button
                onClick={() => setShowAllStations(!showAllStations)}
                className="flex w-full items-center justify-center gap-1 py-2 text-xs text-zinc-500 hover:text-zinc-300"
              >
                {showAllStations ? (
                  <>
                    收起 <ChevronUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    展开全部 {stationPrices.length} 个 <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mb-6 rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-200">周几加油更便宜</h3>
          <span className="text-xs text-zinc-500">按均价从低到高</span>
        </div>

        {weekdayPrices.length === 0 ? (
          <div className="py-8 text-center">
            <Calendar className="mx-auto mb-3 h-10 w-10 text-zinc-700" />
            <p className="text-sm text-zinc-500">暂无足够数据</p>
            <p className="mt-1 text-xs text-zinc-600">添加更多加油记录后即可分析</p>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((dayName, idx) => {
              const weekdayIdx = idx === 6 ? 0 : idx + 1
              const dayData = weekdayPrices.find((d) => d.weekday === weekdayIdx)
              const isCheapest = dayData && dayData.weekday === cheapestWeekday?.weekday

              return (
                <div
                  key={dayName}
                  className={cn(
                    'flex flex-col items-center rounded-xl py-3 transition-colors',
                    isCheapest
                      ? 'bg-amber-500/10 border border-amber-500/20'
                      : dayData
                      ? 'bg-zinc-800/30 border border-zinc-800/50'
                      : 'bg-zinc-800/10 border border-zinc-800/30'
                  )}
                >
                  <span className="text-xs font-medium text-zinc-500">{dayName}</span>
                  {dayData ? (
                    <>
                      <span className={cn(
                        'mt-2 font-data text-base font-bold',
                        isCheapest ? 'text-amber-400' : 'text-zinc-300'
                      )}>
                        {dayData.avgPrice.toFixed(2)}
                      </span>
                      <span className="mt-1 text-[10px] text-zinc-600">{dayData.recordCount}次</span>
                    </>
                  ) : (
                    <span className="mt-2 text-xs text-zinc-700">--</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/20">
              <Bell className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-200">油价提醒</h3>
              <p className="text-xs text-zinc-500">可按城市/区域/加油站设置提醒阈值</p>
            </div>
          </div>
          <button
            onClick={openAddAlert}
            className="flex items-center gap-1.5 rounded-lg bg-blue-500/10 px-3 py-2 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-500/20"
          >
            <Plus className="h-3.5 w-3.5" />
            添加提醒
          </button>
        </div>

        {priceAlerts.length === 0 ? (
          <div className="py-8 text-center">
            <Bell className="mx-auto mb-3 h-10 w-10 text-zinc-700" />
            <p className="text-sm text-zinc-500">暂无油价提醒</p>
            <p className="mt-1 text-xs text-zinc-600">点击上方按钮添加油价提醒</p>
          </div>
        ) : (
          <div className="space-y-2">
            {priceAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center gap-4 rounded-xl border border-zinc-800/50 bg-zinc-800/30 px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-200">
                    {getLocationDisplay(alert.location)}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {alert.fuelType} · 低于 {alert.threshold.toFixed(2)} 元/L 时提醒
                  </p>
                </div>
                <button
                  onClick={() => toggleAlert(alert.id, !alert.enabled)}
                  className="text-zinc-400 transition-colors hover:text-zinc-200 flex-shrink-0"
                >
                  {alert.enabled ? (
                    <ToggleRight className="h-6 w-6 text-blue-400" />
                  ) : (
                    <ToggleLeft className="h-6 w-6 text-zinc-600" />
                  )}
                </button>
                <button
                  onClick={() => setDeleteConfirmId(alert.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-400 flex-shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl border border-zinc-800 bg-[#1a1a2e] p-6 max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-100">添加油价提醒</h3>
              <button
                onClick={() => setShowAlertModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddAlert} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">加油站名称（可选）</label>
                <input
                  type="text"
                  value={alertForm.location.name}
                  onChange={(e) => setAlertForm((f) => ({ ...f, location: { ...f.location, name: e.target.value } }))}
                  placeholder="留空则监控全部加油站"
                  className="w-full rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowAlertLocationDetails(!showAlertLocationDetails)}
                className="flex w-full items-center justify-between gap-2 rounded-lg border border-zinc-700/30 bg-zinc-800/30 px-3.5 py-2.5 text-xs text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300"
              >
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {showAlertLocationDetails ? '收起位置筛选' : '展开位置筛选（城市/区域）'}
                </span>
                {showAlertLocationDetails ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {showAlertLocationDetails && (
                <div className="space-y-4 rounded-xl border border-zinc-700/30 bg-zinc-800/20 p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-400">城市</label>
                      <input
                        type="text"
                        value={alertForm.location.city || ''}
                        onChange={(e) => setAlertForm((f) => ({ ...f, location: { ...f.location, city: e.target.value } }))}
                        placeholder="如：北京市"
                        className="w-full rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-400">区/县</label>
                      <input
                        type="text"
                        value={alertForm.location.district || ''}
                        onChange={(e) => setAlertForm((f) => ({ ...f, location: { ...f.location, district: e.target.value } }))}
                        placeholder="如：朝阳区"
                        className="w-full rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">燃油类型</label>
                <select
                  value={alertForm.fuelType}
                  onChange={(e) => setAlertForm((f) => ({ ...f, fuelType: e.target.value as FuelType }))}
                  className="w-full rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3.5 py-2.5 text-sm text-zinc-100 outline-none transition-colors focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                >
                  <option value="汽油">汽油</option>
                  <option value="柴油">柴油</option>
                  <option value="电动">电动</option>
                  <option value="混动">混动</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">提醒阈值 (元/L)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={alertForm.threshold}
                  onChange={(e) => setAlertForm((f) => ({ ...f, threshold: e.target.value }))}
                  placeholder="7.50"
                  className="w-full rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                  required
                />
                <p className="mt-1.5 text-[10px] text-zinc-500">当油价低于此价格时，您将收到通知提醒</p>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-zinc-700/30 bg-zinc-800/30 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-zinc-200">启用提醒</p>
                  <p className="text-xs text-zinc-500">开启后监控油价变化</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAlertForm((f) => ({ ...f, enabled: !f.enabled }))}
                  className="text-zinc-400 transition-colors hover:text-zinc-200"
                >
                  {alertForm.enabled ? (
                    <ToggleRight className="h-6 w-6 text-blue-400" />
                  ) : (
                    <ToggleLeft className="h-6 w-6 text-zinc-600" />
                  )}
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAlertModal(false)}
                  className="flex-1 rounded-lg border border-zinc-700/50 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-blue-500 py-2.5 text-sm font-medium text-white transition-all hover:bg-blue-400"
                >
                  添加提醒
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
            <p className="mt-2 text-sm text-zinc-400">确定要删除这条油价提醒吗？此操作不可撤销。</p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 rounded-lg border border-zinc-700/50 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800"
              >
                取消
              </button>
              <button
                onClick={() => {
                  deletePriceAlert(deleteConfirmId)
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
