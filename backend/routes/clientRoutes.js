import express from 'express';
import Client from '../models/Client.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

console.log('✅ clientRoutes.js loaded');

router.get('/test', (req, res) => {
  console.log('✅ CLIENT TEST ROUTE HIT');

  res.status(200).json({
    message: 'Client routes are working',
  });
});

// Add new client
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, email, company, phone, notes } = req.body;

    const client = new Client({
      name,
      email,
      company,
      phone,
      notes,
    });

    await client.save();

    res.status(201).json({
      message: 'Client added successfully',
      client,
    });
  } catch (error) {
    console.error('Error adding client:', error);

    res.status(500).json({
      message: 'Server error',
    });
  }
});

// Get clients assigned to logged-in employee
router.get('/my-clients', authMiddleware, async (req, res) => {
  try {
    console.log('========== MY CLIENTS ==========');
    console.log('REQ.USER:', req.user);

    const employeeId = req.user.id;

    console.log('Logged-in employee ID:', employeeId);

    const clients = await Client.find({
      assignedTo: employeeId,
    }).sort({
      name: 1,
    });

    console.log('Assigned clients:', clients);

    console.log('Client count:', clients.length);

    console.log('================================');

    return res.status(200).json(clients);
  } catch (error) {
    console.error('GET MY CLIENTS ERROR:', error);

    return res.status(500).json({
      message: 'Unable to fetch assigned clients',
      error: error.message,
    });
  }
});

export default router;
