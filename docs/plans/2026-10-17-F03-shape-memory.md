# F03 记忆翻牌·同形配对 Implementation Plan

> **For agentic workers:** 按任务逐步实施；本仓无单测框架，以 `npm run build` + #TC-F03 手工验收代替 TDD。设计依据：[`2026-10-17-F03-shape-memory-design.md`](./2026-10-17-F03-shape-memory-design.md)。

**Goal:** 在认一认「记忆」区增加「图形配对」：形剪影+形名翻牌；局1 同形同色、局2 同形异色仍按形配对；进度写入 `memory.shapePair`。

**Architecture:** 继续扩 [`MemoryPairPlay.vue`](../../src/views/sense/MemoryPairPlay.vue)：slug `shape-pair` → mode `shapePair`；匹配键改为 `ShapeId`（不比色）；发牌按局次决定两张是否同 `hex`。RecMap 已用 `MEMORY_MODES` 循环，加 meta 即出入口。

**Tech Stack:** Vue3 + Vite + TS；`SHAPES` / `COLORS`（[`attr.ts`](../../src/data/sense/attr.ts)）；形剪影参考 [`AttrPlay.vue`](../../src/views/sense/AttrPlay.vue) 的 `shapeClip`；无新 npm。

## Global Constraints

- 最小改动；无新依赖；不改 attr 解锁链  
- 局1=3对同色+形名；局2=4对异色+形名；匹配=`shapeId`  
- 无限时、无扣分；#TC-F03 门禁  

---

### Task 1: meta + progress 支持 shapePair

**Files:**
- Modify: `src/data/sense/meta.ts`
- Modify: `src/composables/useSenseProgress.ts`
- Modify: `src/views/sense/RecMap.vue`（`MEMORY_SLUG` 映射）

**Step 1: meta**

```ts
export type MemoryModeId = 'numPair' | 'colorPair' | 'shapePair'

// MEMORY_MODES 追加：
{ id: 'shapePair', name: '图形配对', emoji: '🔷', blurb: '翻牌：找出相同图形' },
```

**Step 2: progress**

```ts
function isMemoryUnlocked(id: MemoryModeId) {
  return id === 'numPair' || id === 'colorPair' || id === 'shapePair'
}

function completeMemory(id: MemoryModeId, stars = 2) {
  if (id !== 'numPair' && id !== 'colorPair' && id !== 'shapePair') return
  // ... 同现有 save
}
```

**Step 3: RecMap slug**

```ts
const MEMORY_SLUG: Record<MemoryModeId, string> = {
  numPair: 'num-pair',
  colorPair: 'color-pair',
  shapePair: 'shape-pair',
}
```

（列表已 `v-for="m in MEMORY_MODES"`，无需新按钮。）

**Step 4:** `npx vue-tsc --noEmit` 通过。

---

### Task 2: 路由识别 shape-pair

**Files:**
- Modify: `src/router.ts`

现有 `/sense/memory/:slug` 的 `beforeEnter` 增加：

```ts
const id =
  slug === 'num-pair' ? 'numPair'
  : slug === 'color-pair' ? 'colorPair'
  : slug === 'shape-pair' ? 'shapePair'
  : null
```

**Step:** 打开 `#/sense/memory/shape-pair` 不重定向回认一认。

---

### Task 3: MemoryPairPlay — mode 解析与 Card 类型

**Files:**
- Modify: `src/views/sense/MemoryPairPlay.vue`

**Step 1: modeId**

```ts
const modeId = computed<MemoryModeId>(() => {
  const s = String(route.params.slug)
  if (s === 'color-pair') return 'colorPair'
  if (s === 'shape-pair') return 'shapePair'
  return 'numPair'
})
const isColor = computed(() => modeId.value === 'colorPair')
const isShape = computed(() => modeId.value === 'shapePair')
```

**Step 2: Card.kind 增加 `'shape'`**（保留 hex/name）。

**Step 3: 内联 `shapeClip(id: ShapeId): string`**  
从 AttrPlay 复制 switch（circle/ellipse/…/star），本关不抽公共文件（YAGNI）。

---

### Task 4: 发牌 — 同色 / 异色

**Step 1: deal 分支 `isShape`**

```ts
const picked = shuffle([...SHAPES]).slice(0, pairCount)
for (const sh of picked) {
  const hexA = pick(COLORS).hex
  const hexB =
    pairCount === 4 // 局2：确保异色
      ? pick(COLORS.filter((c) => c.hex !== hexA)).hex
      : hexA
  for (const [i, hex] of [[0, hexA], [1, hexB]] as const) {
    list.push({
      id: `s-${sh.id}-${i}-${pairCount}`,
      pairId: sh.id,
      kind: 'shape',
      hex,
      name: sh.name,
      faceUp: false,
      matched: false,
      pulse: false,
    })
  }
}
prompt =
  pairCount === 3
    ? '翻两张，找出一样的图形'
    : '再来难一点：颜色不同也要找同形'
```

> 局次用 `round` 判断更稳：`const sameColor = round.value === 1`，再 `deal(3|4)`。  
> 当前 `deal(pairCount)` 在桥接时 `round` 已改为 2，可用 `round.value === 1` 决定同色。

**Step 2: isMatch**

```ts
if (isShape.value) return a.pairId === b.pairId && a.id !== b.id
// color / num 保持原逻辑
```

**Step 3: TTS** 匹配成功：`speak(a.name || '')`。

**Step 4: faceLabel** 翻开时返回形名。

---

### Task 5: 模板 — 形 + 名

```vue
<span v-else-if="c.kind === 'shape'" class="shape-face">
  <span
    class="shape-glyph"
    :style="{ background: c.hex, clipPath: shapeClip(c.pairId as ShapeId) }"
  />
  <span class="shape-name">{{ c.name }}</span>
</span>
```

样式要点：
- `.shape-face`：纵排，形约占 60%，名在下 `font-weight:900`  
- `.shape-glyph`：固定宽高（如 56×56），居中  
- 浅色填充可加细描边（复用 LIGHT 思路，按 hex 亮度或 color id）

---

### Task 6: 文档打标

**Files:**
- `D:\other\docs\research\products\kiddo-playlearn\adaptations\F03.md` → 状态已落地  
- run 表 F03 状态 → 已落地  
- `research/components/README.md` flip-card 关联加 F03  
- `README.md` 记忆行补「图形配对」（若尚未写）

---

### Task 7: #TC-F03 手工验收

| # | 操作 | 期望 |
| --- | --- | --- |
| 1 | RecMap → 图形配对 | 始终可进；6 张背面；有形名位（翻开后可见） |
| 2 | 局1 翻同形同色 | 锁定 + TTS 形名 |
| 3 | 局1 翻异形 | 盖回 |
| 4 | 局2 翻同形异色 | 锁定成功 |
| 5 | 通关 | `stars.shapePair===2`；num/color 星不变；attr 不变 |
| 6 | `npm run build` | success |

---

### Task 8: 提交（仅用户要求时）

```text
feat(sense): 记忆区上线图形配对翻牌（F03）

局1同色局2异色按形配对；进度 memory.shapePair。
```

---

## 执行交接

计划已写入 [`docs/plans/2026-10-17-F03-shape-memory.md`](./2026-10-17-F03-shape-memory.md)。

| | 下一步 |
| --- | --- |
| **A** | 开始按本计划实施（编码） |
| **B** | 先改计划某一条 |
| **C** | 暂不实施 |
