# F02 记忆翻牌·同色配对 Implementation Plan

> **For agentic workers:** 按任务逐步实施；本仓无单测框架，以 `npm run build` + #TC-F02 手工验收代替 TDD 红绿循环。设计依据：`docs/plans/2026-10-17-F02-color-memory-design.md`。

**Goal:** 在认一认「记忆」区增加「颜色配对」：纯色块同色翻牌，局制同 F01（3→4 对），进度写入 `memory:v1` 的 `colorPair`。

**Architecture:** 扩 [`MemoryPairPlay.vue`](../../src/views/sense/MemoryPairPlay.vue)：路由 `/sense/memory/color-pair` 与 `num-pair` 共用翻牌状态机；发牌/匹配/牌面按 `MemoryModeId` 分支。进度与 RecMap 入口增量，不改 attr 线。

**Tech Stack:** Vue3 + Vite + TS；复用 `COLORS`（[`attr.ts`](../../src/data/sense/attr.ts)）、SenseChrome / Celebrate / useSpeech；无新 npm。

## Global Constraints

- 不改框架级文件；业务最小改动；无新依赖  
- 无限时、无扣分；不写 `completeAttr` / `completeRec`  
- 局 1=3 对、局 2=4 对；色 ∈ 现有 12 色；纯色块；白/浅色描边  
- 验收门禁：#TC-F02；`prefers-reduced-motion` 沿用 F01  

---

### Task 1: meta + progress 支持 colorPair

**Files:**
- Modify: `src/data/sense/meta.ts`
- Modify: `src/composables/useSenseProgress.ts`

**Step 1: 扩展 MemoryModeId 与 MEMORY_MODES**

```ts
export type MemoryModeId = 'numPair' | 'colorPair'

export const MEMORY_MODES: SenseModeMeta[] = [
  { id: 'numPair', name: '数字配对', emoji: '🃏', blurb: '翻牌：数字对上苹果数量' },
  { id: 'colorPair', name: '颜色配对', emoji: '🎨', blurb: '翻牌：找出相同颜色' },
]
```

**Step 2: 解锁与通关**

```ts
function isMemoryUnlocked(id: MemoryModeId) {
  return id === 'numPair' || id === 'colorPair'
}

function completeMemory(id: MemoryModeId, stars = 2) {
  if (id !== 'numPair' && id !== 'colorPair') return
  memory.done[id] = true
  memory.stars[id] = Math.max(memory.stars[id] ?? 0, stars)
  saveMemory(memory)
}
```

**Step 3: 构建检查**

Run: `npx vue-tsc --noEmit`  
Expected: 通过（或仅既有无关告警）

**Step 4: Commit（若用户要求再提交；默认本任务可暂不 commit，整关结束后一次提交）**

---

### Task 2: 路由 color-pair

**Files:**
- Modify: `src/router.ts`

**Step 1: 合并记忆路由为 param（推荐）**

将现有 `num-pair` 固定路由改为：

```ts
{
  path: '/sense/memory/:slug',
  component: () => import('./views/sense/MemoryPairPlay.vue'),
  beforeEnter: (to) => {
    const slug = String(to.params.slug)
    const id = slug === 'num-pair' ? 'numPair' : slug === 'color-pair' ? 'colorPair' : null
    if (!id || !MEMORY_MODES.some((m) => m.id === id)) return '/sense/recognize'
    if (!useSenseProgress().isMemoryUnlocked(id)) return '/sense/recognize'
  },
}
```

保留旧路径等价：仅支持 `num-pair` | `color-pair` 两个 slug。

**Step 2: 本地打开**

Run: 开发服导航 `#/sense/memory/color-pair`  
Expected: 进入 MemoryPairPlay（此时玩法仍可能是数字，Task 3 再分支）

---

### Task 3: RecMap 第二入口

**Files:**
- Modify: `src/views/sense/RecMap.vue`

**Step 1: 记忆区 list 增加颜色配对行**

- 使用 `MEMORY_MODES` 两项，或显式第二按钮  
- `openMemory('colorPair')` → `router.push('/sense/memory/color-pair')`  
- 星级：`memory.stars.colorPair ?? 0`  
- 将现有仅 `numPair` 的 `openMemory` 改为接受 `MemoryModeId`

