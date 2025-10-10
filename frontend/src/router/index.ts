import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ChatWorkspace from '../components/chat/ChatWorkspace.vue'
import PersonaManager from '../components/personas/PersonaManager.vue'
import EldercareDashboard from '../views/EldercareDashboard.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/kalito', name: 'chat', component: ChatWorkspace },
  { path: '/personas', name: 'personas', component: PersonaManager },
  { path: '/eldercare', name: 'eldercare', component: EldercareDashboard },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
