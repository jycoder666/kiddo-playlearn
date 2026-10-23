# F02 记忆翻牌·同色配对 设计说明

> 状态：已确认  
> 日期：2026-10-17  
> 来源：brainstorming 对话（入口 A / 解锁 A / 牌面 A / 局制 A / 实现方案 1）

## 1. 问题与目标

- **谁在用**：4～7 岁幼儿 + 家长陪同  
- **要解决什么**：颜色辨识巩固不够「记忆负荷」；数字翻牌（F01）后缺少同机制的颜色练习  
- **成功标准**：RecMap 记忆区可进「颜色配对」；两局 3→4 对同色配对通关；进度写入 memory 键且不影响 attr / F01；无限时无红叉

## 2. 范围

### 本次包含

- RecMap「记忆」区第二入口「颜色配对」（始终可进）  
- 路由 `/sense/memory/color-pair`，扩 `MemoryPairPlay.vue` 按 mode 分支  
- 纯色块双牌配对；局 1=3 对、局 2=4 对；从现有 12 色随机抽  
- `completeMemory('colorPair')`；Celebrate；CSS flip 复用 F01  

### 明确不做

- F03、限时、易混色必出、色名/图标牌面、新 npm、改颜色线解锁链  

## 3. 约束与假设

| 类型 | 内容 |
|------|------|
| 技术/环境 | Vue3 + 现有 SenseChrome/Celebrate/useSpeech；无新依赖 |
| 时间/资源 | 在 F01 翻牌状态机上增量 |
| 假设 | 白/浅色加描边即可辨认；TTS 读 `COLORS[].name` 可接受 |

## 4. 方案对比

| 方案 | 概要 | 优点 | 代价 / 风险 |
|------|------|------|-------------|
| A（推荐） | 扩 MemoryPairPlay，路由区分 mode | 改动小、体验一致 | 单文件略胖 |
| B | 新建 MemoryColorPlay 复制 | 互不污染 | 双份维护 |
| C | 先抽 useMemoryFlip | 利 F03 | 本关略超 YAGNI |

**推荐方案及理由**：A — F02 与 F01 同机制换牌面；F03 再评估是否抽引擎。

## 5. 推荐设计

### 5.1 架构概览

- 入口：RecMap 记忆区 + `MEMORY_MODES.colorPair`  
- 页：`MemoryPairPlay`（`numPair` | `colorPair`）  
- 进度：`kiddo-playlearn:number:memory:v1` → `done/stars.colorPair`  
- 解锁：`isMemoryUnlocked('colorPair') === true`  

### 5.2 数据流

RecMap → `/sense/memory/color-pair` → 抽色发牌 → 翻牌状态机 → 两局清完 → `completeMemory('colorPair', 2)` → Celebrate → RecMap

### 5.3 关键接口或交互

- 牌（颜色）：`{ id, pairId: ColorId, kind: 'color', hex, name, faceUp, matched, pulse }`  
- 匹配：两张 `pairId` 相同；TTS 读色名  
- 错配：700ms 盖回 +「再试试」  
- 白/浅色：正面细描边  

### 5.4 错误与边界

- 非法 mode → 回认一认地图  
- 计时器在 unmount / 重发牌时清理（沿用 F01）  

### 5.5 测试思路

见 #TC-F02（adaptations/F02.md）。

## 6. 待决事项

无（对话中已锁定）。

## 7. 下一步

- [x] 用户确认本设计  
- [ ] （可选）转 writing-plans 写实施计划并编码  
