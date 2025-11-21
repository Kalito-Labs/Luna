# RAG Document Processing Pipeline

**Created:** November 20, 2025
**Status:** 📋 Planning Phase
**Priority:** High

---

  

## 🧠 What is RAG? (ELI5 Explanation)

  

### **Think of RAG like a smart librarian for your AI therapist**

  

Imagine you have a really helpful AI therapist, but they only know general information about therapy. Now imagine giving that therapist access to:

- **Your specific therapy worksheets** from your actual therapist
- **Handouts** from your CBT sessions
- **DBT skills sheets** you've been practicing with
- **Personal notes** about techniques that work for you
  
**RAG (Retrieval-Augmented Generation)** is like giving your AI a perfectly organized filing cabinet of all your therapeutic materials, and teaching it to:


1. **📖 Read and understand** your documents
2. **🔍 Find relevant information** when you ask questions
3. **💬 Give you personalized advice** based on YOUR specific materials

### **Simple Example:**

**Without RAG:**

- You: "I'm having negative thoughts about my presentation"
- AI: "Try thinking positive thoughts" *(generic advice)*

  

**With RAG:**

- You: "I'm having negative thoughts about my presentation"
- AI: *searches your uploaded CBT thought record worksheet*\
- AI: "Let's use the thought record technique from Dr. Smith's handout. First, what's the specific thought? Now let's examine the evidence for and against it, just like we practiced in your worksheet..."

  

---

  

## 🏗️ How the Pipeline Works

  

### **Step 1: Document Upload**

```

You upload a file → Luna receives it

├── PDF (therapist handouts)

├── Word Doc (therapy notes)

├── Text files (personal notes)

└── Images (worksheet photos) [future]

```

  

### **Step 2: Document Processing**

```

Luna breaks down your document:

├── Extract text from PDF/Word

├── Split into small chunks (paragraphs)

├── Understand what each chunk is about

└── Create a "fingerprint" for each chunk

```

  

### **Step 3: Smart Storage**

```

Luna creates a searchable database:

├── Stores text chunks

├── Stores "fingerprints" (embeddings)

├── Links chunks to specific personas

└── Organizes by therapeutic approach

```

  

### **Step 4: Intelligent Retrieval**

```

When you chat with a persona:

├── AI understands your question

├── Searches for relevant chunks

├── Finds best matching content

└── Uses it to give personalized advice

```

  

---

  

## 🎯 Real-World Use Cases

  

### **Case 1: CBT Thought Records**

**What you upload:** "CBT Thought Record Worksheet.pdf"

**What happens:** Luna learns the 7-column thought record format

**Result:** When you mention negative thoughts, AI guides you through the exact worksheet structure your therapist uses

  

### **Case 2: DBT Crisis Skills**

**What you upload:** "DBT Distress Tolerance Handout.pdf"

**What happens:** Luna memorizes TIPP, distraction, and self-soothing techniques

**Result:** During crisis moments, AI provides step-by-step guidance from your actual DBT materials

  

### **Case 3: Personal Therapy Notes**

**What you upload:** "What works for me - therapy notes.txt"

**What happens:** Luna learns your specific triggers, coping strategies, and preferences

**Result:** AI gives advice tailored to what YOU'VE discovered works

  

---

  

## 🔒 Privacy & Security

  

### **Local Processing Mode** *(Recommended)*

- 🏠 **Everything stays on your device**
- 🔐 **Documents never uploaded to the internet**
- 💻 **Processing happens locally**
- 🔒 **Encrypted storage**
- ✅ **Complete privacy guarantee**

### **Cloud Processing Mode** *(Optional)*

- ☁️ **Higher quality text understanding**
- 🚀 **Faster processing**
- 📊 **Better search results**
- ⚠️ **Text sent to OpenAI (anonymized)**
---
## 🛠️ Technical Implementation

  

### **Document Processing Pipeline**

  

#### **1. Text Extraction**

```typescript

interface DocumentProcessor {

extractText(file: File): Promise<string> {

switch (file.type) {

case 'application/pdf':

return extractFromPDF(file) // Using pdf-parse library

case 'application/docx':

return extractFromWord(file) // Using mammoth.js

case 'text/plain':

return file.text() // Direct text reading

}

}

}

```

  

#### **2. Intelligent Chunking**

