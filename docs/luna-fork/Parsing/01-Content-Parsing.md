# Content Parsing Strategy for Luna Wellness App

## Overview

This document outlines the strategy for parsing ebooks (EPUB, PDF, MOBI) and storing their content for use in the Luna mental wellness application. This parsing system will be a **separate microservice/utility** outside the main Luna repository.

  

---

  

## Architecture Decision: Separate Service

  

### Why Keep It Separate?

1. **Heavy Dependencies**: Parsing libraries are large (epub.js ~500KB, pdf-lib ~1.5MB, etc.)

2. **Processing Intensive**: Can be slow and block the main app

3. **One-Time Operations**: Parsing happens once, serving happens millions of times

4. **Different Concerns**: File processing vs. user interface

5. **Scalability**: Can run as batch job or separate API service

6. **Security**: Isolates file handling from user-facing application

  

### Recommended Structure

```

Luna-Content-Processor/ (separate repository)

├── package.json

├── tsconfig.json

├── .env.example

├── src/

│ ├── parsers/

│ │ ├── EpubParser.ts

│ │ ├── PdfParser.ts

│ │ ├── MobiParser.ts

│ │ └── MarkdownParser.ts

│ ├── processors/

│ │ ├── ContentChunker.ts

│ │ ├── MetadataExtractor.ts

│ │ └── TextCleaner.ts

│ ├── storage/

│ │ ├── DatabaseStorage.ts

│ │ └── FileStorage.ts

│ ├── api/

│ │ ├── ingest.ts

│ │ └── query.ts

│ ├── utils/

│ │ ├── logger.ts

│ │ └── validators.ts

│ └── index.ts

├── scripts/

│ ├── batch-process.ts

│ ├── test-parser.ts

│ └── migrate-content.ts

├── input/ (gitignored)

│ └── books/

└── output/ (gitignored)

└── processed/

```

  

---

  

## EPUB Parsing with epub.js

  

### Installation

```bash

npm install epubjs jsdom canvas

npm install --save-dev @types/node

```

  

### Basic EPUB Parser Implementation

  

```typescript

// src/parsers/EpubParser.ts

import ePub from 'epubjs';

import { JSDOM } from 'jsdom';

  

interface BookMetadata {

title: string;

author: string;

publisher?: string;

language?: string;

isbn?: string;

description?: string;

coverImage?: string;

}

  

interface Chapter {

id: string;

title: string;

content: string;

order: number;

wordCount: number;

}

  

interface ParsedBook {

metadata: BookMetadata;

chapters: Chapter[];

toc: any[];

totalWords: number;

}

  

export class EpubParser {

async parse(filePath: string): Promise<ParsedBook> {

const book = ePub(filePath);

// Load the book

await book.opened;

  

// Extract metadata

const metadata = await this.extractMetadata(book);

  

// Get table of contents

const navigation = await book.loaded.navigation;

const toc = navigation.toc;

  

// Parse all chapters

const chapters = await this.parseChapters(book, toc);

  

// Calculate total words

const totalWords = chapters.reduce((sum, ch) => sum + ch.wordCount, 0);

  

return {

metadata,

chapters,

toc,

totalWords

};

}

  

private async extractMetadata(book: any): Promise<BookMetadata> {

const metadata = await book.loaded.metadata;

const cover = await book.loaded.cover;

  

return {

title: metadata.title || 'Unknown',

author: metadata.creator || 'Unknown',

publisher: metadata.publisher,

language: metadata.language,

isbn: metadata.identifier,

description: metadata.description,

coverImage: cover // Base64 or URL

};

}

  

private async parseChapters(book: any, toc: any[]): Promise<Chapter[]> {

const chapters: Chapter[] = [];

const spine = await book.loaded.spine;

  

for (let i = 0; i < spine.items.length; i++) {

const item = spine.items[i];

try {

// Load chapter content

const doc = await item.load(book.load.bind(book));

const content = this.extractTextContent(doc);

// Find corresponding TOC entry

const tocEntry = toc.find(entry => entry.href.includes(item.href));

chapters.push({

id: item.idref || `chapter-${i}`,

title: tocEntry?.label || `Chapter ${i + 1}`,

content: content,

order: i,

wordCount: content.split(/\s+/).length

});

  

// Unload to free memory

await item.unload();

} catch (error) {

console.error(`Error parsing chapter ${i}:`, error);

}

}

  

return chapters;

}

  

private extractTextContent(doc: any): string {

// Use JSDOM to parse HTML content

const dom = new JSDOM(doc);

const document = dom.window.document;

  

// Remove script and style tags

const scripts = document.querySelectorAll('script, style');

scripts.forEach(el => el.remove());

  

// Get text content

let text = document.body.textContent || '';

  

// Clean up whitespace

text = text

.replace(/\n\s*\n/g, '\n\n') // Remove multiple line breaks

.replace(/[ \t]+/g, ' ') // Normalize spaces

.trim();

  

return text;

}

  

// Extract specific sections (for DBT/CBT workbooks)

async extractSections(filePath: string, sectionTitles: string[]): Promise<Map<string, string>> {

const parsed = await this.parse(filePath);

const sections = new Map<string, string>();

  

for (const chapter of parsed.chapters) {

for (const sectionTitle of sectionTitles) {

if (chapter.title.toLowerCase().includes(sectionTitle.toLowerCase())) {

sections.set(sectionTitle, chapter.content);

}

}

}

  

return sections;

}

}

```

  

