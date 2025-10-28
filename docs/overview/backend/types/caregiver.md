# Caregiver Types Documentation

## Overview

The `caregiver.ts` file defines TypeScript interfaces for managing **caregiver profiles**, **weekly schedules**, and **clock in/out tracking** in the eldercare system. These types support complete caregiver management including availability scheduling, specialty certifications, and time tracking.

**Location**: `/backend/types/caregiver.ts`

**Purpose**:
- Manage caregiver profile information
- Track weekly availability schedules
- Monitor clock in/out status for shifts
- Store certifications and specialties
- Support caregiver-patient matching

**Key Capabilities**:
- 7-day weekly availability schedules
- Real-time clock in/out tracking
- Specialty and certification management
- Hourly rate tracking
- Availability status management
- Emergency contact information

---

## Core Types

### CaregiverScheduleDay

```typescript
export interface CaregiverScheduleDay {
  start: string;   // "09:00"
  end: string;     // "17:00"
  available: boolean;
}
```

**Purpose**: Represents a single day's availability window for a caregiver.

#### Properties

##### `start: string`
- **Format**: 24-hour time string `"HH:MM"`
- **Description**: Start time of availability window
- **Example**: `"09:00"` (9:00 AM)
- **Validation**: Must be valid 24-hour time format

##### `end: string`
- **Format**: 24-hour time string `"HH:MM"`
- **Description**: End time of availability window
- **Example**: `"17:00"` (5:00 PM)
- **Validation**: Must be valid 24-hour time format, should be after `start`

##### `available: boolean`
- **Description**: Whether caregiver is available on this day
- **Example**: `true` (available), `false` (day off)
- **Usage**: If `false`, `start` and `end` times are ignored

#### Example

```typescript
// Caregiver available Monday 9 AM - 5 PM
const mondaySchedule: CaregiverScheduleDay = {
  start: "09:00",
  end: "17:00",
  available: true
};

// Caregiver not available on Sunday (day off)
const sundaySchedule: CaregiverScheduleDay = {
  start: "00:00",
  end: "00:00",
  available: false
};
```

---

### CaregiverSchedule

```typescript
export interface CaregiverSchedule {
  monday: CaregiverScheduleDay;
  tuesday: CaregiverScheduleDay;
  wednesday: CaregiverScheduleDay;
  thursday: CaregiverScheduleDay;
  friday: CaregiverScheduleDay;
  saturday: CaregiverScheduleDay;
  sunday: CaregiverScheduleDay;
}
```

**Purpose**: Complete 7-day weekly availability schedule for a caregiver.

**Storage**: Stored as JSON in the database `availability_schedule` column.

#### Example

```typescript
// Full-time caregiver, Monday-Friday 8 AM - 6 PM
const fullTimeSchedule: CaregiverSchedule = {
  monday: { start: "08:00", end: "18:00", available: true },
  tuesday: { start: "08:00", end: "18:00", available: true },
  wednesday: { start: "08:00", end: "18:00", available: true },
  thursday: { start: "08:00", end: "18:00", available: true },
  friday: { start: "08:00", end: "18:00", available: true },
  saturday: { start: "00:00", end: "00:00", available: false },
  sunday: { start: "00:00", end: "00:00", available: false }
};

// Part-time caregiver, flexible hours
const partTimeSchedule: CaregiverSchedule = {
  monday: { start: "09:00", end: "13:00", available: true },
  tuesday: { start: "00:00", end: "00:00", available: false },
  wednesday: { start: "09:00", end: "13:00", available: true },
  thursday: { start: "00:00", end: "00:00", available: false },
  friday: { start: "09:00", end: "13:00", available: true },
  saturday: { start: "10:00", end: "14:00", available: true },
  sunday: { start: "00:00", end: "00:00", available: false }
};
```

#### Availability Checking

