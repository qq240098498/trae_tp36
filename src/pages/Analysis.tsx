import { useMemo } from 'react'
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
} from 'recharts'
import { BarChart3, TrendingDown, TrendingUp, Fuel, Gauge, AlertTriangle, Route, Coins } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'

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

export default function Analysis() {
  const { activeVehicleId, vehicles, getActiveVehicle, getRecordsForVehicle } = useStore()
  const activeVehicle = getActiveVehicle()
  const records = activeVehicleId ? getRecordsForVehicle(activeVehicleId) : []

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
    if (records.length === 0) return null
    const withConsumption = records.filter((r) => r.consumption > 0)
    const totalVolume = records.reduce((s, r) => s + r.volume, 0)
    const totalCost = records.reduce((s, r) => s + r.totalCost, 0)
    const maxMileage = Math.max(...records.map((r) => r.mileage))
    const minMileage = Math.min(...records.map((r) => r.mileage))
    const totalDistance = maxMileage - minMileage

    return {
      avgConsumption: withConsumption.length > 0
        ? withConsumption.reduce((s, r) => s + r.consumption, 0) / withConsumption.length
        : 0,
      minConsumption: withConsumption.length > 0 ? Math.min(...withConsumption.map((r) => r.consumption)) : 0,
      maxConsumption: withConsumption.length > 0 ? Math.max(...withConsumption.map((r) => r.consumption)) : 0,
      totalVolume,
      totalCost,
      totalDistance,
      recordCount: records.length,
      anomalyCount: records.filter((r) => r.isAnomaly).length,
    }
  }, [records])

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
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-zinc-100">油耗分析</h2>
        <p className="mt-1 text-sm text-zinc-500">
          {activeVehicle
            ? `${activeVehicle.brand} ${activeVehicle.plateNumber} — 油耗趋势与统计数据`
            : '选择车辆查看分析'}
        </p>
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
    </div>
  )
}
