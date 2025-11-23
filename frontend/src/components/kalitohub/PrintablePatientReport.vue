
<template>
  <div class="printable-report" ref="printableContent">
      <h2 class="section-title">Patient Information</h2>
      <div class="patient-details">
        <div class="detail-row">
          <div class="detail-item">
            <label>Name:</label>
            <span>{{ patient.name }}</span>
          </div>
          <div class="detail-item" v-if="patient.date_of_birth">
            <label>Age:</label>
            <span>{{ calculateAge(patient.date_of_birth) }} years old (DOB: {{ formatDate(patient.date_of_birth) }})</span>
          </div>
        </div>
        
        <div class="detail-row">
          <div class="detail-item" v-if="patient.gender">
            <label>Gender:</label>
            <span>{{ patient.gender }}</span>
          </div>
          <div class="detail-item" v-if="patient.phone">
            <label>Phone:</label>
            <span>{{ patient.phone }}</span>
          </div>
        </div>

        <div class="detail-row">
          <div class="detail-item" v-if="patient.city || patient.state">
            <label>Location:</label>
            <span>{{ [patient.city, patient.state].filter(Boolean).join(', ') }}</span>
          </div>
          <div class="detail-item" v-if="patient.occupation">
            <label>Occupation:</label>
            <span>{{ patient.occupation }}</span>
          </div>
        </div>

        <div class="detail-row">
          <div class="detail-item" v-if="patient.languages">
            <label>Languages:</label>
            <span>{{ patient.languages }}</span>
          </div>
          <div class="detail-item" v-if="primaryDoctorName">
            <label>Primary Doctor:</label>
            <span>{{ primaryDoctorName }}</span>
          </div>
        </div>

        <div v-if="patient.occupation_description" class="occupation-section">
          <label>Occupation Details:</label>
          <p class="occupation-text">{{ patient.occupation_description }}</p>
        </div>

        <div v-if="patient.notes" class="notes-section">
          <label>Additional Notes:</label>
          <p class="notes-text">{{ patient.notes }}</p>
        </div>
      </div>

    <!-- Medications Section -->
    <div v-if="medications.length > 0" class="medications-section">
      <h2 class="section-title">Current Medications ({{ medications.length }})</h2>
      <table class="medications-table">
        <thead>
          <tr>
            <th>Medication</th>
            <th>Dosage</th>
            <th>Frequency</th>
            <th>Prescriber</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="medication in medications" :key="medication.id">
            <td><strong>{{ medication.name }}</strong></td>
            <td>{{ medication.dosage }}</td>
            <td>{{ medication.frequency }}</td>
            <td>{{ medication.prescribing_doctor || 'N/A' }}</td>
          </tr>
        </tbody>
      </table>
      <div v-for="medication in medications.filter(m => m.notes)" :key="'notes-' + medication.id" class="med-notes">
        <strong>{{ medication.name }} - Notes:</strong> {{ medication.notes }}
      </div>
    </div>

    <!-- Print Footer -->
    <div class="print-footer">
      <p>This report was generated on {{ formattedDate }} from the Luna Management System.</p>
      <p class="disclaimer">This information is confidential and intended for medical use only.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Patient {
  id: string
  name: string
  date_of_birth?: string
  gender?: string
  phone?: string
  city?: string
  state?: string
  occupation?: string
  occupation_description?: string
  languages?: string
  notes?: string
  active?: number
  created_at?: string
  updated_at?: string
  primary_doctor_id?: string
}

interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  prescribing_doctor?: string
  start_date?: string
  refills_remaining?: number
  notes?: string
  patient_id?: string
  patient_name?: string
}

interface Props {
  patient: Patient
  medications: Medication[]
}

const props = defineProps<Props>()

