# MyEMS-PV 开发者快速指南

## 项目结构概览

### React 前端 (3200+ 行代码)
```
src/
├── components/          # 10 个可复用 React 组件
│   ├── Dashboard.tsx          # 监控大屏 (实时功率、发电量、告警)
│   ├── DataAnalysis.tsx       # 数据分析 (时间序列统计)
│   ├── StationList.tsx        # 电站管理 (CRUD)
│   ├── GatewayList.tsx        # 接入网关管理
│   ├── InverterList.tsx       # 逆变器管理
│   ├── AlertList.tsx          # 告警管理
│   ├── BasicData.tsx          # 基础资料
│   ├── UserManagement.tsx     # 用户管理
│   ├── RoleManagement.tsx     # 角色权限管理
│   └── StationTags.tsx        # 电站标签管理
├── contexts/            # 状态管理
│   ├── AuthContext.ts         # 身份验证和用户信息
│   └── UIContext.ts           # 全局 UI 状态 (主题、通知)
├── lib/                 # 工具库
│   ├── firebase.ts            # Firebase 初始化和配置
│   ├── assetGuards.ts         # 资产删除前置检查
│   └── request.ts             # API 请求工具
├── types/               # TypeScript 类型定义
│   └── index.ts
├── pages/               # 页面路由
│   ├── Layout.tsx             # 主布局
│   ├── Dashboard.tsx           # 大屏页面
│   ├── Management.tsx          # 管理中心
│   └── Analysis.tsx            # 数据分析页面
├── router/              # 路由配置
│   └── index.tsx
├── index.css            # 全局样式和 CSS 变量定义
└── App.tsx              # 应用入口

package.json:
  React: 19.x
  TypeScript: 5.3
  Tailwind CSS: 3.4
  Firebase: 11.x (Firestore, Auth, Storage)
  Recharts: 2.x (数据可视化)
  Lucide React: 0.x (图标库)
  XLSX: 0.x (Excel 导出)
```

### RuoYi-Vue3 后端 (1713+ 行代码)
```
ruoyi-vue3-myems/
├── src/
│   ├── api/pv/               # API 调用层 (20+ 个端点)
│   │   ├── dashboard.js       # 大屏 API
│   │   ├── station.js         # 电站管理 API
│   │   ├── gateway.js         # 网关管理 API
│   │   ├── inverter.js        # 逆变器管理 API
│   │   ├── alert.js           # 告警管理 API
│   │   ├── analysis.js        # 数据分析 API
│   │   └── catalog.js         # 目录 API (标签、型号)
│   ├── views/pv/              # Vue 组件页面
│   │   ├── dashboard/index.vue     # 大屏 (ECharts 集成)
│   │   ├── station/index.vue       # 电站管理
│   │   ├── gateway/index.vue
│   │   ├── inverter/index.vue
│   │   ├── alert/index.vue
│   │   ├── analysis/index.vue
│   │   ├── catalog/
│   │   │   ├── station-tag/index.vue
│   │   │   └── model/index.vue
│   │   └── ...
│   ├── router/                # 路由配置
│   ├── store/                 # Pinia 状态管理
│   └── ...
├── package.json
├── vite.config.js
└── tsconfig.json
```

---

## CSS 主题系统

### 色彩变量定义 (`src/index.css`)

```css
/* 浅色模式 (默认) */
:root {
  --bg-base: #ffffff;                  /* 背景基色 */
  --bg-card: #ffffff;                  /* 卡片背景 */
  --border-subtle: #e5e7eb;             /* 弱边框 */
  --border-strong: #d1d5db;             /* 强边框 */
  --text-muted: #6b7280;                /* 淡化文本 */
  
  /* CSS 变量链映射 */
  --color-bg-base: var(--bg-base);
  --color-bg-card: var(--bg-card);
  --color-border-subtle: var(--border-subtle);
  --color-border-strong: var(--border-strong);
  --color-text-muted: var(--text-muted);
}

/* 深色模式 */
.dark {
  --bg-base: #0a0a0a;                  /* 深色背景 */
  --bg-card: #141414;                  /* 深色卡片 */
  --border-subtle: #1a1a1a;             /* 深色弱边框 */
  --border-strong: #222222;             /* 深色强边框 */
  --text-muted: #6b7280;                /* 灰度文本 */
}

/* Tailwind CSS 映射 */
.bg-bg-base { background-color: var(--color-bg-base); }
.bg-bg-card { background-color: var(--color-bg-card); }
.border-border-subtle { border-color: var(--color-border-subtle); }
.border-border-strong { border-color: var(--color-border-strong); }
.text-text-muted { color: var(--color-text-muted); }

/* 响应式虚拟滚动条 */
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--color-border-subtle);
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--color-border-strong);
}
```

### 使用规范

#### ✅ 正确做法

