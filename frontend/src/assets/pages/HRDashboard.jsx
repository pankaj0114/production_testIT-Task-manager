import { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/HRDashboard.css';
import AssignTaskModal from './AssignTaskModal';

export default function HRDashboard() {
  const [showModal, setShowModal] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchTasks();
    fetchEmployees();
  }, []);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get('${API_BASE}/api/tasks', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(res.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get('${API_BASE}/api/users/employees');
      setEmployees(res.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleChange = (e, taskId) => {
    const { name, value } = e.target;
    setTasks((prev) =>
      prev.map((task) =>
        task._id === taskId ? { ...task, [name]: value } : task,
      ),
    );
  };

  const handleUpdate = async (taskId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const task = tasks.find((t) => t._id === taskId);
      await axios.put(
        `${API_BASE}/api/tasks/${taskId}`,
        {
          title: task.title,
          description: task.description,
          dueDate: task.dueDate,
          priority: task.priority,
          assignedTo: task.assignedTo?._id || task.assignedTo,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setMessage('✅ Task updated successfully!');
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      setMessage('❌ Error updating task');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/';
  };

  return (
    <div className="hr-dashboard">
      <div className="dashboard-header">
        <h2>HR Manager Dashboard</h2>
        <button className="btn-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <button onClick={() => setShowModal(true)}>Assign Task</button>
      {showModal && (
        <AssignTaskModal
          onClose={() => {
            setShowModal(false);
            fetchTasks();
          }}
        />
      )}

      {message && <p className="message">{message}</p>}

      <table className="task-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>Priority</th>
            <th>Due Date</th>
            <th>Assigned To</th>
            <th>Assigned By</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task._id}>
              <td>
                <input
                  type="text"
                  name="title"
                  value={task.title}
                  onChange={(e) => handleChange(e, task._id)}
                />
              </td>
              <td>
                <textarea
                  name="description"
                  value={task.description}
                  onChange={(e) => handleChange(e, task._id)}
                />
              </td>
              <td>
                <select
                  name="priority"
                  value={task.priority}
                  onChange={(e) => handleChange(e, task._id)}
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="URGENT">URGENT</option>
                </select>
              </td>
              <td>
                <input
                  type="date"
                  name="dueDate"
                  value={task.dueDate?.substring(0, 10)}
                  onChange={(e) => handleChange(e, task._id)}
                />
              </td>
              <td>
                <select
                  name="assignedTo"
                  value={task.assignedTo?._id || task.assignedTo || ''}
                  onChange={(e) => handleChange(e, task._id)}
                >
                  <option value="">-- Select Employee --</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.email})
                    </option>
                  ))}
                </select>
              </td>
              <td>{task.assignedBy?.email || 'N/A'}</td>
              <td>
                <button onClick={() => handleUpdate(task._id)}>Update</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
