# UI/UX Design Specifications

  

**Created:** November 20, 2025

**Status:** 🎨 Design Phase

**Priority:** High

**Target:** Design & Frontend Team

  

---

  

## 🎨 Design System Extensions

  

### **New Therapeutic Color Palette**

```scss

// Therapeutic specialty colors

:root {

// CBT (Cognitive Behavioral Therapy) - Blue spectrum

--cbt-primary: #3b82f6;

--cbt-secondary: #1e40af;

--cbt-light: #dbeafe;

--cbt-gradient: linear-gradient(135deg, #3b82f6, #1e40af);

// DBT (Dialectical Behavior Therapy) - Purple spectrum

--dbt-primary: #8b5cf6;

--dbt-secondary: #7c3aed;

--dbt-light: #ede9fe;

--dbt-gradient: linear-gradient(135deg, #8b5cf6, #7c3aed);

// Mindfulness - Green spectrum

--mindfulness-primary: #10b981;

--mindfulness-secondary: #059669;

--mindfulness-light: #d1fae5;

--mindfulness-gradient: linear-gradient(135deg, #10b981, #059669);

// Trauma-Informed - Warm neutral spectrum

--trauma-primary: #f59e0b;

--trauma-secondary: #d97706;

--trauma-light: #fef3c7;

--trauma-gradient: linear-gradient(135deg, #f59e0b, #d97706);

// Crisis Support - Red spectrum (calming red)

--crisis-primary: #ef4444;

--crisis-secondary: #dc2626;

--crisis-light: #fee2e2;

--crisis-gradient: linear-gradient(135deg, #ef4444, #dc2626);

// General/Custom - Luna brand colors

--general-primary: #6366f1;

--general-secondary: #4f46e5;

--general-light: #e0e7ff;

--general-gradient: linear-gradient(135deg, #6366f1, #4f46e5);

}

  

// Dynamic theming based on persona specialty

.persona-themed {

&.cbt {

--theme-primary: var(--cbt-primary);

--theme-secondary: var(--cbt-secondary);

--theme-light: var(--cbt-light);

--theme-gradient: var(--cbt-gradient);

}

&.dbt {

--theme-primary: var(--dbt-primary);

--theme-secondary: var(--dbt-secondary);

--theme-light: var(--dbt-light);

--theme-gradient: var(--dbt-gradient);

}

&.mindfulness {

--theme-primary: var(--mindfulness-primary);

--theme-secondary: var(--mindfulness-secondary);

--theme-light: var(--mindfulness-light);

--theme-gradient: var(--mindfulness-gradient);

}

}

```

  

### **Persona Icon System**

```scss

// Standardized persona avatar styles

.persona-avatar {

width: 48px;

height: 48px;

border-radius: 50%;

display: flex;

align-items: center;

justify-content: center;

font-size: 24px;

background: var(--theme-gradient);

color: white;

box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

transition: all 0.3s ease;

&.large {

width: 64px;

height: 64px;

font-size: 32px;

}

&.small {

width: 32px;

height: 32px;

font-size: 16px;

}

// Hover effect for interactive avatars

&:hover {

transform: translateY(-2px);

box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);

}

}

  

// Specialty-specific avatar styles

.persona-avatar {

&.cbt { background: var(--cbt-gradient); }

&.dbt { background: var(--dbt-gradient); }

&.mindfulness { background: var(--mindfulness-gradient); }

&.trauma { background: var(--trauma-gradient); }

&.crisis { background: var(--crisis-gradient); }

&.general { background: var(--general-gradient); }

}

```

  

---

  

## 🏠 Enhanced Persona Manager Interface

  

### **Main Persona Manager Layout**

