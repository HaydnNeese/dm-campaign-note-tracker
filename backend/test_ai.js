const { getAiProvider } = require('./src/services/ai/aiProvider');
const dotenv = require('dotenv');
dotenv.config();

async function main() {
  const ai = getAiProvider();
  console.log('Testing AI provider...');
  try {
    const res = await ai.complete({
      messages: [{ role: 'user', content: 'Hello, are you working?' }],
    });
    console.log('AI Response:', res);
  } catch (err) {
    console.error('AI Error:', err);
  }
}

main();
