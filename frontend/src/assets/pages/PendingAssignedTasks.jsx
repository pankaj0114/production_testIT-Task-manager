import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../css/EmployeeDashboard.css';

const PendingAssignedTasks = () => {
  const navigate = useNavigate();

  const storedUser = localStorage.getItem('user');

  let loggedInUser = null;

  try {
    loggedInUser = storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error('Invalid user data:', error);
  }

  const [user] = useState(loggedInUser);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [remarkTimers, setRemarkTimers] = useState({});

  const fetchTasks = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('accessToken');

      const response = await axios.get(
        'http://localhost:5005/api/tasks/pending-assigned',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('PENDING TASKS FROM API:', response.data);

      setTasks(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(
        'Error fetching pending tasks:',
        error.response?.data || error.message,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleRemarkChange = (taskId, value) => {
    if (!taskId) {
      console.error('Task ID missing while editing remark');
      return;
    }

    // Immediately update UI
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        String(task._id) === String(taskId)
          ? {
              ...task,
              remarks: value,
            }
          : task,
      ),
    );

    // Clear previous timer for this task
    if (remarkTimers[taskId]) {
      clearTimeout(remarkTimers[taskId]);
    }

    // Save after user stops typing
    const timer = setTimeout(async () => {
      try {
        const token = localStorage.getItem('accessToken');

        console.log('Automatically saving remark:', {
          taskId,
          remarks: value,
        });

        const response = await axios.put(
          `http://localhost:5005/api/tasks/${taskId}`,
          {
            remarks: value,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        );

        console.log('Remark saved:', response.data);
      } catch (error) {
        console.error(
          'Error automatically saving remark:',
          error.response?.data || error.message,
        );
      }
    }, 700);

    setRemarkTimers((prev) => ({
      ...prev,
      [taskId]: timer,
    }));
  };

  const saveRemark = async (taskId, remarks) => {
    try {
      if (!taskId) {
        console.error('Task ID is missing:', taskId);
        return;
      }

      const token = localStorage.getItem('accessToken');

      console.log('Saving remark:', {
        taskId,
        remarks,
      });

      const response = await axios.put(
        `http://localhost:5005/api/tasks/${taskId}`,
        {
          remarks,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log('Remark saved successfully:', response.data);

      // Keep frontend synchronized with database
      if (response.data.task) {
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            String(task._id) === String(taskId) ? response.data.task : task,
          ),
        );
      }
    } catch (error) {
      console.error(
        'Error automatically saving remark:',
        error.response?.data || error.message,
      );
    }
  };
  const handleUpdateTask = async (taskId, changes) => {
    try {
      if (!taskId) {
        console.error('Task ID is missing:', taskId);
        return;
      }

      console.log('Updating task:', taskId);
      console.log('Changes:', changes);

      const token = localStorage.getItem('accessToken');

      const response = await axios.put(
        `http://localhost:5005/api/tasks/${taskId}`,
        changes,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log('Task updated:', response.data);

      // Update the card immediately
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          String(task._id) === String(taskId)
            ? {
                ...task,
                ...response.data,
              }
            : task,
        ),
      );
    } catch (error) {
      console.error(
        'Error updating pending task:',
        error.response?.data || error.message,
      );
    }
  };

  const pendingTasks = tasks;

  if (loading) {
    return (
      <div className="assigned-status-page">
        <p>Loading pending tasks...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      {/* ================= HEADER ================= */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <button
          type="button"
          onClick={() => navigate('/employee-dashboard')}
          className="mb-5 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <span className="text-lg">←</span>
          Back to Dashboard
        </button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-800 sm:text-3xl">
                Pending Tasks
              </h2>

              <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">
                {pendingTasks.length}
              </span>
            </div>

            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Tasks assigned by you that are waiting to be started.
            </p>
          </div>
        </div>
      </div>

      {/* ================= TASK CARDS ================= */}
      {pendingTasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-500 sm:text-base">
            No pending tasks found.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {pendingTasks.map((task) => (
            <div
              key={task._id}
              className="overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
            >
              {/* Status */}
              <div className="flex items-center justify-between border-b border-orange-100 bg-orange-50 px-5 py-4">
                <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                  Pending
                </span>
              </div>

              {/* Task Information */}
              <div className="space-y-3 px-5 py-5">
                <p className="wrap-break-word text-sm text-slate-600">
                  <strong className="font-semibold text-slate-800">
                    Title:
                  </strong>{' '}
                  {task.title || 'No title'}
                </p>

                <p className="text-sm text-slate-600">
                  <strong className="font-semibold text-slate-800">
                    Due Date:
                  </strong>{' '}
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString()
                    : 'No due date'}
                </p>

                <p className="text-sm text-slate-600">
                  <strong className="font-semibold text-slate-800">
                    Priority:
                  </strong>{' '}
                  <span
                    className={`ml-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                      task.priority === 'High'
                        ? 'bg-red-100 text-red-700'
                        : task.priority === 'Low'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {task.priority || 'Medium'}
                  </span>
                </p>

                <p className="text-sm text-slate-600">
                  <strong className="font-semibold text-slate-800">
                    Assigned To:
                  </strong>{' '}
                  {task.assignedTo?.name || 'N/A'}
                </p>

                <p className="text-sm text-slate-600">
                  <strong className="font-semibold text-slate-800">
                    Assigned By:
                  </strong>{' '}
                  {task.assignedBy?.name || 'Me'}
                </p>
              </div>

              {/* Editable Remarks */}
              <div className="border-t border-slate-100 bg-slate-50 px-5 py-5">
                <label
                  htmlFor={`remarks-${task._id}`}
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Remarks:
                </label>

                <textarea
                  id={`remarks-${task._id}`}
                  value={task.remarks || ''}
                  onChange={(e) => handleRemarkChange(task._id, e.target.value)}
                  placeholder="Add remarks..."
                  rows={3}
                  className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingAssignedTasks;
