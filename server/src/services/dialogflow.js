// server/src/services/dialogflow.js
import dialogflow from "@google-cloud/dialogflow";
import dotenv from "dotenv";

dotenv.config();

const projectId = process.env.DIALOGFLOW_PROJECT_ID; // e.g. "voice-command-470407"
const languageCode = process.env.DEFAULT_LANGUAGE_CODE || "en-US";

console.log("Dialogflow initialization - Environment variables:");
console.log("DIALOGFLOW_PROJECT_ID:", projectId ? "SET" : "NOT SET");
console.log("FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID ? "SET" : "NOT SET");
console.log("FIREBASE_CLIENT_EMAIL:", process.env.FIREBASE_CLIENT_EMAIL ? "SET" : "NOT SET");
console.log("FIREBASE_PRIVATE_KEY:", process.env.FIREBASE_PRIVATE_KEY ? "SET" : "NOT SET");

// Simple fallback intent detection without Dialogflow
function detectIntentFallback(queryText) {
  const text = queryText.toLowerCase();
  
  // Add item patterns
  if (text.includes('add') || text.includes('buy') || text.includes('get')) {
    const itemMatch = text.match(/(?:add|buy|get)\s+(\d+)?\s*([a-zA-Z\s]+)/);
    if (itemMatch) {
      const quantity = itemMatch[1] ? parseInt(itemMatch[1]) : 1;
      const item = itemMatch[2].trim();
      return {
        intent: "AddItemIntent",
        parameters: {
          item: { stringValue: item },
          quantity: { numberValue: quantity }
        },
        fulfillmentText: `I'll add ${quantity} ${item} to your shopping list.`
      };
    }
  }
  
  // Remove item patterns
  if (text.includes('remove') || text.includes('delete') || text.includes('take off')) {
    const itemMatch = text.match(/(?:remove|delete|take off)\s+([a-zA-Z\s]+)/);
    if (itemMatch) {
      const item = itemMatch[1].trim();
      return {
        intent: "RemoveItemIntent",
        parameters: {
          item: { stringValue: item }
        },
        fulfillmentText: `I'll remove ${item} from your shopping list.`
      };
    }
  }
  
  // Get list patterns
  if (text.includes('list') || text.includes('show') || text.includes('what')) {
    return {
      intent: "GetListIntent",
      parameters: {},
      fulfillmentText: "Here's your shopping list."
    };
  }
  
  // Search patterns
  if (text.includes('search') || text.includes('find') || text.includes('look for')) {
    const itemMatch = text.match(/(?:search|find|look for)\s+([a-zA-Z\s]+)/);
    if (itemMatch) {
      const item = itemMatch[1].trim();
      return {
        intent: "SearchItemIntent",
        parameters: {
          item: { stringValue: item }
        },
        fulfillmentText: `I'll search for ${item} in our catalog.`
      };
    }
  }
  
  // Default fallback
  return {
    intent: "UnknownIntent",
    parameters: {},
    fulfillmentText: "I didn't understand that. Try saying 'add milk' or 'show my list'."
  };
}

// Create a Dialogflow session client
// Use environment variables for credentials instead of JSON file
let sessionClient;
let useDialogflow = false;

try {
  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    sessionClient = new dialogflow.SessionsClient({
      credentials: {
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    useDialogflow = true;
    console.log("Dialogflow client initialized successfully");
  } else {
    console.log("Dialogflow credentials not found, using fallback mode");
  }
} catch (error) {
  console.error("Failed to initialize Dialogflow client:", error);
  console.log("Using fallback mode for voice commands");
}

/**
 * Detect intent from Dialogflow
 * @param {string} sessionId - unique session ID (e.g., user ID or random string)
 * @param {string} queryText - the user's input text
 * @returns {object} normalized response
 */
export const detectIntent = async (sessionId, queryText) => {
  try {
    console.log("Dialogflow detectIntent called with:", { sessionId, queryText });
    
    // Use fallback if Dialogflow is not available
    if (!useDialogflow) {
      console.log("Using fallback intent detection");
      const fallbackResult = detectIntentFallback(queryText);
      return {
        queryText: queryText,
        intent: fallbackResult.intent,
        parameters: fallbackResult.parameters,
        fulfillmentText: fallbackResult.fulfillmentText,
      };
    }
    
    // Resolve project ID even if env var is missing to avoid undefined errors
    const resolvedProjectId = projectId || (await sessionClient.getProjectId());
    console.log("Using project ID:", resolvedProjectId);
    
    const sessionPath = sessionClient.projectAgentSessionPath(
      resolvedProjectId,
      sessionId
    );

    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: queryText,
          languageCode: languageCode,
        },
      },
    };

    console.log("Sending request to Dialogflow...");
    const [response] = await sessionClient.detectIntent(request);
    const result = response.queryResult || {};

    console.log("Dialogflow response received:", {
      intent: result.intent?.displayName,
      fulfillmentText: result.fulfillmentText?.substring(0, 50) + "..."
    });

    // Normalize the response so routes don't crash on undefined
    return {
      queryText: result.queryText || "",
      intent: result.intent?.displayName || "UnknownIntent",
      parameters: result.parameters?.fields || {}, // safe access
      fulfillmentText: result.fulfillmentText || "",
    };
  } catch (error) {
    console.error("Dialogflow error:", error);
    console.log("Falling back to simple intent detection");
    
    // Use fallback if Dialogflow fails
    const fallbackResult = detectIntentFallback(queryText);
    return {
      queryText: queryText,
      intent: fallbackResult.intent,
      parameters: fallbackResult.parameters,
      fulfillmentText: fallbackResult.fulfillmentText,
    };
  }
};
