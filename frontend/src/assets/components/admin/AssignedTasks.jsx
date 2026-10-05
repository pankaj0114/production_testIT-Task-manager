import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Send,
  Clock3,
  CheckCircle2,
  CircleDot,
  AlertCircle,
  Plus,
  RefreshCw,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5005';

const AssignedTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [clients, setClients] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create task form
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [client, setClient] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  // Keep inline edits separate from server data.
  // This prevents the remarks input from losing characters while typing.
  const [editingTasks, setEditingTasks] = useState({});

  const getToken = () => localStorage.getItem('accessToken');

  const authConfig = () => ({
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    },
  });

  const normalizeArray = (data, keys = []) => {
    if (Array.isArray(data)) return data;

    for (const key of keys) {
      if (Array.isArray(data?.[key])) {
        return data[key];
      }
    }

    return [];
  };

  const getTaskValue = (task, field) => {
    if (
      Object.prototype.hasOwnProperty.call(editingTasks, task._id) &&
      Object.prototype.hasOwnProperty.call(editingTasks[task._id], field)
    ) {
      return editingTasks[task._id][field];
    }

    if (field === 'client') {
      return typeof task.client === 'object'
        ? task.client?._id || ''
        : task.client || '';
    }

    if (field === 'remarks') {
      return task.remarks || '';
    }

    return task[field] ?? '';
  };

  const setLocalTaskValue = (taskId, field, value) => {
    setEditingTasks((prev) => ({
      ...prev,
      [taskId]: {
        ...(prev[taskId] || {}),
        [field]: value,
      },
    }));
  };
  const fetchTasks = async () => {
    console.log('========== FETCH ASSIGNED TASKS ==========');

    setLoadingTasks(true);

    try {
      const token = localStorage.getItem('accessToken');

      console.log('Token exists:', !!token);

      const response = await axios.get(`${API_BASE}/api/admin/tasks`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('API RESPONSE:', response.data);

      const allTasks = normalizeArray(response.data, ['tasks']);

      console.log('ALL TASKS:', allTasks);

      const currentUser = JSON.parse(localStorage.getItem('user') || 'null');

      console.log('CURRENT USER:', currentUser);

      const adminId = currentUser?._id || currentUser?.id;

      console.log('ADMIN ID:', adminId);

      if (!adminId) {
        console.error('❌ Admin ID not found in localStorage');
        setTasks([]);
        return;
      }

      const assignedEmployeeTasks = allTasks.filter((task) => {
        const assignedById =
          typeof task.assignedBy === 'object'
            ? task.assignedBy?._id
            : task.assignedBy;

        const assignedToId =
          typeof task.assignedTo === 'object'
            ? task.assignedTo?._id
            : task.assignedTo;

        console.log('TASK CHECK:', {
          title: task.title,
          assignedById,
          assignedToId,
          adminId,
        });

        return (
          String(assignedById) === String(adminId) &&
          assignedToId &&
          String(assignedToId) !== String(adminId)
        );
      });

      console.log('✅ TASKS ASSIGNED BY THIS ADMIN:', assignedEmployeeTasks);

      setTasks(assignedEmployeeTasks);
    } catch (error) {
      console.error('❌ FETCH TASKS ERROR:', error);

      console.error('STATUS:', error.response?.status);

      console.error('DATA:', error.response?.data);

      setTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = getToken();

      const response = await axios.get(
        `${API_BASE}/api/admin/employees/task-assignment`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setEmployees(normalizeArray(response.data, ['employees', 'users']));
    } catch (err) {
      console.error(
        'FETCH EMPLOYEES ERROR:',
        err.response?.data || err.message,
      );
    }
  };

  const fetchClients = async () => {
    try {
      const token = getToken();

      if (!token) {
        setError('Authentication token not found.');
        return;
      }

      const response = await axios.get(`${API_BASE}/api/admin/clients`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('CLIENTS:', response.data);

      setClients(normalizeArray(response.data, ['clients']) || []);
    } catch (err) {
      console.error('FETCH CLIENTS ERROR:', err.response?.data || err.message);

      setError(err.response?.data?.message || 'Failed to load clients');
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchEmployees();
    fetchClients();
  }, []);

  const handleCreateTask = async (event) => {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (!title.trim()) {
      setError('Please enter a task title.');
      return;
    }

    if (!dueDate) {
      setError('Please select a due date.');
      return;
    }

    if (!assignedTo) {
      setError('Please select an employee.');
      return;
    }

    try {
      setSaving(true);

      const token = getToken();

      if (!token) {
        setError('Authentication token not found.');
        return;
      }

      const response = await axios.post(
        `${API_BASE}/api/tasks/assign`,
        {
          title: title.trim(),
          dueDate,
          priority: priority || 'Medium',
          client: client || null,
          assignedTo,
        },
        authConfig(),
      );

      const createdTask = response.data?.task || response.data;

      if (createdTask && createdTask._id) {
        setTasks((prev) => [createdTask, ...prev]);
      } else {
        await fetchTasks();
      }

      setTitle('');
      setDueDate('');
      setPriority('Medium');
      setClient('');
      setAssignedTo('');

      setSuccess('Task assigned successfully.');

      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      console.error(
        'CREATE ASSIGNED TASK ERROR:',
        err.response?.data || err.message,
      );

      setError(err.response?.data?.message || 'Failed to assign task.');
    } finally {
      setSaving(false);
    }
  };

  const updateTaskOnServer = async (taskId, field, value) => {
    try {
      let response;

      if (field === 'remarks') {
        response = await axios.put(
          `${API_BASE}/api/tasks/${taskId}/remarks`,
          {
            remarks: value,
          },
          authConfig(),
        );
      } else {
        response = await axios.put(
          `${API_BASE}/api/tasks/${taskId}`,
          {
            [field]: value || null,
          },
          authConfig(),
        );
      }

      console.log('Task update response:', response.data);

      // IMPORTANT:
      // Do NOT replace the entire task with response.data.
      // Preserve assignedTo, client, assignedBy, etc.
      setTasks((prevTasks) =>
        prevTasks.map((task) => {
          if (String(task._id) !== String(taskId)) {
            return task;
          }

          return {
            ...task,
            [field]: value,
          };
        }),
      );

      return true;
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      console.error('Response:', error.response?.data);

      return false;
    }
  };

  const handleInlineChange = (taskId, field, value) => {
    // Update only local editing state while typing/selecting.
    setLocalTaskValue(taskId, field, value);
  };

  const handleInlineBlur = async (taskId, field) => {
    const value = editingTasks[taskId]?.[field];

    if (value === undefined) {
      return;
    }

    const success = await updateTaskOnServer(taskId, field, value);

    if (success) {
      setEditingTasks((prev) => {
        const next = { ...prev };

        if (next[taskId]) {
          const taskEdits = { ...next[taskId] };
          delete taskEdits[field];

          if (Object.keys(taskEdits).length === 0) {
            delete next[taskId];
          } else {
            next[taskId] = taskEdits;
          }
        }

        return next;
      });
    }
  };

  const handleStatusChange = async (taskId, status) => {
    await updateTaskOnServer(taskId, 'status', status);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-700';

      case 'In Progress':
        return 'bg-blue-100 text-blue-700';

      default:
        return 'bg-orange-100 text-orange-700';
    }
  };

  const getPriorityClass = (taskPriority) => {
    switch (taskPriority) {
      case 'High':
        return 'bg-red-100 text-red-700';

      case 'Low':
        return 'bg-slate-100 text-slate-600';

      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const pendingTasks = tasks.filter((task) => task.status === 'Not Started');

  const inProgressTasks = tasks.filter((task) => task.status === 'In Progress');

  const completedTasks = tasks.filter((task) => task.status === 'Completed');

  return (
    <div className="mx-auto w-full max-w-7xl">
      {/* Create New Task */}
      <div className="mb-12 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
            Create New Task
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Create and assign a task to yourself or another employee.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <form onSubmit={handleCreateTask}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Task Title */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Task Title
              </label>

              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Due Date
              </label>

              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Priority */}

            {/* Client */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Client
              </label>

              <select
                value={client}
                onChange={(e) => setClient(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">-- Select Client --</option>

                {clients.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name || item.company || 'Unnamed Client'}
                  </option>
                ))}
              </select>
            </div>

            {/* Assign To */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Assign To
              </label>

              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">-- Select Employee --</option>

                {employees.map((employee) => (
                  <option key={employee._id} value={employee._id}>
                    {employee.name || employee.email || 'Unnamed Employee'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-6">
            <button
              type="button"
              onClick={() => {
                setTitle('');
                setDueDate('');
                setPriority('Medium');
                setClient('');
                setAssignedTo('');
                setError('');
              }}
              className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus size={18} />

              {saving ? 'Adding...' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>

      {/* Assigned Tasks */}
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Assigned Tasks</h2>

          <p className="mt-1 text-sm text-slate-500">
            View and update tasks assigned to your employees.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchTasks}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Assigned</p>
              <p className="mt-1 text-3xl font-bold text-slate-800">
                {tasks.length}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Send size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Pending</p>
              <p className="mt-1 text-3xl font-bold text-slate-800">
                {pendingTasks.length}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <Clock3 size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">In Progress</p>
              <p className="mt-1 text-3xl font-bold text-slate-800">
                {inProgressTasks.length}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <CircleDot size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Completed</p>
              <p className="mt-1 text-3xl font-bold text-slate-800">
                {completedTasks.length}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <CheckCircle2 size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
          <h3 className="text-lg font-semibold text-slate-800">
            Tasks Assigned By Me
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Edit title, due date, client and remarks directly in the table.
          </p>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-262.5 text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-5 py-4 text-left font-semibold text-slate-600">
                  Title
                </th>

                <th className="px-5 py-4 text-left font-semibold text-slate-600">
                  Assigned To
                </th>

                <th className="px-5 py-4 text-left font-semibold text-slate-600">
                  Due Date
                </th>

                <th className="px-5 py-4 text-left font-semibold text-slate-600">
                  Status
                </th>

                <th className="px-5 py-4 text-left font-semibold text-slate-600">
                  Client
                </th>

                <th className="px-5 py-4 text-left font-semibold text-slate-600">
                  Remarks
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loadingTasks ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    Loading assigned tasks...
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    <div className="flex flex-col items-center">
                      <AlertCircle className="mb-2 text-slate-400" size={28} />
                      <p>You have not assigned any tasks yet.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task._id} className="transition hover:bg-slate-50">
                    {/* Editable Title */}
                    <td className="px-5 py-4">
                      <input
                        type="text"
                        value={getTaskValue(task, 'title')}
                        onChange={(e) =>
                          handleInlineChange(task._id, 'title', e.target.value)
                        }
                        onBlur={() => handleInlineBlur(task._id, 'title')}
                        className="w-full min-w-47.5 rounded-md border border-transparent bg-transparent px-2 py-2 font-medium text-slate-800 outline-none transition hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                      />
                    </td>

                    {/* Assigned To */}
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-medium text-slate-700">
                          {task.assignedTo?.name || 'Unknown'}
                        </p>

                        {task.assignedTo?.email && (
                          <p className="mt-1 text-xs text-slate-400">
                            {task.assignedTo.email}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Editable Due Date */}
                    <td className="px-5 py-4">
                      <input
                        type="date"
                        value={
                          getTaskValue(task, 'dueDate')
                            ? String(getTaskValue(task, 'dueDate')).slice(0, 10)
                            : ''
                        }
                        onChange={(e) =>
                          handleInlineChange(
                            task._id,
                            'dueDate',
                            e.target.value,
                          )
                        }
                        onBlur={() => handleInlineBlur(task._id, 'dueDate')}
                        className="rounded-md border border-transparent bg-transparent px-2 py-2 text-slate-600 outline-none hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                      />
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <select
                        value={task.status || 'Not Started'}
                        onChange={(e) =>
                          handleStatusChange(task._id, e.target.value)
                        }
                        className={`rounded-full border-0 px-3 py-1.5 text-xs font-semibold outline-none ${getStatusClass(
                          task.status,
                        )}`}
                      >
                        <option value="Not Started">Not Started</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>

                    {/* Editable Client */}
                    <td className="px-5 py-4">
                      <select
                        value={getTaskValue(task, 'client')}
                        onChange={(e) =>
                          handleInlineChange(task._id, 'client', e.target.value)
                        }
                        onBlur={() => handleInlineBlur(task._id, 'client')}
                        className="min-w-42.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="">No Client</option>

                        {clients.map((item) => (
                          <option key={item._id} value={item._id}>
                            {item.name || item.company || 'Unnamed Client'}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Editable Remarks */}
                    <td className="px-5 py-4">
                      <input
                        type="text"
                        value={
                          editingTasks[task._id]?.remarks !== undefined
                            ? editingTasks[task._id].remarks
                            : task.remarks || ''
                        }
                        onChange={(e) =>
                          setLocalTaskValue(task._id, 'remarks', e.target.value)
                        }
                        onBlur={() => handleInlineBlur(task._id, 'remarks')}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AssignedTasks;
