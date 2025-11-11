import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ChatWorkspace from '../components/chat/ChatWorkspace.vue'
import PersonaManager from '../components/personas/PersonaManager.vue'
import KalitoHub from '../views/KalitoHub.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/kalito', name: 'chat', component: ChatWorkspace },
  { path: '/personas', name: 'personas', component: PersonaManager },
  { path: '/family-hub', name: 'family-hub', component: KalitoHub },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