```scss

.persona-manager-enhanced {

max-width: 1200px;

margin: 0 auto;

padding: 2rem;

// Hero section with prominent create button

.persona-manager-header {

display: flex;

justify-content: space-between;

align-items: center;

margin-bottom: 3rem;

padding: 2rem;

background: linear-gradient(135deg, #f8fafc, #e2e8f0);

border-radius: 1rem;

border: 1px solid var(--border-light);

.header-content {

h1 {

font-size: 2.5rem;

font-weight: 700;

color: var(--text-primary);

margin-bottom: 0.5rem;

}

p {

font-size: 1.125rem;

color: var(--text-secondary);

max-width: 600px;

}

}

.create-persona-btn {

background: var(--general-gradient);

color: white;

border: none;

padding: 1rem 2rem;

border-radius: 0.75rem;

font-size: 1.125rem;

font-weight: 600;

display: flex;

align-items: center;

gap: 0.75rem;

cursor: pointer;

transition: all 0.3s ease;

box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);

&:hover {

transform: translateY(-2px);

box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);

}

.icon {

font-size: 1.25rem;

}

}

}

// Category filter tabs

.category-filters {

display: flex;

gap: 0.5rem;

margin-bottom: 2rem;

overflow-x: auto;

padding-bottom: 0.5rem;

.category-tab {

display: flex;

align-items: center;

gap: 0.5rem;

padding: 0.75rem 1.5rem;

background: white;

border: 2px solid var(--border-light);

border-radius: 2rem;

cursor: pointer;

transition: all 0.3s ease;

white-space: nowrap;

font-weight: 500;

&:hover {

border-color: var(--accent-blue);

background: var(--bg-hover);

}

&.active {

background: var(--accent-blue);

color: white;

border-color: var(--accent-blue);

}

.category-icon {

font-size: 1.125rem;

}

.count {

font-size: 0.875rem;

opacity: 0.8;

background: rgba(0, 0, 0, 0.1);

padding: 0.125rem 0.5rem;

border-radius: 1rem;

}

}

}

// Personas grid

.personas-grid-enhanced {

display: grid;

grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));

gap: 1.5rem;

@media (max-width: 768px) {

grid-template-columns: 1fr;

gap: 1rem;

}

}

// Empty state for new users

.empty-state {

text-align: center;

padding: 4rem 2rem;

background: white;

border: 2px dashed var(--border-light);

border-radius: 1rem;

margin-top: 2rem;

.empty-icon {

font-size: 4rem;

margin-bottom: 1rem;

opacity: 0.6;

}

h2 {

font-size: 1.5rem;

color: var(--text-primary);

margin-bottom: 0.5rem;

}

p {

color: var(--text-secondary);

margin-bottom: 2rem;

}

.create-first-btn {

background: var(--general-gradient);

color: white;

border: none;

padding: 1rem 2rem;

border-radius: 0.75rem;

font-weight: 600;

cursor: pointer;

transition: all 0.3s ease;

&:hover {

transform: translateY(-2px);

box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);

}

}

}

}

```

  

### **Enhanced Persona Cards**