```typescript
function isAvailableOn(
  schedule: CaregiverSchedule, 
  dayOfWeek: string
): boolean {
  const day = dayOfWeek.toLowerCase() as keyof CaregiverSchedule;
  return schedule[day]?.available || false;
}

function getAvailableHours(
  schedule: CaregiverSchedule, 
  dayOfWeek: string
): { start: string; end: string } | null {
  const day = dayOfWeek.toLowerCase() as keyof CaregiverSchedule;
  const daySchedule = schedule[day];
  
  if (!daySchedule || !daySchedule.available) {
    return null;
  }
  
  return {
    start: daySchedule.start,
    end: daySchedule.end
  };
}

// Usage
const hours = getAvailableHours(fullTimeSchedule, 'monday');
console.log(hours); // { start: "08:00", end: "18:00" }
```

---

### CaregiverClockStatus

```typescript
export interface CaregiverClockStatus {
  clockedIn: boolean;
  clockInTime?: string;  // ISO 8601 timestamp
  clockOutTime?: string; // ISO 8601 timestamp
}
```

**Purpose**: Tracks real-time clock in/out status for active caregiver shifts.

#### Properties

##### `clockedIn: boolean`
- **Description**: Whether caregiver is currently clocked in
- **Example**: `true` (on shift), `false` (off shift)

##### `clockInTime?: string`
- **Format**: ISO 8601 timestamp string
- **Description**: When caregiver clocked in for current/last shift
- **Example**: `"2024-01-15T08:00:00.000Z"`
- **Nullability**: `undefined` if never clocked in

##### `clockOutTime?: string`
- **Format**: ISO 8601 timestamp string
- **Description**: When caregiver clocked out from last shift
- **Example**: `"2024-01-15T17:00:00.000Z"`
- **Nullability**: `undefined` if currently clocked in or never clocked in

#### States

| `clockedIn` | `clockInTime` | `clockOutTime` | Meaning |
|-------------|---------------|----------------|---------|
| `false` | `undefined` | `undefined` | Never clocked in |
| `true` | `"2024-..."` | `undefined` | Currently on shift |
| `false` | `"2024-..."` | `"2024-..."` | Shift completed |

#### Example

```typescript
// Caregiver currently on shift
const onShift: CaregiverClockStatus = {
  clockedIn: true,
  clockInTime: "2024-01-15T08:00:00.000Z",
  clockOutTime: undefined
};

// Caregiver off shift (last completed)
const offShift: CaregiverClockStatus = {
  clockedIn: false,
  clockInTime: "2024-01-15T08:00:00.000Z",
  clockOutTime: "2024-01-15T17:00:00.000Z"
};

// Calculate shift duration
function getShiftDuration(status: CaregiverClockStatus): number | null {
  if (!status.clockInTime || !status.clockOutTime) {
    return null; // Shift still active or no shift data
  }
  
  const clockIn = new Date(status.clockInTime);
  const clockOut = new Date(status.clockOutTime);
  
  return (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60); // hours
}

const hours = getShiftDuration(offShift);
console.log(`Shift duration: ${hours} hours`); // "Shift duration: 9 hours"
```

---

### Caregiver

```typescript
export interface Caregiver {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  specialties: string[];  // ["dementia", "mobility", "medication"]
  certifications: string[]; // ["CNA", "CPR", "First Aid"]
  hourly_rate: number;
  availability_status: 'available' | 'busy' | 'off';
  availability_schedule: CaregiverSchedule;
  years_of_experience: number;
  bio?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  date_of_birth?: string;
  hire_date?: string;
  termination_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  clock_status?: CaregiverClockStatus;
}
```

**Purpose**: Complete caregiver profile with all personal, professional, and availability information.

#### Required Properties

##### `id: string`
- **Description**: Unique caregiver identifier
- **Format**: UUID or database-generated ID
- **Example**: `"cgv_abc123xyz789"`

##### `first_name: string`
- **Description**: Caregiver's first name
- **Example**: `"Maria"`

##### `last_name: string`
- **Description**: Caregiver's last name
- **Example**: `"Rodriguez"`

##### `phone: string`
- **Description**: Primary contact phone number
- **Format**: Any string (validation should be applied)
- **Example**: `"555-123-4567"`

