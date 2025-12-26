import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader, Sparkles, AlertCircle } from 'lucide-react';
import api from '../utils/api';

const ChatAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Add welcome message
    setMessages([
      {
        role: 'assistant',
        content: `👋 Hi! I'm your HeartWise AI Medical Assistant. I can help you with:

• 📊 Analyzing your ECG results
• 💊 Understanding your prescriptions
• 📝 Creating new ECG recording sessions
• 📅 Scheduling appointments
• ❤️ General heart health questions

How can I assist you today?`,
        timestamp: new Date().toISOString()
      }
    ]);
  }, []);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/chat', {
        message: inputMessage,
        session_id: conversationId
      });

      const assistantMessage = {
        role: 'assistant',
        content: response.data.message,
        timestamp: new Date().toISOString(),
        functionCalled: response.data.function_called,
        functionResult: response.data.function_result
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      if (response.data.conversation_id && !conversationId) {
        setConversationId(response.data.conversation_id);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setError(err.response?.data?.error || 'Failed to send message. Please try again.');
      
      const errorMessage = {
        role: 'assistant',
        content: `⚠️ Sorry, I encountered an error: ${err.response?.data?.error || 'Unable to process your request'}. Please try again.`,
        timestamp: new Date().toISOString(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessage = (content) => {
    // Enhanced markdown-style formatting
    let html = content
      // Escape HTML first
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Bold text **text**
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      // Italic text *text*
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      // Code `text`
      .replace(/`([^`]+)`/g, '<code class="bg-gray-200 px-1 rounded text-sm">$1</code>')
      // Headers with emojis (like "❤️ Heart Rate:")
      .replace(/^([\u{1F300}-\u{1F9FF}].*?)$/gmu, '<h4 class="font-semibold text-purple-700 mt-3 mb-1">$1</h4>')
      // Numbered lists (1. 2. 3.)
      .replace(/^(\d+)\.\s+(.*)$/gm, '<div class="flex ml-2 my-1"><span class="text-purple-600 font-medium mr-2">$1.</span><span>$2</span></div>')
      // Bullet points (• or - or *)
      .replace(/^[•\-*]\s+(.*)$/gm, '<div class="flex ml-2 my-1"><span class="text-purple-500 mr-2">•</span><span>$1</span></div>')
      // Line breaks
      .replace(/\n\n/g, '</p><p class="my-2">')
      .replace(/\n/g, '<br/>');
    
    // Wrap in paragraph if not already structured
    if (!html.startsWith('<')) {
      html = `<p class="my-1">${html}</p>`;
    }
    
    return html;
  };

  const MessageBubble = ({ message }) => {
    const isUser = message.role === 'user';
    const isError = message.isError;

    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`flex items-start max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar */}
          <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isUser 
                ? 'bg-blue-500' 
                : isError 
                  ? 'bg-red-500' 
                  : 'bg-gradient-to-br from-purple-500 to-pink-500'
            }`}>
              {isUser ? (
                <User size={18} className="text-white" />
              ) : isError ? (
                <AlertCircle size={18} className="text-white" />
              ) : (
                <Bot size={18} className="text-white" />
              )}
            </div>
          </div>

          {/* Message Content */}
          <div className={`rounded-2xl px-4 py-3 ${
            isUser 
              ? 'bg-blue-500 text-white' 
              : isError
                ? 'bg-red-50 border border-red-200 text-red-800'
                : 'bg-gray-100 text-gray-800'
          }`}>
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
            />
            
            {/* Function Call Indicator */}
            {message.functionCalled && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="flex items-center text-xs text-gray-500">
                  <Sparkles size={12} className="mr-1" />
                  <span>Action: {message.functionCalled.replace(/_/g, ' ')}</span>
                </div>
              </div>
            )}
            
            {/* Timestamp */}
            <div className={`text-xs mt-1 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
              {new Date(message.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-t-lg">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mr-3">
            <Bot size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold">HeartWise AI Assistant</h2>
            <p className="text-sm text-purple-100">Your personal cardiac health advisor</p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        {messages.map((message, index) => (
          <MessageBubble key={index} message={message} />
        ))}
        
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="flex items-center bg-gray-100 rounded-2xl px-4 py-3">
              <Loader size={16} className="animate-spin text-purple-600 mr-2" />
              <span className="text-gray-600">Thinking...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4 bg-white rounded-b-lg">
        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your heart health..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows="2"
              disabled={isLoading}
            />
          </div>
          
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className={`p-3 rounded-xl transition-all duration-200 ${
              inputMessage.trim() && !isLoading
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg transform hover:scale-105'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send size={20} />
          </button>
        </div>
        
        <p className="text-xs text-gray-500 mt-2 text-center">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default ChatAssistant;
