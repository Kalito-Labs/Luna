### Family Care Dashboard

A family care coordination system to manage Mom and Dads Health.

**Patients** (`patients` table):

- Complete patient profiles (name, DOB, relationship, gender)
- Emergency contacts and contact information
- Primary doctor and doctor contact details
- Insurance information (provider, ID number)
- Medical history notes
- Active/inactive status for patient management
- Calculated age from date of birth

**Medications** (`medications` table):

- Medication tracking per patient
- Drug name (brand and generic)
- Dosage, frequency, and route of administration
- Prescribing doctor and pharmacy information
- RX number tracking
- Side effects documentation
- Active/inactive status
- Patient relationship linking

**Appointments** (`appointments` table):

- Healthcare appointment scheduling
- Date, time, and location tracking
- Appointment type categorization (routine, follow-up, specialist, emergency)
- Healthcare provider linking
- Preparation notes (what to bring, special instructions)
- Status tracking (scheduled, completed, cancelled, rescheduled)
- Post-appointment outcome summaries
- Follow-up requirement flags

**Healthcare Providers** (`healthcare_providers` table):

- Provider contact directory
- Name, specialty, and practice information
- Phone, email, and physical address
- Provider notes and preferences
- Preferred provider designation
- Linked to appointments and medications

**Caregivers** (`caregivers` table):

- Professional caregiver management
- Contact information and emergency contacts
- Relationship and specialty tracking
- Certifications and qualifications
- Availability scheduling (weekly schedule)
- Clock in/out time tracking
- Total hours worked calculation
- Hourly rate tracking
- Active/inactive status
- Last clock in/out timestamps

**Medical Records** (`medical_records` table):

- Comprehensive medical record keeping
- Record types: diagnosis, treatment, test results, incidents, notes
- Date-stamped entries
- Provider and location information
- Importance scoring for prioritization
- Tag system for categorization (JSON)
- Attachment support for documents (JSON)
- Patient relationship linking

**Vitals** (`vitals` table):

- Health metrics tracking per patient
- Weight tracking (kg)
- Blood glucose monitoring (AM and PM readings)
- Date-stamped vital sign entries
- Notes for context and observations
- Active/inactive status
- Patient relationship linking

**UI Components:**

- `KalitoHub.vue`: Main dashboard with 6-section quick actions
- `PatientForm.vue`, `MedicationForm.vue`, `AppointmentForm.vue`: Data entry
- `PatientDetailModal.vue`: Comprehensive patient view with all related data and print functionality
- `PrintablePatientReport.vue`: Professional print-optimized patient reports (hidden on screen, visible only when printing)
- `MedicationsList.vue`, `AppointmentsList.vue`: Organized data views
- `CaregiverProfile.vue`: Professional caregiver management interface

**Print Functionality:**

- **Professional PDF Generation**: One-click printing of comprehensive patient reports
- **Clean Document Layout**: Industry-standard medical report format with proper spacing
- **Includes**: Patient demographics, current medications with dosages, upcoming appointments, emergency contacts
- **Privacy-Focused**: No application UI visible in printed output - pure document view
- **Print Architecture**:
  - Visibility-based approach hides entire application during print
  - `@page { margin: 0; }` for precise spacing control
  - Controlled padding (0.25in top, 0.5in sides) for professional appearance
  - Complete style isolation between screen and print layouts

  