##### `email: string`
- **Description**: Email address for communications
- **Example**: `"maria.rodriguez@example.com"`

##### `specialties: string[]`
- **Description**: Areas of care expertise
- **Stored As**: JSON array in database
- **Examples**: 
  - `["dementia care", "mobility assistance"]`
  - `["alzheimer's", "parkinson's", "medication management"]`
- **Usage**: Matching caregivers to patient needs

##### `certifications: string[]`
- **Description**: Professional certifications held
- **Stored As**: JSON array in database
- **Examples**:
  - `["CNA", "CPR", "First Aid"]`
  - `["Home Health Aide", "Dementia Care Specialist"]`

##### `hourly_rate: number`
- **Description**: Billing rate per hour
- **Format**: Decimal number (USD)
- **Example**: `25.50` ($25.50/hour)

##### `availability_status: 'available' | 'busy' | 'off'`
- **Description**: Current real-time availability status
- **Values**:
  - `'available'`: Ready for new assignments
  - `'busy'`: Currently assigned to patients
  - `'off'`: Not available (vacation, sick leave, etc.)
- **Example**: `'available'`

##### `availability_schedule: CaregiverSchedule`
- **Description**: 7-day weekly availability schedule
- **Stored As**: JSON object in database
- **Example**: See `CaregiverSchedule` section above

##### `years_of_experience: number`
- **Description**: Total years in caregiving profession
- **Example**: `5` (5 years)

##### `created_at: string`
- **Format**: ISO 8601 timestamp
- **Description**: When profile was created
- **Example**: `"2024-01-10T14:30:00.000Z"`

##### `updated_at: string`
- **Format**: ISO 8601 timestamp
- **Description**: When profile was last modified
- **Example**: `"2024-01-15T10:20:00.000Z"`

#### Optional Properties

##### `bio?: string`
- **Description**: Caregiver's professional biography
- **Example**: `"Compassionate caregiver with 10+ years specializing in dementia care..."`

##### `emergency_contact_name?: string`
- **Description**: Emergency contact person's name
- **Example**: `"John Rodriguez"`

##### `emergency_contact_phone?: string`
- **Description**: Emergency contact phone number
- **Example**: `"555-987-6543"`

##### `address?: string`, `city?: string`, `state?: string`, `zip_code?: string`
- **Description**: Caregiver's home address components
- **Example**: 
  ```typescript
  {
    address: "123 Main St",
    city: "Springfield",
    state: "IL",
    zip_code: "62701"
  }
  ```

##### `date_of_birth?: string`
- **Format**: ISO 8601 date string
- **Description**: Caregiver's birthdate
- **Example**: `"1985-05-15"`

##### `hire_date?: string`
- **Format**: ISO 8601 date string
- **Description**: When caregiver was hired
- **Example**: `"2020-03-01"`

##### `termination_date?: string`
- **Format**: ISO 8601 date string
- **Description**: When employment ended (if applicable)
- **Example**: `"2024-12-31"`

##### `notes?: string`
- **Description**: Internal notes about caregiver
- **Example**: `"Prefers morning shifts. Excellent with Alzheimer's patients."`

##### `clock_status?: CaregiverClockStatus`
- **Description**: Real-time clock in/out status
- **Example**: 
  ```typescript
  {
    clockedIn: true,
    clockInTime: "2024-01-15T08:00:00.000Z"
  }
  ```

#### Complete Example

