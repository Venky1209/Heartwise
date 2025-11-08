// Positive and motivational health quotes for HeartWise
export const healthQuotes = [
  {
    text: "Your heart is the engine of life. Keep it running strong! 💪",
    author: "HeartWise Team",
    category: "motivation"
  },
  {
    text: "Every heartbeat is a gift. Monitor it. Cherish it. Protect it. ❤️",
    author: "HeartWise",
    category: "awareness"
  },
  {
    text: "A healthy heart is a happy heart. Stay active, stay positive! 🌟",
    author: "HeartWise",
    category: "lifestyle"
  },
  {
    text: "Taking care of your heart today means more tomorrows. 🌅",
    author: "HeartWise Team",
    category: "prevention"
  },
  {
    text: "Your heart works 24/7. Give it the care it deserves! 🫀",
    author: "HeartWise",
    category: "care"
  },
  {
    text: "Small steps lead to great heart health. Keep going! 👣",
    author: "HeartWise Team",
    category: "progress"
  },
  {
    text: "Listen to your heart. It speaks through every beat. 🎵",
    author: "HeartWise",
    category: "awareness"
  },
  {
    text: "A strong heart creates a strong life. Build yours daily! 💪",
    author: "HeartWise Team",
    category: "strength"
  },
  {
    text: "Your health is an investment, not an expense. Choose wisely! 💰",
    author: "HeartWise",
    category: "wisdom"
  },
  {
    text: "Every monitoring session brings you closer to better health! 📊",
    author: "HeartWise Team",
    category: "progress"
  },
  {
    text: "Stress less, live more. Your heart will thank you! 🧘",
    author: "HeartWise",
    category: "lifestyle"
  },
  {
    text: "Prevention is better than cure. Monitor regularly! 🩺",
    author: "HeartWise Team",
    category: "prevention"
  },
  {
    text: "Your heart rhythm tells a story. Let's read it together! 📖",
    author: "HeartWise",
    category: "monitoring"
  },
  {
    text: "Health is not just about absence of disease, it's about vitality! ✨",
    author: "HeartWise Team",
    category: "wellness"
  },
  {
    text: "Each heartbeat is 1 second of life. Make them all count! ⏰",
    author: "HeartWise",
    category: "mindfulness"
  },
  {
    text: "Knowledge is power. Know your heart health! 🧠",
    author: "HeartWise Team",
    category: "awareness"
  },
  {
    text: "A calm mind leads to a healthy heart. Stay peaceful! 🕊️",
    author: "HeartWise",
    category: "mental-health"
  },
  {
    text: "Regular monitoring saves lives. You're doing great! 🎯",
    author: "HeartWise Team",
    category: "encouragement"
  },
  {
    text: "Your heart health journey starts with one beat at a time. 🫀",
    author: "HeartWise",
    category: "journey"
  },
  {
    text: "Trust the process. Your dedication to health shows! 🌱",
    author: "HeartWise Team",
    category: "persistence"
  },
];

// Loading state quotes
export const loadingQuotes = [
  "Analyzing your heart rhythm... 💓",
  "Processing ECG data with AI... 🤖",
  "Calculating heart rate variability... 📊",
  "Detecting R-peaks with precision... 🎯",
  "Evaluating signal quality... ✨",
  "Generating health insights... 🧠",
  "Your heart tells a unique story... 📖",
  "Almost there! Creating your analysis... ⏱️",
  "Comparing with medical standards... 🏥",
  "Preparing your personalized report... 📄",
];

// Success messages
export const successMessages = [
  "Great! Your heart looks healthy! 🎉",
  "Excellent monitoring session! ✅",
  "Analysis complete! Review your results. 👍",
  "Data captured successfully! 📈",
  "Your dedication to health is inspiring! 🌟",
  "Perfect! Keep up the good work! 💪",
  "Session saved successfully! 🎯",
  "You're on the path to better health! 🚀",
];

// Empty state messages
export const emptyStateMessages = {
  noSessions: {
    title: "Start Your Heart Health Journey! 🫀",
    description: "Record your first ECG session to begin tracking your heart health.",
    cta: "Start Recording"
  },
  noAnalysis: {
    title: "Ready to Analyze Your Heart? 📊",
    description: "Select a session to view detailed ECG analysis and insights.",
    cta: "View Sessions"
  },
  noDevices: {
    title: "Connect Your ECG Device 🔌",
    description: "Connect an ECG monitoring device to start recording sessions.",
    cta: "Add Device"
  },
  noReports: {
    title: "Your Reports Will Appear Here 📄",
    description: "Complete ECG sessions to generate comprehensive health reports.",
    cta: "Start Session"
  },
};

// Get random quote by category
export const getRandomQuote = (category = null) => {
  const quotes = category
    ? healthQuotes.filter(q => q.category === category)
    : healthQuotes;
  
  return quotes[Math.floor(Math.random() * quotes.length)];
};

// Get random loading quote
export const getLoadingQuote = () => {
  return loadingQuotes[Math.floor(Math.random() * loadingQuotes.length)];
};

// Get random success message
export const getSuccessMessage = () => {
  return successMessages[Math.floor(Math.random() * successMessages.length)];
};

export default {
  healthQuotes,
  loadingQuotes,
  successMessages,
  emptyStateMessages,
  getRandomQuote,
  getLoadingQuote,
  getSuccessMessage,
};
