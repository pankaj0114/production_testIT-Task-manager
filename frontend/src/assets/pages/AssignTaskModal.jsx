import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/AssignTaskModal.css';

const API_BASE = (
  import.meta.env.VITE_API_URL || 'http://localhost:5005'
).replace(/\/+$/, '');

const AssignTaskModal = ({ onClose }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    assignDate: '',
    dueDate: '',
    estimatedHours: '',
    priority: 'MEDIUM',
    tags: '',
  });

  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/users/employees`);
        setEmployees(res.data);
      } catch (error) {
        console.error('Error fetching employees:', error);
      }
    };
    fetchEmployees();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('accessToken');

      const payload = {
        title: task.title,
        dueDate: task.dueDate,
        assignedTo: task.assignedTo,
        priority: task.priority,
      };

      console.log('Assigning task:', payload);

      const response = await axios.post(
        `${API_BASE}/api/tasks/assign`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log('TASK CREATED:', response.data);

      // Reset form
      setTask({
        title: '',
        dueDate: '',
        priority: 'Medium',
        assignedTo: '',
      });

      // Go back to the task section
      setActiveTab('assignedTasks');
    } catch (error) {
      console.error(
        'Error assigning task:',
        error.response?.data || error.message,
      );

      setErrorMessage(error.response?.data?.message || 'Failed to assign task');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2 className="modal-heading">Assign New Task</h2>

        <div className="modal-form">
          <label>Task Title</label>
          <input
            className="modal-input"
            name="title"
            value={form.title}
            onChange={handleChange}
          />

          <label>Description</label>
          <textarea
            className="modal-textarea"
            name="description"
            value={form.description}
            onChange={handleChange}
          />

          <label>Assign To</label>
          <select
            className="modal-select"
            name="assignedTo"
            value={form.assignedTo}
            onChange={handleChange}
          >
            <option value="">-- Select Employee --</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.name} ({emp.email})
              </option>
            ))}
          </select>

          <div className="modal-row">
            <div>
              <label>Assign Date</label>
              <input
                className="modal-input"
                type="date"
                name="assignDate"
                value={form.assignDate}
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Due Date</label>
              <input
                className="modal-input"
                type="date"
                name="dueDate"
                value={form.dueDate}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="modal-row">
            <div>
              <label>Estimated Hours</label>
              <input
                className="modal-input"
                name="estimatedHours"
                value={form.estimatedHours}
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Priority</label>
              <select
                className="modal-select"
                name="priority"
                value={form.priority}
                onChange={handleChange}
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>
            </div>
          </div>

          <label>Tags</label>
          <input
            className="modal-input"
            name="tags"
            value={form.tags}
            onChange={handleChange}
          />
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-create" onClick={handleSubmit}>
            Create & Assign
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignTaskModal;