```typescript
const caregiver: Caregiver = {
  id: "cgv_12345",
  first_name: "Maria",
  last_name: "Rodriguez",
  phone: "555-123-4567",
  email: "maria.rodriguez@eldercare.com",
  specialties: ["dementia care", "mobility assistance", "medication management"],
  certifications: ["CNA", "CPR", "First Aid", "Dementia Care Specialist"],
  hourly_rate: 28.50,
  availability_status: 'available',
  availability_schedule: {
    monday: { start: "08:00", end: "18:00", available: true },
    tuesday: { start: "08:00", end: "18:00", available: true },
    wednesday: { start: "08:00", end: "18:00", available: true },
    thursday: { start: "08:00", end: "18:00", available: true },
    friday: { start: "08:00", end: "18:00", available: true },
    saturday: { start: "09:00", end: "14:00", available: true },
    sunday: { start: "00:00", end: "00:00", available: false }
  },
  years_of_experience: 10,
  bio: "Compassionate caregiver with over 10 years of experience specializing in dementia and Alzheimer's care. Certified Nursing Assistant with advanced training in cognitive disorders.",
  emergency_contact_name: "John Rodriguez",
  emergency_contact_phone: "555-987-6543",
  address: "456 Oak Street",
  city: "Springfield",
  state: "IL",
  zip_code: "62704",
  date_of_birth: "1985-05-15",
  hire_date: "2020-01-15",
  notes: "Excellent with patients in advanced dementia stages. Fluent in Spanish.",
  created_at: "2020-01-15T10:00:00.000Z",
  updated_at: "2024-01-10T14:30:00.000Z",
  clock_status: {
    clockedIn: false,
    clockInTime: "2024-01-09T08:00:00.000Z",
    clockOutTime: "2024-01-09T17:00:00.000Z"
  }
};
```

---

### CaregiverDbRow

```typescript
export interface CaregiverDbRow {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  specialties: string;  // JSON string: '["dementia","mobility"]'
  certifications: string; // JSON string: '["CNA","CPR"]'
  hourly_rate: number;
  availability_status: 'available' | 'busy' | 'off';
  availability_schedule: string; // JSON string: CaregiverSchedule
  years_of_experience: number;
  bio?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  date_of_birth?: string;
  hire_date?: string;
  termination_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}
```

**Purpose**: Database representation of caregiver with JSON fields serialized to strings.

**Key Differences from `Caregiver`**:
- `specialties`: `string[]` → `string` (JSON serialized)
- `certifications`: `string[]` → `string` (JSON serialized)
- `availability_schedule`: `CaregiverSchedule` → `string` (JSON serialized)
- No `clock_status` field (stored separately or computed on-demand)

#### Database Schema

```sql
CREATE TABLE caregivers (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  specialties TEXT NOT NULL,  -- JSON: ["dementia", "mobility"]
  certifications TEXT NOT NULL,  -- JSON: ["CNA", "CPR"]
  hourly_rate REAL NOT NULL,
  availability_status TEXT NOT NULL CHECK (availability_status IN ('available', 'busy', 'off')),
  availability_schedule TEXT NOT NULL,  -- JSON: CaregiverSchedule object
  years_of_experience INTEGER NOT NULL,
  bio TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  date_of_birth TEXT,  -- ISO date
  hire_date TEXT,  -- ISO date
  termination_date TEXT,  -- ISO date
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_caregivers_availability ON caregivers(availability_status);
CREATE INDEX idx_caregivers_email ON caregivers(email);
```

#### Conversion Functions

```typescript
// Database row → Caregiver object
function dbRowToCaregiver(row: CaregiverDbRow): Caregiver {
  return {
    ...row,
    specialties: JSON.parse(row.specialties),
    certifications: JSON.parse(row.certifications),
    availability_schedule: JSON.parse(row.availability_schedule)
  };
}

// Caregiver object → Database row
function caregiverToDbRow(caregiver: Caregiver): Omit<CaregiverDbRow, 'clock_status'> {
  const { clock_status, ...rest } = caregiver;
  return {
    ...rest,
    specialties: JSON.stringify(caregiver.specialties),
    certifications: JSON.stringify(caregiver.certifications),
    availability_schedule: JSON.stringify(caregiver.availability_schedule)
  };
}
```

---

### CreateCaregiverRequest

```typescript
export interface CreateCaregiverRequest {
  id: string;  // Frontend provides ID
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  specialties: string[];
  certifications: string[];
  hourly_rate: number;
  availability_status: 'available' | 'busy' | 'off';
  availability_schedule: CaregiverSchedule;
  years_of_experience: number;
  bio?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  date_of_birth?: string;
  hire_date?: string;
  notes?: string;
}
```

