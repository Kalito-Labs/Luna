import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ChatWorkspace from '../components/chat/ChatWorkspace.vue'
import PersonaManager from '../components/personas/PersonaManager.vue'
import KalitoHub from '../views/KalitoHub.vue'
import JournalView from '../views/JournalView.vue'
import JournalEntryView from '../views/JournalEntryView.vue'
import JournalCalendarView from '../views/JournalCalendarView.vue'
import LibraryView from '../views/LibraryView.vue'
import CBTView from '../views/CBTView.vue'
import SelfContextView from '../views/SelfContextView.vue'
import DBTView from '../views/DBTView.vue'
import ResourcesView from '../views/ResourcesView.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/kalito', name: 'chat', component: ChatWorkspace },
  { path: '/personas', name: 'personas', component: PersonaManager },
  { path: '/library', name: 'library', component: LibraryView },
  { path: '/resources', name: 'resources', component: ResourcesView },
  { path: '/cbt', name: 'cbt', component: CBTView },
  { path: '/self-context', name: 'self-context', component: SelfContextView },
  { path: '/dbt', name: 'dbt', component: DBTView },
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
