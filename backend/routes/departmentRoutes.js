/* import express from 'express';
import Department from '../models/Department.js';
import { authMiddleware, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// ✅ HR/Admin can view departments
router.get(
  '/',
  authMiddleware,
  authorizeRoles(['hr_manager', 'admin']),
  async (req, res) => {
    try {
      const departments = await Department.find({ isActive: true });
      res.json(departments);
    } catch (error) {
      console.error('Error fetching departments:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },
);

// ✅ HR/Admin can create a new department
router.post(
  '/',
  authMiddleware,
  authorizeRoles(['hr_manager', 'admin']),
  async (req, res) => {
    try {
      const { name, description, head } = req.body;

      const department = new Department({
        name,
        description,
        head,
        createdBy: req.user.id, // comes from JWT payload
      });

      await department.save();
      res
        .status(201)
        .json({ message: 'Department created successfully', department });
    } catch (error) {
      console.error('Error creating department:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },
);

export default router;
 */
