/**
 * Test script to verify LunaContextService can read thought records
 */

import { LunaContextService } from '../logic/lunaContextService'
import { getModelAdapter } from '../logic/modelRegistry'

async function testLunaContext() {
  console.log('🧪 Testing LunaContextService thought record access...\n')
  
  const contextService = new LunaContextService()
  
  // Get a default adapter (doesn't matter which for this test)
  const adapter = getModelAdapter('gpt-4.1-nano')
  
  if (!adapter) {
    console.error('❌ Could not get adapter')
    return
  }
  
  // Patient ID for Kaleb
  const kalebPatientId = '1762885449885-vyuzo96qop9'
  
  console.log(`📋 Fetching context for patient: ${kalebPatientId}\n`)
  
  // Get context
  const context = contextService.getLunaContext(adapter, kalebPatientId)
  
  console.log('📊 Context Results:')
  console.log(`   Patients: ${context.patients.length}`)
  console.log(`   Medications: ${context.medications.length}`)
  console.log(`   Appointments: ${context.recentAppointments.length}`)
  console.log(`   Journal Entries: ${context.journalEntries.length}`)
  console.log(`   Therapy Records (all types): ${context.therapyRecords.length}`)
  console.log(`   CBT Thought Records: ${context.cbtThoughtRecords.length}\n`)
  
  if (context.cbtThoughtRecords.length > 0) {
    console.log('✅ CBT Thought Records Found:\n')
    context.cbtThoughtRecords.forEach((record, index) => {
      console.log(`   Record ${index + 1}:`)
      console.log(`   - ID: ${record.id}`)
      console.log(`   - Patient: ${record.patientName}`)
      console.log(`   - Created: ${record.createdAt}`)
      console.log(`   - Situation: ${record.recordData.situation}`)
      console.log(`   - Automatic Thought: ${record.recordData.automaticThought}`)
      console.log(`   - Emotion: ${record.recordData.emotion} (${record.recordData.emotionIntensity}/100)`)
      if (record.recordData.alternativeThought) {
        console.log(`   - Alternative Thought: ${record.recordData.alternativeThought}`)
        console.log(`   - New Emotion: ${record.recordData.newEmotion} (${record.recordData.newEmotionIntensity}/100)`)
        console.log(`   - Improvement: ${record.improvementScore} points`)
      }
      console.log('')
    })
  } else {
    console.log('⚠️  No CBT thought records found\n')
  }
  
  // Show a preview of the AI context summary
  console.log('📝 AI Context Summary Preview (first 1000 chars):\n')
  console.log(context.summary.substring(0, 1000))
  console.log('\n...\n')
  
  // Test contextual prompt generation
  console.log('🤖 Testing contextual prompt generation...\n')
  const testQuery = "How is Kaleb doing with his CBT exercises?"
  const contextPrompt = contextService.generateContextualPrompt(adapter, testQuery)
  
  console.log(`Query: "${testQuery}"`)
  console.log(`Generated prompt length: ${contextPrompt.length} characters`)
  console.log(`Contains thought records: ${contextPrompt.includes('CBT Thought Records') ? 'YES ✅' : 'NO ❌'}`)
  console.log(`Contains situation data: ${contextPrompt.includes('Situation:') ? 'YES ✅' : 'NO ❌'}`)
  
  console.log('\n✅ Test complete!')
}

testLunaContext().catch(console.error)