```typescript

interface ChunkingStrategy {

// Therapy-aware chunking that keeps related content together

therapeutic: {

respect_sections: true, // Keep "Instructions" with "Examples"

preserve_exercises: true, // Don't split worksheets across chunks

maintain_context: true, // Include section headers in chunks

ideal_chunk_size: 512 // Tokens per chunk

}

}

  

// Example chunking result:

const chunks = [

{

content: "CBT Thought Record Instructions: When you notice...",

metadata: { section: "Instructions", page: 1, type: "technique" }

},

{

content: "Example: Situation - Presenting at work meeting...",

metadata: { section: "Example", page: 2, type: "example" }

}

]

```

  

#### **3. Vector Embeddings**

```typescript

interface EmbeddingGeneration {

// Convert text chunks into mathematical vectors for similarity search

local: {

model: 'all-MiniLM-L6-v2', // Runs on your computer

quality: 'good', // Sufficient for most therapy content

privacy: 'complete' // Never leaves your device

},

cloud: {

model: 'text-embedding-ada-002', // OpenAI's model

quality: 'excellent', // Higher accuracy

privacy: 'limited' // Text sent to OpenAI

}

}

```

  

#### **4. Similarity Search**

```typescript

interface VectorSearch {

// Find relevant content when user asks questions

search(userQuery: string): Promise<RelevantChunk[]> {

// 1. Convert user question to vector

const queryVector = await embed(userQuery)

// 2. Find similar vectors in database

const similarChunks = await findSimilar(queryVector, {

top_k: 5, // Return best 5 matches

threshold: 0.7 // Minimum similarity score

})

// 3. Return relevant content with source info

return similarChunks.map(chunk => ({

content: chunk.text,

source: "CBT_Worksheet.pdf, page 3",

relevance: 0.85

}))

}

}

```

  

### **Database Schema**

  

#### **Datasets Table**

```sql

CREATE TABLE datasets (

id TEXT PRIMARY KEY,

name TEXT NOT NULL, -- "CBT Thought Records"

file_type TEXT NOT NULL, -- "pdf", "docx", "txt"

upload_date TEXT, -- When uploaded

processing_status TEXT, -- "processing", "completed", "error"

chunk_count INTEGER, -- Number of chunks created

metadata TEXT -- File info, settings used

);

```

  

#### **Document Chunks Table**

```sql

CREATE TABLE document_chunks (

id TEXT PRIMARY KEY,

dataset_id TEXT, -- Links to datasets table

content TEXT NOT NULL, -- Actual text content

embedding BLOB, -- Vector representation (binary)

metadata TEXT, -- Page numbers, section, type

chunk_index INTEGER -- Order within document

);

```

  

#### **Persona-Dataset Links**

```sql

CREATE TABLE persona_datasets (

persona_id TEXT, -- Which persona can access

dataset_id TEXT, -- Which dataset

enabled INTEGER DEFAULT 1, -- On/off toggle

weight REAL DEFAULT 1.0, -- How much to prioritize this data

PRIMARY KEY (persona_id, dataset_id)

);

```

  

### **Context Building for Chat**

  

#### **Enhanced Prompt Generation**

```typescript

async function buildPersonaPrompt(

userMessage: string,

persona: Persona,

conversationHistory: Message[]

): Promise<string> {

// 1. Find relevant content from user's documents

const relevantContext = await retrieveRelevantContext(userMessage, persona.id)

// 2. Get user's current state from Luna

const userContext = await getUserContext(persona.user_id)

// 3. Build enhanced prompt

return `

${persona.basePrompt}

  

RELEVANT THERAPEUTIC MATERIALS:

${relevantContext.map(chunk =>

`[${chunk.source}]: ${chunk.content}`

).join('\n\n')}

  

USER'S CURRENT STATE:

- Recent mood: ${userContext.currentMood || 'Not specified'}

- Active goals: ${userContext.therapyGoals?.join(', ') || 'None set'}

- Last journal entry: ${userContext.lastJournalSummary || 'None'}

  

CONVERSATION HISTORY:

${conversationHistory.slice(-3).map(msg =>

`${msg.role}: ${msg.content}`

).join('\n')}

  

USER MESSAGE: ${userMessage}

  

Please provide guidance based on the therapeutic materials and user context above.

`

}

```

  

---

  

## 🎨 User Experience Flow

  

