const express = require('express');
const router = express.Router();
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Import authenticateToken from auth.js
const { authenticateToken } = require('./auth');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

    // Call ML service for RAG context
    let ragContext = '';
    try {
      const ragResponse = await axios.post('http://localhost:5002/api/ml/chat/context', {
        query: message,
        user_id: userId
      });
      ragContext = ragResponse.data.context || '';
    } catch (error) {
      console.error('Error getting RAG context:', error.message);
    }

    // Build context for Gemini
    const systemPrompt = `You are HeartWise Medical AI Assistant, an expert in cardiovascular health. 
You help patients understand their ECG results, manage their heart health, and answer medical questions.

**Medical Knowledge Base:**
${ragContext}

**Guidelines:**
- Always be empathetic and supportive
- Explain medical terms in simple language
- Recommend seeing a doctor for serious concerns
- Use the retrieved context to provide accurate information
- Be concise but thorough
- Never provide definitive diagnoses - always recommend professional medical consultation for concerns

**User Question:** ${message}

**Instructions:** Provide a helpful, accurate, and compassionate response based on the medical knowledge above.`;

    // Initialize Gemini model (using gemini-pro)
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Build conversation history for Gemini
    const chatHistory = conversationHistory.slice(-10).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content || '' }]
    }));

    // Start chat with history
    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      },
    });

    // Send message to Gemini
    const result = await chat.sendMessage(systemPrompt);
    const aiResponse = result.response.text();

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
      model: 'gemini-pro'
    });
  } catch (error) {
    console.error('Chatbot error:', error.message);
    if (error.response) {
      console.error('Gemini API error:', error.response);
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
