import { createRouter, createWebHashHistory } from 'vue-router'
import MapHome from './views/MapHome.vue'
import { getLevelMeta } from './data/levelMeta'
import { useProgress } from './composables/useProgress'
import { CALC_MODES, REC_MODES } from './data/sense/meta'
import { useSenseProgress } from './composables/useSenseProgress'

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
      component: () => import('./views/sense/RecPlay.vue'),
      beforeEnter: (to) => {
        const mode = String(to.params.mode)
        if (!REC_MODES.some((m) => m.id === mode)) return '/sense/recognize'
        if (!useSenseProgress().isRecUnlocked(mode as never)) return '/sense/recognize'
      },
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})
