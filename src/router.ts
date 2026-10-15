import { createRouter, createWebHashHistory } from 'vue-router'
import MapHome from './views/MapHome.vue'
import { getLevelMeta } from './data/levelMeta'
import { useProgress } from './composables/useProgress'

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
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})