---

  

## PDF Parsing

  

### Installation

```bash

npm install pdf-parse pdf-lib

```

  

### PDF Parser Implementation

  

```typescript

// src/parsers/PdfParser.ts

import pdf from 'pdf-parse';

import fs from 'fs/promises';

  

interface PdfMetadata {

title?: string;

author?: string;

subject?: string;

keywords?: string;

creator?: string;

producer?: string;

creationDate?: Date;

pages: number;

}

  

interface ParsedPdf {

metadata: PdfMetadata;

text: string;

pages: string[];

wordCount: number;

}

  

export class PdfParser {

async parse(filePath: string): Promise<ParsedPdf> {

const dataBuffer = await fs.readFile(filePath);

const data = await pdf(dataBuffer);

  

return {

metadata: {

title: data.info.Title,

author: data.info.Author,

subject: data.info.Subject,

keywords: data.info.Keywords,

creator: data.info.Creator,

producer: data.info.Producer,

creationDate: data.info.CreationDate,

pages: data.numpages

},

text: data.text,

pages: this.splitIntoPages(data.text),

wordCount: data.text.split(/\s+/).length

};

}

  

private splitIntoPages(text: string): string[] {

// PDFs often have page markers or form feeds

// This is a simple split - may need adjustment based on your PDFs

return text.split(/\f|\n{3,}/).filter(page => page.trim().length > 0);

}

  

// Extract specific chapters or sections

async extractSections(filePath: string, sectionHeaders: string[]): Promise<Map<string, string>> {

const parsed = await this.parse(filePath);

const sections = new Map<string, string>();

const text = parsed.text;

for (let i = 0; i < sectionHeaders.length; i++) {

const currentHeader = sectionHeaders[i];

const nextHeader = sectionHeaders[i + 1];

const startIndex = text.indexOf(currentHeader);

if (startIndex === -1) continue;

const endIndex = nextHeader

? text.indexOf(nextHeader, startIndex + currentHeader.length)

: text.length;

const sectionContent = text.substring(

startIndex + currentHeader.length,

endIndex

).trim();

sections.set(currentHeader, sectionContent);

}

return sections;

}

}

```

  

---

  

## Content Processing & Chunking

  