**Purpose**: Request body for `POST /api/caregivers` to create new caregiver.

**Note**: Frontend provides `id` (typically generated client-side as UUID).

#### Example

```typescript
const createRequest: CreateCaregiverRequest = {
  id: crypto.randomUUID(),
  first_name: "Sarah",
  last_name: "Johnson",
  phone: "555-234-5678",
  email: "sarah.johnson@eldercare.com",
  specialties: ["alzheimer's", "medication management"],
  certifications: ["RN", "CPR", "Alzheimer's Care"],
  hourly_rate: 32.00,
  availability_status: 'available',
  availability_schedule: {
    monday: { start: "09:00", end: "17:00", available: true },
    tuesday: { start: "09:00", end: "17:00", available: true },
    wednesday: { start: "09:00", end: "17:00", available: true },
    thursday: { start: "09:00", end: "17:00", available: true },
    friday: { start: "09:00", end: "17:00", available: true },
    saturday: { start: "00:00", end: "00:00", available: false },
    sunday: { start: "00:00", end: "00:00", available: false }
  },
  years_of_experience: 8,
  bio: "Registered Nurse with extensive Alzheimer's care experience.",
  hire_date: "2024-01-15"
};

const response = await fetch('/api/caregivers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(createRequest)
});
```

---

### UpdateCaregiverRequest

```typescript
export interface UpdateCaregiverRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  specialties?: string[];
  certifications?: string[];
  hourly_rate?: number;
  availability_status?: 'available' | 'busy' | 'off';
  availability_schedule?: CaregiverSchedule;
  years_of_experience?: number;
  bio?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  date_of_birth?: string;
  hire_date?: string;
  termination_date?: string;
  notes?: string;
}
```

**Purpose**: Request body for `PUT /api/caregivers/:id` to update existing caregiver.

**Note**: All fields are optional (sparse update pattern). Only send fields that changed.

#### Example

```typescript
// Update availability status only
const updateRequest: UpdateCaregiverRequest = {
  availability_status: 'busy'
};

await fetch(`/api/caregivers/${caregiverId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(updateRequest)
});

// Update schedule and hourly rate
const scheduleUpdate: UpdateCaregiverRequest = {
  hourly_rate: 30.00,
  availability_schedule: {
    monday: { start: "08:00", end: "16:00", available: true },
    tuesday: { start: "08:00", end: "16:00", available: true },
    wednesday: { start: "08:00", end: "16:00", available: true },
    thursday: { start: "08:00", end: "16:00", available: true },
    friday: { start: "08:00", end: "16:00", available: true },
    saturday: { start: "00:00", end: "00:00", available: false },
    sunday: { start: "00:00", end: "00:00", available: false }
  }
};
```

---

### ClockInOutRequest

```typescript
export interface ClockInOutRequest {
  action: 'clock_in' | 'clock_out';
}
```

**Purpose**: Request body for `POST /api/caregivers/:id/clock` to clock caregiver in or out.

#### Properties

##### `action: 'clock_in' | 'clock_out'`
- **Description**: Clock action to perform
- **Values**:
  - `'clock_in'`: Start a shift (records current timestamp)
  - `'clock_out'`: End a shift (records current timestamp)

#### Example

```typescript
// Clock in
const clockInRequest: ClockInOutRequest = {
  action: 'clock_in'
};

await fetch(`/api/caregivers/${caregiverId}/clock`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(clockInRequest)
});

// Clock out
const clockOutRequest: ClockInOutRequest = {
  action: 'clock_out'
};

await fetch(`/api/caregivers/${caregiverId}/clock`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(clockOutRequest)
});
```

---

## API Endpoints

### GET /api/caregivers

**Purpose**: Retrieve all caregivers or filter by availability status.

**Query Parameters**:
- `status?: 'available' | 'busy' | 'off'` - Filter by availability status

**Response**: `ApiSuccessList<Caregiver>`

```typescript
// Get all caregivers
const response = await fetch('/api/caregivers');
const data: ApiSuccessList<Caregiver> = await response.json();
console.log(`Found ${data.data.length} caregivers`);

