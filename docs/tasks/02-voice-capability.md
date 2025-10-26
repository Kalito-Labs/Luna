# Voice Capability for AI Models

## Overview
Enable Kalito to communicate via voice - both speech-to-text (listening) and text-to-speech (speaking) - allowing for hands-free interaction, which is crucial for caregiving scenarios when hands are busy.

## Project Context

**Deployment Setup:**
- **Server**: Hosted on your Kubuntu laptop (local network)
- **Primary Users**: Parents using iPads (iOS Safari/Chrome) and Android phones
- **Architecture**: Progressive Web App (PWA) accessed via local IP address
- **Your Setup**: Brave/Chrome on Kubuntu (development)
- **Network**: Local network access, PWA installation on devices

**Why This Matters for Voice:**
- ✅ iOS Safari has **excellent** native Web Speech API support (Siri's engine)
- ✅ Chrome/Brave on iPad/Android have **excellent** Web Speech API support
- ✅ No need for cloud APIs when browser-native works perfectly
- ✅ Voice processing happens locally on iPad/phone (privacy + low latency)
- ✅ Works offline after PWA installation

## Use Cases

### Primary Use Cases
1. **Hands-Free Queries**: Ask questions while helping a patient
2. **Medication Reminders**: Voice announcements for medication times
3. **Appointment Alerts**: Spoken reminders for upcoming appointments
4. **Quick Status Checks**: "Kalito, when is Dad's next doctor appointment?"
5. **Accessibility**: Essential for aging users or those with vision impairments
6. **Spanish Language Support**: Voice in both English and Spanish

### Example Scenarios
- Voice reminder: "It's 8 AM. Time for Aurora's Lisinopril 10mg"
- Voice query: "Kalito, what medications does Dad take in the morning?"
- Voice response: "Your father takes three medications in the morning: Lisinopril 10mg, Metformin 500mg, and Aspirin 81mg"

---

## Architecture Decision

**Chosen Approach:** Web Speech API (Browser-Based) - **Perfect for Your PWA Setup**

### Why Web Speech API is the Clear Winner

**For Your Specific Setup:**

| Device/Browser | Speech Recognition | Text-to-Speech | Quality | Notes |
|----------------|-------------------|----------------|---------|-------|
| **iPad Safari** ⭐ | ✅ Excellent | ✅ Excellent | ⭐⭐⭐⭐⭐ | Uses iOS Siri engine - native quality |
| **iPad Chrome** | ✅ Excellent | ✅ Excellent | ⭐⭐⭐⭐⭐ | Full Chromium support |
| **iPad Brave** | ✅ Excellent | ✅ Excellent | ⭐⭐⭐⭐⭐ | Chromium-based, same as Chrome |
| **Android Chrome** | ✅ Excellent | ✅ Excellent | ⭐⭐⭐⭐⭐ | Google's native engine |
| **Kubuntu Brave** | ✅ Good | ✅ Good | ⭐⭐⭐⭐ | Works well for development |

**Key Advantages:**

1. **Cost**: 
   - ✅ **$0/month** - Completely free
   - ✅ No API keys to manage
   - ✅ No usage limits or quotas

2. **Performance**:
   - ✅ **Lower latency** than cloud APIs (runs locally on device)
   - ✅ Works even if local network is slow
   - ✅ No backend processing needed
   - ✅ Instant response time

3. **Privacy**:
   - ✅ **Voice data stays on device** (huge plus for health information)
   - ✅ No audio sent to external servers
   - ✅ HIPAA-friendly (if needed)
   - ✅ No logging or tracking

4. **Bilingual Support**:
   - ✅ Both `en-US` and `es-ES` natively supported on iOS/Android
   - ✅ High-quality Spanish voices (iOS has excellent Spanish voice actors)
   - ✅ Language switching is instant
   - ✅ No additional cost for multilingual

5. **PWA Integration**:
   - ✅ Works seamlessly in PWA mode on iPad/Android
   - ✅ Microphone permissions persist after PWA install
   - ✅ Works offline (after initial setup)
   - ✅ Native-like experience

6. **Implementation**:
   - ✅ ~2-3 hours to implement
   - ✅ ~150 lines of clean code
   - ✅ No backend changes needed
   - ✅ Simple, maintainable

**Why NOT OpenAI Whisper/TTS (for now):**
- ❌ Costs $10-15/month (unnecessary when Web Speech is excellent)
- ❌ Higher latency (cloud round-trip)
- ❌ Requires internet (Web Speech works offline after PWA install)
- ❌ More complex implementation
- ❌ Audio sent to external servers (privacy concern)
- ❌ No significant quality advantage on iOS devices

---

## Complete Implementation

### 1. Voice Composable (Core Logic)

```typescript
// frontend/src/composables/useVoice.ts

import { ref, onMounted } from 'vue'

interface VoiceOptions {
  lang: 'en-US' | 'es-ES'
  rate?: number
  pitch?: number
  volume?: number
}

export function useVoice() {
  const isListening = ref(false)
  const isSupported = ref(false)
  const isSpeaking = ref(false)
  const interimTranscript = ref('')
  
  let recognition: SpeechRecognition | null = null

  // Check browser support
  onMounted(() => {
    const hasSpeechSynthesis = 'speechSynthesis' in window
    const hasSpeechRecognition = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
    
    isSupported.value = hasSpeechSynthesis && hasSpeechRecognition

    if (isSupported.value) {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
      recognition = new SpeechRecognitionAPI()
    }

    // Load voices (especially important for iOS)
    if (hasSpeechSynthesis) {
      window.speechSynthesis.getVoices()
      // iOS Safari requires this event listener
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices()
      }
    }
  })

  // Speech-to-Text (Listening)
  function startListening(
    lang: 'en-US' | 'es-ES' = 'en-US',
    onResult: (transcript: string) => void,
    onError?: (error: string) => void
  ) {
    if (!recognition) {
      console.error('Speech recognition not supported')
      return
    }

    recognition.lang = lang
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      isListening.value = true
      interimTranscript.value = ''
    }

    recognition.onresult = (event) => {
      const results = event.results
      const lastResult = results[results.length - 1]
      
      if (lastResult.isFinal) {
        const transcript = lastResult[0].transcript
        onResult(transcript)
        interimTranscript.value = ''
      } else {
        // Show interim results
        interimTranscript.value = lastResult[0].transcript
      }
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      if (onError) {
        onError(event.error)
      }
      isListening.value = false
      interimTranscript.value = ''
    }

    recognition.onend = () => {
      isListening.value = false
      interimTranscript.value = ''
    }

    try {
      recognition.start()
    } catch (error) {
      console.error('Failed to start recognition:', error)
      isListening.value = false
    }
  }

  function stopListening() {
    if (recognition) {
      recognition.stop()
    }
    isListening.value = false
    interimTranscript.value = ''
  }

  // Text-to-Speech (Speaking)
  function speak(text: string, options: VoiceOptions = { lang: 'en-US' }) {
    // Stop any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = options.lang
    utterance.rate = options.rate || 0.95 // Slightly slower for clarity
    utterance.pitch = options.pitch || 1.0
    utterance.volume = options.volume || 1.0

    // Get the best voice for the language
    const voices = window.speechSynthesis.getVoices()
    
    // Prefer high-quality voices
    const preferredVoiceNames = options.lang === 'es-ES' 
      ? ['Monica', 'Paulina', 'Google español', 'Spanish Female'] // Spanish voices
      : ['Samantha', 'Karen', 'Google US English', 'English Female'] // English voices

    let selectedVoice = voices.find(v => 
      v.lang.startsWith(options.lang.split('-')[0]) && 
      preferredVoiceNames.some(name => v.name.includes(name))
    )

    // Fallback to any voice matching the language
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.startsWith(options.lang.split('-')[0]))
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice
    }

    utterance.onstart = () => {
      isSpeaking.value = true
    }

    utterance.onend = () => {
      isSpeaking.value = false
    }

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error)
      isSpeaking.value = false
    }

    window.speechSynthesis.speak(utterance)
  }

  function stopSpeaking() {
    window.speechSynthesis.cancel()
    isSpeaking.value = false
  }

  return {
    isSupported,
    isListening,
    isSpeaking,
    interimTranscript,
    startListening,
    stopListening,
    speak,
    stopSpeaking
  }
}
```

### 2. Voice Control Component

```vue
<!-- frontend/src/components/VoiceControl.vue -->

<template>
  <div class="voice-control">
    <!-- Browser Support Warning -->
    <div v-if="!isSupported" class="warning">
      ⚠️ Voice features not supported in this browser. Please use Chrome, Safari, or Brave.
    </div>

    <template v-else>
      <!-- Voice Input Button -->
      <button 
        @click="toggleListening"
        :class="['voice-btn', { active: isListening }]"
        :disabled="isSpeaking"
      >
        <span v-if="!isListening">🎤 {{ currentLang === 'en-US' ? 'Speak' : 'Hablar' }}</span>
        <span v-else>🔴 {{ currentLang === 'en-US' ? 'Listening...' : 'Escuchando...' }}</span>
      </button>

      <!-- Language Toggle -->
      <button 
        @click="toggleLanguage" 
        class="lang-btn"
        :disabled="isListening || isSpeaking"
      >
        {{ currentLang === 'en-US' ? '🇺🇸 English' : '🇪🇸 Español' }}
      </button>

      <!-- Voice Output Toggle -->
      <button 
        @click="toggleVoiceOutput" 
        :class="['speaker-btn', { active: voiceOutputEnabled }]"
        :title="voiceOutputEnabled ? 'Voice output ON' : 'Voice output OFF'"
      >
        {{ voiceOutputEnabled ? '🔊' : '🔇' }}
      </button>

      <!-- Interim Transcript (what's being said in real-time) -->
      <div v-if="isListening && interimTranscript" class="interim-text">
        <span class="interim-label">{{ currentLang === 'en-US' ? 'Hearing' : 'Oyendo' }}:</span>
        {{ interimTranscript }}
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useVoice } from '@/composables/useVoice'

const emit = defineEmits<{
  voiceInput: [text: string]
}>()

const currentLang = ref<'en-US' | 'es-ES'>('en-US')
const voiceOutputEnabled = ref(true)

const { 
  isSupported,
  isListening, 
  isSpeaking,
  interimTranscript,
  startListening, 
  stopListening,
  speak,
  stopSpeaking
} = useVoice()

function toggleListening() {
  if (isListening.value) {
    stopListening()
  } else {
    startListening(
      currentLang.value,
      (transcript: string) => {
        console.log('Voice input:', transcript)
        emit('voiceInput', transcript)
      },
      (error: string) => {
        console.error('Voice error:', error)
        // Could show user-friendly error message here
      }
    )
  }
}

function toggleLanguage() {
  currentLang.value = currentLang.value === 'en-US' ? 'es-ES' : 'en-US'
  // Store preference in localStorage
  localStorage.setItem('kalito-voice-lang', currentLang.value)
}

function toggleVoiceOutput() {
  voiceOutputEnabled.value = !voiceOutputEnabled.value
  // Store preference in localStorage
  localStorage.setItem('kalito-voice-output', voiceOutputEnabled.value.toString())
  
  // Stop speaking if turning off
  if (!voiceOutputEnabled.value && isSpeaking.value) {
    stopSpeaking()
  }
}

// Speak AI response (called from parent component)
function speakResponse(text: string) {
  if (voiceOutputEnabled.value && text) {
    speak(text, { lang: currentLang.value })
  }
}

// Load saved preferences
function loadPreferences() {
  const savedLang = localStorage.getItem('kalito-voice-lang')
  if (savedLang === 'es-ES' || savedLang === 'en-US') {
    currentLang.value = savedLang
  }

  const savedOutput = localStorage.getItem('kalito-voice-output')
  if (savedOutput !== null) {
    voiceOutputEnabled.value = savedOutput === 'true'
  }
}

loadPreferences()

defineExpose({ speakResponse, currentLang })
</script>

<style scoped>
.voice-control {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px;
  background: var(--bg-panel);
  border-radius: 8px;
  flex-wrap: wrap;
}

.warning {
  padding: 12px 16px;
  background: var(--warning-bg, #fff3cd);
  color: var(--warning-text, #856404);
  border-radius: 6px;
  font-size: 0.9rem;
}

.voice-btn {
  padding: 12px 24px;
  border-radius: 8px;
  background: var(--accent-blue);
  color: white;
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  font-size: 1rem;
}

.voice-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.voice-btn.active {
  background: var(--led-red, #dc3545);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.lang-btn, .speaker-btn {
  padding: 12px 16px;
  border-radius: 8px;
  background: var(--bg-glass);
  border: 1px solid var(--border);
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.lang-btn:disabled, .speaker-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.speaker-btn.active {
  background: var(--accent-blue);
  color: white;
  border-color: var(--accent-blue);
}

.interim-text {
  flex: 1 1 100%;
  padding: 8px 16px;
  background: var(--bg-glass);
  border-radius: 6px;
  font-style: italic;
  color: var(--text-muted);
  margin-top: 4px;
}

.interim-label {
  font-weight: 600;
  color: var(--accent-blue);
  margin-right: 8px;
}
</style>
```

### 3. Integration with Chat Panel

```vue
<!-- frontend/src/components/chat/ChatPanel.vue (modifications) -->

<template>
  <div class="chat-panel">
    <!-- Voice Controls at top -->
    <VoiceControl 
      ref="voiceControlRef"
      @voice-input="handleVoiceInput"
    />

    <!-- Existing chat messages -->
    <div class="messages">
      <Message 
        v-for="msg in messages" 
        :key="msg.id"
        :message="msg"
      />
    </div>

    <!-- Input area -->
    <div class="input-area">
      <input 
        v-model="userInput"
        @keyup.enter="sendMessage"
        :placeholder="getPlaceholder()"
      />
      <button @click="sendMessage">
        {{ voiceControlRef?.currentLang === 'es-ES' ? 'Enviar' : 'Send' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import VoiceControl from '@/components/VoiceControl.vue'

const voiceControlRef = ref<InstanceType<typeof VoiceControl>>()
const userInput = ref('')
const messages = ref<Array<{ role: string, content: string }>>([])

function getPlaceholder() {
  const lang = voiceControlRef.value?.currentLang
  return lang === 'es-ES' 
    ? 'Escribe o habla tu mensaje...' 
    : 'Type or speak your message...'
}

async function handleVoiceInput(text: string) {
  userInput.value = text
  await sendMessage()
}

async function sendMessage() {
  if (!userInput.value.trim()) return

  const userMessage = userInput.value.trim()
  userInput.value = ''

  // Add user message to chat
  messages.value.push({ role: 'user', content: userMessage })

  try {
    // Send to backend API
    const response = await fetch('/api/agent/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: userMessage,
        sessionId: 'current-session-id' // Use your session management
      })
    })

    const data = await response.json()
    const aiResponse = data.reply || data.message || 'Error: No response'
    
    // Add AI response to chat
    messages.value.push({ role: 'assistant', content: aiResponse })

    // Speak the response
    voiceControlRef.value?.speakResponse(aiResponse)
    
  } catch (error) {
    console.error('Failed to send message:', error)
    messages.value.push({ 
      role: 'assistant', 
      content: 'Sorry, I encountered an error. Please try again.' 
    })
  }
}
</script>
```

### 4. Type Definitions

```typescript
// frontend/src/types/voice.ts

export interface VoiceOptions {
  lang: 'en-US' | 'es-ES'
  rate?: number
  pitch?: number
  volume?: number
}

export interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

export interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

export interface SpeechRecognitionResult {
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

export interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

// Extend window for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}
```

---

## Bilingual (English/Spanish) Support

The Web Speech API handles bilingual support natively - no translation layer needed!

### How It Works:

1. **Language Detection** (Optional):
   - User can manually toggle language with button
   - Or auto-detect based on first few words spoken
   - Preference saved in localStorage

2. **Voice Recognition**:
   - `recognition.lang = 'en-US'` → English recognition
   - `recognition.lang = 'es-ES'` → Spanish recognition
   - Both work excellently on iOS/Android

3. **Voice Output**:
   - iOS has beautiful native Spanish voices
   - Android has Google's high-quality Spanish voices
   - No additional setup required

### Spanish System Prompt

```typescript
// In your agentService.ts
const SYSTEM_PROMPTS = {
  en: `You are Kalito, a dedicated AI care companion...`,
  
  es: `Eres Kalito, un compañero de cuidado de IA dedicado para la familia...`
}

// Detect language from user input or use voice control language setting
function getSystemPrompt(language: 'en' | 'es'): string {
  return SYSTEM_PROMPTS[language]
}
```

---

## PWA Integration

### Manifest Configuration

```json
// frontend/public/manifest.json

{
  "name": "Kalito - Family Care Assistant",
  "short_name": "Kalito",
  "description": "AI-powered eldercare companion",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#007bff",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "permissions": [
    "microphone"
  ],
  "features": [
    "audio-input",
    "audio-output"
  ]
}
```

### Service Worker (Voice Permissions)

```typescript
// frontend/public/sw.js

// Cache voice assets for offline use
const CACHE_NAME = 'kalito-voice-v1'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/assets/main.js',
        '/assets/main.css'
      ])
    })
  )
})
```

---

## Testing Strategy

### Manual Testing Checklist

```typescript
// Test on each device/browser combination

const TEST_CASES = [
  // Basic Functionality
  { test: 'Click microphone button', expected: 'Microphone permission requested' },
  { test: 'Say "Hello Kalito"', expected: 'Text appears in chat input' },
  { test: 'AI responds', expected: 'Response is spoken aloud' },
  
  // Language Switching
  { test: 'Switch to Spanish', expected: 'Button shows 🇪🇸 Español' },
  { test: 'Say "Hola Kalito"', expected: 'Spanish recognized correctly' },
  { test: 'AI responds in Spanish', expected: 'Spanish voice output' },
  
  // Voice Output Control
  { test: 'Click speaker button to mute', expected: 'AI response not spoken' },
  { test: 'Click speaker button to unmute', expected: 'AI responses spoken again' },
  
  // PWA Mode
  { test: 'Install PWA on iPad', expected: 'App opens in standalone mode' },
  { test: 'Voice works in PWA mode', expected: 'Microphone accessible' },
  { test: 'Offline voice (after cache)', expected: 'Voice recognition still works' },
  
  // Edge Cases
  { test: 'Background noise', expected: 'Recognition still accurate' },
  { test: 'Long sentence', expected: 'Full sentence captured' },
  { test: 'Interrupt AI speaking', expected: 'Speech stops cleanly' }
]
```

### Device-Specific Testing

**iPad (Primary Device):**
- ✅ Test in Safari (primary browser for parents)
- ✅ Test in Chrome
- ✅ Test in Brave
- ✅ Test PWA installation
- ✅ Test microphone permissions persist after install
- ✅ Test both English and Spanish voices
- ✅ Test with iPad locked/unlocked

**Android Phone:**
- ✅ Test in Chrome (primary Android browser)
- ✅ Test PWA installation
- ✅ Test microphone permissions

**Development (Kubuntu):**
- ✅ Test in Brave/Chrome
- ✅ Verify console logs for debugging

---

## Cost Analysis

| Solution | Setup Time | Monthly Cost | Quality on iOS | Privacy | Latency |
|----------|-----------|--------------|----------------|---------|---------|
| **Web Speech API** ⭐ | **2-3 hours** | **$0** | **⭐⭐⭐⭐⭐** | **Excellent** | **~50ms** |
| OpenAI Whisper/TTS | 4-5 hours | $10-15 | ⭐⭐⭐⭐⭐ | Good | ~500ms |
| Google Cloud | 6-8 hours | $0-10 | ⭐⭐⭐⭐ | Fair | ~300ms |
| Local Whisper | 8-12 hours | $0 | ⭐⭐⭐ | Excellent | ~200ms |

**Winner: Web Speech API** - Best combination of cost, quality, and simplicity for your PWA setup.

---

## Implementation Timeline

### Phase 1: Basic Voice (2-3 hours)
- ✅ Create `useVoice.ts` composable (1 hour)
- ✅ Create `VoiceControl.vue` component (1 hour)
- ✅ Integrate with `ChatPanel.vue` (30 min)
- ✅ Test on development machine (30 min)

### Phase 2: Spanish Support (1 hour)
- ✅ Add language toggle button (15 min)
- ✅ Test Spanish recognition (15 min)
- ✅ Test Spanish voice output (15 min)
- ✅ Save language preference (15 min)

### Phase 3: PWA Testing (1-2 hours)
- ✅ Test PWA installation on iPad (30 min)
- ✅ Test microphone permissions (30 min)
- ✅ Test offline functionality (30 min)
- ✅ Final testing with parents (30 min)

**Total Implementation Time: 4-6 hours**

---

## Accessibility Features

### Voice Commands (Future Enhancement)

```typescript
// Optional: Add voice commands for navigation

const VOICE_COMMANDS = {
  en: {
    'show medications': () => router.push('/eldercare/medications'),
    'show appointments': () => router.push('/eldercare/appointments'),
    'help': () => showHelpDialog()
  },
  es: {
    'mostrar medicamentos': () => router.push('/eldercare/medications'),
    'mostrar citas': () => router.push('/eldercare/appointments'),
    'ayuda': () => showHelpDialog()
  }
}
```

---

## Security & Privacy

### Microphone Permissions

```typescript
// Request permissions gracefully
async function requestMicrophonePermission() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach(track => track.stop())
    return true
  } catch (error) {
    console.error('Microphone permission denied:', error)
    return false
  }
}
```

### Privacy Guarantees

✅ **All voice processing happens on-device**
- Speech recognition runs in the browser (uses iOS/Android native engines)
- No audio is sent to external servers
- No audio is saved or logged
- No third-party analytics on voice data

✅ **HIPAA-Friendly**
- Voice data never leaves the device
- Health information discussed via voice is not transmitted
- Only text transcripts are sent to your backend (not audio)

---

## Future Enhancements (Optional)

### If Web Speech API Quality Isn't Sufficient

**Unlikely scenario**, but if you find Web Speech API doesn't meet your needs:

### Option: Add OpenAI Whisper/TTS Fallback

**When you might want this:**
- ❌ Web Speech quality isn't good enough (unlikely on iOS)
- ✅ You want "premium" ultra-natural voices
- ✅ You add Firefox support (Web Speech limited)
- ✅ Budget allows $10-15/month

**Implementation approach:**


```typescript
// backend/logic/voiceService.ts (OPTIONAL - only if needed later)

import OpenAI from 'openai'

export class VoiceService {
  private openai: OpenAI

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }

  // Speech-to-Text (Whisper)
  async transcribe(audioFile: Buffer, language: 'en' | 'es' = 'en'): Promise<string> {
    const file = new File([audioFile], 'audio.webm', { type: 'audio/webm' })
    
    const transcription = await this.openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: language,
      response_format: 'text'
    })

    return transcription
  }

  // Text-to-Speech
  async generateSpeech(
    text: string, 
    voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'nova',
    speed: number = 1.0
  ): Promise<Buffer> {
    const mp3 = await this.openai.audio.speech.create({
      model: 'tts-1', // or 'tts-1-hd' for higher quality
      voice: voice,
      input: text,
      speed: speed
    })

    const buffer = Buffer.from(await mp3.arrayBuffer())
    return buffer
  }
}
```

**When to add this:**
- You find Web Speech quality insufficient (test first!)
- You want ultra-premium voices
- Budget allows $10-15/month

**Pricing:**
- Whisper: $0.006 per minute of audio
- TTS: $15 per 1M characters (tts-1), $30 per 1M (tts-1-hd)
- Estimated: ~$10-15/month for moderate use

**Recommendation:** Start with Web Speech API, only add OpenAI if truly needed.

---

## Summary

**Decision:** Web Speech API (Browser-Based) - Perfect for your PWA/iPad setup

**Why it's perfect:**
- ✅ $0/month (completely free)
- ✅ Excellent quality on iOS/Android (native engines)
- ✅ Low latency (~50ms vs ~500ms for cloud)
- ✅ Privacy-friendly (all on-device)
- ✅ Bilingual support built-in (en-US, es-ES)
- ✅ Works in PWA mode
- ✅ Simple implementation (4-6 hours total)

**Implementation:**
1. Create `useVoice.ts` composable (~150 lines)
2. Create `VoiceControl.vue` component (~200 lines)
3. Integrate with existing chat
4. Test on iPad/Android
5. Done!

**Next:** After implementing this, move on to bilingual support documentation (already handled by voice component)!