```tsx
// 使用语义化 CSS 变量类名
<div className="bg-bg-card border border-border-subtle rounded-xl p-6">
  <h3 className="text-white">标题</h3>
  <p className="text-text-muted">描述文本</p>
</div>

// 内联样式必须使用 CSS 变量
<div style={{ backgroundColor: 'var(--color-bg-card)' }}>
  内容
</div>

// Recharts 图表颜色使用 CSS 变量
<CartesianGrid stroke="var(--color-border-strong)" />
<XAxis stroke="var(--color-text-muted)" />
<Tooltip contentStyle={{ backgroundColor: 'var(--color-bg-card)' }} />
```

#### ❌ 错误做法

```tsx
// 不要使用硬编码颜色
<div className="bg-[#141414] border-[#1a1a1a]">错误</div>

// 不要混合使用变量和硬编码
<div className="bg-bg-card" style={{ color: '#ffffff' }}>错误</div>

// 透明度使用错误
<div className="bg-[#1a1a1a]/50">错误 → 应该用 bg-border-subtle/50</div>
```

---

## 状态管理指南

### React Context 使用

```typescript
// AuthContext - 身份验证状态
const authContext = useAuth();
// 属性:
//   - profile: UserProfile | null          // 当前用户信息
//   - isAdmin: boolean                     // 是否管理员
//   - apiFetch: <T>(url, options) => Promise<T>  // 带认证的 API 调用
//   - logout: () => void                   // 登出

// UIContext - UI 全局状态
const uiContext = useUI();
// 属性:
//   - isDark: boolean                      // 是否深色主题
//   - toggleTheme: () => void              // 切换主题
//   - showToast: (msg, type) => void       // 显示通知
//   - confirm: (msg) => Promise<boolean>   // 确认对话框
```

### Vue Pinia Store 使用

```typescript
// 在 Vue 组件中
import useSettingsStore from '@/store/modules/settings'
const settingsStore = useSettingsStore()

// 访问状态
console.log(settingsStore.isDark)

// 修改状态
settingsStore.setTheme('dark')
```

---

## API 调用规范

### React 端

```typescript
// 使用 useAuth 中的 apiFetch
const { apiFetch } = useAuth();

// GET 请求
const data = await apiFetch<DashboardSummary>('/api/dashboard/summary');

// POST 请求
const result = await apiFetch('/api/stations', {
  method: 'POST',
  body: JSON.stringify(newStation)
});

// 错误处理 (自动)
try {
  const data = await apiFetch('/api/data');
  // 处理数据
} catch (error) {
  // 错误已由拦截器处理，显示 toast
  console.error(error);
}
```

### Vue 端

```typescript
// API 调用示例 (src/api/pv/station.js)
import request from '@/utils/request'

export function listStation(query) {
  return request({
    url: '/pv/station/list',
    method: 'get',
    params: query
  })
}

// 在组件中使用
<script setup>
import { listStation } from '@/api/pv/station'

const loading = ref(false)
async function getList() {
  loading.value = true
  try {
    const res = await listStation(queryParams)
    stationList.value = res.rows || []
  } finally {
    loading.value = false
  }
}
</script>
```

---

## 常见开发任务

### 任务1: 添加新的数据列表页面

**React 端步骤**:
1. 创建 `src/components/NewList.tsx`
2. 导入必要的库和类型
3. 使用 Firestore 查询数据
4. 使用 CSS 变量类名的卡片布局
5. 在路由中注册组件

**Vue 端步骤**:
1. 创建 `src/views/pv/newitem/index.vue`
2. 在 `src/api/pv/` 创建 API 模块
3. 使用 Element Plus 表格组件
4. 实现分页和搜索功能
5. 添加菜单项到路由配置

**示例** (React):
```tsx
import { useEffect, useState } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Plus, Search } from 'lucide-react';

export function NewItemList() {
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'newItems'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="搜索..."
          className="flex-1 bg-bg-card border border-border-subtle rounded-xl px-4 py-2"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button className="bg-orange-500 text-white px-4 py-2 rounded-xl flex items-center gap-2">
          <Plus className="w-4 h-4" />
          添加
        </button>
      </div>
      
      <div className="bg-bg-card border border-border-subtle rounded-2xl overflow-hidden">
        {/* 表格内容 */}
      </div>
    </div>
  );
}
```

### 任务2: 修改主题色

在 `src/index.css` 修改 CSS 变量:
```css
:root {
  --border-subtle: #你的新颜色;  /* 浅色模式 */
}

.dark {
  --border-subtle: #你的新颜色;  /* 深色模式 */
}
```

所有使用 `border-border-subtle` 的组件会自动更新。

### 任务3: 添加新的 API 端点

**后端 (Spring Boot)** 步骤:
1. 创建 Entity (数据模型)
2. 创建 Repository (数据访问)
3. 创建 Service (业务逻辑)
4. 创建 Controller (REST 端点)
5. 配置权限和路由

