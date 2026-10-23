<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ANTI_LIMITS, isAntiDebug, useAntiAddiction } from '../composables/useAntiAddiction'
import { WRONG_LIMITS, useWrongRest } from '../composables/useWrongRest'
import { useCalcPrefs, type CalcMax } from '../composables/useCalcPrefs'

const router = useRouter()
const anti = useAntiAddiction()
const wrong = useWrongRest()
const calcPrefs = useCalcPrefs()
const MAX_OPTS: CalcMax[] = [5, 10]
</script>

<template>
  <div class="page">
    <header class="top">
      <button class="hot back" type="button" aria-label="回地图" @click="router.push('/')">
        <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M30 10 L16 24 L30 38" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </button>
      <h1>家长设置</h1>
    </header>

    <section class="card">
      <h2>防沉迷模式</h2>
      <p class="lead">开启后，右上角开始倒计时。时间一到回到首页，所有按钮都按不了，休息满 1 小时再自动恢复。</p>
      <button type="button" class="switch" :class="{ on: anti.enabled }" @click="anti.setEnabled(!anti.enabled)">
        {{ anti.enabled ? '已开启' : '已关闭' }}
      </button>
      <p v-if="anti.locked" class="status rest">正在休息，{{ anti.restLabel }} 后可以再玩</p>
      <p v-else-if="anti.enabled" class="status">这次还能玩 {{ anti.playLabel }}</p>

      <h3>每次可玩</h3>
      <div class="limits" role="radiogroup" aria-label="每次可玩时长">
        <button
          v-for="m in ANTI_LIMITS"
          :key="m"
          type="button"
          role="radio"
          :aria-checked="anti.limitMinutes === m"
          :class="{ on: anti.limitMinutes === m }"
          @click="anti.setLimit(m)"
        >
          {{ m }} 分钟
        </button>
      </div>
    </section>

    <section class="card">
      <h2>口算范围</h2>
      <p class="lead">影响「口算接龙」和「加减练习卷」的数字大小。先练到 5，再开到 10。</p>
      <div class="limits" role="radiogroup" aria-label="口算得数上限">
        <button
          v-for="m in MAX_OPTS"
          :key="m"
          type="button"
          role="radio"
          :aria-checked="calcPrefs.prefs.max === m"
          :class="{ on: calcPrefs.prefs.max === m }"
          @click="calcPrefs.setMax(m)"
        >
          1～{{ m }}
        </button>
      </div>
    </section>

    <section class="card">
      <h2>加减练习卷</h2>
      <p class="lead">屏幕练 8 道十以内加减，像纸笔卷一样点出得数。无打印、无限时。</p>
      <button type="button" class="hot btn-primary act" @click="router.push('/sense/worksheet')">
        开始练 8 道
      </button>
    </section>

    <section class="card">
      <h2>错题休息</h2>
      <p class="lead">和防沉迷分开计算。每一题第一次没答对记 1 次，同一题再错不重复计。达到次数就回到首页，休息 30 分钟后重新计算。</p>
      <div class="limits" role="radiogroup" aria-label="错题最大次数">
        <button type="button" role="radio" :aria-checked="wrong.max === 0" :class="{ on: wrong.max === 0 }" @click="wrong.setMax(0)">
          关闭
        </button>
        <button
          v-for="n in WRONG_LIMITS"
          :key="n"
          type="button"
          role="radio"
          :aria-checked="wrong.max === n"
          :class="{ on: wrong.max === n }"
          @click="wrong.setMax(n)"
        >
          {{ n }} 次
        </button>
      </div>
      <p v-if="wrong.locked" class="status rest">正在休息，{{ wrong.restLabel }} 后重新计算</p>
      <p v-else-if="wrong.max" class="status">本轮已错 {{ wrong.wrongCount }} / {{ wrong.max }}</p>
    </section>

    <Teleport to="#anti-debug-root" :disabled="!(anti.locked || wrong.locked)">
      <section v-if="isAntiDebug" class="card debug">
        <h2>调试</h2>
        <p class="lead">只在本地调试出现。可以马上进入休息，或清除后重新计时。</p>
        <button type="button" class="hot btn-primary act" @click="anti.debugActivate()">立即激活防沉迷</button>
        <button type="button" class="hot btn-secondary act" @click="anti.debugClear()">清除防沉迷</button>
        <button type="button" class="hot btn-primary act" @click="wrong.debugActivate()">立即触发错题休息</button>
        <button type="button" class="hot btn-secondary act" @click="wrong.debugClear()">清除错题休息</button>
      </section>
    </Teleport>
  </div>
</template>

<style scoped>
.page {
  min-height: 100dvh;
  padding: 12px 16px calc(24px + env(safe-area-inset-bottom));
  background:
    radial-gradient(circle at 88% 12%, rgba(247, 197, 159, 0.55) 0 48px, transparent 49px),
    radial-gradient(circle at 10% 80%, rgba(184, 224, 210, 0.5) 0 56px, transparent 57px),
    var(--bg-cream);
}
.top { display: flex; align-items: center; gap: 12px; }
.back { background: var(--card); box-shadow: var(--shadow); }
.back svg { width: 30px; height: 30px; }
h1 { margin: 0; font-size: 28px; }
.card {
  margin-top: 18px;
  background: var(--card);
  border-radius: 28px;
  padding: 18px 16px 16px;
  box-shadow: var(--shadow);
}
h2 { margin: 0; font-size: 22px; }
h3 { margin: 18px 0 10px; font-size: 18px; }
.lead { margin: 8px 0 14px; font-size: 16px; font-weight: 700; line-height: 1.45; color: var(--ink-soft); }
.switch {
  width: 100%;
  min-height: 64px;
  border-radius: 18px;
  background: var(--locked);
  color: var(--ink-soft);
  font-size: 22px;
  font-weight: 900;
  box-shadow: var(--shadow);
}
.switch.on {
  background: var(--hero);
  color: #fff;
  box-shadow: 0 6px 0 #E8907C;
}
.status { margin: 12px 0 0; font-size: 18px; font-weight: 800; text-align: center; }
.status.rest { color: #C47B45; }
.limits { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.limits:has(button:nth-child(2):last-child) { grid-template-columns: repeat(2, 1fr); }
.limits button {
  min-height: 64px;
  border-radius: 18px;
  background: var(--bg-cream);
  font-size: 18px;
  font-weight: 800;
  box-shadow: var(--shadow);
}
.limits button.on {
  background: var(--mint);
  box-shadow: 0 6px 0 #8FC7B2;
}
.debug { background: linear-gradient(180deg, #fff 30%, var(--lavender)); }
.act { width: 100%; margin-top: 10px; }
</style>
