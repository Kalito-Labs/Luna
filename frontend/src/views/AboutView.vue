<template>
  <div class="about-view">
    <!-- Hamburger button/menu, top left -->
    <div class="hamburger-fixed">
      <HamburgerMenu />
    </div>
    
    <div class="about-container">
      <div class="about-header">
        <h1 class="about-title">What is Kalito-Space</h1>
      </div>
      
      <div class="about-content">
        <div class="intro-section">
          <p class="intro-text">
            Kalito-Space is a hybrid AI platform that bridges local and cloud AI models through intelligent 
            memory management, persona-driven interactions, and context optimization.
          </p>
        </div>
        
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">�</div>
            <h3 class="feature-title">Hybrid Memory System</h3>
            <p class="feature-description">
              Advanced memory management with automatic summarization, semantic pins, and importance scoring. 
              Maintains context across long conversations without overwhelming AI models with excessive history.
            </p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">🔗</div>
            <h3 class="feature-title">Hybrid AI Architecture</h3>
            <p class="feature-description">
              Seamlessly connects local models (Qwen, DeepSeek, Llama) with cloud providers (OpenAI, Claude). 
              Intelligent routing based on model capabilities and network availability.
            </p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">👤</div>
            <h3 class="feature-title">Voice-Ready Personas</h3>
            <p class="feature-description">
              Sophisticated persona system with specialized AI assistants for different domains. Each persona 
              has custom system prompts, behavioral patterns, and context awareness tailored to specific tasks.
            </p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">�</div>
            <h3 class="feature-title">Semantic Context Pins</h3>
            <p class="feature-description">
              Pin important concepts, code snippets, and decisions directly from conversations. The system 
              automatically prioritizes pinned content in future context assembly for consistent AI responses.
            </p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">🔄</div>
            <h3 class="feature-title">Offline-First Design</h3>
            <p class="feature-description">
              Full functionality with local AI models when offline. Intelligent fallback mechanisms ensure 
              continuous operation regardless of network connectivity or cloud service availability.
            </p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">⚡</div>
            <h3 class="feature-title">Performance Optimization</h3>
            <p class="feature-description">
              Multi-level caching, smart context truncation, and database optimization. Maintains responsive 
              performance even with extensive conversation history and complex memory structures.
            </p>
          </div>
        </div>
        
        <div class="technical-section">
          <h2 class="section-title">Technical Architecture</h2>
          <div class="tech-grid">
            <div class="tech-card">
              <h4 class="tech-title">Memory Management</h4>
              <div class="tech-details">
                <div class="tech-item">Automatic conversation summarization every 15 messages</div>
                <div class="tech-item">Importance scoring (0.0-1.0) based on content heuristics</div>
                <div class="tech-item">Smart context building with 3000 token budget optimization</div>
                <div class="tech-item">5-second performance caching with intelligent invalidation</div>
              </div>
            </div>
            <div class="tech-card">
              <h4 class="tech-title">Model Integration</h4>
              <div class="tech-details">
                <div class="tech-item">Local models: Qwen 2.5, Mistral-7B </div>
                <div class="tech-item">Cloud providers: OpenAI GPT-4, Claude 3.5 Sonnet</div>
                <div class="tech-item">Session-aware model selection for summarization</div>
                <div class="tech-item">Automatic fallback routing for reliability</div>
              </div>
            </div>
          </div>
        </div>

        <div class="capabilities-section">
          <h2 class="section-title">Core Capabilities</h2>
          <div class="capabilities-list">
            <div class="capability-item">
              <span class="capability-icon">🧠</span>
              <span class="capability-text">Context-aware conversations with semantic memory</span>
            </div>
            <div class="capability-item">
              <span class="capability-icon">📌</span>
              <span class="capability-text">Manual semantic pins for important concepts</span>
            </div>
            <div class="capability-item">
              <span class="capability-icon">�</span>
              <span class="capability-text">Hybrid local/cloud model orchestration</span>
            </div>
            <div class="capability-item">
              <span class="capability-icon">💾</span>
              <span class="capability-text">Persistent session management with SQLite backend</span>
            </div>
            <div class="capability-item">
              <span class="capability-icon">⚙️</span>
              <span class="capability-text">Advanced model parameter control (temperature, top-p, tokens)</span>
            </div>
            <div class="capability-item">
              <span class="capability-icon">🎭</span>
              <span class="capability-text">Specialized personas with domain expertise</span>
            </div>
            <div class="capability-item">
              <span class="capability-icon">📊</span>
              <span class="capability-text">Token usage tracking and optimization</span>
            </div>
            <div class="capability-item">
              <span class="capability-icon">�️</span>
              <span class="capability-text">Offline operation with local model validation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import HamburgerMenu from '../components/HamburgerMenu.vue'
// This component is a static about page
</script>

<style scoped>
.about-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0e1a 0%, #1a1f2e 100%);
  font-family: var(--font-base);
  overflow: auto;
}