```scss

.persona-card-enhanced {

background: white;

border: 1px solid var(--border-light);

border-radius: 1rem;

padding: 1.5rem;

transition: all 0.3s ease;

position: relative;

overflow: hidden;

&:hover {

transform: translateY(-4px);

box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

border-color: var(--accent-blue);

}

&.favorite {

border-color: var(--accent-gold);

&::before {

content: '';

position: absolute;

top: 0;

left: 0;

right: 0;

height: 4px;

background: var(--accent-gold);

}

}

// Persona header with avatar and info

.persona-header {

display: flex;

align-items: flex-start;

gap: 1rem;

margin-bottom: 1rem;

.persona-avatar {

flex-shrink: 0;

}

.persona-identity {

flex: 1;

.persona-name {

font-size: 1.25rem;

font-weight: 600;

color: var(--text-primary);

margin-bottom: 0.25rem;

line-height: 1.3;

}

.persona-specialty {

.specialty-badge {

background: var(--theme-light);

color: var(--theme-primary);

font-size: 0.75rem;

font-weight: 500;

padding: 0.25rem 0.75rem;

border-radius: 1rem;

border: 1px solid var(--theme-primary);

}

}

}

.favorite-btn {

background: none;

border: none;

font-size: 1.25rem;

cursor: pointer;

opacity: 0.4;

transition: all 0.3s ease;

&:hover, &.active {

opacity: 1;

transform: scale(1.1);

}

&.active {

color: var(--accent-gold);

}

}

}

// Description

.persona-description {

color: var(--text-secondary);

line-height: 1.5;

margin-bottom: 1rem;

display: -webkit-box;

-webkit-line-clamp: 2;

-webkit-box-orient: vertical;

overflow: hidden;

}

// Statistics row

.persona-stats {

display: flex;

gap: 1rem;

margin-bottom: 1.5rem;

font-size: 0.875rem;

color: var(--text-muted);

.stat-item {

display: flex;

align-items: center;

gap: 0.25rem;

.stat-icon {

font-size: 1rem;

}

}

}

// Action buttons

.persona-actions {

display: flex;

gap: 0.75rem;

.action-btn {

flex: 1;

display: flex;

align-items: center;

justify-content: center;

gap: 0.5rem;

padding: 0.625rem 1rem;

border: 1px solid var(--border-light);

border-radius: 0.5rem;

background: white;

cursor: pointer;

transition: all 0.3s ease;

font-size: 0.875rem;

font-weight: 500;

&:hover:not(:disabled) {

transform: translateY(-1px);

box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

}

&:disabled {

opacity: 0.5;

cursor: not-allowed;

}

.icon {

font-size: 1rem;

}

// Specific button styles

&.edit {

border-color: var(--accent-blue);

color: var(--accent-blue);

&:hover {

background: var(--accent-blue);

color: white;

}

}

&.duplicate {

border-color: var(--accent-purple);

color: var(--accent-purple);

&:hover {

background: var(--accent-purple);

color: white;

}

}

&.delete {

border-color: var(--accent-red);

color: var(--accent-red);

&:hover:not(:disabled) {

background: var(--accent-red);

color: white;

}

}

}

}

}

```

  

---

  

## 🔮 Create Persona Wizard Design

  

### **Wizard Progress Indicator**

```scss

.create-persona-wizard {

max-width: 800px;

margin: 0 auto;

// Progress steps indicator

.wizard-progress {

display: flex;

justify-content: center;

margin-bottom: 3rem;

position: relative;

&::before {

content: '';

position: absolute;

top: 50%;

left: 15%;

right: 15%;

height: 2px;

background: var(--border-light);

z-index: 1;

}

.progress-step {

display: flex;

flex-direction: column;

align-items: center;

gap: 0.5rem;

position: relative;

z-index: 2;

background: white;

padding: 0 1rem;

.step-number {

width: 40px;

height: 40px;

border-radius: 50%;

display: flex;

align-items: center;

justify-content: center;

font-weight: 600;

border: 2px solid var(--border-light);

background: white;

color: var(--text-muted);

transition: all 0.3s ease;

}

.step-label {

font-size: 0.875rem;

font-weight: 500;

color: var(--text-muted);

transition: color 0.3s ease;

}

// Active step

&.active {

.step-number {

background: var(--accent-blue);

color: white;

border-color: var(--accent-blue);

}

.step-label {

color: var(--accent-blue);

}

}

// Completed step

&.completed {

.step-number {

background: var(--accent-green);

color: white;

border-color: var(--accent-green);

}

.step-label {

color: var(--accent-green);

}

}

}

}

}

```

  

### **Creation Method Selection**

```scss

.creation-method-selection {

text-align: center;

h2 {

font-size: 2rem;

color: var(--text-primary);

margin-bottom: 1rem;

}

.method-grid {

display: grid;

grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));

gap: 1.5rem;

margin-top: 2rem;

.method-card {

background: white;

border: 2px solid var(--border-light);

border-radius: 1rem;

padding: 2rem;

cursor: pointer;

transition: all 0.3s ease;

text-align: center;

&:hover {

border-color: var(--accent-blue);

transform: translateY(-4px);

box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

}

.method-icon {

font-size: 3rem;

margin-bottom: 1rem;

display: block;

}

h3 {

font-size: 1.25rem;

font-weight: 600;

color: var(--text-primary);

margin-bottom: 0.5rem;

}

p {

color: var(--text-secondary);

margin-bottom: 1.5rem;

line-height: 1.5;

}

.method-benefits {

display: flex;

flex-direction: column;

gap: 0.5rem;

span {

font-size: 0.875rem;

color: var(--accent-green);

display: flex;

align-items: center;

gap: 0.25rem;

&::before {

content: '✓';

color: var(--accent-green);

font-weight: bold;

}

}

}

}

}

}

```

  