**Step 2: 目测**

Expected: 「记忆」下两行：数字配对、颜色配对；均无锁

---

### Task 4: MemoryPairPlay 按 mode 分支

**Files:**
- Modify: `src/views/sense/MemoryPairPlay.vue`

**Step 1: 解析 mode**

```ts
import { useRoute } from 'vue-router'
import { COLORS, type ColorId } from '../../data/sense/attr'
import { MEMORY_MODES, type MemoryModeId } from '../../data/sense/meta'

const route = useRoute()
const modeId = computed<MemoryModeId>(() =>
  String(route.params.slug) === 'color-pair' ? 'colorPair' : 'numPair',
)
const meta = computed(() => MEMORY_MODES.find((m) => m.id === modeId.value)!)
const isColor = computed(() => modeId.value === 'colorPair')
```

若 Task 2 仍用固定 path 无 `slug`，则用 `route.path.endsWith('color-pair')`。

**Step 2: 统一 Card 类型**

```ts
interface Card {
  id: string
  pairId: string | number  // ColorId | 1..5
  kind: 'digit' | 'qty' | 'color'
  n?: number
  hex?: string
  name?: string
  faceUp: boolean
  matched: boolean
  pulse: boolean
}
```

**Step 3: deal 分支**

- `numPair`：保持现有 digit/qty 逻辑  
- `colorPair`：`shuffle(COLORS).slice(0, pairCount)`，每色生成 **两张** `kind:'color'`（同 `pairId`）  
- prompt：颜色用「翻两张，找出一样的颜色」/「再来难一点：找相同颜色」

**Step 4: 匹配条件**

```ts
const matched =
  isColor.value
    ? a.pairId === b.pairId && a.id !== b.id
    : a.pairId === b.pairId && a.kind !== b.kind
// TTS: color → a.name；num → String(a.n)
```

通关：`completeMemory(modeId.value, 2)`（不要写死 `numPair`）。

**Step 5: 模板牌面**

- `kind==='color'`：`.swatch` 设 `background: hex`；`white`/`yellow` 等浅色加 `box-shadow`/`outline`  
- aria-label：翻开时用色名，否则「牌背面，点开」  
- 数字模式模板保持不变  

**Step 6: 切路由重置**

`watch(modeId, () => { celebrate=false; round=1; deal(3) })`，避免从数字关切到颜色关残留牌面。

**Step 7: Build**

Run: `npm run build`  
Expected: success，产物含 MemoryPairPlay chunk

---

### Task 5: 文档打标

**Files:**
- Modify: `D:\other\docs\research\products\kiddo-playlearn\adaptations\F02.md`（状态→已落地）  
- Modify: `D:\other\docs\research\products\kiddo-playlearn\runs\2026-10-17-同赛道调研.md`（F02 状态→已落地）  
- Modify: `D:\other\docs\research\components\README.md`（若无需新组件，注明 F02 复用自研 flip-card）

---

### Task 6: #TC-F02 手工验收

| # | 操作 | 期望 |
| --- | --- | --- |
| 1 | RecMap → 颜色配对 | 始终可进；6 张背面 |
| 2 | 翻两同色 | 锁定 + TTS 色名 |
| 3 | 翻两异色 | 盖回；无红叉 |
| 4 | 清完局1→局2（8 张）→通关 | Celebrate；`memory.stars.colorPair===2`；刷新仍在 |
| 5 | 再玩数字配对 | F01 进度不受影响；attr 不变 |
| 6 | （可选）系统开减弱动态效果 | 仍可通关 |

---

### Task 7: 提交（仅当用户要求）

```text
feat(sense): 记忆区上线颜色配对翻牌（F02）

扩 MemoryPairPlay 支持 color-pair；进度写入 memory.colorPair。
```

---

## 执行交接

计划已写入 [`docs/plans/2026-10-17-F02-color-memory.md`](./2026-10-17-F02-color-memory.md)。

**可选下一步：**

1. **直接按本计划实施**（回复「开始实施」/「执行计划」）  
2. **只要计划、暂不写代码**（到此为止）  