```typescript

// src/processors/ContentChunker.ts

  

interface ContentChunk {

id: string;

bookId: string;

chapterTitle: string;

chunkIndex: number;

content: string;

wordCount: number;

category?: string;

tags?: string[];

}

  

export class ContentChunker {

// Chunk content for better retrieval (important for AI/RAG systems)

chunkByParagraphs(

content: string,

maxWords: number = 500,

overlap: number = 50

): string[] {

const paragraphs = content.split(/\n\n+/);

const chunks: string[] = [];

let currentChunk: string[] = [];

let currentWordCount = 0;

  

for (const paragraph of paragraphs) {

const words = paragraph.split(/\s+/);

const paragraphWordCount = words.length;

  

if (currentWordCount + paragraphWordCount > maxWords && currentChunk.length > 0) {

// Save current chunk

chunks.push(currentChunk.join('\n\n'));

// Start new chunk with overlap

const overlapWords = currentChunk[currentChunk.length - 1]

.split(/\s+/)

.slice(-overlap)

.join(' ');

currentChunk = [overlapWords, paragraph];

currentWordCount = overlap + paragraphWordCount;

} else {

currentChunk.push(paragraph);

currentWordCount += paragraphWordCount;

}

}

  

// Add final chunk

if (currentChunk.length > 0) {

chunks.push(currentChunk.join('\n\n'));

}

  

return chunks;

}

  

// Semantic chunking (for exercises, techniques, etc.)

chunkByHeaders(content: string): Map<string, string> {

const chunks = new Map<string, string>();

// Match markdown-style headers or common patterns

const headerPattern = /^(#{1,6}|Chapter \d+|Exercise \d+|Technique:)(.+)$/gm;

const matches = Array.from(content.matchAll(headerPattern));

for (let i = 0; i < matches.length; i++) {

const currentMatch = matches[i];

const nextMatch = matches[i + 1];

const header = currentMatch[2].trim();

const startIndex = currentMatch.index! + currentMatch[0].length;

const endIndex = nextMatch ? nextMatch.index! : content.length;

const sectionContent = content.substring(startIndex, endIndex).trim();

chunks.set(header, sectionContent);

}

return chunks;

}

}

```

  

---

  

## Database Storage Strategy

  

### SQLite Schema for Content

  

```sql

-- Books/Resources table

CREATE TABLE resources (

id INTEGER PRIMARY KEY AUTOINCREMENT,

title TEXT NOT NULL,

author TEXT,

type TEXT NOT NULL, -- 'book', 'article', 'worksheet', 'exercise'

category TEXT NOT NULL, -- 'DBT', 'CBT', 'AA', 'NA', 'Mindfulness', etc.

source_file TEXT,

isbn TEXT,

publisher TEXT,

language TEXT DEFAULT 'en',

description TEXT,

cover_image TEXT,

total_pages INTEGER,

total_words INTEGER,

created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

updated_at DATETIME DEFAULT CURRENT_TIMESTAMP

);

  

-- Chapters/Sections table

CREATE TABLE resource_chapters (

id INTEGER PRIMARY KEY AUTOINCREMENT,

resource_id INTEGER NOT NULL,

chapter_number INTEGER NOT NULL,

title TEXT NOT NULL,

content TEXT NOT NULL,

word_count INTEGER,

FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE

);

  

-- Content chunks (for AI/RAG retrieval)

CREATE TABLE content_chunks (

id INTEGER PRIMARY KEY AUTOINCREMENT,

resource_id INTEGER NOT NULL,

chapter_id INTEGER,

chunk_index INTEGER NOT NULL,

content TEXT NOT NULL,

word_count INTEGER,

embedding BLOB, -- For vector search if using embeddings

FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,

FOREIGN KEY (chapter_id) REFERENCES resource_chapters(id) ON DELETE CASCADE

);

  

-- Coping strategies/techniques extracted from books

CREATE TABLE coping_techniques (

id INTEGER PRIMARY KEY AUTOINCREMENT,

resource_id INTEGER NOT NULL,

name TEXT NOT NULL,

description TEXT NOT NULL,

category TEXT NOT NULL, -- 'Grounding', 'Breathing', 'Distress Tolerance', etc.

instructions TEXT,

duration_minutes INTEGER,

difficulty TEXT, -- 'Beginner', 'Intermediate', 'Advanced'

tags TEXT, -- JSON array

source_page TEXT,

FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE

);

  

-- User bookmarks/highlights

CREATE TABLE user_content_bookmarks (

id INTEGER PRIMARY KEY AUTOINCREMENT,

user_id INTEGER NOT NULL,

resource_id INTEGER NOT NULL,

chapter_id INTEGER,

chunk_id INTEGER,

highlight_text TEXT,

note TEXT,

created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE

);

  

-- Full-text search index

CREATE VIRTUAL TABLE content_search USING fts5(

resource_id,

chapter_id,

content,

tokenize='porter unicode61'

);

  

-- Indexes for performance

CREATE INDEX idx_resources_category ON resources(category);

CREATE INDEX idx_chapters_resource ON resource_chapters(resource_id);

CREATE INDEX idx_chunks_resource ON content_chunks(resource_id);

CREATE INDEX idx_techniques_category ON coping_techniques(category);

```

  

### Database Storage Implementation

  