// Get only available caregivers
const available = await fetch('/api/caregivers?status=available');
const availableData: ApiSuccessList<Caregiver> = await available.json();
```

### GET /api/caregivers/:id

**Purpose**: Retrieve single caregiver by ID.

**Response**: `ApiSuccessItem<Caregiver>`

```typescript
const response = await fetch(`/api/caregivers/${caregiverId}`);
const data: ApiSuccessItem<Caregiver> = await response.json();
console.log(data.data.first_name, data.data.last_name);
```

### POST /api/caregivers

**Purpose**: Create new caregiver.

**Request Body**: `CreateCaregiverRequest`

**Response**: `ApiSuccessItem<Caregiver>`

```typescript
const newCaregiver: CreateCaregiverRequest = {
  id: crypto.randomUUID(),
  first_name: "John",
  last_name: "Smith",
  phone: "555-345-6789",
  email: "john.smith@eldercare.com",
  specialties: ["mobility", "physical therapy"],
  certifications: ["PTA", "CPR"],
  hourly_rate: 26.00,
  availability_status: 'available',
  availability_schedule: { /* ... */ },
  years_of_experience: 6
};

const response = await fetch('/api/caregivers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(newCaregiver)
});

const data: ApiSuccessItem<Caregiver> = await response.json();
console.log("Created caregiver:", data.data.id);
```

### PUT /api/caregivers/:id

**Purpose**: Update existing caregiver.

**Request Body**: `UpdateCaregiverRequest`

**Response**: `ApiSuccessItem<Caregiver>`

```typescript
const updates: UpdateCaregiverRequest = {
  availability_status: 'busy',
  notes: "Assigned to patient #123"
};

const response = await fetch(`/api/caregivers/${caregiverId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(updates)
});

const data: ApiSuccessItem<Caregiver> = await response.json();
```

### DELETE /api/caregivers/:id

**Purpose**: Delete caregiver.

**Response**: `ApiDeleted`

```typescript
const response = await fetch(`/api/caregivers/${caregiverId}`, {
  method: 'DELETE'
});

const data: ApiDeleted = await response.json();
console.log(data.message); // "Deleted successfully"
```

### POST /api/caregivers/:id/clock

**Purpose**: Clock caregiver in or out of shift.

**Request Body**: `ClockInOutRequest`

**Response**: `ApiSuccessItem<Caregiver>` (with updated `clock_status`)

```typescript
// Clock in
const clockIn: ClockInOutRequest = { action: 'clock_in' };
const response = await fetch(`/api/caregivers/${caregiverId}/clock`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(clockIn)
});

const data: ApiSuccessItem<Caregiver> = await response.json();
console.log("Clocked in at:", data.data.clock_status?.clockInTime);
```

---

## Usage Patterns

### Creating a Caregiver Profile

```typescript
import { CreateCaregiverRequest, Caregiver } from '@/types/caregiver';
import { ApiSuccessItem } from '@/types/api';

async function createCaregiverProfile(
  firstName: string,
  lastName: string,
  email: string,
  phone: string
): Promise<Caregiver> {
  const request: CreateCaregiverRequest = {
    id: crypto.randomUUID(),
    first_name: firstName,
    last_name: lastName,
    email,
    phone,
    specialties: [],
    certifications: [],
    hourly_rate: 25.00,
    availability_status: 'available',
    availability_schedule: {
      monday: { start: "09:00", end: "17:00", available: true },
      tuesday: { start: "09:00", end: "17:00", available: true },
      wednesday: { start: "09:00", end: "17:00", available: true },
      thursday: { start: "09:00", end: "17:00", available: true },
      friday: { start: "09:00", end: "17:00", available: true },
      saturday: { start: "00:00", end: "00:00", available: false },
      sunday: { start: "00:00", end: "00:00", available: false }
    },
    years_of_experience: 0
  };

  const response = await fetch('/api/caregivers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });

  const data: ApiSuccessItem<Caregiver> = await response.json();
  return data.data;
}
```

### Finding Available Caregivers for a Shift

```typescript
import { Caregiver, CaregiverSchedule } from '@/types/caregiver';

async function findAvailableCaregivers(
  dayOfWeek: string,
  startTime: string,
  endTime: string,
  requiredSpecialties: string[]
): Promise<Caregiver[]> {
  // Get all available caregivers
  const response = await fetch('/api/caregivers?status=available');
  const data: ApiSuccessList<Caregiver> = await response.json();
  
  const day = dayOfWeek.toLowerCase() as keyof CaregiverSchedule;
  
  return data.data.filter(caregiver => {
    // Check if available on this day
    const daySchedule = caregiver.availability_schedule[day];
    if (!daySchedule?.available) return false;
    
    // Check if time window fits (simplified - full logic would parse times)
    const caregiverStart = daySchedule.start;
    const caregiverEnd = daySchedule.end;
    if (caregiverStart > startTime || caregiverEnd < endTime) return false;
    
    // Check if has required specialties
    const hasSpecialties = requiredSpecialties.every(specialty =>
      caregiver.specialties.includes(specialty)
    );
    
    return hasSpecialties;
  });
}

// Usage
const candidates = await findAvailableCaregivers(
  'monday',
  '10:00',
  '14:00',
  ['dementia care', 'medication management']
);
console.log(`Found ${candidates.length} matching caregivers`);
```

### Clock In/Out Workflow

```typescript
import { ClockInOutRequest, Caregiver } from '@/types/caregiver';

async function clockIn(caregiverId: string): Promise<void> {
  const request: ClockInOutRequest = { action: 'clock_in' };
  
  const response = await fetch(`/api/caregivers/${caregiverId}/clock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });

  const data: ApiSuccessItem<Caregiver> = await response.json();
  
  console.log(`${data.data.first_name} clocked in at ${data.data.clock_status?.clockInTime}`);
}

