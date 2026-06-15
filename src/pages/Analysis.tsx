import { useMemo, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts'
import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  Fuel,
  Gauge,
  AlertTriangle,
  Route,
  Coins,
  Car,
  Scale,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import VehicleSelector from '@/components/VehicleSelector'
import { cn } from '@/lib/utils'
import type { Vehicle, RefuelRecord } from '@/types'

interface CustomDotProps {
  cx?: number
  cy?: number
  payload?: {
    isAnomaly: boolean
    consumption: number
    anomalyPercentage: number
    date: string
  }
}

function AnomalyDot({ cx, cy, payload }: CustomDotProps) {
  if (!cx || !cy || !payload) return null

  if (payload.isAnomaly) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={8} fill="#ef4444" fillOpacity={0.15} />
        <circle cx={cx} cy={cy} r={5} fill="#ef4444" stroke="#1a1a2e" strokeWidth={2} />
      </g>
    )
  }

  return <circle cx={cx} cy={cy} r={4} fill="#f59e0b" stroke="#1a1a2e" strokeWidth={2} />
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    payload: {
      date: string
      consumption: number
      costPerKm: number
      volume: number
      mileage: number
      isAnomaly: boolean
      anomalyPercentage: number
    }
  }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload

  return (
    <div className="rounded-xl border border-zinc-700/50 bg-[#1a1a2e] p-3 shadow-xl">
      <p className="mb-2 text-xs font-medium text-zinc-400">{data.date}</p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-6">
          <span className="text-xs text-zinc-500">百公里油耗</span>
          <span className={cn('font-data text-xs font-semibold', data.isAnomaly ? 'text-red-400' : 'text-amber-400')}>
            {data.consumption} L
          </span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-xs text-zinc-500">每公里成本</span>
          <span className="font-data text-xs font-semibold text-emerald-400">
            {data.costPerKm} 元
          </span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-xs text-zinc-500">加油量</span>
          <span className="font-data text-xs font-semibold text-zinc-300">
            {data.volume} L
          </span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-xs text-zinc-500">里程</span>
          <span className="font-data text-xs font-semibold text-zinc-300">
            {data.mileage.toLocaleString()} km
          </span>
        </div>
        {data.isAnomaly && (
          <div className="mt-1 flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-1">
            <AlertTriangle className="h-3 w-3 text-red-400" />
            <span className="text-[10px] font-semibold text-red-400">
              油耗偏高 {data.anomalyPercentage}%
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

interface VehicleStats {
  vehicle: Vehicle
  avgConsumption: number
  minConsumption: number
  maxConsumption: number
  totalVolume: number
  totalCost: number
  totalDistance: number
  recordCount: number
  anomalyCount: number
  avgCostPerKm: number
}

function calcVehicleStats(vehicle: Vehicle, records: RefuelRecord[]): VehicleStats | null {
  if (records.length === 0) return null
  const withConsumption = records.filter((r) => r.consumption > 0)
  if (withConsumption.length === 0) return null

  const totalVolume = records.reduce((s, r) => s + r.volume, 0)
  const totalCost = records.reduce((s, r) => s + r.totalCost, 0)
  const maxMileage = Math.max(...records.map((r) => r.mileage))
  const minMileage = Math.min(...records.map((r) => r.mileage))
  const totalDistance = maxMileage - minMileage
  const avgConsumption = withConsumption.reduce((s, r) => s + r.consumption, 0) / withConsumption.length
  const avgCostPerKm = withConsumption.reduce((s, r) => s + r.costPerKm, 0) / withConsumption.length

  return {
    vehicle,
    avgConsumption,
    minConsumption: Math.min(...withConsumption.map((r) => r.consumption)),
    maxConsumption: Math.max(...withConsumption.map((r) => r.consumption)),
    totalVolume,
    totalCost,
    totalDistance,
    recordCount: records.length,
    anomalyCount: records.filter((r) => r.isAnomaly).length,
    avgCostPerKm,
  }
}

export default function Analysis() {
  const { vehicles, activeVehicleId, getActiveVehicle, getRecordsForVehicle } = useStore()
  const activeVehicle = getActiveVehicle()
  const records = activeVehicleId ? getRecordsForVehicle(activeVehicleId) : []
  const [showComparison, setShowComparison] = useState(false)

  const chartData = useMemo(() => {
    return [...records]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .filter((r) => r.consumption > 0)
  }, [records])

  const avgConsumption = useMemo(() => {
    if (chartData.length === 0) return 0
    return chartData.reduce((sum, r) => sum + r.consumption, 0) / chartData.length
  }, [chartData])

  const stats = useMemo(() => {
    if (!activeVehicle) return null
    return calcVehicleStats(activeVehicle, records)
  }, [activeVehicle, records])

  const allVehicleStats = useMemo(() => {
    return vehicles
      .map((v) => calcVehicleStats(v, getRecordsForVehicle(v.id)))
      .filter((s): s is VehicleStats => s !== null)
      .sort((a, b) => a.avgConsumption - b.avgConsumption)
  }, [vehicles, getRecordsForVehicle])

  const comparisonBarData = useMemo(() => {
    return allVehicleStats.map((s) => ({
      name: s.vehicle.brand,
      shortName: s.vehicle.plateNumber,
      '平均油耗': parseFloat(s.avgConsumption.toFixed(1)),
      color: s.vehicle.color,
    }))
  }, [allVehicleStats])

  if (vehicles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700/50 py-20">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/50">
          <BarChart3 className="h-8 w-8 text-zinc-500" />
        </div>
        <p className="text-sm text-zinc-400">请先添加车辆信息</p>
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700/50 py-20">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/50">
          <BarChart3 className="h-8 w-8 text-zinc-500" />
        </div>
        <p className="text-sm text-zinc-400">暂无足够的加油数据</p>
        <p className="mt-1 text-xs text-zinc-600">需要至少两条加油记录才能生成趋势分析</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-100">油耗分析</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {activeVehicle
              ? `${activeVehicle.brand} ${activeVehicle.plateNumber} — 油耗趋势与统计数据`
              : '选择车辆查看分析'}
          </p>
        </div>
        <VehicleSelector />
      </div>

      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Gauge className="h-4 w-4 text-amber-400" />
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">平均油耗</span>
            </div>
            <p className="font-data text-xl font-bold text-amber-400">
              {stats.avgConsumption.toFixed(1)}
              <span className="ml-1 text-xs text-zinc-500">L/100km</span>
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-emerald-400" />
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">最低油耗</span>
            </div>
            <p className="font-data text-xl font-bold text-emerald-400">
              {stats.minConsumption.toFixed(1)}
              <span className="ml-1 text-xs text-zinc-500">L/100km</span>
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-red-400" />
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">最高油耗</span>
            </div>
            <p className="font-data text-xl font-bold text-red-400">
              {stats.maxConsumption.toFixed(1)}
              <span className="ml-1 text-xs text-zinc-500">L/100km</span>
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-400" />
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">异常次数</span>
            </div>
            <p className="font-data text-xl font-bold text-orange-400">
              {stats.anomalyCount}
              <span className="ml-1 text-xs text-zinc-500">次</span>
            </p>
          </div>
        </div>
      )}

      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Fuel className="h-4 w-4 text-blue-400" />
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">总加油量</span>
            </div>
            <p className="font-data text-xl font-bold text-blue-400">
              {stats.totalVolume.toFixed(1)}
              <span className="ml-1 text-xs text-zinc-500">L</span>
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Coins className="h-4 w-4 text-yellow-400" />
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">总花费</span>
            </div>
            <p className="font-data text-xl font-bold text-yellow-400">
              {stats.totalCost.toFixed(0)}
              <span className="ml-1 text-xs text-zinc-500">元</span>
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Route className="h-4 w-4 text-purple-400" />
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">总里程</span>
            </div>
            <p className="font-data text-xl font-bold text-purple-400">
              {stats.totalDistance.toLocaleString()}
              <span className="ml-1 text-xs text-zinc-500">km</span>
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-cyan-400" />
              <span className="text-[10px] uppercase tracking-wider text-zinc-500">记录次数</span>
            </div>
            <p className="font-data text-xl font-bold text-cyan-400">
              {stats.recordCount}
              <span className="ml-1 text-xs text-zinc-500">次</span>
            </p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/50 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-200">百公里油耗趋势</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-[10px] text-zinc-500">正常</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-[10px] text-zinc-500">异常</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-0.5 w-4 border-t border-dashed border-zinc-500" />
              <span className="text-[10px] text-zinc-500">平均值</span>
            </div>
          </div>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#71717a', fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#1e293b' }}
                tickFormatter={(val: string) => {
                  const d = new Date(val)
                  return `${d.getMonth() + 1}/${d.getDate()}`
                }}
              />
              <YAxis
                tick={{ fill: '#71717a', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val: number) => `${val}`}
                domain={['auto', 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              {avgConsumption > 0 && (
                <ReferenceLine
                  y={avgConsumption}
                  stroke="#71717a"
                  strokeDasharray="6 4"
                  strokeWidth={1}
                  label={{
                    value: `平均 ${avgConsumption.toFixed(1)}`,
                    position: 'right',
                    fill: '#71717a',
                    fontSize: 10,
                  }}
                />
              )}
              <ReferenceLine
                y={avgConsumption * 1.2}
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeWidth={1}
                strokeOpacity={0.4}
                label={{
                  value: '异常线 +20%',
                  position: 'right',
                  fill: '#ef4444',
                  fontSize: 10,
                  opacity: 0.6,
                }}
              />
              <Line
                type="monotone"
                dataKey="consumption"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={<AnomalyDot />}
                activeDot={{ r: 6, fill: '#f59e0b', stroke: '#1a1a2e', strokeWidth: 2 }}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.isAnomaly ? '#ef4444' : '#f59e0b'}
                    stroke={entry.isAnomaly ? '#ef4444' : '#f59e0b'}
                  />
                ))}
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </div>

        {chartData.some((d) => d.isAnomaly) && (
          <div className="mt-4 space-y-2">
            <h4 className="text-xs font-medium text-zinc-400">异常波动记录</h4>
            {chartData
              .filter((d) => d.isAnomaly)
              .map((d) => (
                <div
                  key={d.id}
                  className="flex items-center gap-3 rounded-lg border border-red-500/10 bg-red-500/5 px-4 py-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-200">
                      {d.date} — 油耗 <span className="font-data text-red-400">{d.consumption} L/100km</span>
                    </p>
                    <p className="text-xs text-zinc-500">
                      比平均值高 <span className="font-semibold text-red-400">{d.anomalyPercentage}%</span>，建议检查车辆状况
                    </p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {allVehicleStats.length > 1 && (
        <div className="mt-6">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="flex w-full items-center justify-between rounded-xl border border-zinc-800/50 bg-zinc-900/50 px-5 py-4 transition-all hover:border-zinc-700/50 hover:bg-zinc-900"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10">
                <Scale className="h-4 w-4 text-purple-400" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-semibold text-zinc-200">多车辆对比</h3>
                <p className="text-xs text-zinc-500">
                  共 {allVehicleStats.length} 辆车参与对比
                </p>
              </div>
            </div>
            {showComparison ? (
              <ChevronUp className="h-5 w-5 text-zinc-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-zinc-400" />
            )}
          </button>

          {showComparison && (
            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
                <h4 className="mb-4 text-sm font-medium text-zinc-300">平均油耗对比 (L/100km)</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={comparisonBarData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                      <XAxis
                        type="number"
                        tick={{ fill: '#71717a', fontSize: 11 }}
                        tickLine={false}
                        axisLine={{ stroke: '#1e293b' }}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tick={{ fill: '#a1a1aa', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        width={80}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1a1a2e',
                          border: '1px solid #334155',
                          borderRadius: '12px',
                        }}
                        labelStyle={{ color: '#a1a1aa' }}
                        itemStyle={{ color: '#f59e0b' }}
                        formatter={(value: number) => [`${value} L/100km`, '平均油耗']}
                      />
                      <Bar dataKey="平均油耗" radius={[0, 6, 6, 0]} barSize={24}>
                        {comparisonBarData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-zinc-800/50 bg-zinc-900/50">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800/50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500">车辆</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500">平均油耗</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500">每公里成本</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500">总里程</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500">总花费</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allVehicleStats.map((s, i) => (
                      <tr
                        key={s.vehicle.id}
                        className={cn(
                          'border-b border-zinc-800/30 last:border-0',
                          s.vehicle.id === activeVehicleId && 'bg-amber-500/5'
                        )}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="flex h-7 w-7 items-center justify-center rounded-md"
                              style={{ backgroundColor: s.vehicle.color + '20' }}
                            >
                              <Car className="h-3.5 w-3.5" style={{ color: s.vehicle.color }} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-zinc-200">{s.vehicle.brand}</p>
                              <p className="font-data text-[10px] text-zinc-500">
                                {s.vehicle.plateNumber} · {s.vehicle.displacement}L
                              </p>
                            </div>
                            {i === 0 && (
                              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                                最省油
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={cn(
                              'font-data text-sm font-bold',
                              i === 0 ? 'text-emerald-400' : 'text-zinc-300'
                            )}
                          >
                            {s.avgConsumption.toFixed(1)} L
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-data text-sm text-zinc-300">
                          {s.avgCostPerKm.toFixed(2)} 元
                        </td>
                        <td className="px-4 py-3 text-right font-data text-sm text-zinc-300">
                          {s.totalDistance.toLocaleString()} km
                        </td>
                        <td className="px-4 py-3 text-right font-data text-sm text-zinc-300">
                          {s.totalCost.toFixed(0)} 元
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
