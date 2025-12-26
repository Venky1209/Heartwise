const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: './backend/.env' });

async function testGemini() {
  try {
    console.log('🔑 Testing Gemini API Key...');
    console.log('API Key:', process.env.GEMINI_API_KEY ? '✅ Found' : '❌ Not found');
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    console.log('\n📤 Sending test message to Gemini...');
    const result = await model.generateContent('Say hello in one sentence');
    const response = await result.response;
    const text = response.text();

    console.log('\n✅ Gemini Response:');
    console.log(text);
    console.log('\n🎉 Gemini API is working correctly!');
  } catch (error) {
    console.error('\n❌ Error testing Gemini API:');
    console.error('Message:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
  }
}

testGemini();
