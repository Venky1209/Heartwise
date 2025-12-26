const express = require('express');
const router = express.Router();
const axios = require('axios');

// Import authenticateToken from auth.js
const { authenticateToken } = require('./auth');

// Ollama API configuration
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:8b';

// Conversation memory (in production, use Redis or database)
const conversationMemory = new Map();

// @route   POST /api/chat
// @desc    Send message to AI chatbot
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('📨 Chatbot request received');
    console.log('   User:', req.user);
    console.log('   Body:', req.body);
    
    const { message, session_id } = req.body;
    const userId = req.user.userId;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get or create conversation session
    const conversationId = session_id || `chat_${userId}_${Date.now()}`;
    let conversationHistory = conversationMemory.get(conversationId) || [];

    // Add user message to history
    conversationHistory.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });

    // Call ML service for RAG context (optional, may fail)
    let ragContext = '';
    try {
      const ragResponse = await axios.post('http://localhost:5002/api/ml/chat/context', {
        query: message,
        user_id: userId
      }, { timeout: 5000 });
      ragContext = ragResponse.data.context || '';
    } catch (error) {
      console.log('⚠️ RAG context unavailable, proceeding without it');
    }

    // Build system prompt for Ollama
    const systemPrompt = `You are HeartWise Medical AI Assistant, an expert in cardiovascular health.

RESPONSE FORMAT RULES:
1. Use clear sections with emoji headers when appropriate
2. Use bullet points (•) for lists
3. Keep paragraphs short and readable
4. Use **bold** for important terms
5. Add line breaks between sections
6. Be concise - aim for 3-5 sentences per section

GUIDELINES:
• Be empathetic and supportive
• Explain medical terms simply
• Recommend doctors for serious concerns
• Never diagnose - suggest professional consultation
• For emergencies (chest pain, severe symptoms), advise calling emergency services immediately

${ragContext ? `MEDICAL CONTEXT:\n${ragContext}\n` : ''}`;

    // Build messages array for Ollama (include conversation history)
    const messages = [
      { role: 'system', content: systemPrompt }
    ];
    
    // Add last 10 messages from conversation history
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    }

    console.log(`🤖 Calling Ollama (${OLLAMA_MODEL})...`);
    
    // Call Ollama API
    const ollamaResponse = await axios.post(`${OLLAMA_URL}/api/chat`, {
      model: OLLAMA_MODEL,
      messages: messages,
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        num_predict: 500
      }
    }, { timeout: 60000 });

    const aiResponse = ollamaResponse.data.message?.content || 'Sorry, I could not generate a response.';
    console.log('✅ Ollama response received');

    // Add AI response to conversation history
    conversationHistory.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString()
    });

    // Save conversation history
    conversationMemory.set(conversationId, conversationHistory);

    return res.json({
      message: aiResponse,
      conversation_id: conversationId,
      model: OLLAMA_MODEL
    });
  } catch (error) {
    console.error('❌ Chatbot error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('⚠️ Ollama is not running. Start it with: ollama serve');
      return res.status(503).json({ 
        error: 'AI service unavailable. Please ensure Ollama is running.', 
        details: 'Run "ollama serve" to start the Ollama service.'
      });
    }
    res.status(500).json({ 
      error: 'Failed to process chat message', 
      details: error.message 
    });
  }
});

// @route   GET /api/chat/history/:conversation_id
// @desc    Get conversation history
// @access  Private
router.get('/history/:conversation_id', authenticateToken, async (req, res) => {
  try {
    const { conversation_id } = req.params;
    const history = conversationMemory.get(conversation_id) || [];

    res.json({
      conversation_id,
      messages: history,
      count: history.length
    });
  } catch (error) {
    console.error('Error fetching conversation history:', error);
    res.status(500).json({ error: 'Failed to fetch conversation history' });
  }
});

// @route   DELETE /api/chat/:conversation_id
// @desc    Clear conversation history
// @access  Private
router.delete('/:conversation_id', authenticateToken, async (req, res) => {
  try {
    const { conversation_id } = req.params;
    conversationMemory.delete(conversation_id);

    res.json({ message: 'Conversation cleared successfully' });
  } catch (error) {
    console.error('Error clearing conversation:', error);
    res.status(500).json({ error: 'Failed to clear conversation' });
  }
});

module.exports = router;
