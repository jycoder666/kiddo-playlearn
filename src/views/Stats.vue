<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { LEVELS } from '../data/levelMeta'
import { CALC_MODES, REC_MODES } from '../data/sense/meta'
import { useStats, type AreaStat, type StatsGroup } from '../composables/useStats'

const router = useRouter()
const { state, totalCount, correctCount, clearStats } = useStats()

const groups: { id: StatsGroup; title: string; order: string[] }[] = [
  { id: 'direction', title: '辨方向', order: LEVELS.map((l) => `dir:${l.id}`) },
  { id: 'calc', title: '算一算', order: CALC_MODES.map((m) => `calc:${m.id}`) },
  { id: 'rec', title: '认一认', order: REC_MODES.map((m) => `rec:${m.id}`) },
]

function rate(correct: number, total: number) {
  if (!total) return '0%'
  return `${Math.round((correct / total) * 100)}%`
}

function wrongList(area: AreaStat) {
  return Object.entries(area.wrongs).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh'))
}

const sections = computed(() =>
  groups
    .map((g) => {
      const rows = Object.entries(state.areas)
        .filter(([, area]) => area.group === g.id && area.total > 0)
        .sort((a, b) => {
          const ia = g.order.indexOf(a[0])
          const ib = g.order.indexOf(b[0])
          return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib)
        })
      return { ...g, rows }
    })
    .filter((g) => g.rows.length > 0),
)
</script>

<template>
  <div class="page">
    <header class="top">
      <button class="hot back" type="button" aria-label="回地图" @click="router.push('/')">
        <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M30 10 L16 24 L30 38" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </button>
      <h1>答题统计</h1>
    </header>

    <section v-if="totalCount === 0" class="card empty">
      <p>还没有答题</p>
      <p class="lead">玩过辨方向或数感岛之后，这里会记下正确率，以及错题落在哪一关。</p>
    </section>

    <template v-else>
      <section class="card summary">
        <p class="rate">{{ rate(correctCount, totalCount) }}</p>
        <p class="lead">答对 {{ correctCount }} 题，一共 {{ totalCount }} 题</p>
      </section>

      <section v-for="g in sections" :key="g.id" class="group">
        <h2>{{ g.title }}</h2>
        <article v-for="[id, area] in g.rows" :key="id" class="card area">
          <div class="head">
            <h3>{{ area.name }}</h3>
            <b>{{ rate(area.correct, area.total) }}</b>
          </div>
          <p class="lead">对 {{ area.correct }} · 错 {{ area.total - area.correct }}</p>
          <ul v-if="wrongList(area).length" class="wrongs">
            <li v-for="[label, n] in wrongList(area)" :key="label">{{ label }} ×{{ n }}</li>
          </ul>
        </article>
      </section>

      <button class="hot btn-secondary clear" type="button" @click="clearStats">清空记录</button>
    </template>
  </div>
</template>

<style scoped>
.page {
  min-height: 100dvh;
  padding: 12px 16px calc(24px + env(safe-area-inset-bottom));
  background:
    radial-gradient(circle at 12% 16%, rgba(168, 213, 229, 0.55) 0 48px, transparent 49px),
    radial-gradient(circle at 90% 70%, rgba(226, 209, 249, 0.5) 0 56px, transparent 57px),
    var(--bg-cream);
}
.top { display: flex; align-items: center; gap: 12px; }
.back { background: var(--card); box-shadow: var(--shadow); }
.back svg { width: 30px; height: 30px; }
h1 { margin: 0; font-size: 28px; }
h2 { margin: 18px 0 8px; font-size: 20px; }
.card {
  margin-top: 14px;
  background: var(--card);
  border-radius: 28px;
  padding: 18px 16px;
  box-shadow: var(--shadow);
}
.empty p { margin: 0; font-size: 24px; font-weight: 900; text-align: center; }
.summary { text-align: center; }
.rate { margin: 0; font-size: 48px; font-weight: 900; color: var(--accent-strong); }
.lead { margin: 8px 0 0; font-size: 16px; font-weight: 700; line-height: 1.45; color: var(--ink-soft); }
.area { margin-top: 10px; }
.head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
h3 { margin: 0; font-size: 22px; }
.head b { font-size: 22px; }
.wrongs { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0 0; padding: 0; list-style: none; }
.wrongs li {
  background: var(--warn);
  border-radius: 999px;
  padding: 6px 12px;
  font-weight: 800;
}
.clear { width: 100%; margin-top: 18px; }
</style>