### **Document Upload Workflow**

  

#### **Step 1: Access Dataset Manager**

```

User clicks on persona → Edit → Datasets tab

├── See current documents

├── Toggle Luna data access (journal, mood, etc.)

└── Upload new documents section

```

  

#### **Step 2: Upload Documents**

```

Drag & drop or browse for files

├── Show supported formats (PDF, Word, Text)

├── Choose processing mode (Local/Cloud)

├── Add description/category

└── Start processing

```

  

#### **Step 3: Processing Feedback**

```

Real-time progress updates:

├── "Extracting text from PDF..." (30%)

├── "Breaking into chunks..." (60%)

├── "Generating embeddings..." (80%)

└── "Ready to use!" (100%)

```

  

#### **Step 4: Dataset Management**

```

Manage uploaded documents:

├── Enable/disable for specific personas

├── Preview content and chunks

├── Delete or reprocess

└── See usage statistics

```

  

### **Chat Integration Experience**

  

#### **Enhanced Response Quality**

```

User: "I'm catastrophizing about my job interview"

  

Without RAG:

AI: "Try to think more positively about the interview"

  

With RAG (CBT worksheet uploaded):

AI: "I can see you're experiencing catastrophic thinking - that's one

of the cognitive distortions from your CBT handout. Let's use the

thought record technique:

  

1. What's the specific thought? (from your worksheet)

2. What's the evidence FOR this thought?

3. What's the evidence AGAINST it?

4. What would you tell a friend in this situation?

  

From your handout, remember that catastrophizing means imagining

the worst possible outcome. Let's examine if this thought is

realistic or if your mind is jumping to extremes..."

```

  

#### **Source Attribution**

- **💬 Responses include citations:** "Based on your DBT handout, page 3..."

- **📄 View original source:** Click to see the exact document section used

- **🔍 Transparency:** Always know where advice comes from

  

---

  

## 🚀 Implementation Phases

  

### **Phase 1: Foundation (Week 1-2)**

- ✅ Database schema for datasets and chunks

- ✅ Basic file upload API

- ✅ PDF and text extraction

- ✅ Simple chunking algorithm

  

### **Phase 2: Processing Engine (Week 3-4)**

- ✅ Local embedding generation

- ✅ Vector similarity search

- ✅ Chunk storage and retrieval

- ✅ Basic persona-dataset linking

  

### **Phase 3: UI Integration (Week 5-6)**

- ✅ Dataset management in persona editor

- ✅ File upload interface with progress

- ✅ Processing status and error handling

- ✅ Dataset preview and management

  

### **Phase 4: Chat Enhancement (Week 7-8)**

- ✅ RAG integration in chat responses

- ✅ Context building and prompt enhancement

- ✅ Source attribution and citations

- ✅ Performance optimization

  

---

  

## 🎯 Success Metrics

  

### **Technical Performance**

- **Processing Speed:** <30 seconds for typical 10-page document

- **Search Accuracy:** >80% relevance for therapeutic queries

- **Storage Efficiency:** <50MB per 100-page collection

- **Response Time:** <2 seconds for context retrieval

  

### **User Experience**

- **Upload Success Rate:** >95% successful document processing

- **User Adoption:** >60% of users upload at least one document

- **Response Quality:** Measurable improvement in therapeutic relevance

- **User Satisfaction:** Higher ratings for personalized advice

  

---

  

## 🔮 Future Enhancements

  

### **Advanced Document Understanding**

- **📋 Form Recognition:** Automatically identify CBT worksheets, mood trackers

- **🎨 Visual Processing:** Extract information from worksheet images

- **📊 Structured Data:** Process therapy assessment results, progress charts

  

### **Intelligent Organization**

- **🏷️ Auto-Categorization:** Automatically tag documents by therapeutic approach

- **🔗 Smart Linking:** Connect related concepts across different documents

- **📈 Progress Tracking:** Monitor which techniques you use most

  

### **Collaborative Features**

- **👩‍⚕️ Therapist Integration:** Share document collections with your therapist

- **📚 Community Libraries:** Access curated therapeutic document collections

- **🤝 Peer Support:** Share effective worksheets with consent

  

---

  

**This RAG pipeline transforms Luna from a generic AI assistant into a personalized therapeutic companion that truly understands your specific therapeutic journey and materials.**