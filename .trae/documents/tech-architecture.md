## 1. 架构设计

```mermaid
flowchart TB
    subgraph "前端层"
        "React 页面组件"
        "Zustand 状态管理"
        "Recharts 图表库"
    end
    subgraph "数据层"
        "localStorage 持久化"
    end
    "React 页面组件" --> "Zustand 状态管理"
    "Zustand 状态管理" --> "localStorage 持久化"
    "Recharts 图表库" --> "Zustand 状态管理"
```

纯前端应用，数据持久化使用 localStorage，无需后端服务。

## 2. 技术说明
- 前端：React@18 + TypeScript + Tailwind CSS@3 + Vite
- 初始化工具：vite-init（react-ts 模板）
- 状态管理：Zustand（含 persist 中间件自动同步 localStorage）
- 图表库：Recharts（轻量级 React 图表库，支持折线图、自定义标注）
- 图标库：lucide-react
- 后端：无
- 数据库：localStorage

## 3. 路由定义
| 路由 | 用途 |
|------|------|
| / | 重定向到 /vehicles |
| /vehicles | 车辆管理页——添加/编辑/删除车辆 |
| /refuel | 加油记录页——录入和查看加油记录 |
| /analysis | 油耗分析页——趋势图和异常标注 |

## 4. API定义
无后端API，所有数据操作通过 Zustand store 在前端完成。

## 5. 服务端架构图
不适用

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    "Vehicle" {
        "string id PK"
        "string brand"
        "string plateNumber"
        "number displacement"
        "string fuelType"
        "string color"
        "number createdAt"
    }
    "RefuelRecord" {
        "string id PK"
        "string vehicleId FK"
        "string date"
        "number volume"
        "number unitPrice"
        "number totalCost"
        "number mileage"
        "number consumption"
        "number costPerKm"
        "boolean isAnomaly"
        "number anomalyPercentage"
    }
    "Vehicle" ||--o{ "RefuelRecord" : "has"
```

### 6.2 数据定义语言

```typescript
interface Vehicle {
  id: string
  brand: string
  plateNumber: string
  displacement: number
  fuelType: '汽油' | '柴油' | '电动' | '混动'
  color: string
  createdAt: number
}

interface RefuelRecord {
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
```

### 6.3 计算逻辑

- **百公里油耗** = (本次加油量 / (本次里程 - 上次里程)) × 100
- **每公里成本** = 本次总金额 / (本次里程 - 上次里程)
- **异常判定** = 本次油耗 > 平均油耗 × 1.2 时标记为异常，anomalyPercentage = (本次油耗 - 平均油耗) / 平均油耗 × 100%
- 首次加油记录无法计算油耗（无上次里程），显示为"—"