```typescript

// src/storage/DatabaseStorage.ts

import Database from 'better-sqlite3';

  

export class ContentDatabase {

private db: Database.Database;

  

constructor(dbPath: string) {

this.db = new Database(dbPath);

this.initSchema();

}

  

private initSchema() {

// Execute schema SQL from above

// ... (schema creation code)

}

  

async storeBook(parsed: ParsedBook, category: string) {

const insert = this.db.prepare(`

INSERT INTO resources (title, author, type, category, isbn, description,

cover_image, total_pages, total_words)

VALUES (?, ?, 'book', ?, ?, ?, ?, ?, ?)

`);

  

const result = insert.run(

parsed.metadata.title,

parsed.metadata.author,

category,

parsed.metadata.isbn,

parsed.metadata.description,

parsed.metadata.coverImage,

parsed.chapters.length,

parsed.totalWords

);

  

const resourceId = result.lastInsertRowid;

  

// Store chapters

const chapterInsert = this.db.prepare(`

INSERT INTO resource_chapters (resource_id, chapter_number, title, content, word_count)

VALUES (?, ?, ?, ?, ?)

`);

  

for (const chapter of parsed.chapters) {

chapterInsert.run(

resourceId,

chapter.order,

chapter.title,

chapter.content,

chapter.wordCount

);

}

  

return resourceId;

}

  

searchContent(query: string, category?: string): any[] {

let sql = `

SELECT r.id, r.title, r.author, c.title as chapter_title,

snippet(content_search, 2, '<mark>', '</mark>', '...', 30) as snippet

FROM content_search cs

JOIN resources r ON r.id = cs.resource_id

JOIN resource_chapters c ON c.id = cs.chapter_id

WHERE content_search MATCH ?

`;

  

const params: any[] = [query];

  

if (category) {

sql += ` AND r.category = ?`;

params.push(category);

}

  

sql += ` ORDER BY rank LIMIT 20`;

  

return this.db.prepare(sql).all(...params);

}

}

```

  

---

  

## Batch Processing Script

  

```typescript

// scripts/batch-process.ts

import { EpubParser } from '../src/parsers/EpubParser';

import { PdfParser } from '../src/parsers/PdfParser';

import { ContentDatabase } from '../src/storage/DatabaseStorage';

import { glob } from 'glob';

import path from 'path';

  

interface ProcessingConfig {

inputDir: string;

dbPath: string;

categories: {

[key: string]: string; // filename pattern -> category

};

}

  

async function processAllBooks(config: ProcessingConfig) {

const db = new ContentDatabase(config.dbPath);

const epubParser = new EpubParser();

const pdfParser = new PdfParser();

  

// Find all ebooks

const epubFiles = await glob(`${config.inputDir}/**/*.epub`);

const pdfFiles = await glob(`${config.inputDir}/**/*.pdf`);

  

console.log(`Found ${epubFiles.length} EPUB files and ${pdfFiles.length} PDF files`);

  

// Process EPUBs

for (const file of epubFiles) {

try {

console.log(`Processing EPUB: ${path.basename(file)}`);

const parsed = await epubParser.parse(file);

const category = detectCategory(file, config.categories);

await db.storeBook(parsed, category);

console.log(`✓ Stored: ${parsed.metadata.title}`);

} catch (error) {

console.error(`✗ Failed: ${file}`, error);

}

}

  

// Process PDFs

for (const file of pdfFiles) {

try {

console.log(`Processing PDF: ${path.basename(file)}`);

const parsed = await pdfParser.parse(file);

const category = detectCategory(file, config.categories);

// Convert PDF format to book format and store

console.log(`✓ Stored: ${parsed.metadata.title}`);

} catch (error) {

console.error(`✗ Failed: ${file}`, error);

}

}

}

  

function detectCategory(filename: string, patterns: { [key: string]: string }): string {

const lower = filename.toLowerCase();

for (const [pattern, category] of Object.entries(patterns)) {

if (lower.includes(pattern.toLowerCase())) {

return category;

}

}

return 'General';

}

  

// Usage

const config: ProcessingConfig = {

inputDir: './input/books',

dbPath: './output/content.db',

categories: {

'dbt': 'DBT',

'dialectical': 'DBT',

'cognitive': 'CBT',

'cbt': 'CBT',

'alcoholics': 'AA',

'narcotics': 'NA',

'mindfulness': 'Mindfulness',

'meditation': 'Mindfulness'

}

};

  

processAllBooks(config).catch(console.error);

```

  

---

  

## Integration with Luna App

  

