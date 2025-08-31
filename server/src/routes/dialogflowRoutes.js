// server/src/routes/dialogflowRoutes.js
import express from "express";
import { detectIntent } from "../services/dialogflow.js";
import { addItem, getItems, deleteItem } from "../services/firestore.js";
import { searchCatalog, categorizeItem, getSubstitutes, getSeasonalItems, getLowStockSuggestions } from "../services/catalog.js";

const router = express.Router();

// Add a simple GET endpoint for testing
router.get("/query", (req, res) => {
  res.json({ 
    message: "Dialogflow endpoint is working! Use POST method with message and sessionId.",
    example: {
      method: "POST",
      body: {
        message: "add milk",
        sessionId: "test-session"
      }
    }
  });
});

// Super safe parameter getter
function getParam(params, key) {
  if (!params || !params[key]) return null;

  const field = params[key];
  if (field.stringValue !== undefined) return field.stringValue;
  if (field.numberValue !== undefined) return field.numberValue;
  if (field.listValue && Array.isArray(field.listValue.values)) {
    return field.listValue.values.map((v) => v.stringValue || v.numberValue);
  }
  return null;
}

router.post("/query", async (req, res) => {
  try {
    console.log("Dialogflow POST request received:", req.body);
    
    const { message, sessionId } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Call Dialogflow
    const result = await detectIntent(sessionId || "default-session", message);

    // Debug entire result to terminal
    console.log("DEBUG RESULT:", JSON.stringify(result, null, 2));

    // `detectIntent` already returns a normalized string for `intent`
    // and a plain object for `parameters` (fields).
    const intent = result.intent || "UnknownIntent";
    const params = result.parameters || {};

    // Debug: Log the intent being processed
    console.log("Processing intent:", intent);
    console.log("Parameters:", params);

    let responseMessage = "";

    // ------------------ ADD ITEM ------------------
    if (intent === "AddItemIntent") {
      const item = getParam(params, "item") || "unknown item";
      const quantity = getParam(params, "quantity") || 1;

      const saved = await addItem({
        name: item,
        quantity,
        category: categorizeItem(item),
      });

      responseMessage = `Added ${quantity} ${item}(s) to your list.`;
      return res.json({
        intent,
        action: "add",
        data: saved,
        responseMessage,
      });
    }
    // ------------------ SUGGESTIONS ------------------
    if (intent === "SuggestionsIntent") {
      const items = await getItems();
      
      // Get different types of suggestions
      const lowStockSuggestions = getLowStockSuggestions(items);
      const seasonalSuggestions = getSeasonalItems().map(item => ({
        name: item,
        reason: "in season now",
        priority: "medium"
      }));
      
      // Default suggestions for new users
      const defaultSuggestions = [
        { name: "milk", reason: "daily essential", priority: "low" },
        { name: "bread", reason: "breakfast staple", priority: "low" },
        { name: "apple", reason: "healthy snack", priority: "low" },
        { name: "toothpaste", reason: "personal care", priority: "low" },
      ];

      // Combine all suggestions, prioritizing low stock alerts
      const allSuggestions = [
        ...lowStockSuggestions,
        ...seasonalSuggestions.slice(0, 2),
        ...defaultSuggestions.slice(0, 2)
      ];

      responseMessage = allSuggestions.length
        ? "Here are some smart suggestions for you."
        : "I don't have suggestions yet.";

      return res.json({ intent, action: "suggestions", suggestions: allSuggestions, responseMessage });
    }

    // ------------------ REMOVE ITEM ------------------
    if (intent === "RemoveItemIntent") {
      const item = getParam(params, "item");
      if (!item) {
        return res.json({ intent, error: "No item recognized to remove." });
      }

      const items = await getItems();
      const match = items.find(
        (i) => i.name.toLowerCase() === item.toLowerCase()
      );

      if (match) {
        await deleteItem(match.id);
        responseMessage = `Removed ${item} from your list.`;
      } else {
        responseMessage = `${item} not found in your list.`;
      }

      return res.json({
        intent,
        action: "remove",
        responseMessage,
      });
    }

    // ------------------ GET LIST ------------------
    if (intent === "GetListIntent") {
      const items = await getItems();
      responseMessage =
        items.length > 0
          ? "Here is your shopping list."
          : "Your shopping list is empty.";
      return res.json({
        intent,
        action: "list",
        items,
        responseMessage,
      });
    }

    // ------------------ SEARCH ITEMS ------------------
    if (intent === "SearchItemIntent") {
      const item = getParam(params, "item");
      const brand = getParam(params, "brand");
      const category = getParam(params, "category");
      const minPrice = getParam(params, "minPrice");
      const maxPrice = getParam(params, "maxPrice");

      // Determine search strategy
      let searchQuery = null;
      let searchCategory = null;

      if (item) {
        // Item-specific search
        searchQuery = item;
      } else if (category) {
        // Category-based search
        searchCategory = category;
      }

      const results = searchCatalog({
        query: searchQuery,
        brand,
        category: searchCategory,
        minPrice: typeof minPrice === "number" ? minPrice : undefined,
        maxPrice: typeof maxPrice === "number" ? maxPrice : undefined,
      });

      // Add substitutes if no results found for item-specific search
      let substitutes = [];
      if (results.length === 0 && item && !category) {
        substitutes = getSubstitutes(item).map(sub => ({
          name: sub,
          reason: `alternative to ${item}`,
          isSubstitute: true
        }));
      }

      responseMessage =
        results.length > 0
          ? `Found ${results.length} result(s).`
          : substitutes.length > 0
          ? `No exact matches found, but here are some alternatives.`
          : "I couldn't find matching items.";

      return res.json({ 
        intent, 
        action: "search", 
        results, 
        substitutes,
        responseMessage 
      });
    }

    // ------------------ SUBSTITUTES ------------------
    if (intent === "SubstitutesIntent") {
      const item = getParam(params, "item");
      
      if (!item) {
        return res.json({ 
          intent, 
          error: "No item specified to find substitutes for." 
        });
      }

      const substitutes = getSubstitutes(item);
      
      if (substitutes.length === 0) {
        responseMessage = `I don't have substitutes for ${item}.`;
      } else {
        responseMessage = `Here are some alternatives to ${item}.`;
      }

      return res.json({ 
        intent, 
        action: "substitutes", 
        item,
        substitutes: substitutes.map(sub => ({
          name: sub,
          reason: `alternative to ${item}`
        })),
        responseMessage 
      });
    }

    // ------------------ FALLBACK ------------------
    res.json({
      intent,
      responseMessage:
        result.fulfillmentText || "Sorry, I didn't understand that.",
      parameters: params,
    });
  } catch (error) {
    console.error("Dialogflow error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