**前端更新** (Vue):
```typescript
// src/api/pv/newfeature.js
import request from '@/utils/request'

export function getNewFeatureData(query) {
  return request({
    url: '/pv/newfeature/list',
    method: 'get',
    params: query
  })
}

// 在组件中使用
const res = await getNewFeatureData(params)
```

---

## 调试技巧

### React DevTools
```bash
# 安装 React Developer Tools 浏览器扩展
# 在开发工具中可以看到:
# - Component 树结构
# - Props 和 State 变化
# - Context 变化
```

### Vue DevTools
```bash
# 安装 Vue DevTools 浏览器扩展
# 在开发工具中可以看到:
# - Component 树结构
# - Props, Data, Computed 属性
# - Pinia store 状态
```

### 主题切换测试
```typescript
// 在浏览器控制台执行
document.documentElement.classList.toggle('dark')

// 检查 CSS 变量值
getComputedStyle(document.documentElement).getPropertyValue('--color-bg-card')
```

### 网络请求检查
```typescript
// React: 查看 Network 选项卡
// 确保所有 API 请求都返回 200 状态码

// 在控制台检查请求
// Network -> 选择请求 -> Preview 查看响应数据
```

---

## 性能优化建议

### 列表性能 (>1000 条)
```typescript
// 使用虚拟滚动
import { FixedSizeList } from 'react-window'

// 或后端分页
const pageSize = 50
const currentPage = 1
```

### 图表性能
```typescript
// 数据聚合 (后端处理)
// 而不是在前端渲染 24小时 × 逆变器数 = 数千条数据

// 使用 useMemo 缓存计算结果
const chartData = useMemo(() => 
  powerSeries.map(point => ({...})),
  [powerSeries]
)
```

### 组件性能
```typescript
// 使用 React.memo 避免不必要重新渲染
const StationCard = React.memo(({ station }) => (
  <div>...</div>
))

// 使用 useCallback 缓存回调函数
const handleClick = useCallback(() => {
  // ...
}, [dependencies])
```

---

## 常见错误和解决方案

### 错误1: "Cannot read property 'xxx' of null"
**原因**: 数据未加载时访问  
**解决**:
```tsx
// 添加加载状态检查
{isLoading ? <LoadingSpinner /> : data && <Content data={data} />}
```

### 错误2: 主题切换后样式不更新
**原因**: 使用了硬编码颜色而不是 CSS 变量  
**解决**: 检查是否所有颜色都使用 `var(--color-xxx)` 或 CSS 变量类名

### 错误3: Firebase 连接失败
**原因**: 配置文件缺失或环境变量未设置  
**解决**:
```bash
# 检查 .env.local 文件
# REACT_APP_FIREBASE_API_KEY=...
# REACT_APP_FIREBASE_PROJECT_ID=...
```

### 错误4: TypeScript 类型错误
**原因**: 类型定义不完整  
**解决**: 在 `src/types/index.ts` 中定义完整的接口

---

## 测试指南

### 单元测试 (Jest)
```bash
# 运行测试
npm test

# 查看覆盖率
npm test -- --coverage
```

### E2E 测试 (Cypress)
```bash
# 运行 E2E 测试
npm run test:e2e

# 打开测试运行器
npm run test:e2e -- --open
```

### 手动测试清单
- [ ] 浅色/深色模式切换
- [ ] 登录/登出功能
- [ ] 数据列表加载和搜索
- [ ] 表单提交和验证
- [ ] 错误提示显示
- [ ] 权限检查 (管理员 vs 普通用户)
- [ ] 响应式布局 (手机/平板/桌面)

---

## 部署指南

### 本地开发
```bash
# React 端
cd MyEMS-PV
npm install
npm run dev

# Vue 端 (新终端)
cd ruoyi-vue3-myems
npm install
npm run dev
```

### 生产构建
```bash
# React
npm run build
# 输出: dist/ 目录

# Vue
npm run build
# 输出: dist/ 目录
```

### Docker 部署
```bash
# 创建 Dockerfile
docker build -t myems-pv:v2.0.0 .
docker run -p 80:5173 myems-pv:v2.0.0
```

---

## 资源链接

- [React 官方文档](https://react.dev)
- [Vue 3 官方文档](https://vuejs.org)
- [Tailwind CSS 文档](https://tailwindcss.com)
- [Firebase 文档](https://firebase.google.com/docs)
- [RuoYi-Vue3 文档](https://gitee.com/y_project/RuoYi-Vue3)

---

## 获取帮助

遇到问题?
1. 检查浏览器控制台是否有错误信息
2. 查看 Network 选项卡的 API 响应
3. 使用开发者工具检查组件状态
4. 查看本文档的常见错误部分
5. 在团队 Slack/Discord 提问

**文档版本**: 1.0  
**最后更新**: 2026-04-11  
**维护人**: Codex Team
