import { EldercareContextService } from '../logic/eldercareContextService';
import { getModelAdapter } from '../logic/modelRegistry';

const service = new EldercareContextService();

// Get a local adapter (trusted - includes RX numbers)
const adapter = getModelAdapter('phi3');

if (!adapter) {
  console.error('Could not get adapter');
  process.exit(1);
}

console.log('=== GENERATING AI CONTEXT FOR AURORA SANCHEZ ===\n');

const prompt = service.generateContextualPrompt(
  adapter,
  'List all medications for Aurora Sanchez with RX numbers'
);

console.log(prompt);
console.log('\n=== CHECKING FOR SPECIFIC DATA ===\n');

const checks = [
  { name: 'Ibuprofen mentioned', test: /Ibuprofen/i },
  { name: 'Ibuprofen RX 9125787', test: /9125787/ },
  { name: 'Entancapone mentioned', test: /Entancapone/i },
  { name: 'Entancapone RX 8965887', test: /8965887/ },
  { name: 'All 8 medications', test: /Aurora Sanchez \(8 medication/ },
];

checks.forEach(check => {
  const found = check.test.test(prompt);
  console.log(`${found ? '✓' : '✗'} ${check.name}: ${found ? 'YES' : 'NO'}`);
});

console.log('\n=== EXTRACTING MEDICATION SECTION ===\n');

const medSection = prompt.match(/### Active Medications[\s\S]*?(?=###|$)/);
if (medSection) {
  console.log(medSection[0]);
}