const formattedDate = computed(() => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

const primaryDoctorName = computed(() => {
  return null
})

function calculateAge(dateOfBirth: string): number {
  if (!dateOfBirth) return 0
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  
  return age
}

function formatDate(dateString: string): string {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function formatTime(timeString: string): string {
  if (!timeString) return ''
  const [hours, minutes] = timeString.split(':')
  if (!hours || !minutes) return timeString
  const date = new Date()
  date.setHours(parseInt(hours), parseInt(minutes))
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}

function printReport() {
  window.print()
}

defineExpose({
  printReport
})
</script>

<style scoped>
/* Screen - hide completely */
.printable-report {
  display: none !important;
  position: absolute !important;
  left: -9999px !important;
  top: -9999px !important;
  width: 0 !important;
  height: 0 !important;
  overflow: hidden !important;
  visibility: hidden !important;
  opacity: 0 !important;
}

/* Print - table-based list layout */
@media print {
  @page {
    size: letter;
    margin: 0;
  }

  .printable-report {
    position: static !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    height: auto !important;
    overflow: visible !important;
    visibility: visible !important;
    opacity: 1 !important;
    display: block !important;
    width: 100%;
    margin: 0 !important;
    padding: 0.25in 0.5in 0.5in 0.5in !important;
    font-family: Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.3;
    color: #000;
    background: #fff;
  }

  .section-title {
    display: block;
    margin: 0 0 10pt 0 !important;
    padding: 0 0 5pt 0 !important;
    font-size: 14pt;
    font-weight: bold;
    border-bottom: 1px solid #333;
  }
  
  /* First section title gets no top margin at all */
  .printable-report > .section-title:first-child {
    margin-top: 0 !important;
    padding-top: 0 !important;
  }

  /* Patient Details - Simple Grid */
  .patient-details {
    line-height: 1.6;
  }

  .detail-row {
    margin-bottom: 8pt;
  }

  .detail-row::after {
    content: "";
    display: table;
    clear: both;
  }

  .detail-item {
    float: left;
    width: 48%;
    margin-right: 2%;
  }

  .detail-item:nth-child(2n) {
    margin-right: 0;
  }

  .detail-item label {
    font-weight: bold;
    margin-right: 5pt;
  }

  .notes-section {
    clear: both;
    margin-top: 10pt;
    padding-top: 10pt;
    border-top: 1px solid #ccc;
  }

  .notes-section label {
    font-weight: bold;
    display: block;
    margin-bottom: 5pt;
  }

  .notes-text {
    margin: 0;
    line-height: 1.5;
  }

  .occupation-section {
    clear: both;
    margin-top: 10pt;
    padding-top: 10pt;
    border-top: 1px solid #ccc;
  }

  .occupation-section label {
    font-weight: bold;
    display: block;
    margin-bottom: 5pt;
  }

  .occupation-text {
    margin: 0;
    line-height: 1.5;
  }

  /* Tables for Medications */
  .medications-table,
  .appointments-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 10pt;
  }

  .medications-table th,
  .medications-table td,
  .appointments-table th,
  .appointments-table td {
    border: 1px solid #333;
    padding: 5pt 8pt;
    text-align: left;
    font-size: 10pt;
  }

  .medications-table th,
  .appointments-table th {
    background: #f0f0f0;
    font-weight: bold;
    font-size: 10pt;
  }

  .medications-table tbody tr,
  .appointments-table tbody tr {
    page-break-inside: avoid;
  }

  .status-cell {
    font-weight: bold;
  }

  /* Notes below tables */
  .med-notes,
  .appt-notes {
    margin: 8pt 0;
    padding: 5pt 10pt;
    background: #f9f9f9;
    border-left: 3px solid #666;
    font-size: 10pt;
    line-height: 1.4;
    page-break-inside: avoid;
  }

  .med-notes strong {
    display: block;
    margin-bottom: 3pt;
  }

  /* Footer */
  .print-footer {
    margin-top: 30pt;
    padding-top: 10pt;
    border-top: 1px solid #333;
    text-align: center;
    font-size: 9pt;
    color: #666;
  }

  .print-footer p {
    margin: 3pt 0;
  }

  .disclaimer {
    font-style: italic;
    font-size: 8pt;
  }
}
</style>