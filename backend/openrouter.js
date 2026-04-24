const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';

async function queryAI(systemPrompt, userPrompt) {
  if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'your_openrouter_api_key_here') {
    return {
      success: false,
      error: 'OpenRouter API key not configured. Please set OPENROUTER_API_KEY in .env file.',
      fallback: true,
      content: generateFallbackResponse(systemPrompt, userPrompt)
    };
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Energy Grid Platform'
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    const data = await response.json();

    if (data.error) {
      return {
        success: false,
        error: data.error.message || 'OpenRouter API error',
        fallback: true,
        content: generateFallbackResponse(systemPrompt, userPrompt)
      };
    }

    return {
      success: true,
      content: data.choices[0].message.content,
      model: data.model,
      usage: data.usage
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      fallback: true,
      content: generateFallbackResponse(systemPrompt, userPrompt)
    };
  }
}

function generateFallbackResponse(systemPrompt, userPrompt) {
  if (userPrompt.includes('capacity') || userPrompt.includes('energy')) {
    return 'AI Analysis: Based on the building energy data, there are significant opportunities for capacity optimization. Key recommendations include: implementing smart load balancing, upgrading HVAC scheduling systems, and deploying IoT sensors for real-time monitoring. Estimated potential savings: 15-25% of current energy waste.';
  }
  if (userPrompt.includes('community') || userPrompt.includes('equity')) {
    return 'AI Analysis: Community impact assessment indicates high potential for positive social equity outcomes. Priority areas include low-income neighborhoods with aging infrastructure. Recommended actions: establish community solar programs, provide energy efficiency grants, and create job training programs in renewable energy sectors.';
  }
  if (userPrompt.includes('grid') || userPrompt.includes('stability')) {
    return 'AI Analysis: Grid stability metrics suggest moderate risk in peak demand periods. Recommendations: implement distributed energy storage, establish demand response protocols, and integrate renewable sources with smart inverters for frequency regulation support.';
  }
  return 'AI Analysis: The energy services platform data indicates multiple optimization opportunities. Focus areas include capacity aggregation, community benefit distribution, and grid stability enhancement through intelligent load management.';
}

module.exports = { queryAI };