async function clockOut(caregiverId: string): Promise<void> {
  const request: ClockInOutRequest = { action: 'clock_out' };
  
  const response = await fetch(`/api/caregivers/${caregiverId}/clock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });

  const data: ApiSuccessItem<Caregiver> = await response.json();
  
  const clockIn = new Date(data.data.clock_status!.clockInTime!);
  const clockOut = new Date(data.data.clock_status!.clockOutTime!);
  const hours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
  
  console.log(`${data.data.first_name} clocked out. Shift duration: ${hours.toFixed(2)} hours`);
}
```

### Updating Schedule

```typescript
import { UpdateCaregiverRequest, CaregiverSchedule } from '@/types/caregiver';

async function updateSchedule(
  caregiverId: string,
  newSchedule: CaregiverSchedule
): Promise<void> {
  const request: UpdateCaregiverRequest = {
    availability_schedule: newSchedule
  };

  const response = await fetch(`/api/caregivers/${caregiverId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    throw new Error('Failed to update schedule');
  }

  console.log('Schedule updated successfully');
}

// Usage: Change to weekend availability
const weekendSchedule: CaregiverSchedule = {
  monday: { start: "00:00", end: "00:00", available: false },
  tuesday: { start: "00:00", end: "00:00", available: false },
  wednesday: { start: "00:00", end: "00:00", available: false },
  thursday: { start: "00:00", end: "00:00", available: false },
  friday: { start: "00:00", end: "00:00", available: false },
  saturday: { start: "08:00", end: "20:00", available: true },
  sunday: { start: "08:00", end: "20:00", available: true }
};

await updateSchedule(caregiverId, weekendSchedule);
```

---

## Best Practices

### 1. Schedule Validation

```typescript
// ✅ GOOD: Validate schedule before saving
function isValidSchedule(schedule: CaregiverSchedule): boolean {
  for (const day of Object.values(schedule)) {
    if (!day.available) continue;
    
    // Validate time format
    if (!/^\d{2}:\d{2}$/.test(day.start) || !/^\d{2}:\d{2}$/.test(day.end)) {
      return false;
    }
    
    // Validate end > start
    if (day.end <= day.start) {
      return false;
    }
  }
  return true;
}

// Usage
if (!isValidSchedule(newSchedule)) {
  throw new Error('Invalid schedule: end time must be after start time');
}
```

### 2. Specialty Matching

```typescript
// ✅ GOOD: Flexible specialty matching (case-insensitive, partial)
function hasSpecialty(caregiver: Caregiver, requiredSpecialty: string): boolean {
  return caregiver.specialties.some(s => 
    s.toLowerCase().includes(requiredSpecialty.toLowerCase())
  );
}

// Usage
const dementiaSpecialists = caregivers.filter(c => 
  hasSpecialty(c, 'dementia') || hasSpecialty(c, 'alzheimer')
);
```

### 3. Clock Status Validation

```typescript
// ✅ GOOD: Validate clock actions
async function validateClockAction(
  caregiver: Caregiver,
  action: 'clock_in' | 'clock_out'
): Promise<void> {
  if (action === 'clock_in' && caregiver.clock_status?.clockedIn) {
    throw new Error('Caregiver is already clocked in');
  }
  
  if (action === 'clock_out' && !caregiver.clock_status?.clockedIn) {
    throw new Error('Caregiver is not clocked in');
  }
}

// Usage before clocking
await validateClockAction(caregiver, 'clock_in');
await clockIn(caregiver.id);
```

### 4. Availability Status Consistency

```typescript
// ✅ GOOD: Auto-update availability_status based on assignments
async function assignCaregiver(caregiverId: string, patientId: string): Promise<void> {
  // Create assignment
  await createAssignment(caregiverId, patientId);
  
  // Update status to 'busy'
  const update: UpdateCaregiverRequest = {
    availability_status: 'busy'
  };
  
  await fetch(`/api/caregivers/${caregiverId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update)
  });
}
```

### 5. Database JSON Serialization

```typescript
// ✅ GOOD: Safe JSON parsing with error handling
function safeParseJSON<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('JSON parse error:', error);
    return fallback;
  }
}

// Usage when reading from database
const caregiver: Caregiver = {
  ...dbRow,
  specialties: safeParseJSON(dbRow.specialties, []),
  certifications: safeParseJSON(dbRow.certifications, []),
  availability_schedule: safeParseJSON(dbRow.availability_schedule, getDefaultSchedule())
};

function getDefaultSchedule(): CaregiverSchedule {
  const defaultDay = { start: "09:00", end: "17:00", available: true };
  return {
    monday: defaultDay,
    tuesday: defaultDay,
    wednesday: defaultDay,
    thursday: defaultDay,
    friday: defaultDay,
    saturday: { start: "00:00", end: "00:00", available: false },
    sunday: { start: "00:00", end: "00:00", available: false }
  };
}
```

---

## Summary

The **caregiver types** provide comprehensive support for caregiver profile management:

- **CaregiverSchedule**: 7-day weekly availability with time windows
- **CaregiverClockStatus**: Real-time shift tracking with clock in/out timestamps
- **Caregiver**: Complete profile (24 properties) with specialties, certifications, rates
- **CaregiverDbRow**: Database representation with JSON serialization
- **CreateCaregiverRequest**: Frontend-provided ID for new caregivers
- **UpdateCaregiverRequest**: Sparse updates (only changed fields)
- **ClockInOutRequest**: Simple clock action requests

**Key Features**:
- Weekly schedule management (available days, time windows)
- Specialty and certification tracking for patient matching
- Real-time availability status (available/busy/off)
- Clock in/out tracking for shift management
- Emergency contact and address information
- Hourly rate and experience tracking

**Common Use Cases**:
- Finding available caregivers for shifts
- Matching caregivers to patient needs by specialty
- Tracking shift hours for payroll
- Managing caregiver schedules and availability
- Storing certifications and professional information
