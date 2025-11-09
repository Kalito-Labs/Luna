/**
 * Test: Backend Structured Validation Integration
 * 
 * Tests that medication queries are routed through structured validation
 * and responses remain conversational.
 */

import { runAgent } from '../logic/agentService'

console.log('='.repeat(80))
console.log('BACKEND VALIDATION INTEGRATION TEST')
console.log('='.repeat(80))
console.log()

async function testMedicationQuery() {
  console.log('📊 TEST 1: Medication Query (Should use structured validation)')
  console.log('-'.repeat(80))
  
  try {
    const result = await runAgent({
      modelName: 'gpt-4.1-nano',
      input: 'List all medications for Aurora Sanchez with RX numbers',
      settings: {
        model: 'gpt-4.1-nano',
      },
    })
    
    console.log('\n✅ Response received:')
    console.log(result.reply)
    console.log(`\nToken usage: ${result.tokenUsage || 'N/A'}`)
    
    // Check if RX numbers are present
    const hasRxNumbers = /\d{7}/.test(result.reply) || /rx/i.test(result.reply)
    console.log(`\n${hasRxNumbers ? '✅' : '❌'} RX numbers present in response`)
    
    // Check if specific medications mentioned
    const hasBelsomra = /belsomra/i.test(result.reply)
    const hasIbuprofen = /ibuprofen/i.test(result.reply)
    const hasEntancapone = /entancapone|entacapone/i.test(result.reply)
    
    console.log(`${hasBelsomra ? '✅' : '❌'} Belsomra mentioned`)
    console.log(`${hasIbuprofen ? '✅' : '❌'} Ibuprofen mentioned`)
    console.log(`${hasEntancapone ? '✅' : '❌'} Entancapone mentioned`)
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

async function testGeneralQuery() {
  console.log('\n' + '='.repeat(80))
  console.log('📊 TEST 2: General Query (Should use free-text)')
  console.log('-'.repeat(80))
  
  try {
    const result = await runAgent({
      modelName: 'gpt-4.1-nano',
      input: 'How is Aurora doing today?',
      settings: {
        model: 'gpt-4.1-nano',
      },
    })
    
    console.log('\n✅ Response received:')
    console.log(result.reply.slice(0, 200) + (result.reply.length > 200 ? '...' : ''))
    console.log(`\nToken usage: ${result.tokenUsage || 'N/A'}`)
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

async function testBasilioMedications() {
  console.log('\n' + '='.repeat(80))
  console.log('📊 TEST 3: Basilio Medications (Should use structured validation)')
  console.log('-'.repeat(80))
  
  try {
    const result = await runAgent({
      modelName: 'gpt-4.1-nano',
      input: 'What medications does Basilio take?',
      settings: {
        model: 'gpt-4.1-nano',
      },
    })
    
    console.log('\n✅ Response received:')
    console.log(result.reply)
    console.log(`\nToken usage: ${result.tokenUsage || 'N/A'}`)
    
    // Check if Basilio's medications are mentioned
    const hasInsulin = /insulin/i.test(result.reply)
    const hasGlipizide = /glipizide/i.test(result.reply)
    
    console.log(`\n${hasInsulin ? '✅' : '❌'} Insulin mentioned`)
    console.log(`${hasGlipizide ? '✅' : '❌'} Glipizide mentioned`)
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

async function runTests() {
  await testMedicationQuery()
  await testGeneralQuery()
  await testBasilioMedications()
  
  console.log('\n' + '='.repeat(80))
  console.log('ALL TESTS COMPLETE')
  console.log('='.repeat(80))
}

runTests()
