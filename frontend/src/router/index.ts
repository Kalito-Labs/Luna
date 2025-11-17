import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ChatWorkspace from '../components/chat/ChatWorkspace.vue'
import PersonaManager from '../components/personas/PersonaManager.vue'
import KalitoHub from '../views/KalitoHub.vue'
import JournalView from '../views/JournalView.vue'
import JournalEntryView from '../views/JournalEntryView.vue'
import JournalCalendarView from '../views/JournalCalendarView.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/kalito', name: 'chat', component: ChatWorkspace },
  { path: '/personas', name: 'personas', component: PersonaManager },
  { path: '/kalito-hub', name: 'kalito-hub', component: KalitoHub },
  { path: '/journal', name: 'journal', component: JournalView },
  { path: '/journal/new', name: 'journal-new', component: JournalEntryView },
  { path: '/journal/:id/edit', name: 'journal-edit', component: JournalEntryView },
  { path: '/journal/calendar', name: 'journal-calendar', component: JournalCalendarView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
