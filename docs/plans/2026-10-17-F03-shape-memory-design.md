# F03 记忆翻牌·同形配对 设计说明

> 状态：已确认  
> 日期：2026-10-17  
> 来源：brainstorming（入口 A / 解锁 A / 牌面 B / 难度组合 A / 对数 A / 实现方案 1）

## 1. 问题与目标

- **谁在用**：4～7 岁幼儿 + 家长陪同  
- **要解决什么**：图形辨识缺「记忆负荷」练习；F01/F02 后缺同机制的形配对  
- **成功标准**：RecMap 记忆区可进「图形配对」；局1 同形同色+形名、局2 同形异色+形名仍配对；通关写 `memory.shapePair`；无限时无红叉

## 2. 范围

### 本次包含

- RecMap「记忆」第三入口「图形配对」（始终可进）  
- `/sense/memory/shape-pair`，扩 `MemoryPairPlay`（mode=`shapePair`）  
- 牌面：形剪影 + 中文形名；匹配键=`ShapeId`  
- 局1=3 对同色；局2=4 对异色  

### 明确不做

- 去名第三局、限时、扣分、新 npm、抽 `useMemoryFlip`、改图形线解锁  

## 3. 约束与假设

| 类型 | 内容 |
|------|------|
| 技术 | 复用 `SHAPES` / `COLORS`；`clip-path` 对齐 AttrPlay `shapeClip` |
| 资源 | 在 F02 分支上增量 |
| 假设 | 异色同形足以训练「看形」；8 形池够抽 4 对 |

## 4. 方案对比

| 方案 | 概要 | 优点 | 代价 |
|------|------|------|------|
| A（推荐） | 扩 MemoryPairPlay | 一致、改动小 | 文件略胖 |
| B | 新页面复制 | 隔离 | 三份逻辑 |
| C | 先抽引擎 | 利长期 | 超 YAGNI |

**推荐**：A。

## 5. 推荐设计

### 5.1 架构

- `MemoryModeId` += `shapePair`；进度 `memory:v1`  
- slug `shape-pair` → 同一玩法页  

### 5.2 数据流

RecMap → shape-pair → 抽形发牌 → 翻牌（比 shapeId）→ 两局 → `completeMemory('shapePair')` → Celebrate → RecMap

### 5.3 交互

- 匹配 TTS 读形名；错配「再试试」700ms  
- 牌：`{ pairId: ShapeId, kind:'shape', hex, name, ... }`  
- 局2 同 pair 两张 hex 不同  

### 5.4 边界

- 非法 slug → 回认一认；计时器清理同 F01  

### 5.5 测试

见 #TC-F03（adaptations/F03.md）。

## 6. 待决事项

无。

## 7. 下一步

- [x] 用户确认本设计  
- [ ] writing-plans / 实施  
