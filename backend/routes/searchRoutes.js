import express from 'express';
import Task from '../models/Task.js';

const router = express.Router();

// GET /api/tasks/search?query=...&priority=...
router.get('/search', async (req, res) => {
  try {
    const { query, priority } = req.query;

    const searchConditions = [];

    if (query) {
      searchConditions.push(
        { assignedTo: { $regex: query, $options: 'i' } },
        { title: { $regex: query, $options: 'i' } },
      );
    }

    const filter = {};
    if (searchConditions.length > 0) {
      filter.$or = searchConditions;
    }
    if (priority) {
      filter.priority = priority.toUpperCase();
    }

    const tasks = await Task.find(filter);
    res.json(tasks);
  } catch (error) {
    console.error('Error searching tasks:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});
export default Router;
