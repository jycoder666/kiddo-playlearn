<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import SpeakButton from '../../components/shared/SpeakButton.vue'
import { picksForToday, todayLabel } from '../../data/sense/todayPicks'
import { friendOfDay } from '../../data/sense/friendOfDay'
import { useSenseStickers } from '../../composables/useSenseStickers'
import { useSpeech } from '../../composables/useSpeech'

const router = useRouter()
const picks = computed(() => picksForToday(3))
const dayText = computed(() => todayLabel())
const { owned } = useSenseStickers()
const friend = computed(() => friendOfDay(owned))
const { speak } = useSpeech()

const islandSpeak =
  '数感岛。先点今日玩玩，或者选认一认、算一算、比一比、拼图形四条路。'

const hubs = [
  {
    path: '/sense/recognize',
    emo: '🔢',
    name: '认一认',
    tag: '数字 · 颜色 · 翻牌',
    tone: 'mint',
    step: '1',
  },
  {
    path: '/sense/calc',
    emo: '🧮',
    name: '算一算',
    tag: '分合 · 加减 · 口算',
    tone: 'coral',
    step: '2',
  },
  {
    path: '/sense/compare',
    emo: '⚖️',
    name: '比一比',
    tag: '大小 · 长短 · 高低',
    tone: 'sky',
    step: '3',
  },
  {
    path: '/sense/compose',
    emo: '🧩',
    name: '拼图形',
    tag: '图鉴 · 拆 · 拼',
    tone: 'lilac',
    step: '4',
  },
] as const

function greetFriend() {
  speak(`今天的小伙伴是${friend.value.name}`)
  router.push('/stickers')
}
</script>

<template>
  <div class="island">
    <header class="top">
      <button class="hot back" aria-label="回主页" @click="router.push('/')">←</button>
      <h1>数感岛</h1>
      <SpeakButton :text="islandSpeak" />
    </header>
    <p class="lead">玩一玩，把 1～10 认稳、算稳</p>

    <div class="hero-row">
      <button type="button" class="friend" @click="greetFriend">
        <span class="f-emo">{{ friend.emoji }}</span>
        <span class="f-body">
          <span class="f-label">今日小伙伴</span>
          <span class="f-name">{{ friend.name }}</span>
        </span>
      </button>
    </div>

    <section class="today" aria-label="今日推荐">
      <div class="today-top">
        <h2>今日玩玩</h2>
        <span class="day">{{ dayText }}</span>
      </div>
      <p class="today-lead">不知道玩啥？先点这三个</p>
      <div class="picks">
        <button
          v-for="p in picks"
          :key="p.id"
          type="button"
          class="pick"
          @click="router.push(p.path)"
        >
          <span class="p-emo">{{ p.emoji }}</span>
          <span class="p-name">{{ p.name }}</span>
        </button>
      </div>
    </section>

    <section class="hubs" aria-label="四条学习路">
      <h2 class="hub-title">四条路</h2>
      <p class="hub-lead">从认一认开始，再去算、比、拼</p>
      <div class="hub-grid">
        <button
          v-for="h in hubs"
          :key="h.path"
          type="button"
          class="hub"
          :class="h.tone"
          @click="router.push(h.path)"
        >
          <span class="step">{{ h.step }}</span>
          <span class="emo">{{ h.emo }}</span>
          <span class="name">{{ h.name }}</span>
          <span class="tag">{{ h.tag }}</span>
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.island {
  min-height: 100dvh;
  padding: 10px 16px calc(20px + env(safe-area-inset-bottom));
  background:
    radial-gradient(circle at 18% 12%, rgba(184, 224, 210, 0.55) 0 72px, transparent 73px),
    radial-gradient(circle at 88% 28%, rgba(255, 180, 162, 0.42) 0 64px, transparent 65px),
    radial-gradient(circle at 50% 90%, rgba(214, 196, 245, 0.35) 0 80px, transparent 81px),
    var(--bg-cream);
}
.top {
  display: grid;
  grid-template-columns: 72px 1fr 72px;
  align-items: center;
}
h1 { margin: 0; text-align: center; font-size: 28px; font-weight: 900; }
.back { background: var(--card); box-shadow: var(--shadow); font-size: 26px; }
.lead {
  text-align: center;
  font-weight: 800;
  color: var(--ink-soft);
  margin: 6px 0 12px;
  font-size: 14px;
}
.hero-row { margin-bottom: 12px; }
.friend {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 14px;
  border: none;
  border-radius: 20px;
  background: linear-gradient(120deg, #e8fff4, #fff6e8);
  box-shadow: var(--shadow);
  text-align: left;
}
.f-emo { font-size: 36px; }
.f-body { display: flex; flex-direction: column; gap: 2px; }
.f-label { font-size: 12px; font-weight: 800; color: var(--ink-soft); }
.f-name { font-size: 17px; font-weight: 900; }

.today {
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 22px;
  background: linear-gradient(145deg, #fff9e8 0%, #ffe8d6 100%);
  box-shadow: var(--shadow);
}
.today-top {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
}
.today h2 { margin: 0; font-size: 18px; font-weight: 900; }
.day {
  font-size: 12px;
  font-weight: 800;
  color: var(--ink-soft);
  background: rgba(255, 255, 255, 0.7);
  padding: 2px 8px;
  border-radius: 999px;
}
.today-lead {
  margin: 4px 0 10px;
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  color: var(--ink-soft);
}
.picks {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.pick {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 6px;
  border: none;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 3px 0 rgba(92, 75, 81, 0.1);
  min-height: 84px;
}
.p-emo { font-size: 28px; }
.p-name { font-size: 13px; font-weight: 900; text-align: center; }

.hubs { margin-top: 4px; }
.hub-title {
  margin: 0;
  text-align: center;
  font-size: 18px;
  font-weight: 900;
}
.hub-lead {
  margin: 4px 0 12px;
  text-align: center;
  font-size: 13px;
  font-weight: 700;
  color: var(--ink-soft);
}
.hub-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.hub {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 16px 14px 14px;
  border: none;
  border-radius: 22px;
  box-shadow: var(--shadow);
  text-align: left;
  min-height: 120px;
  transition: transform 0.15s ease;
}
.hub:active { transform: scale(0.98); }
.hub.mint { background: linear-gradient(155deg, #fff 35%, #d9f3e9); }
.hub.coral { background: linear-gradient(155deg, #fff 35%, #ffe4dc); }
.hub.sky { background: linear-gradient(155deg, #fff 35%, #d9eef7); }
.hub.lilac { background: linear-gradient(155deg, #fff 35%, #ebe0f5); }
.step {
  position: absolute;
  top: 10px;
  right: 12px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(92, 75, 81, 0.12);
  font-size: 12px;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ink);
}
.emo { font-size: 34px; line-height: 1; }
.name { font-size: 22px; font-weight: 900; margin-top: 4px; }
.tag { font-size: 12px; font-weight: 700; color: var(--ink-soft); }
</style>
