// server/src/services/dialogflow.js
import dialogflow from "@google-cloud/dialogflow";
import dotenv from "dotenv";

dotenv.config();

const projectId = process.env.DIALOGFLOW_PROJECT_ID; // e.g. "voice-command-470407"
const languageCode = process.env.DEFAULT_LANGUAGE_CODE || "en-US";

// Create a Dialogflow session client
// Use environment variables for credentials instead of JSON file
const sessionClient = new dialogflow.SessionsClient({
  credentials: {
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  projectId: process.env.FIREBASE_PROJECT_ID,
});

/**
 * Detect intent from Dialogflow
 * @param {string} sessionId - unique session ID (e.g., user ID or random string)
 * @param {string} queryText - the user's input text
 * @returns {object} normalized response
 */
export const detectIntent = async (sessionId, queryText) => {
  try {
    // Resolve project ID even if env var is missing to avoid undefined errors
    const resolvedProjectId = projectId || (await sessionClient.getProjectId());
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

    const [response] = await sessionClient.detectIntent(request);
    const result = response.queryResult || {};

    // Normalize the response so routes don't crash on undefined
    return {
      queryText: result.queryText || "",
      intent: result.intent?.displayName || "UnknownIntent",
      parameters: result.parameters?.fields || {}, // safe access
      fulfillmentText: result.fulfillmentText || "",
    };
  } catch (error) {
    console.error("Dialogflow error:", error);
    // Return a fallback response if Dialogflow fails
    return {
      queryText: queryText,
      intent: "UnknownIntent",
      parameters: {},
      fulfillmentText: "Sorry, I'm having trouble understanding. Please try again.",
    };
  }
};
