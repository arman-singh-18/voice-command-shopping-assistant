// server/src/routes/listRoutes.js
import express from "express";
import { addItem, getItems, deleteItem } from "../services/firestore.js";

const router = express.Router();

// GET all items
router.get("/", async (req, res) => {
  try {
    const items = await getItems();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST add item
router.post("/", async (req, res) => {
  try {
    const { name, quantity = 1, category = "uncategorized" } = req.body;
    const newItem = await addItem({ name, quantity, category });
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE item by ID
router.delete("/:id", async (req, res) => {
  try {
    await deleteItem(req.params.id);
    res.json({ message: "Item deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
