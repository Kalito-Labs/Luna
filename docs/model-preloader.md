# Model Preloader System

## Overview

The Model Preloader system eliminates "cold start" delays for local AI models by warming them up during backend startup. This ensures instant responses from the first chat message, significantly improving user experience.

## Problem Statement

Local AI models (via Ollama) experience significant delays on first use:
- **Cold Start Delay**: 10-30 seconds for first response
- **User Impact**: Poor experience waiting for initial model loading
- **Resource Utilization**: Models loaded on-demand waste time

## Solution Architecture

### Core Components

1. **`modelPreloader.ts`** - Main preloader service
2. **Integration with `server.ts`** - Startup orchestration
3. **Model Registry** - Centralized model management
4. **Health Monitoring** - Continuous model status checking

### Implementation Details

#### Preloader Configuration

```typescript
const MODELS_TO_PRELOAD: PreloadConfig[] = [
  {
    model: 'qwen2.5-coder:3b',
    displayName: 'Qwen 2.5 Coder 3B',
    maxRetries: 3,
    retryDelayMs: 2000,
  },
  {
    model: 'tinyllama:latest',
    displayName: 'TinyLlama 1.1B',
    maxRetries: 3,
    retryDelayMs: 1000, // Faster retry for smaller model
  },
]
```

#### Key Features

- **Parallel Processing**: Multiple models preload simultaneously
- **Retry Logic**: Configurable retry attempts with exponential backoff
- **Health Checks**: Continuous monitoring of model availability
- **Graceful Degradation**: System continues if preloading fails
- **Status API**: Real-time preload status via `/api/models/status`

## Performance Benefits

### Before Preloading
- First chat message: **15-30 seconds**
- Subsequent messages: **2-5 seconds**
- User frustration: **High**

### After Preloading
- First chat message: **2-5 seconds** ⚡
- Subsequent messages: **2-5 seconds**
- User satisfaction: **High**

### Resource Impact
- **Memory**: ~2-4GB for loaded models (acceptable trade-off)
- **Startup Time**: +10-20 seconds (one-time cost)
- **CPU**: Minimal ongoing overhead

## Model Support

### Currently Supported Models

| Model | Size | Purpose | Preload Time |
|-------|------|---------|-------------|
| Qwen 2.5 Coder 3B | 1.9GB | Code generation, technical tasks | ~15-20s |
| TinyLlama 1.1B | 637MB | Quick responses, casual chat | ~5-10s |

### Adding New Models

1. **Install via Ollama**:
   ```bash
   ollama pull model-name:tag
   ```

2. **Add to preloader config**:
   ```typescript
   {
     model: 'model-name:tag',
     displayName: 'Human Readable Name',
     maxRetries: 3,
     retryDelayMs: 2000,
   }
   ```

3. **Create adapter** (if needed):
   ```typescript
   // backend/logic/adapters/newModelAdapter.ts
   export const newModelAdapter: LLMAdapter = {
     id: 'model-id',
     name: 'Model Name',
     type: 'local',
     contextWindow: 4096,
     // ... implementation
   }
   ```

4. **Register in modelRegistry.ts**:
   ```typescript
   registerAdapter(newModelAdapter, ['alias1', 'alias2'])
   ```

## API Endpoints

### Model Status
```
GET /api/models/status
```

Response:
```json
{
  "qwen2.5-coder:3b": {
    "status": "ready",
    "preloadedAt": "2025-09-25T10:30:15.123Z",
    "lastChecked": "2025-09-25T10:35:20.456Z"
  },
  "tinyllama:latest": {
    "status": "ready",
    "preloadedAt": "2025-09-25T10:30:18.789Z",
    "lastChecked": "2025-09-25T10:35:22.012Z"
  }
}
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_URL` | `http://localhost:11434` | Ollama API endpoint |
| `MODEL_PRELOAD_TIMEOUT` | `30000` | Preload timeout (ms) |
| `HEALTH_CHECK_INTERVAL` | `300000` | Health check interval (ms) |

### Customization

Edit `MODELS_TO_PRELOAD` in `modelPreloader.ts`:

```typescript
const MODELS_TO_PRELOAD: PreloadConfig[] = [
  // Add your models here
  {
    model: 'your-model:tag',
    displayName: 'Your Model Name',
    maxRetries: 5,        // Increase for unreliable models
    retryDelayMs: 3000,   // Adjust retry timing
  },
]
```

## Troubleshooting

### Common Issues

1. **Model Not Found**
   ```
   Error: Model 'model-name' not found
   ```
   **Solution**: Run `ollama pull model-name` to download

2. **Ollama Not Running**
   ```
   Error: connect ECONNREFUSED 127.0.0.1:11434
   ```
   **Solution**: Start Ollama service: `ollama serve`

3. **Timeout Errors**
   ```
   Error: Preload timeout after 30000ms
   ```
   **Solution**: Increase timeout or check system resources

4. **Memory Issues**
   ```
   Error: Out of memory loading model
   ```
   **Solution**: Reduce concurrent preloads or upgrade RAM

### Debug Mode

Enable detailed logging:
```bash
DEBUG=kalito:preloader npm run dev
```

### Manual Model Management

```bash
# List available models
ollama list

# Remove unused models
ollama rm old-model:tag

# Check model info
ollama show model-name:tag
```

## Best Practices

### Model Selection
- **Use smaller models** for better startup performance
- **Limit concurrent preloads** to avoid memory pressure
- **Choose specialized models** for specific use cases

### Performance Optimization
- **SSD Storage**: Faster model loading from disk
- **Sufficient RAM**: Keep all models in memory
- **Fast CPU**: Quicker model initialization

### Monitoring
- **Check status endpoint** regularly
- **Monitor system resources** during preload
- **Set up alerts** for preload failures

## Integration Examples

### Frontend Status Display
```javascript
// Check if models are ready
const response = await fetch('/api/models/status')
const status = await response.json()

if (status['qwen2.5-coder:3b']?.status === 'ready') {
  // Enable coding features
  enableCodingMode()
}
```

### Custom Preload Logic
```typescript
// Add to server startup
async function customStartup() {
  await preloadLocalModels()
  
  // Your additional initialization
  await setupCustomServices()
  
  console.log('🚀 All systems ready!')
}
```

## Future Enhancements

### Planned Features
- **Dynamic Model Loading**: Load models based on usage patterns
- **Memory Management**: Automatic model unloading for memory optimization
- **Load Balancing**: Distribute requests across multiple model instances
- **Caching Layer**: Persistent model state across restarts

### Experimental Ideas
- **Predictive Preloading**: ML-based usage prediction
- **Model Sharing**: Multiple processes sharing loaded models
- **Cloud Integration**: Hybrid local/cloud model management

## Changelog

### v1.0.0 (September 2025)
- Initial implementation with Qwen 2.5 Coder support
- Basic retry logic and health monitoring
- Status API endpoint

### v1.1.0 (September 2025)
- Added TinyLlama support
- Improved error handling
- Performance optimizations
- Enhanced documentation

---

## Related Documentation

- [Model Registry](./types/models.md) - Model adapter system
- [API Documentation](./types/api.md) - Complete API reference
- [Deployment Guide](../README.md) - Setup and configuration