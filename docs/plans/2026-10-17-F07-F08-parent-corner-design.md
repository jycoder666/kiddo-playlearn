# F07/F08 家长角（长按入口 + 重置本岛）设计说明

> 状态：已确认（按调研表最小方案直接落地）  
> 日期：2026-10-17  
> 来源：F:\docs\research\products\kiddo-playlearn\runs\2026-10-17-同赛道调研.md

## 1. 目标

- F07：SenseChrome 增加家长入口；短按无效，长按 ≥2s 打开家长角  
- F08：家长角可确认后重置「当前岛」进度；其它岛不变  

## 2. 范围

### 包含

- `useSenseProgress.resetIsland(islandId)`  
- `ParentCorner.vue` 浮层（确认重置 / 关闭）  
- SenseChrome「爸妈」热区长按 2s  

### 不做

- 云端账号、密码门、改 MapHome「家长设置」、F17 时长统计  

## 3. 岛映射

| islandId | 清空键 |
| --- | --- |
| calc | `number:v1` |
| recognize | `recognize:v1` + `recognize-attr:v1` + `memory:v1` |
| compare | `compare:v1` |
| compose | `compose:v1` |

由 `backTo` 推断。

## 4. 验收

见 adaptations F07 / F08。
