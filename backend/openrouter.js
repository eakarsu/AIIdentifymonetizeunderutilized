const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';
const OPENROUTER_BASE_URL = (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, '');

async function queryAI(systemPrompt, userPrompt) {
  if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'your_openrouter_api_key_here') {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
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

    if (!response.ok || data.error) throw new Error(data.error?.message || `OpenRouter request failed with HTTP ${response.status}`);
    const content = data.choices?.[0]?.message?.content;
    if (!content || !String(content).trim()) throw new Error('OpenRouter returned empty content');

    return {
      success: true,
      content,
      model: data.model,
      usage: data.usage
    };
  } catch (error) { throw error; }
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
