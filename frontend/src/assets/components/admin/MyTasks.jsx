import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
//import '../css/MyTaskform.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5005';

const getTodayDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const authConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
    'Content-Type': 'application/json',
  },
});

export default function MyTasks({ user, admin }) {
  const currentAdmin =
    admin ||
    user ||
    (() => {
      try {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
      } catch {
        return null;
      }
    })();
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newTask, setNewTask] = useState({
    title: '',
    dueDate: getTodayDate(),
    assignedTo: '',
    assignedBy: '',
    priority: 'Medium',
    remarks: '',
    client: '',
  });

  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [clientSearchTaskId, setClientSearchTaskId] = useState(null);
  const [clientSearchText, setClientSearchText] = useState('');
  const [showTaskClientDropdown, setShowTaskClientDropdown] = useState(false);
  const [highlightedTaskClientIndex, setHighlightedTaskClientIndex] =
    useState(-1);
  const taskClientDropdownRef = useRef(null);
  const [typingTimeouts, setTypingTimeouts] = useState({});

  const [showPopup, setShowPopup] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE}/api/admin/tasks/my`,
        authConfig(),
      );
      const data = response.data;
      const taskList = Array.isArray(data)
        ? data
        : Array.isArray(data?.tasks)
          ? data.tasks
          : Array.isArray(data?.data)
            ? data.data
            : [];
      setTasks(taskList);
    } catch (err) {
      console.error(
        'Error fetching my tasks:',
        err.response?.data || err.message,
      );
      setError(err.response?.data?.message || 'Failed to load your tasks.');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/admin/clients`,
        authConfig(),
      );

      console.log('ADMIN CLIENTS FROM API:', response.data);

      const responseData = response.data;
      const adminClients = Array.isArray(responseData)
        ? responseData
        : Array.isArray(responseData?.clients)
          ? responseData.clients
          : Array.isArray(responseData?.data)
            ? responseData.data
            : [];

      setClients(adminClients);
    } catch (err) {
      console.error(
        'Error fetching clients:',
        err.response?.data || err.message,
      );
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/users/employees`,
        authConfig(),
      );
      setEmployees(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error(
        'Error fetching employees:',
        err.response?.data || err.message,
      );
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchClients();
    fetchEmployees();
  }, []);

  const handleChange = (e) => {
    setNewTask((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleQuickAddTask();
    }
  };

  const handleQuickAddTask = async () => {
    try {
      const title = newTask.title.trim();
      if (!title) return alert('Please enter a task title.');

      const todayDate = getTodayDate();
      await axios.post(
        `${API_BASE}/api/tasks/assign`,
        {
          title,
          quickAdd: true,
          assignedTo: 'me',
          priority: 'Medium',
          dueDate: newTask.dueDate || todayDate,
          client: newTask.client || null,
        },
        authConfig(),
      );

      setNewTask((prev) => ({
        ...prev,
        title: '',
        dueDate: todayDate,
        client: '',
      }));
      await fetchTasks();
    } catch (err) {
      console.error(
        'Error quick adding task:',
        err.response?.data || err.message,
      );
      setError(err.response?.data?.message || 'Failed to quick add task.');
    }
  };

  const handleAddTask = async () => {
    try {
      if (!newTask.title.trim()) return setError('Please add a task title.');
      if (!newTask.dueDate) return setError('Please select a due date.');
      if (!newTask.client) return setError('Please select a client.');
      if (!newTask.assignedBy) return setError('Please select Assigned By.');

      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Authentication token not found. Please login again.');
        return;
      }

      console.log('CREATING ADMIN MY TASK:', {
        adminId: currentAdmin?._id || currentAdmin?.id || null,
        title: newTask.title.trim(),
        dueDate: newTask.dueDate,
        client: newTask.client,
        assignedBy: newTask.assignedBy,
      });

      await axios.post(
        `${API_BASE}/api/admin/tasks/my`,
        {
          title: newTask.title.trim(),
          dueDate: newTask.dueDate,
          client: newTask.client,
          assignedBy: newTask.assignedBy,
        },
        authConfig(),
      );

      setNewTask({
        title: '',
        dueDate: getTodayDate(),
        assignedTo: '',
        assignedBy: '',
        priority: 'Medium',
        remarks: '',
        client: '',
      });
      setError('');
      await fetchTasks();
    } catch (err) {
      console.error('Error adding task:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to create task.');
    }
  };

  const handleUpdateTaskTitle = async (taskId) => {
    const title = editingTitle.trim();
    if (!title) return alert('Task title cannot be empty.');

    try {
      await axios.put(
        `${API_BASE}/api/tasks/${taskId}`,
        { title },
        authConfig(),
      );
      setEditingTaskId(null);
      setEditingTitle('');
      await fetchTasks();
    } catch (err) {
      console.error('Error updating title:', err.response?.data || err.message);
      alert(err.response?.data?.message || 'Failed to update task title.');
    }
  };

  const handleDueDateChange = async (taskId, dueDate) => {
    try {
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, dueDate } : t)),
      );
      await axios.put(
        `${API_BASE}/api/tasks/${taskId}`,
        { dueDate },
        authConfig(),
      );
    } catch (err) {
      console.error(
        'Error updating due date:',
        err.response?.data || err.message,
      );
      await fetchTasks();
    }
  };

  const handleRemarkChange = (taskId, value) => {
    setTasks((prev) =>
      prev.map((task) =>
        String(task._id) === String(taskId)
          ? { ...task, remarks: value }
          : task,
      ),
    );

    if (typingTimeouts[taskId]) clearTimeout(typingTimeouts[taskId]);

    const timeout = setTimeout(async () => {
      try {
        await axios.put(
          `${API_BASE}/api/tasks/${taskId}/remarks`,
          { remarks: value },
          authConfig(),
        );
      } catch (err) {
        console.error(
          'Error saving remark:',
          err.response?.data || err.message,
        );
      }
    }, 1000);

    setTypingTimeouts((prev) => ({ ...prev, [taskId]: timeout }));
  };

  const filteredTaskClients = useMemo(() => {
    const search = clientSearchText.trim().toLowerCase();
    return clients.filter((client) => {
      const name = client.name || client.company || client.clientName || '';
      return String(name).trim().toLowerCase().includes(search);
    });
  }, [clients, clientSearchText]);

  const handleTaskClientChange = async (taskId, clientId) => {
    try {
      const response = await axios.put(
        `${API_BASE}/api/tasks/${taskId}`,
        { client: clientId },
        authConfig(),
      );

      const returnedTask = response.data?.task || response.data;
      const selectedClient = clients.find(
        (c) =>
          String(c._id) === String(clientId) ||
          String(c.id) === String(clientId),
      );

      setTasks((prev) =>
        prev.map((task) =>
          task._id === taskId
            ? {
                ...task,
                ...returnedTask,
                client: returnedTask?.client || selectedClient || null,
              }
            : task,
        ),
      );

      setShowTaskClientDropdown(false);
      setClientSearchTaskId(null);
      setHighlightedTaskClientIndex(-1);
    } catch (err) {
      console.error(
        'Error updating client:',
        err.response?.data || err.message,
      );
      alert(err.response?.data?.message || 'Failed to update client.');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        taskClientDropdownRef.current &&
        !taskClientDropdownRef.current.contains(event.target)
      ) {
        setShowTaskClientDropdown(false);
        setClientSearchTaskId(null);
        setHighlightedTaskClientIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTaskChange = async (e, taskId) => {
    const newStatus = e.target.value;
    if (newStatus === 'Completed') {
      setSelectedTaskId(taskId);
      setHours('');
      setMinutes('');
      setShowPopup(true);
      return;
    }

    try {
      const response = await axios.put(
        `${API_BASE}/api/tasks/${taskId}`,
        { status: newStatus },
        authConfig(),
      );
      const updatedTask = response.data?.task || response.data;
      setTasks((prev) =>
        prev.map((task) =>
          task._id === taskId ? { ...task, ...updatedTask } : task,
        ),
      );
    } catch (err) {
      console.error(
        'Error updating status:',
        err.response?.data || err.message,
      );
      alert(err.response?.data?.message || 'Failed to update task status.');
    }
  };

  const handleCompleteTask = async () => {
    const totalHours = Number(hours);
    const totalMinutes = Number(minutes);

    if (!Number.isInteger(totalHours) || totalHours < 0)
      return alert('Please enter valid hours.');
    if (
      !Number.isInteger(totalMinutes) ||
      totalMinutes < 0 ||
      totalMinutes > 59
    ) {
      return alert('Minutes must be between 0 and 59.');
    }
    if (!selectedTaskId) return;

    try {
      const response = await axios.put(
        `${API_BASE}/api/tasks/${selectedTaskId}/complete`,
        { status: 'Completed', totalHours, totalMinutes },
        authConfig(),
      );

      const updatedTask = response.data?.task || response.data;
      setTasks((prev) =>
        prev.map((task) =>
          task._id === selectedTaskId ? { ...task, ...updatedTask } : task,
        ),
      );
      setShowPopup(false);
      setSelectedTaskId(null);
      setHours('');
      setMinutes('');
      await fetchTasks();
    } catch (err) {
      console.error(
        'Error completing task:',
        err.response?.data || err.message,
      );
      alert(err.response?.data?.message || 'Failed to complete task.');
    }
  };

  const myOpenTasks = tasks.filter((task) => {
    const assignedToId =
      task.assignedTo?._id || task.assignedTo?.id || task.assignedTo;
    const isMyTask = user?._id
      ? String(assignedToId) === String(user._id)
      : true;
    return isMyTask && task.status !== 'Completed';
  });

  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 w-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="w-full">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Title
            </label>
            <div className="flex w-full">
              <input
                name="title"
                type="text"
                value={newTask.title}
                onChange={handleChange}
                onKeyDown={handleTitleKeyDown}
                placeholder="Enter task title"
                className="h-10 min-w-0 flex-1 rounded-l-md border border-slate-300 px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="button"
                onClick={handleQuickAddTask}
                title="Quick add task"
                className="h-10 w-10 rounded-r-md bg-blue-500 text-xl font-semibold text-white hover:bg-blue-600"
              >
                +
              </button>
            </div>
          </div>

          <div className="w-full">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Due Date
            </label>
            <input
              name="dueDate"
              type="date"
              value={newTask.dueDate || getTodayDate()}
              onChange={handleChange}
              min={getTodayDate()}
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="w-full">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Client
            </label>
            <select
              name="client"
              value={newTask.client}
              onChange={handleChange}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Select an assigned client</option>
              {clients.map((client) => (
                <option key={client._id} value={client._id}>
                  {client.name}
                  {client.company ? ` - ${client.company}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Assigned By
            </label>
            <select
              name="assignedBy"
              value={newTask.assignedBy}
              onChange={handleChange}
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Assigned by</option>
              {employees.map((employee) => (
                <option key={employee._id} value={employee._id}>
                  {employee.name}
                  {employee.email ? ` - ${employee.email}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-1 flex justify-end md:col-span-2 xl:col-span-4">
            <button
              type="button"
              onClick={handleAddTask}
              className="h-11 rounded-lg bg-blue-600 px-7 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Add Task
            </button>
          </div>
        </div>
      </div>

      <h3 className="mb-4 text-lg font-semibold text-slate-800 sm:text-xl">
        My Tasks
      </h3>

      <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-225 border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100">
              {[
                'Title',
                'Issue Date',
                'Due Date',
                'Status',
                'Client',
                'Assigned By',
                'Remarks',
              ].map((heading) => (
                <th
                  key={heading}
                  className="px-4 py-3 text-left font-semibold text-slate-700"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-slate-500"
                >
                  Loading your tasks...
                </td>
              </tr>
            ) : myOpenTasks.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-slate-500"
                >
                  No active tasks found.
                </td>
              </tr>
            ) : (
              myOpenTasks.map((task) => (
                <tr
                  key={task._id}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-medium text-slate-700">
                    {editingTaskId === task._id ? (
                      <input
                        autoFocus
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleUpdateTaskTitle(task._id);
                          }
                          if (e.key === 'Escape') {
                            setEditingTaskId(null);
                            setEditingTitle('');
                          }
                        }}
                        onBlur={() => handleUpdateTaskTitle(task._id)}
                        className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    ) : (
                      <div
                        onClick={() => {
                          setEditingTaskId(task._id);
                          setEditingTitle(task.title || '');
                        }}
                        className="cursor-text rounded-md px-2 py-2 hover:bg-slate-100"
                      >
                        {task.title}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <input
                      type="date"
                      readOnly
                      value={
                        task.issueDate
                          ? new Date(task.issueDate).toISOString().split('T')[0]
                          : ''
                      }
                      className="min-w-32.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-600"
                    />
                  </td>

                  <td className="px-4 py-3">
                    <input
                      type="date"
                      value={
                        task.dueDate
                          ? new Date(task.dueDate).toISOString().split('T')[0]
                          : ''
                      }
                      onChange={(e) =>
                        handleDueDateChange(task._id, e.target.value)
                      }
                      min={getTodayDate()}
                      className="min-w-32.5 rounded-md border border-slate-300 bg-white px-2 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </td>

                  <td className="px-4 py-3">
                    <select
                      value={task.status || 'Not Started'}
                      onChange={(e) => handleTaskChange(e, task._id)}
                      className={`min-w-31.25 rounded-md border px-2 py-2 text-xs font-medium outline-none ${
                        task.status === 'Not Started'
                          ? 'border-orange-200 bg-orange-50 text-orange-700'
                          : task.status === 'In Progress'
                            ? 'border-blue-200 bg-blue-50 text-blue-700'
                            : 'border-slate-300 bg-white'
                      }`}
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </td>

                  <td className="px-4 py-3">
                    <div
                      ref={
                        clientSearchTaskId === task._id
                          ? taskClientDropdownRef
                          : null
                      }
                      className="relative min-w-47.5"
                    >
                      {(() => {
                        const taskClientId =
                          typeof task.client === 'string'
                            ? task.client
                            : task.client?._id || task.client?.id || '';

                        const selectedClient =
                          typeof task.client === 'object' && task.client
                            ? task.client
                            : clients.find(
                                (client) =>
                                  String(client._id) === String(taskClientId) ||
                                  String(client.id) === String(taskClientId) ||
                                  String(client.name || '')
                                    .trim()
                                    .toLowerCase() ===
                                    String(taskClientId || '')
                                      .trim()
                                      .toLowerCase() ||
                                  String(client.clientName || '')
                                    .trim()
                                    .toLowerCase() ===
                                    String(taskClientId || '')
                                      .trim()
                                      .toLowerCase(),
                              );

                        const selectedClientName =
                          selectedClient?.name ||
                          selectedClient?.clientName ||
                          selectedClient?.company ||
                          (typeof task.client === 'string'
                            ? task.client
                            : '') ||
                          '';

                        const inputValue =
                          clientSearchTaskId === task._id
                            ? clientSearchText
                            : selectedClientName;

                        const visibleClients = filteredTaskClients.filter(
                          (client) =>
                            String(client._id) !== String(taskClientId),
                        );

                        return (
                          <>
                            <input
                              type="text"
                              value={inputValue}
                              placeholder="Search client..."
                              autoComplete="off"
                              onFocus={(e) => {
                                setClientSearchTaskId(task._id);
                                setClientSearchText(selectedClientName);
                                setShowTaskClientDropdown(true);
                                setHighlightedTaskClientIndex(-1);
                                e.target.select();
                              }}
                              onChange={(e) => {
                                setClientSearchTaskId(task._id);
                                setClientSearchText(e.target.value);
                                setShowTaskClientDropdown(true);
                                setHighlightedTaskClientIndex(-1);
                              }}
                              onKeyDown={(e) => {
                                if (
                                  e.key === 'ArrowDown' &&
                                  visibleClients.length
                                ) {
                                  e.preventDefault();
                                  setHighlightedTaskClientIndex((i) =>
                                    i < visibleClients.length - 1 ? i + 1 : 0,
                                  );
                                }

                                if (
                                  e.key === 'ArrowUp' &&
                                  visibleClients.length
                                ) {
                                  e.preventDefault();
                                  setHighlightedTaskClientIndex((i) =>
                                    i > 0 ? i - 1 : visibleClients.length - 1,
                                  );
                                }

                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const selected =
                                    visibleClients[highlightedTaskClientIndex];
                                  if (selected) {
                                    handleTaskClientChange(
                                      task._id,
                                      selected._id,
                                    );
                                  }
                                }

                                if (e.key === 'Escape') {
                                  setClientSearchText(selectedClientName);
                                  setShowTaskClientDropdown(false);
                                  setClientSearchTaskId(null);
                                  setHighlightedTaskClientIndex(-1);
                                }
                              }}
                              onBlur={() => {
                                // Keep the saved client visible in the input if the user
                                // leaves the field without selecting another client.
                                if (!showTaskClientDropdown) {
                                  setClientSearchText(selectedClientName);
                                }
                              }}
                              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            />

                            {clientSearchTaskId === task._id &&
                              showTaskClientDropdown && (
                                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl">
                                  {visibleClients.length ? (
                                    visibleClients.map((client, index) => {
                                      const name =
                                        client.name ||
                                        client.company ||
                                        client.clientName ||
                                        'Unnamed Client';

                                      return (
                                        <button
                                          key={client._id}
                                          type="button"
                                          onMouseDown={(event) =>
                                            event.preventDefault()
                                          }
                                          onMouseEnter={() =>
                                            setHighlightedTaskClientIndex(index)
                                          }
                                          onClick={() =>
                                            handleTaskClientChange(
                                              task._id,
                                              client._id,
                                            )
                                          }
                                          className={`block w-full px-3 py-2.5 text-left text-sm ${
                                            highlightedTaskClientIndex === index
                                              ? 'bg-blue-50 text-blue-700'
                                              : 'text-slate-700 hover:bg-slate-50'
                                          }`}
                                        >
                                          {name}
                                        </button>
                                      );
                                    })
                                  ) : (
                                    <div className="px-3 py-3 text-sm text-slate-500">
                                      No other clients found
                                    </div>
                                  )}
                                </div>
                              )}
                          </>
                        );
                      })()}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-slate-600">
                    {task.assignedBy?.name || ''}
                  </td>

                  <td className="px-4 py-3">
                    <textarea
                      value={task.remarks || ''}
                      onChange={(e) =>
                        handleRemarkChange(task._id, e.target.value)
                      }
                      placeholder="Add your remarks..."
                      rows={2}
                      className="min-w-45 resize-y rounded-md border border-slate-300 bg-green-50 px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-green-300"
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">
              Upon Completion of your task, Please Log your Time
            </h3>
            <div className="space-y-3">
              <input
                type="number"
                min="0"
                placeholder="Hours"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                type="number"
                min="0"
                max="59"
                placeholder="Minutes"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowPopup(false);
                  setSelectedTaskId(null);
                }}
                className="rounded-md bg-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCompleteTask}
                className="rounded-md bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
