import { createRouter, createWebHashHistory } from 'vue-router'
import MapHome from './views/MapHome.vue'
import { getLevelMeta } from './data/levelMeta'
import { useProgress } from './composables/useProgress'
import { ATTR_MODES, CALC_MODES, CMP_MODES, COMPOSE_MODES, REC_MODES } from './data/sense/meta'
import { useSenseProgress } from './composables/useSenseProgress'
import { isAntiDebug, isAntiLocked } from './composables/useAntiAddiction'
import { isWrongLocked } from './composables/useWrongRest'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: MapHome },
    {
      path: '/level/:id',
      component: () => import('./views/LevelPlay.vue'),
      beforeEnter: (to) => {
        const id = Number(to.params.id)
        if (!getLevelMeta(id) || !useProgress().isUnlocked(id)) return '/'
      },
    },
    { path: '/stickers', component: () => import('./views/Stickers.vue') },
    { path: '/settings', component: () => import('./views/Settings.vue') },
    { path: '/stats', component: () => import('./views/Stats.vue') },
    { path: '/sense', component: () => import('./views/sense/SenseIsland.vue') },
    { path: '/sense/calc', component: () => import('./views/sense/CalcMap.vue') },
    {
      path: '/sense/calc/:mode',
      component: () => import('./views/sense/CalcPlay.vue'),
      beforeEnter: (to) => {
        const mode = String(to.params.mode)
        if (!CALC_MODES.some((m) => m.id === mode)) return '/sense/calc'
        if (!useSenseProgress().isCalcUnlocked(mode as never)) return '/sense/calc'
      },
    },
    { path: '/sense/recognize', component: () => import('./views/sense/RecMap.vue') },
    {
      path: '/sense/recognize/:mode',
      component: () => import('./views/sense/RecognizePlay.vue'),
      beforeEnter: (to) => {
        const mode = String(to.params.mode)
        const progress = useSenseProgress()
        if (ATTR_MODES.some((m) => m.id === mode)) {
          if (!progress.isAttrUnlocked(mode as never)) return '/sense/recognize'
          return
        }
        if (!REC_MODES.some((m) => m.id === mode)) return '/sense/recognize'
        if (!progress.isRecUnlocked(mode as never)) return '/sense/recognize'
      },
    },
    { path: '/sense/compare', component: () => import('./views/sense/CmpMap.vue') },
    {
      path: '/sense/compare/:mode',
      component: () => import('./views/sense/CmpPlay.vue'),
      beforeEnter: (to) => {
        const mode = String(to.params.mode)
        if (!CMP_MODES.some((m) => m.id === mode)) return '/sense/compare'
        if (!useSenseProgress().isCmpUnlocked(mode as never)) return '/sense/compare'
      },
    },
    { path: '/sense/compose', component: () => import('./views/sense/ComposeMap.vue') },
    {
      path: '/sense/compose/:mode',
      component: () => import('./views/sense/ComposePlay.vue'),
      beforeEnter: (to) => {
        const mode = String(to.params.mode)
        if (!COMPOSE_MODES.some((m) => m.id === mode)) return '/sense/compose'
        if (!useSenseProgress().isComposeUnlocked(mode as never)) return '/sense/compose'
      },
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  if (!isAntiLocked() && !isWrongLocked()) return
  if (to.path === '/') return
  if (isAntiDebug && to.path === '/settings') return
  return '/'
})