### **Template Selection Interface**

```scss

.template-selection {

h2 {

text-align: center;

font-size: 2rem;

color: var(--text-primary);

margin-bottom: 2rem;

}

.templates-grid {

display: grid;

grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));

gap: 1.5rem;

.template-card {

background: white;

border: 2px solid var(--border-light);

border-radius: 1rem;

padding: 1.5rem;

cursor: pointer;

transition: all 0.3s ease;

position: relative;

&:hover {

border-color: var(--accent-blue);

transform: translateY(-2px);

box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);

}

&.selected {

border-color: var(--accent-blue);

background: var(--bg-accent-light);

&::after {

content: '✓ Selected';

position: absolute;

top: 1rem;

right: 1rem;

background: var(--accent-blue);

color: white;

font-size: 0.75rem;

font-weight: 600;

padding: 0.25rem 0.75rem;

border-radius: 1rem;

}

}

.template-header {

display: flex;

align-items: center;

gap: 1rem;

margin-bottom: 1rem;

.template-icon {

font-size: 2.5rem;

width: 60px;

height: 60px;

display: flex;

align-items: center;

justify-content: center;

background: var(--theme-light);

border-radius: 1rem;

}

.template-specialty {

font-size: 0.875rem;

color: var(--theme-primary);

font-weight: 600;

background: var(--theme-light);

padding: 0.25rem 0.75rem;

border-radius: 1rem;

}

}

.template-name {

font-size: 1.25rem;

font-weight: 600;

color: var(--text-primary);

margin-bottom: 0.5rem;

}

.template-description {

color: var(--text-secondary);

line-height: 1.5;

margin-bottom: 1rem;

}

.template-features {

margin-bottom: 1rem;

h4 {

font-size: 0.875rem;

font-weight: 600;

color: var(--text-primary);

margin-bottom: 0.5rem;

}

ul {

list-style: none;

padding: 0;

li {

font-size: 0.875rem;

color: var(--text-secondary);

margin-bottom: 0.25rem;

&::before {

content: '•';

color: var(--theme-primary);

margin-right: 0.5rem;

}

}

}

}

.template-tags {

display: flex;

flex-wrap: wrap;

gap: 0.5rem;

margin-bottom: 1rem;

.tag {

font-size: 0.75rem;

background: var(--bg-accent-light);

color: var(--text-muted);

padding: 0.25rem 0.5rem;

border-radius: 0.75rem;

border: 1px solid var(--border-light);

}

}

.template-best-for {

h4 {

font-size: 0.875rem;

font-weight: 600;

color: var(--text-primary);

margin-bottom: 0.25rem;

}

p {

font-size: 0.875rem;

color: var(--accent-green);

font-weight: 500;

}

}

}

}

}

```

  

---

  

## 📚 Document Upload Interface Design

  

### **Upload Modal Layout**

```scss

.document-upload-modal {

position: fixed;

top: 0;

left: 0;

width: 100%;

height: 100%;

z-index: 1000;

display: flex;

align-items: center;

justify-content: center;

padding: 1rem;

.modal-overlay {

position: absolute;

top: 0;

left: 0;

width: 100%;

height: 100%;

background: rgba(0, 0, 0, 0.5);

backdrop-filter: blur(4px);

}

.modal-content {

background: white;

border-radius: 1rem;

padding: 2rem;

max-width: 600px;

width: 100%;

max-height: 90vh;

overflow-y: auto;

position: relative;

z-index: 1001;

box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);

.modal-header {

text-align: center;

margin-bottom: 2rem;

position: relative;

h2 {

font-size: 1.75rem;

color: var(--text-primary);

margin-bottom: 0.5rem;

}

p {

color: var(--text-secondary);

}

.close-btn {

position: absolute;

top: -1rem;

right: -1rem;

background: var(--bg-light);

border: 1px solid var(--border-light);

border-radius: 50%;

width: 32px;

height: 32px;

display: flex;

align-items: center;

justify-content: center;

cursor: pointer;

transition: all 0.3s ease;

&:hover {

background: var(--accent-red);

color: white;

border-color: var(--accent-red);

}

}

}

}

}

```

  

