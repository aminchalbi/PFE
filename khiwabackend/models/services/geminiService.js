const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateResponse({ text, history = [] }) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro",
      generationConfig: {
        temperature: 0.9,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      ]
    });

    // Formatage de l'historique
    const formattedHistory = history.map(msg => ({
      role: msg.role || (msg.sender === 'user' ? 'user' : 'model'),
      parts: Array.isArray(msg.parts) 
        ? msg.parts.map(part => typeof part === 'string' ? { text: part } : part)
        : [{ text: msg.content || msg.parts || '' }]
    }));

    const chat = model.startChat({
      history: formattedHistory
    });

    // Envoi du message avec le bon format
    const result = await chat.sendMessage(text);
    const response = await result.response;
    
    return {
      text: response.text(),
      context: await chat.getHistory()
    };
  } catch (error) {
    console.error("Erreur Gemini complète:", {
      message: error.message,
      stack: error.stack,
      request: { text, history }
    });
    throw new Error(`Erreur Gemini: ${error.message}`);
  }
}

module.exports = { generateResponse };