// Global variables for API configuration
const apiKey = "";
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

// DOM Elements
const businessTypeInput = document.getElementById("businessType");
const targetTopicInput = document.getElementById("targetTopic");
const contentFormatSelect = document.getElementById("contentFormat");
const generateButton = document.getElementById("generateButton");
const contentOutput = document.getElementById("content-output");
const errorMessageDiv = document.getElementById("errorMessage");

/**
 * Converts plain text containing a numbered list into an HTML list structure.
 * @param {string} text - The text response from the LLM.
 * @returns {string} - The HTML formatted content.
 */
function formatLLMResponse(text) {
  // Split the text by newline and filter out empty lines
  const lines = text.split("\n").filter((line) => line.trim().length > 0);

  // Map lines to list items, checking for common numbering patterns
  const listItems = lines.map((line) => {
    // Regex checks for start of line followed by digit(s), dot or bracket, optional space, and then content
    const match = line.match(/^(\s*\d+\.?\s*[\-\)]?\s*)(.*)/);
    if (match) {
      // Extract the text after the number/bullet point and wrap in list item
      return `<li class="text-base leading-relaxed">${match[2].trim()}</li>`;
    }
    // If it doesn't look like a list item, just treat it as a paragraph
    return `<p class="mb-2 text-gray-300">${line.trim()}</p>`;
  });

  // If we have multiple list items, wrap them in a proper <ol>
  if (
    listItems.length > 1 &&
    listItems.every((item) => item.startsWith("<li"))
  ) {
    return `<ol class="space-y-4 pl-0">${listItems.join("")}</ol>`;
  } else {
    // Otherwise, join them as paragraphs (this handles non-list responses gracefully)
    return listItems.join("");
  }
}

/**
 * Shows an error message in the dedicated area.
 * @param {string} message - The error message to display.
 */
function displayError(message) {
  errorMessageDiv.innerHTML = `<p>${message}</p>`;
  errorMessageDiv.classList.remove("hidden");
}

/**
 * Clears the error message area.
 */
function clearError() {
  errorMessageDiv.textContent = "";
  errorMessageDiv.classList.add("hidden");
}

/**
 * Implements exponential backoff for retries.
 * @param {function} fn - The function to retry.
 * @param {number} maxRetries - Maximum number of retries.
 */
async function withRetry(fn, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

/**
 * Handles the click event for generating content ideas using the Gemini API.
 */
async function generateIdeas() {
  clearError();

  const businessType = businessTypeInput.value.trim();
  const targetTopic = targetTopicInput.value.trim();
  const contentFormat = contentFormatSelect.value;

  if (!businessType || !targetTopic) {
    displayError(
      "ERROR: Input parameters missing. Enter the **Business Type** and **Target Topic** to proceed."
    );
    return;
  }

  // Set UI to loading state
  generateButton.disabled = true;
  generateButton.innerHTML = `<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> PROCESSING... STAND BY`;
  contentOutput.innerHTML = `<p class="text-center text-cyan-500 italic p-4">Initializing AI Content Matrix... Please wait. (Searching for current trends...)</p>`;

  const systemPrompt = `You are an expert content strategist specializing in creating highly engaging and diverse content ideas for business owners. You must use the latest information and **current social media trends found via search** to ground your suggestions. Your response must be formatted as a numbered list of 5 distinct, detailed, and actionable content ideas tailored to the provided business, topic, and format. Do not include any introductory or concluding text, only the numbered list.`;

  const userQuery = `Business Type: ${businessType}. Target Topic/Goal: ${targetTopic}. Desired Format: ${contentFormat}. Generate 5 unique content ideas.`;

  const payload = {
    contents: [{ parts: [{ text: userQuery }] }],
    // ADDED: Enable Google Search Grounding to find current trends
    tools: [{ google_search: {} }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
  };

  try {
    const apiCall = async () => {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    };

    const response = await withRetry(apiCall);
    const result = await response.json();
    const candidate = result.candidates?.[0];

    if (candidate && candidate.content?.parts?.[0]?.text) {
      const generatedText = candidate.content.parts[0].text;
      contentOutput.innerHTML = formatLLMResponse(generatedText);
    } else {
      displayError(
        "ERROR: Null data received. AI response was empty or malformed."
      );
      contentOutput.innerHTML = `<p class="text-red-400 p-4">DATA FAIL: Failed to retrieve content matrix. Rerouting required.</p>`;
    }
  } catch (error) {
    console.error("API Error:", error);
    displayError(
      `CRITICAL ERROR: Connection failure or API timeout. ${error.message}.`
    );
    contentOutput.innerHTML = `<p class="text-red-400 p-4">SYSTEM OFFLINE: An unexpected error occurred.</p>`;
  } finally {
    // Reset button state
    generateButton.disabled = false;
    generateButton.innerHTML = `<svg id="buttonIcon" class="w-6 h-6 mr-3 text-cyan-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M18 10h1m-5.636 6.364l.707.707M12 21v-1m-4.636-1.636l-.707-.707M5 10H4m1.636-4.636l-.707-.707M7.879 17.121A7.5 7.5 0 0112 15c2.267 0 4.306.96 5.748 2.532M12 16.5c-4.418 0-8 2-8 4.5v1.5h16v-1.5c0-2.583-3.582-4.5-8-4.5z"></path></svg> EXECUTE IDEA GENERATION`;
  }
}