### **Drag & Drop Upload Zone**

```scss

.upload-area {

margin-bottom: 2rem;

.drop-zone {

border: 2px dashed var(--border-light);

border-radius: 1rem;

padding: 3rem 2rem;

text-align: center;

transition: all 0.3s ease;

background: var(--bg-light);

&:hover, .upload-area.drag-active & {

border-color: var(--accent-blue);

background: var(--bg-accent-light);

transform: scale(1.02);

}

.upload-icon {

font-size: 3rem;

margin-bottom: 1rem;

opacity: 0.6;

}

h3 {

font-size: 1.25rem;

color: var(--text-primary);

margin-bottom: 0.5rem;

}

p {

color: var(--text-secondary);

margin-bottom: 1.5rem;

}

.browse-btn {

background: var(--accent-blue);

color: white;

border: none;

padding: 0.75rem 2rem;

border-radius: 0.75rem;

font-weight: 600;

cursor: pointer;

transition: all 0.3s ease;

&:hover {

background: var(--accent-blue-dark);

transform: translateY(-1px);

}

}

}

// Processing mode selection

.processing-mode {

margin-top: 2rem;

padding-top: 2rem;

border-top: 1px solid var(--border-light);

h4 {

color: var(--text-primary);

margin-bottom: 1rem;

}

.mode-options {

display: flex;

flex-direction: column;

gap: 1rem;

.mode-option {

display: flex;

gap: 1rem;

padding: 1rem;

border: 2px solid var(--border-light);

border-radius: 0.75rem;

cursor: pointer;

transition: all 0.3s ease;

&:hover {

border-color: var(--accent-blue);

background: var(--bg-accent-light);

}

input[type="radio"]:checked + .mode-info {

color: var(--accent-blue);

}

.mode-info {

strong {

display: block;

margin-bottom: 0.25rem;

}

p {

font-size: 0.875rem;

color: var(--text-secondary);

margin: 0;

}

}

}

}

}

}

```

  

### **Upload Progress Display**

```scss

.upload-progress {

margin-top: 2rem;

padding-top: 2rem;

border-top: 1px solid var(--border-light);

h4 {

color: var(--text-primary);

margin-bottom: 1rem;

}

.progress-list {

display: flex;

flex-direction: column;

gap: 1rem;

.progress-item {

background: var(--bg-light);

border: 1px solid var(--border-light);

border-radius: 0.75rem;

padding: 1rem;

.file-info {

display: flex;

justify-content: space-between;

align-items: center;

margin-bottom: 0.5rem;

.file-name {

font-weight: 500;

color: var(--text-primary);

font-size: 0.875rem;

}

.file-status {

font-size: 0.75rem;

font-weight: 600;

padding: 0.25rem 0.75rem;

border-radius: 1rem;

text-transform: uppercase;

&.queued {

background: var(--bg-accent-light);

color: var(--text-muted);

}

&.uploading {

background: var(--accent-blue-light);

color: var(--accent-blue);

}

&.processing {

background: var(--accent-purple-light);

color: var(--accent-purple);

}

&.completed {

background: var(--accent-green-light);

color: var(--accent-green);

}

&.error {

background: var(--accent-red-light);

color: var(--accent-red);

}

}

}

.progress-bar {

height: 6px;

background: var(--bg-accent-light);

border-radius: 3px;

overflow: hidden;

.progress-fill {

height: 100%;

background: var(--accent-blue);

transition: width 0.3s ease;

&.completed {

background: var(--accent-green);

}

&.error {

background: var(--accent-red);

}

}

}

.error-message {

margin-top: 0.5rem;

font-size: 0.75rem;

color: var(--accent-red);

background: var(--accent-red-light);

padding: 0.5rem;

border-radius: 0.5rem;

}

}

}

}

```

  

