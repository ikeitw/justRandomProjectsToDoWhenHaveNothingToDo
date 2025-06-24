import { createRouter, createWebHistory } from 'vue-router'
import EnsemblesView from '../views/EnsemblesView.vue'
import RecordsView from '../views/RecordsView.vue'
import MusiciansView from '../views/MusiciansView.vue'
import CompositionsView from '../views/CompositionsView.vue'

const routes = [
  { path: '/', redirect: '/ensembles' },
  { path: '/ensembles', component: EnsemblesView },
  { path: '/records', component: RecordsView },
  { path: '/musicians', component: MusiciansView },
  { path: '/compositions', component: CompositionsView }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