/* Fixed hamburger placement */
.hamburger-fixed {
  position: fixed;
  top: 32px;
  left: 32px;
  z-index: 2001;
}

.about-container {
  max-width: 1200px;
  margin: 0 auto;
  color: #e2e8f0;
}

.about-header {
  text-align: center;
  margin-top: .5rem;
}

.about-title {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #8fd8fc 0%, #a6d3f7 50%, #6eadcc 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 1rem;
  letter-spacing: -0.02em;
}

.about-subtitle {
  font-size: 1.5rem;
  color: #94a3b8;
  font-weight: 400;
  opacity: 0.9;
}

.about-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.intro-section {
  text-align: center;
  padding: 0 2rem;
}

.intro-text {
  font-size: 1.25rem;
  line-height: 1.8;
  color: #cbd5e1;
  max-width: 800px;
  margin: 0 auto;
  opacity: 0.95;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  padding: 0 1rem;
}

.feature-card {
  background: rgba(12, 14, 18, 0.6);
  border: 1.5px solid rgba(66, 72, 110, 0.25);
  border-radius: 1rem;
  padding: 2rem;
  backdrop-filter: blur(10px) saturate(160%);
  -webkit-backdrop-filter: blur(10px) saturate(160%);
  box-shadow: 
    0 6px 32px 0 rgba(0, 0, 0, 0.3),
    0 0 0 1.5px rgba(58, 65, 101, 0.2);
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  border-color: rgba(143, 216, 252, 0.4);
  box-shadow: 
    0 12px 48px 0 rgba(0, 0, 0, 0.4),
    0 0 0 1.5px rgba(143, 216, 252, 0.3);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  display: block;
}

.feature-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #8fd8fc;
  margin-bottom: 1rem;
  letter-spacing: -0.01em;
}

.feature-description {
  font-size: 1rem;
  line-height: 1.6;
  color: #94a3b8;
  opacity: 0.9;
}

.capabilities-section {
  background: rgba(8, 10, 14, 0.4);
  border: 1.5px solid rgba(66, 72, 110, 0.15);
  border-radius: 1.2rem;
  padding: 3rem 2rem;
  backdrop-filter: blur(8px) saturate(140%);
  -webkit-backdrop-filter: blur(8px) saturate(140%);
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #8fd8fc;
  text-align: center;
  margin-bottom: 2.5rem;
  letter-spacing: -0.02em;
}

.capabilities-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  max-width: 900px;
  margin: 0 auto;
}

.capability-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: rgba(15, 17, 23, 0.5);
  border: 1px solid rgba(66, 72, 110, 0.2);
  border-radius: 0.75rem;
  transition: all 0.2s ease;
}

.capability-item:hover {
  background: rgba(20, 22, 28, 0.7);
  border-color: rgba(110, 173, 204, 0.3);
  transform: translateX(5px);
}

.capability-icon {
  font-size: 1.5rem;
  opacity: 0.9;
}

.capability-text {
  font-size: 1.1rem;
  color: #cbd5e1;
  font-weight: 400;
}

/* Technical section styles */
.technical-section {
  background: rgba(6, 8, 12, 0.5);
  border: 1.5px solid rgba(83, 92, 145, 0.2);
  border-radius: 1.2rem;
  padding: 3rem 2rem;
  margin-bottom: 2rem;
  backdrop-filter: blur(12px) saturate(150%);
  -webkit-backdrop-filter: blur(12px) saturate(150%);
}

.tech-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.tech-card {
  background: rgba(10, 12, 18, 0.7);
  border: 1px solid rgba(66, 72, 110, 0.3);
  border-radius: 1rem;
  padding: 2rem;
  transition: all 0.3s ease;
}

.tech-card:hover {
  border-color: rgba(143, 216, 252, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.tech-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: #8fd8fc;
  margin-bottom: 1.5rem;
  letter-spacing: -0.01em;
}

.tech-details {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.tech-item {
  font-size: 0.95rem;
  color: #94a3b8;
  padding-left: 1rem;
  position: relative;
  line-height: 1.5;
}

.tech-item::before {
  content: "▸";
  position: absolute;
  left: 0;
  color: #6eadcc;
  font-weight: 600;
}

/* Responsive design */
@media (max-width: 768px) {
  .about-view {
    padding: 1rem;
  }
  
  .about-title {
    font-size: 2.5rem;
  }
  
  .about-subtitle {
    font-size: 1.2rem;
  }
  
  .intro-text {
    font-size: 1.1rem;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .tech-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .tech-card {
    padding: 1.5rem;
  }
  
  .technical-section {
    padding: 2rem 1.5rem;
  }
  
  .feature-card {
    padding: 1.5rem;
  }
  
  .capabilities-section {
    padding: 2rem 1.5rem;
  }
  
  .section-title {
    font-size: 2rem;
  }
  
  .capabilities-list {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>