---

  

## 💬 Enhanced Chat Interface with RAG

  

### **Chat Message with Source Attribution**

```scss

.chat-message-enhanced {

margin-bottom: 1.5rem;

&.has-sources {

.message-content {

margin-bottom: 1rem;

}

}

.message-content {

background: white;

padding: 1rem 1.5rem;

border-radius: 1rem;

border: 1px solid var(--border-light);

line-height: 1.6;

// Highlight therapeutic advice differently

&.therapeutic-enhanced {

border-left: 4px solid var(--theme-primary);

background: var(--theme-light);

}

}

.message-sources {

background: var(--bg-light);

border: 1px solid var(--border-light);

border-radius: 0.75rem;

padding: 1rem;

margin-top: 0.5rem;

.sources-header {

display: flex;

align-items: center;

gap: 0.5rem;

margin-bottom: 0.75rem;

font-size: 0.875rem;

font-weight: 600;

color: var(--text-secondary);

.sources-icon {

font-size: 1rem;

}

}

.sources-list {

display: flex;

flex-direction: column;

gap: 0.5rem;

.source-item {

display: flex;

align-items: center;

gap: 1rem;

padding: 0.5rem 0.75rem;

background: white;

border: 1px solid var(--border-light);

border-radius: 0.5rem;

cursor: pointer;

transition: all 0.3s ease;

&:hover {

border-color: var(--accent-blue);

background: var(--bg-accent-light);

}

.source-name {

flex: 1;

font-weight: 500;

color: var(--text-primary);

font-size: 0.875rem;

}

.source-reference {

font-size: 0.75rem;

color: var(--text-secondary);

}

.relevance-score {

font-size: 0.75rem;

font-weight: 600;

color: var(--accent-green);

background: var(--accent-green-light);

padding: 0.125rem 0.5rem;

border-radius: 0.75rem;

}

}

}

}

.context-indicator {

display: flex;

align-items: center;

gap: 0.5rem;

margin-top: 0.5rem;

font-size: 0.75rem;

color: var(--accent-purple);

background: var(--accent-purple-light);

padding: 0.5rem 0.75rem;

border-radius: 0.75rem;

.context-icon {

font-size: 1rem;

}

}

}

```

  

### **Persona Selector with Smart Recommendations**

```scss

.persona-selector-enhanced {

background: white;

border: 1px solid var(--border-light);

border-radius: 1rem;

padding: 1.5rem;

margin-bottom: 1rem;

.current-persona-display {

display: flex;

align-items: center;

gap: 1rem;

margin-bottom: 1rem;

.persona-avatar {

width: 48px;

height: 48px;

}

.persona-info {

h3 {

font-weight: 600;

color: var(--text-primary);

margin-bottom: 0.25rem;

}

p {

font-size: 0.875rem;

color: var(--text-secondary);

margin: 0;

}

}

}

.persona-recommendations {

border-top: 1px solid var(--border-light);

padding-top: 1rem;

h4 {

font-size: 0.875rem;

color: var(--text-secondary);

margin-bottom: 0.75rem;

}

.recommended-personas {

display: flex;

gap: 0.75rem;

overflow-x: auto;

.persona-quick-card {

display: flex;

flex-direction: column;

align-items: center;

gap: 0.5rem;

padding: 0.75rem;

border: 1px solid var(--border-light);

border-radius: 0.75rem;

cursor: pointer;

transition: all 0.3s ease;

min-width: 80px;

&:hover {

border-color: var(--accent-blue);

background: var(--bg-accent-light);

}

.persona-avatar {

width: 32px;

height: 32px;

font-size: 16px;

}

.persona-name {

font-size: 0.75rem;

font-weight: 500;

color: var(--text-primary);

text-align: center;

line-height: 1.3;

}

}

}

}

}

```

  

---

  

## 📱 Responsive Design Considerations

  

### **Mobile-First Breakpoints**