### API Endpoint in Luna Backend

  

```typescript

// backend/routes/resourcesRouter.ts

import { Router } from 'express';

import Database from 'better-sqlite3';

  

const router = Router();

const contentDb = new Database('./content.db', { readonly: true });

  

// Search resources

router.get('/api/resources/search', (req, res) => {

const { q, category } = req.query;

// Full-text search implementation

// Return results

});

  

// Get resource by ID

router.get('/api/resources/:id', (req, res) => {

const resource = contentDb.prepare(`

SELECT * FROM resources WHERE id = ?

`).get(req.params.id);

const chapters = contentDb.prepare(`

SELECT * FROM resource_chapters WHERE resource_id = ? ORDER BY chapter_number

`).get(req.params.id);

res.json({ resource, chapters });

});

  

// Get coping techniques by category

router.get('/api/resources/techniques/:category', (req, res) => {

const techniques = contentDb.prepare(`

SELECT * FROM coping_techniques WHERE category = ?

`).all(req.params.category);

res.json(techniques);

});

  

export default router;

```

  

---

  

## Recommended Workflow

  

1. **Setup Separate Project**

```bash

mkdir Luna-Content-Processor

cd Luna-Content-Processor

npm init -y

npm install epubjs pdf-parse better-sqlite3 jsdom

npm install -D typescript @types/node

```

  

2. **Organize Your Books**

```

input/

├── DBT/

│ ├── dbt-skills-workbook.epub

│ └── dialectical-behavior-therapy.pdf

├── CBT/

│ ├── feeling-good-handbook.epub

│ └── cognitive-therapy-basics.pdf

├── AA/

│ ├── big-book.epub

│ └── twelve-steps.pdf

└── Mindfulness/

├── wherever-you-go.epub

└── mindfulness-workbook.pdf

```

  

3. **Process Books**

```bash

npm run process

# Creates content.db with all parsed content

```

  

4. **Copy Database to Luna**

```bash

cp output/content.db ../Luna/backend/content.db

```

  

5. **Use in Luna App**

- Query via API endpoints

- Display in Resources component

- Search for coping techniques

- Show relevant content based on user's journal entries

  

---

  

## Advanced Features to Consider

  

### 1. Vector Embeddings for Semantic Search

```typescript

// Using OpenAI or local embeddings

import { openai } from './openai-client';

  

async function generateEmbedding(text: string): Promise<number[]> {

const response = await openai.embeddings.create({

model: "text-embedding-3-small",

input: text

});

return response.data[0].embedding;

}

  

// Store embeddings in SQLite using sqlite-vss extension

```

  

### 2. Auto-Extract Exercises/Techniques

```typescript

// Use pattern matching or AI to extract structured exercises

const exercisePattern = /Exercise \d+:(.*?)(?=Exercise \d+:|$)/gs;

```

  

### 3. Content Recommendations

```typescript

// Based on journal entries, recommend relevant book sections

async function recommendContent(journalEntry: string) {

// Analyze journal sentiment/topics

// Match to relevant book chapters

// Return recommendations

}

```

  

---

  

## Security & Legal Considerations

  

⚠️ **Important**:

- Ensure you have legal rights to parse and store copyrighted material

- Consider fair use limitations

- For public-facing app, only use public domain or licensed content

- For personal use, standard "bought for personal use" rights apply

- Don't redistribute parsed content without permission

  

---

  

## Next Steps

  

1. ✅ Create separate `Luna-Content-Processor` repository

2. ✅ Implement EPUB and PDF parsers

3. ✅ Setup SQLite database schema

4. ✅ Create batch processing script

5. ✅ Test with sample books

6. ✅ Integrate with Luna backend API

7. ✅ Build frontend components to display content

  

---

  

## Resources & Libraries

  

- **EPUB**: [epub.js](https://github.com/futurepress/epub.js/)

- **PDF**: [pdf-parse](https://www.npmjs.com/package/pdf-parse), [pdf-lib](https://github.com/Hopding/pdf-lib)

- **MOBI**: [mobi](https://www.npmjs.com/package/mobi) or convert to EPUB first with Calibre

- **Database**: [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)

- **FTS**: [SQLite FTS5](https://www.sqlite.org/fts5.html)

- **Vector Search**: [sqlite-vss](https://github.com/asg017/sqlite-vss)

  

---

  

*Last Updated: November 5, 2025*