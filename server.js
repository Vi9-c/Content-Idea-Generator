// server.js
require("dotenv").config(); // Load environment variables from .env file

const express = require("express");
const { GoogleGenAI } = require("@google/genai");

// CRITICAL: The API key is securely accessed from the environment
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("FATAL: GEMINI_API_KEY not found in environment variables.");
  process.exit(1);
}

const ai = new GoogleGenAI(apiKey);
const app = express();
// server.js

// This checks if the hosting environment (like Render or Vercel) provided a port.
// If not (i.e., we are running locally), it defaults back to 3000.
const PORT = process.env.PORT || 3000; 

// ... rest of the file ...
app.listen(PORT, () => {
  console.log(`Proxy server running securely on http://localhost:${PORT}`);
});

// Middleware to parse JSON bodies
app.use(express.json());
<<<<<<< HEAD
// Route to handle the root path (/)
app.get('/', (req, res) => {
    res.status(200).send("Quipster's Strategy API Proxy is running. Use the /generate-ideas POST endpoint.");
});
=======
>>>>>>> 1553e3d47f7f61c425bf4c6cf68d481b6ce99018

// Add CORS headers to allow your client (e.g., your index.html) to talk to the server
app.use((req, res, next) => {
  // Allow the public Render URL AND your local development server
  const allowedOrigins = [
    "https://quipster-strategy.onrender.com",
    "http://127.0.0.1:5500", // <-- ADD THIS LINE
  ];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    // Fallback for when origin is missing (local file open) or other simple cases
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// Start the server
app.listen(PORT, () => {
  console.log(`Proxy server running securely on http://localhost:${PORT}`);
});

// Endpoint to handle content idea generation requests

app.post('/generate-ideas', async (req, res) => {
    // 1. Extract the user inputs from the request body
    const { businessType, targetTopic, contentFormat } = req.body;

    if (!businessType || !targetTopic) {
        return res.status(400).json({ error: "Missing required input parameters." });
    }

    // 2. Define the System Instruction and User Query
    const systemPrompt = `You are an expert content strategist specializing in creating highly engaging and diverse content ideas for business owners. You must use the latest information and **current social media trends found via search** to ground your suggestions. Your response must be formatted as a numbered list of 5 distinct, detailed, and actionable content ideas tailored to the provided business, topic, and format. Do not include any introductory or concluding text, only the numbered list.`;

    const userQuery = `Business Type: ${businessType}. Target Topic/Goal: ${targetTopic}. Desired Format: ${contentFormat}. Generate 5 unique content ideas.`;

    try {
        // 3. Construct the API payload and make the secure call
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash", // Use the stable model name
            contents: [{ role: "user", parts: [{ text: userQuery }] }],
            config: {
                // Enable Google Search Grounding (tool: google_search)
                tools: [{ googleSearch: {} }],
                systemInstruction: systemPrompt,
            }
        });

        // 4. Send the LLM's generated text back to the client
        const generatedText = response.text;
        res.status(200).json({ content: generatedText });
        
    } catch (error) {
        console.error("Gemini API Error:", error.message);
        // Send a generic error message to the client, hiding technical details
        res.status(500).json({ error: "Server processing failed. Please try again." });
    }
<<<<<<< HEAD
});
=======
});
>>>>>>> 1553e3d47f7f61c425bf4c6cf68d481b6ce99018
