import { useState, useMemo, useRef, useEffect } from 'react'
import {
  X,
  Plus,
  Trash2,
  Wrench,
  Calendar,
  Gauge,
  Upload,
  XCircle,
  Bell,
  Clock,
  Car,
  Edit3,
  ChevronDown,
  FileText,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import VehicleSelector from '@/components/VehicleSelector'
import { cn } from '@/lib/utils'
import type { MaintenanceItem, MaintenanceRecord } from '@/types'

const MAINTENANCE_ITEMS: MaintenanceItem[] = [
  '换机油',
  '换机滤',
  '换空气滤芯',
  '换空调滤芯',
  '换汽油滤芯',
  '换火花塞',
  '换变速箱油',
  '换刹车油',
  '换冷却液',
  '轮胎换位',
  '四轮定位',
  '刹车片更换',
  '刹车盘更换',
  '正时皮带',
  '蓄电池更换',
  '大保养',
  '其他',
]

interface MaintenanceFormData {
  date: string
  items: MaintenanceItem[]
  customItems: string
  totalCost: string
  currentMileage: string
  nextMaintenanceMileage: string
  nextMaintenanceDate: string
  notes: string
  receiptImage: string
}

const defaultForm: MaintenanceFormData = {
  date: new Date().toISOString().split('T')[0],
  items: [],
  customItems: '',
  totalCost: '',
  currentMileage: '',
  nextMaintenanceMileage: '',
  nextMaintenanceDate: '',
  notes: '',
  receiptImage: '',
}

export default function Maintenance() {
  const {
    activeVehicleId,
    vehicles,
    getActiveVehicle,
    getMaintenanceRecordsForVehicle,
    getCurrentMileage,
    getMaintenanceReminders,
    addMaintenanceRecord,
    updateMaintenanceRecord,
    deleteMaintenanceRecord,
  } = useStore()

  const activeVehicle = getActiveVehicle()
  const records = activeVehicleId ? getMaintenanceRecordsForVehicle(activeVehicleId) : []
  const currentMileage = activeVehicleId ? getCurrentMileage(activeVehicleId) : 0
  const reminders = getMaintenanceReminders().filter((r) => r.vehicleId === activeVehicleId)

  const [showModal, setShowModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null)
  const [form, setForm] = useState<MaintenanceFormData>(defaultForm)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [showImagePreview, setShowImagePreview] = useState<string | null>(null)
  const [itemDropdownOpen, setItemDropdownOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setItemDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const sortedReminders = useMemo(() => {
    return [...reminders].sort((a, b) => {
      const aVal = a.type === 'mileage' ? a.remainingKm || 0 : (a.remainingDays || 0) * 33
      const bVal = b.type === 'mileage' ? b.remainingKm || 0 : (b.remainingDays || 0) * 33
      return aVal - bVal
    })
  }, [reminders])

  const totalMaintenanceCost = useMemo(() => {
    return records.reduce((sum, r) => sum + r.totalCost, 0)
  }, [records])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setForm((f) => ({ ...f, receiptImage: reader.result as string }))
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setForm((f) => ({ ...f, receiptImage: '' }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const toggleItem = (item: MaintenanceItem) => {
    setForm((f) => {
      const hasItem = f.items.includes(item)
      return {
        ...f,
        items: hasItem ? f.items.filter((i) => i !== item) : [...f.items, item],
      }
    })
  }

  const openAdd = () => {
    setEditingRecord(null)
    setForm({
      ...defaultForm,
      currentMileage: currentMileage > 0 ? currentMileage.toString() : '',
    })
    setShowModal(true)
  }

  const openEdit = (record: MaintenanceRecord) => {
    setEditingRecord(record)
    setForm({
      date: record.date,
      items: record.items,
      customItems: record.customItems || '',
      totalCost: record.totalCost.toString(),
      currentMileage: record.currentMileage.toString(),
      nextMaintenanceMileage: record.nextMaintenanceMileage?.toString() || '',
      nextMaintenanceDate: record.nextMaintenanceDate || '',
      notes: record.notes || '',
      receiptImage: record.receiptImage || '',
    })
    setShowModal(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeVehicleId) return

    const recordData = {
      vehicleId: activeVehicleId,
      date: form.date,
      items: form.items,
      customItems: form.customItems || undefined,
      totalCost: parseFloat(form.totalCost) || 0,
      currentMileage: parseFloat(form.currentMileage) || 0,
      nextMaintenanceMileage: form.nextMaintenanceMileage
        ? parseFloat(form.nextMaintenanceMileage)
        : undefined,
      nextMaintenanceDate: form.nextMaintenanceDate || undefined,
      notes: form.notes || undefined,
      receiptImage: form.receiptImage || undefined,
    }

    if (editingRecord) {
      updateMaintenanceRecord(editingRecord.id, recordData)
    } else {
      addMaintenanceRecord(recordData)
    }

    setShowModal(false)
    setEditingRecord(null)
    setForm(defaultForm)
  }



  if (vehicles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700/50 py-20">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/50">
          <Wrench className="h-8 w-8 text-zinc-500" />
        </div>
        <p className="text-sm text-zinc-400">请先添加车辆信息</p>
        <p className="mt-1 text-xs text-zinc-600">在"车辆管理"页面中添加车辆后即可记录保养</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-100">保养记录</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {activeVehicle
              ? `为车辆记录每次保养，自动提醒下次保养时间`
              : '请选择一辆车开始记录'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <VehicleSelector />
          <button
            onClick={openAdd}
            disabled={!activeVehicleId}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap',
              activeVehicleId
                ? 'bg-amber-500 text-black hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/20'
                : 'cursor-not-allowed bg-zinc-800 text-zinc-500'
            )}
          >
            <Plus className="h-4 w-4" />
            添加记录
          </button>
        </div>
      </div>

      {sortedReminders.length > 0 && (
        <div className="mb-6 space-y-2">
          {sortedReminders.map((reminder, idx) => (
            <div
              key={`${reminder.maintenanceId}-${reminder.type}-${idx}`}
              className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20">
                <Bell className="h-4 w-4 text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-300">保养提醒</p>
                <p className="text-xs text-amber-400/70">
                  {reminder.type === 'mileage' ? (
                    <>
                      <Gauge className="mr-1 inline h-3 w-3" />
                      距离下次保养还剩 {reminder.remainingKm} 公里
                    </>
                  ) : (
                    <>
                      <Clock className="mr-1 inline h-3 w-3" />
                      距离下次保养还剩 {reminder.remainingDays} 天
                    </>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeVehicle && records.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">保养次数</p>
            <p className="font-data mt-1 text-2xl font-bold text-zinc-100">{records.length}</p>
          </div>
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">累计花费</p>
            <p className="font-data mt-1 text-2xl font-bold text-emerald-400">
              ¥{totalMaintenanceCost.toLocaleString()}
            </p>
          </div>
          <div className="col-span-2 rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4 sm:col-span-1">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">当前里程</p>
            <p className="font-data mt-1 text-2xl font-bold text-zinc-100">
              {currentMileage.toLocaleString()}
              <span className="ml-1 text-sm font-normal text-zinc-500">km</span>
            </p>
          </div>
        </div>
      )}

      {records.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700/50 py-20">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/50">
            <Wrench className="h-8 w-8 text-zinc-500" />
          </div>
          <p className="text-sm text-zinc-400">暂无保养记录</p>
          <p className="mt-1 text-xs text-zinc-600">点击上方按钮开始记录</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => {
            const nextMileageReminder =
              record.nextMaintenanceMileage && currentMileage > 0
                ? record.nextMaintenanceMileage - currentMileage
                : null
            const nextDateReminder = record.nextMaintenanceDate
              ? Math.ceil(
                  (new Date(record.nextMaintenanceDate).getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              : null

            const isMileageUrgent = nextMileageReminder !== null && nextMileageReminder <= 500
            const isDateUrgent = nextDateReminder !== null && nextDateReminder <= 15 && nextDateReminder >= 0

            return (
              <div
                key={record.id}
                className={cn(
                  'group relative overflow-hidden rounded-xl border transition-all',
                  isMileageUrgent || isDateUrgent
                    ? 'border-amber-500/20 bg-amber-500/5'
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
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {record.items.map((item) => (
                        <span
                          key={item}
                          className="inline-flex items-center rounded-md bg-zinc-800/50 px-2 py-0.5 text-xs font-medium text-zinc-300"
                        >
                          {item}
                        </span>
                      ))}
                      {record.customItems && (
                        <span className="inline-flex items-center rounded-md bg-zinc-800/50 px-2 py-0.5 text-xs font-medium text-zinc-300">
                          {record.customItems}
                        </span>
                      )}
                    </div>

                    <div className="grid flex-1 grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-zinc-500">花费金额</p>
                        <p className="font-data text-sm font-semibold text-emerald-400">
                          ¥{record.totalCost.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-zinc-500">当前里程</p>
                        <p className="font-data text-sm font-semibold text-zinc-200">
                          {record.currentMileage.toLocaleString()}
                          <span className="ml-0.5 text-xs text-zinc-500">km</span>
                        </p>
                      </div>
                      {record.receiptImage && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-zinc-500">保养单据</p>
                          <button
                            onClick={() => setShowImagePreview(record.receiptImage!)}
                            className="flex items-center gap-1 text-sm font-medium text-amber-400 hover:text-amber-300"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            查看单据
                          </button>
                        </div>
                      )}
                    </div>

                    {(record.nextMaintenanceMileage || record.nextMaintenanceDate) && (
                      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-zinc-800/50 pt-3">
                        {record.nextMaintenanceMileage && (
                          <div
                            className={cn(
                              'flex items-center gap-1.5 rounded-md px-2.5 py-1',
                              isMileageUrgent ? 'bg-amber-500/10' : 'bg-zinc-800/50'
                            )}
                          >
                            <Gauge
                              className={cn(
                                'h-3.5 w-3.5',
                                isMileageUrgent ? 'text-amber-400' : 'text-zinc-400'
                              )}
                            />
                            <span
                              className={cn(
                                'font-data text-xs font-semibold',
                                isMileageUrgent ? 'text-amber-400' : 'text-zinc-300'
                              )}
                            >
                              下次 {record.nextMaintenanceMileage.toLocaleString()} km
                              {nextMileageReminder !== null && (
                                <span
                                  className={cn(
                                    'ml-1',
                                    nextMileageReminder > 0 ? 'text-zinc-500' : 'text-red-400'
                                  )}
                                >
                                  ({nextMileageReminder > 0 ? `还剩 ${nextMileageReminder} km` : '已超期'})
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                        {record.nextMaintenanceDate && (
                          <div
                            className={cn(
                              'flex items-center gap-1.5 rounded-md px-2.5 py-1',
                              isDateUrgent ? 'bg-amber-500/10' : 'bg-zinc-800/50'
                            )}
                          >
                            <Calendar
                              className={cn(
                                'h-3.5 w-3.5',
                                isDateUrgent ? 'text-amber-400' : 'text-zinc-400'
                              )}
                            />
                            <span
                              className={cn(
                                'font-data text-xs font-semibold',
                                isDateUrgent ? 'text-amber-400' : 'text-zinc-300'
                              )}
                            >
                              下次 {record.nextMaintenanceDate}
                              {nextDateReminder !== null && (
                                <span
                                  className={cn(
                                    'ml-1',
                                    nextDateReminder >= 0 ? 'text-zinc-500' : 'text-red-400'
                                  )}
                                >
                                  ({nextDateReminder >= 0 ? `还剩 ${nextDateReminder} 天` : '已超期'})
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {record.notes && (
                      <p className="mt-3 text-xs text-zinc-500">备注：{record.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 pr-3 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => openEdit(record)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
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
          <div className="mx-4 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-[#1a1a2e] p-6">
            <div className="mb-4 flex items-center justify-between sticky top-0 bg-[#1a1a2e] pb-2">
              <h3 className="text-lg font-semibold text-zinc-100">
                {editingRecord ? '编辑保养记录' : '添加保养记录'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingRecord(null)
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {activeVehicle && (
              <div className="mb-5 flex items-center gap-3 rounded-xl border border-zinc-700/30 bg-zinc-800/30 px-4 py-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: activeVehicle.color + '20' }}
                >
                  <Car className="h-5 w-5" style={{ color: activeVehicle.color }} />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-200">{activeVehicle.brand}</p>
                  <p className="font-data text-xs text-zinc-500">
                    {activeVehicle.plateNumber} · {activeVehicle.displacement}L ·{' '}
                    {activeVehicle.fuelType}
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">保养日期</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3.5 py-2.5 text-sm text-zinc-100 outline-none transition-colors focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">保养项目</label>
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setItemDropdownOpen(!itemDropdownOpen)}
                    className="w-full flex items-center justify-between rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3.5 py-2.5 text-sm text-left text-zinc-100 outline-none transition-colors focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
                  >
                    <span>
                      {form.items.length > 0
                        ? `已选择 ${form.items.length} 项`
                        : '请选择保养项目'}
                    </span>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 text-zinc-500 transition-transform',
                        itemDropdownOpen && 'rotate-180'
                      )}
                    />
                  </button>
                  {itemDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-zinc-700/50 bg-[#1a1a2e] shadow-xl">
                      {MAINTENANCE_ITEMS.map((item) => (
                        <label
                          key={item}
                          className="flex items-center gap-2 px-3.5 py-2 text-sm text-zinc-200 hover:bg-zinc-800/50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={form.items.includes(item)}
                            onChange={() => toggleItem(item)}
                            className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-amber-500 focus:ring-amber-500/50"
                          />
                          {item}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {form.items.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {form.items.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-300"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => toggleItem(item)}
                          className="text-amber-400/60 hover:text-amber-300"
                        >
                          <XCircle className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  其他项目 <span className="text-zinc-600">(可选)</span>
                </label>
                <input
                  type="text"
                  value={form.customItems}
                  onChange={(e) => setForm((f) => ({ ...f, customItems: e.target.value }))}
                  placeholder="如：清洗节气门、更换雨刷等"
                  className="w-full rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">花费金额 (元)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.totalCost}
                  onChange={(e) => setForm((f) => ({ ...f, totalCost: e.target.value }))}
                  placeholder="350.00"
                  className="w-full rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">当前里程 (km)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={form.currentMileage}
                  onChange={(e) => setForm((f) => ({ ...f, currentMileage: e.target.value }))}
                  placeholder={currentMileage > 0 ? `当前 ${currentMileage.toLocaleString()} km` : '输入当前里程'}
                  className="w-full rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                    下次保养里程 <span className="text-zinc-600">(可选)</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={form.nextMaintenanceMileage}
                    onChange={(e) => setForm((f) => ({ ...f, nextMaintenanceMileage: e.target.value }))}
                    placeholder="10000"
                    className="w-full rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                    下次保养日期 <span className="text-zinc-600">(可选)</span>
                  </label>
                  <input
                    type="date"
                    value={form.nextMaintenanceDate}
                    onChange={(e) => setForm((f) => ({ ...f, nextMaintenanceDate: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3.5 py-2.5 text-sm text-zinc-100 outline-none transition-colors focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  备注 <span className="text-zinc-600">(可选)</span>
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="记录保养详情或注意事项"
                  rows={2}
                  className="w-full rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 resize-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  保养单据照片 <span className="text-zinc-600">(可选)</span>
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {form.receiptImage ? (
                  <div className="relative rounded-lg overflow-hidden border border-zinc-700/50">
                    <img
                      src={form.receiptImage}
                      alt="保养单据"
                      className="w-full h-40 object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-zinc-300 hover:bg-red-500/80 hover:text-white transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-700/50 bg-zinc-800/30 py-6 text-zinc-500 hover:border-amber-500/30 hover:text-amber-400/80 transition-colors"
                  >
                    <Upload className="h-6 w-6" />
                    <span className="text-sm">点击上传保养单据照片</span>
                    <span className="text-xs text-zinc-600">支持 JPG、PNG 格式</span>
                  </button>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingRecord(null)
                  }}
                  className="flex-1 rounded-lg border border-zinc-700/50 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-amber-500 py-2.5 text-sm font-medium text-black transition-all hover:bg-amber-400"
                >
                  {editingRecord ? '保存修改' : '保存记录'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImagePreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setShowImagePreview(null)}
        >
          <div className="relative mx-4 max-w-3xl">
            <button
              onClick={() => setShowImagePreview(null)}
              className="absolute -top-10 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={showImagePreview}
              alt="保养单据"
              className="max-h-[80vh] rounded-lg"
            />
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-zinc-800 bg-[#1a1a2e] p-6">
            <h3 className="text-lg font-semibold text-zinc-100">确认删除</h3>
            <p className="mt-2 text-sm text-zinc-400">确定要删除这条保养记录吗？此操作不可撤销。</p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 rounded-lg border border-zinc-700/50 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800"
              >
                取消
              </button>
              <button
                onClick={() => {
                  deleteMaintenanceRecord(deleteConfirmId)
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