```scss

// Mobile-first breakpoint system

$breakpoints: (

sm: 640px, // Small devices

md: 768px, // Medium devices

lg: 1024px, // Large devices

xl: 1280px // Extra large devices

);

  

@mixin respond-to($breakpoint) {

@if map-has-key($breakpoints, $breakpoint) {

@media (min-width: map-get($breakpoints, $breakpoint)) {

@content;

}

}

}

  

// Mobile optimizations for persona manager

.persona-manager-enhanced {

padding: 1rem;

@include respond-to(md) {

padding: 2rem;

}

.persona-manager-header {

flex-direction: column;

gap: 1.5rem;

text-align: center;

@include respond-to(md) {

flex-direction: row;

text-align: left;

}

.header-content h1 {

font-size: 2rem;

@include respond-to(md) {

font-size: 2.5rem;

}

}

}

.category-filters {

overflow-x: auto;

padding: 0 0 0.5rem 0;

&::-webkit-scrollbar {

height: 4px;

}

&::-webkit-scrollbar-track {

background: var(--bg-light);

border-radius: 2px;

}

&::-webkit-scrollbar-thumb {

background: var(--border-light);

border-radius: 2px;

}

}

}

  

// Mobile persona card optimizations

.persona-card-enhanced {

.persona-actions {

flex-direction: column;

@include respond-to(sm) {

flex-direction: row;

}

}

}

  

// Mobile wizard optimizations

.create-persona-wizard {

padding: 1rem;

.wizard-progress {

flex-direction: column;

gap: 1rem;

@include respond-to(md) {

flex-direction: row;

}

&::before {

display: none;

@include respond-to(md) {

display: block;

}

}

}

.method-grid {

grid-template-columns: 1fr;

@include respond-to(md) {

grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));

}

}

}

```

  

### **Touch-Friendly Interactions**

```scss

// Increase touch targets for mobile

@media (max-width: 768px) {

.persona-card-enhanced {

.action-btn {

padding: 1rem;

font-size: 1rem;

}

.favorite-btn {

padding: 0.5rem;

font-size: 1.5rem;

}

}

.category-tab {

padding: 1rem 1.5rem;

font-size: 1rem;

}

.create-persona-btn {

padding: 1.25rem 2rem;

font-size: 1.25rem;

}

// Larger modal close button

.close-btn {

width: 44px !important;

height: 44px !important;

font-size: 1.25rem;

}

}

```

  

---

  

## 🎭 Animation & Microinteractions

  

### **Page Transitions**

```scss

// Smooth page transitions

.persona-page-transition {

&-enter-active,

&-leave-active {

transition: all 0.3s ease;

}

&-enter-from,

&-leave-to {

opacity: 0;

transform: translateY(10px);

}

}

  

// Staggered card animations

.personas-grid-enhanced {

.persona-card-enhanced {

animation: slideInUp 0.6s ease-out;

animation-fill-mode: both;

@for $i from 1 through 12 {

&:nth-child(#{$i}) {

animation-delay: #{$i * 0.05}s;

}

}

}

}

  

@keyframes slideInUp {

from {

opacity: 0;

transform: translateY(30px);

}

to {

opacity: 1;

transform: translateY(0);

}

}

```

  

### **Loading States**

```scss

// Skeleton loading for persona cards

.persona-card-skeleton {

background: white;

border: 1px solid var(--border-light);

border-radius: 1rem;

padding: 1.5rem;

.skeleton-element {

background: linear-gradient(

90deg,

var(--bg-light) 25%,

var(--bg-accent-light) 50%,

var(--bg-light) 75%

);

background-size: 200% 100%;

animation: shimmer 1.5s infinite;

border-radius: 0.5rem;

&.avatar {

width: 48px;

height: 48px;

border-radius: 50%;

}

&.text-lg {

height: 1.5rem;

width: 70%;

}

&.text-sm {

height: 1rem;

width: 50%;

}

&.button {

height: 2.5rem;

width: 100%;

}

}

}

  

@keyframes shimmer {

0% {

background-position: -200% 0;

}

100% {

background-position: 200% 0;

}

}

```

  

---

  

**This comprehensive UI/UX design specification provides the complete visual and interaction blueprint for transforming Luna's persona management system into an intuitive, therapeutically-focused user experience.**