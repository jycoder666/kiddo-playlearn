# Kiddo Playlearn · 小孩趣学

> 用玩代替催，让孩子敢试、敢错、敢再来。

手机竖屏 Web 上的**儿童趣味互动学习**小项目。首版是「小兔辨方向」闯关；后续会逐步扩展识字、数感、常识等更多玩法模块。

技术栈：Vue 3 + Vite + TypeScript + Vue Router。进度存在浏览器 `localStorage`（无账号）。

仓库：https://github.com/jycoder666/kiddo-playlearn

---

## 为什么做这个

晚上回家辅导作业时，常常会遇到这样的画面：孩子其实是**不会**，但更怕爸妈皱眉、叹气、失望的眼神，一紧张就只会哭，越哭越不敢试。

硬教、催进度，往往把「不会」变成「害怕学」。想了很久，觉得更好的办法是：

- 把知识点做成**能摸、能点、能听**的小游戏；
- 让孩子在玩里**自己体验、自己感受**；
- 答错了也不训斥，只温和带着再试一遍。

这个仓库就是从自家辅导场景长出来的：先做一个父母愿意陪、孩子愿意再玩的方向辨识小游戏，再慢慢做成一整套「小孩趣学」互动包。

---

## 设计原则（给孩子的）

| 做 | 不做 |
|----|------|
| 语音 + 大按钮，少依赖识字 | 长篇说明才开玩 |
| 点错：重说 → 高亮 → 一起演示 | 倒计时惩罚、Game Over、嘲讽 |
| 星星、贴纸鼓励再来一局 | 排行榜、攀比、账号墙 |
| 单次几分钟，随时回地图 | 强制通关才能离开 |

---

## 现在有什么（首版 · 小兔辨方向）

闯关地图 L1～L5，帮助约 6 岁孩子熟悉方位：

| 关 | 内容 |
|----|------|
| L1 | 上下左右：听音点向 + 走一步 |
| L2 | 小兔背对你：左手 / 右手 / 耳朵 |
| L3 | 斜向九宫格 + 连跳（每局次数与方向随机） |
| L4 | 正中间 / 放中间 |
| L5 | 北↑地图：点方位，或「家的北边是什么」点地标 |

后续计划（欢迎一起想）：更多主题小游戏、贴纸成长线、家长可开关的「陪玩模式」等——**仍然不要**变成成绩报表工具。

---

## 环境要求

- **Node.js** 18+（推荐 20 / 22 / 24）
- **npm** 9+
- 现代浏览器；主推**手机竖屏**

---

## 安装依赖

```bash
git clone https://github.com/jycoder666/kiddo-playlearn.git
cd kiddo-playlearn
npm install
```

只装 `package.json` 里的依赖；**不要**改 `node_modules`。

---

## 本地开发

```bash
npm run dev
```

默认监听 `0.0.0.0:5173`：

- 本机：http://localhost:5173/
- 局域网：终端里的 Network 地址（同一 Wi‑Fi 手机可打开）

常用页面：`/#/` 方向地图 · `/#/sense` 数感岛 · `/#/level/1`～`5` · `/#/stickers` 贴纸册

数感岛（算一算 / 认一认·数字）设计见 [`docs/plans/数感岛-一期-design.md`](docs/plans/数感岛-一期-design.md)。计数物 PNG 可后续放入 `assets/art/`（`item_apple.png` 等），缺图时用 emoji 占位。

### 外网临时访问

开发服已绑全网卡。公网还需端口转发，或另开隧道：

```bash
npx --yes cloudflared tunnel --url http://localhost:5173
```

正式站点请构建后部署，不要长期用开发服对外。

---

## 构建与部署

```bash
npm run build      # 产出 dist/
npm run preview    # 本地预览生产包
```

任意静态托管即可（Nginx / OSS / **GitHub Pages** / **Vercel**）。根目录有 `vercel.json`。

### GitHub Pages（本仓库托管演示站）

1. Settings → Pages → Source 选 **GitHub Actions**，或选 Branch 的 `gh-pages`
2. 也可本地：`npm run build` 后把 `dist` 推到 `gh-pages` 分支
3. 站点形如：`https://jycoder666.github.io/kiddo-playlearn/`

> 若挂在子路径，把 `vite.config.ts` 里 `base` 改成 `'/kiddo-playlearn/'` 再构建。

### Vercel

Import 本仓库 → Build：`npm run build` → Output：`dist` → Deploy。

---

## 怎么玩

1. 打开地图，点第 1 关（默认解锁）。
2. 听/看题干，点方向、格子、身体热区或地标。
3. 点错会温和纠错；无倒计时、无 Game Over。
4. 过关拿星、可能掉贴纸；达门槛解锁下一关。
5. 「继续上次」恢复未完成局（存在本机浏览器）。

静音：地图右上角喇叭。无声时题干旁有图标，仍可玩。

清进度：DevTools → Application → Local Storage → 删除 `direction-game:v1`。

---

## 目录与扩展

```
src/
  views/          # 地图、关卡、贴纸
  components/     # 玩法组件（方向垫、九宫格、地图问答…）
  data/levels/    # 关卡 CSV 题库
  composables/    # 进度、语音、会话状态机
assets/art/       # 可选 PNG（缺图有占位）
```

- 题库：`src/data/levels/l1.csv` … `l5.csv`
- 美术文件名约定见设计文档；缺图不白屏
- 新玩法：优先加独立关卡/模块，保持「敢试、敢错」的反馈气质

设计侧需求文档（若本机有）：`Documents\grok\direction-game\docs\`

---

## 常用命令

| 命令 | 作用 |
|------|------|
| `npm install` | 安装依赖 |
| `npm run dev` | 开发调试 |
| `npm run build` | 类型检查 + 打到 `dist/` |
| `npm run preview` | 预览生产包 |

---

## 许可与声明

本项目采用 [MIT License](./LICENSE) 开源。欢迎 fork 改成自家孩子爱玩的版本；若分享到班级或社区，请保持对孩子温柔、无惩罚向的玩法底色。

---

## 联系与打赏

如果项目对你有用，打赏杯咖啡 ☕；有问题或想交流，欢迎加微信。

| 赞赏（微信支付） | 加我微信 |
|:---:|:---:|
| <img src="./docs/wechat-donate.png" alt="微信支付赞赏码" width="240" /> | <img src="./docs/wechat-contact.png" alt="微信联系二维码" width="240" /> |
