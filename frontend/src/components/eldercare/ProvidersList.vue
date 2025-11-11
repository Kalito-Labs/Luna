<template>
  <div class="providers-list">
    <div class="list-header">
      <h3>Healthcare Providers</h3>
      <button @click="$emit('add-provider')" class="btn btn-sm btn-primary">
        Add Provider
      </button>
    </div>
    
    <div v-if="providers.length === 0" class="empty-state">
      <p>No healthcare providers added yet</p>
    </div>
    
    <div v-else class="providers-grid">
      <div 
        v-for="provider in providers" 
        :key="provider.id" 
        class="provider-card"
        :class="{ preferred: provider.preferred }"
      >
        <div class="provider-header">
          <div class="header-content">
            <h4>{{ provider.name }}</h4>
            <span v-if="provider.preferred" class="preferred-badge">⭐ Preferred</span>
          </div>
          <span v-if="provider.specialty" class="specialty-badge">
            {{ provider.specialty }}
          </span>
        </div>
        
        <div class="provider-details">
          <p v-if="provider.practice_name">
            <strong>Practice:</strong> {{ provider.practice_name }}
          </p>
          <p v-if="provider.phone">
            <strong>Phone:</strong> {{ provider.phone }}
          </p>
          <p v-if="provider.email">
            <strong>Email:</strong> {{ provider.email }}
          </p>
          <p v-if="provider.address">
            <strong>Address:</strong> {{ provider.address }}
          </p>
          <p v-if="provider.notes" class="notes">
            <strong>Notes:</strong> {{ provider.notes }}
          </p>
        </div>
        
        <div class="provider-actions">
          <button @click="$emit('edit-provider', provider)" class="btn btn-xs btn-outline">
            Edit
          </button>
          <button @click="$emit('delete-provider', provider)" class="btn btn-xs btn-danger">
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Provider {
  id: string
  patient_id?: string
  name: string
  specialty?: string
  practice_name?: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  preferred?: number
}

interface Props {
  providers: Provider[]
}

defineProps<Props>()

defineEmits<{
  'add-provider': []
  'edit-provider': [provider: Provider]
  'delete-provider': [provider: Provider]
}>()
</script>

<style scoped>
.providers-list {
  margin-bottom: 40px;
}

@media (max-width: 768px) {
  .providers-list {
    margin-bottom: 30px;
  }
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: var(--border);
}

@media (max-width: 480px) {
  .list-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
}

.list-header h3 {
  margin: 0;
  color: var(--text-heading);
  font-weight: 600;
  font-size: 1.5rem;
}

@media (max-width: 480px) {
  .list-header h3 {
    font-size: 1.25rem;
  }
}

.providers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

@media (max-width: 1200px) {
  .providers-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .providers-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }
}

@media (max-width: 480px) {
  .providers-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}

.provider-card {
  background: var(--bg-glass);
  backdrop-filter: var(--blur);
  border: var(--border);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-soft);
  transition: all 0.2s ease;
}

.provider-card.preferred {
  border-color: rgba(251, 191, 36, 0.3);
  background: linear-gradient(135deg, var(--bg-glass), rgba(251, 191, 36, 0.05));
}

.provider-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-strong);
  border-color: var(--accent-blue);
}

@media (max-width: 768px) {
  .provider-card {
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .provider-card {
    padding: 16px;
  }
}

@media (hover: none) and (pointer: coarse) {
  .provider-card:hover {
    transform: none;
    box-shadow: var(--shadow-soft);
  }
}

.provider-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: var(--border);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  gap: 12px;
  flex-wrap: wrap;
}

.provider-header h4 {
  margin: 0;
  color: var(--text-heading);
  font-weight: 600;
  font-size: 1.1rem;
}

@media (max-width: 480px) {
  .provider-header h4 {
    font-size: 1rem;
  }
}

.preferred-badge {
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: 600;
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
  white-space: nowrap;
}

.specialty-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: rgba(59, 130, 246, 0.15);
  color: var(--accent-blue);
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
  display: inline-block;
  white-space: nowrap;
}

.provider-details {
  margin-bottom: 16px;
}

.provider-details p {
  margin: 8px 0;
  font-size: 0.95rem;
  color: var(--text-muted);
  line-height: 1.5;
}

.provider-details strong {
  color: var(--text-heading);
  margin-right: 8px;
  display: inline-block;
  min-width: 70px;
}

.provider-details .notes {
  margin-top: 12px;
  padding-top: 12px;
  border-top: var(--border);
}

@media (max-width: 480px) {
  .provider-details p {
    font-size: 0.9rem;
  }
  
  .provider-details strong {
    min-width: 60px;
  }
}

.provider-actions {
  display: flex;
  gap: 12px;
  padding-top: 12px;
  border-top: var(--border);
}

@media (max-width: 480px) {
  .provider-actions {
    flex-direction: column;
    gap: 8px;
  }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-muted);
  background: var(--bg-glass);
  backdrop-filter: var(--blur);
  border: var(--border);
  border-radius: 12px;
}

.empty-state p {
  margin: 0;
  font-size: 1rem;
}

@media (max-width: 480px) {
  .empty-state {
    padding: 40px 16px;
  }
}

.btn {
  padding: 10px 18px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.btn-xs {
  padding: 6px 12px;
  font-size: 0.75rem;
}

.btn-sm {
  padding: 8px 16px;
  font-size: 0.875rem;
}

.btn-primary {
  background: var(--accent-blue);
  color: white;
  box-shadow: var(--glow-blue);
}

.btn-primary:hover:not(:disabled) {
  background: var(--blue-600);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
  transform: translateY(-1px);
}

.btn-outline {
  background: transparent;
  color: var(--accent-blue);
  border: 2px solid var(--accent-blue);
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
}

.btn-outline:hover:not(:disabled) {
  background: var(--accent-blue);
  color: white;
  box-shadow: var(--glow-blue);
  transform: translateY(-1px);
}

.btn-danger {
  background: var(--led-red);
  color: white;
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
  box-shadow: 0 4px 8px rgba(239, 68, 68, 0.4);
  transform: translateY(-1px);
}

@media (hover: none) and (pointer: coarse) {
  .btn:hover {
    transform: none !important;
  }
}
</style>
