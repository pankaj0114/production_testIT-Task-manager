import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import '../css/MyTaskform.css';

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

export default function MyTasks({ user, searchValue = '' }) {
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
  const [editingRemarks, setEditingRemarks] = useState({});
  //const [typingTimeouts, setTypingTimeouts] = useState({});

  const typingTimeouts = useRef({});
  const [clientSearchTaskId, setClientSearchTaskId] = useState(null);
  const [clientSearchText, setClientSearchText] = useState('');
  const [showTaskClientDropdown, setShowTaskClientDropdown] = useState(false);
  const [highlightedTaskClientIndex, setHighlightedTaskClientIndex] =
    useState(-1);
  const taskClientDropdownRef = useRef(null);

  const [showPopup, setShowPopup] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState('all');
  const [assignedTaskStatusFilter, setAssignedTaskStatusFilter] =
    useState('all');

  // Table filters for My Tasks
  const [myTaskSearch, setMyTaskSearch] = useState('');
  const [myTaskClientFilter, setMyTaskClientFilter] = useState('all');
  const [myTaskDueFilter, setMyTaskDueFilter] = useState('all');
  const [myTaskSort, setMyTaskSort] = useState('due-asc');

  // Table filters for Assigned to Me
  const [assignedTaskSearch, setAssignedTaskSearch] = useState('');

  const [assignedTaskClientFilter, setAssignedTaskClientFilter] =
    useState('all');
  const [assignedTaskDueFilter, setAssignedTaskDueFilter] = useState('all');
  const [assignedTaskSort, setAssignedTaskSort] = useState('due-asc');

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE}/api/tasks/my-tasks`,
        authConfig(),
      );
      setTasks(Array.isArray(response.data) ? response.data : []);
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

  const fetchEmployees = async () => {
    try {
      // This endpoint should return the employees/users whose names can be
      // selected in the Assigned By field.
      const response = await axios.get(
        `${API_BASE}/api/users/employees`,
        authConfig(),
      );

      const list = Array.isArray(response.data)
        ? response.data
        : response.data?.employees || response.data?.users || [];

      setEmployees(list);
    } catch (err) {
      console.error(
        'Error fetching employees for Assigned By:',
        err.response?.data || err.message,
      );
      setEmployees([]);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/clients/my-clients`,
        authConfig(),
      );
      setClients(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error(
        'Error fetching clients:',
        err.response?.data || err.message,
      );
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchClients();
    fetchEmployees();
  }, []);

  const handleRefreshTasks = async () => {
    try {
      setRefreshing(true);
      await fetchTasks();
    } finally {
      setRefreshing(false);
    }
  };

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
      const currentUserId = user?._id || user?.id;
      await axios.post(
        `${API_BASE}/api/tasks/assign`,
        {
          title,
          quickAdd: true,
          assignedTo: 'me',
          assignedBy: currentUserId,
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
        assignedBy: '',
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
      if (!newTask.assignedBy)
        return setError('Please select the user who assigned this task.');
      if (!user?._id)
        return setError(
          'User information is not available. Please login again.',
        );

      await axios.post(
        `${API_BASE}/api/tasks/assign`,
        {
          title: newTask.title.trim(),
          dueDate: newTask.dueDate,
          client: newTask.client,
          priority: newTask.priority || 'Medium',
          assignedBy: newTask.assignedBy,
          assignedTo: user?._id || user?.id,
          remarks: newTask.remarks || '',
          issueDate: getTodayDate(),
          quickAdd: false,
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
        `${API_BASE}/api/tasks/${taskId}/due-date`,
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
    // Update ONLY the local typing state.
    // This keeps the textarea focused while typing.
    setEditingRemarks((prev) => ({
      ...prev,
      [taskId]: value,
    }));

    // Clear previous timer for this task
    if (typingTimeouts.current[taskId]) {
      clearTimeout(typingTimeouts.current[taskId]);
    }

    // Save after user stops typing for 1 second
    typingTimeouts.current[taskId] = setTimeout(async () => {
      try {
        await axios.put(
          `${API_BASE}/api/tasks/${taskId}/remarks`,
          {
            remarks: value,
          },
          authConfig(),
        );

        console.log('Remark saved successfully:', value);

        // Update the task state without refetching the entire table.
        setTasks((prev) =>
          prev.map((task) =>
            String(task._id) === String(taskId)
              ? {
                  ...task,
                  remarks: value,
                }
              : task,
          ),
        );

        // Remove temporary editing state
        setEditingRemarks((prev) => {
          const updated = { ...prev };
          delete updated[taskId];
          return updated;
        });

        delete typingTimeouts.current[taskId];
      } catch (err) {
        console.error(
          'Error saving remark:',
          err.response?.data || err.message,
        );
      }
    }, 1000);
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
        (c) => String(c._id) === String(clientId),
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

  const getTaskClientName = (task) => {
    const client = task?.client;

    if (!client) return '';

    if (typeof client === 'string') {
      const matchedClient = clients.find(
        (item) => String(item?._id) === String(client),
      );

      return (
        matchedClient?.name ||
        matchedClient?.company ||
        matchedClient?.clientName ||
        client
      );
    }

    return client.name || client.company || client.clientName || '';
  };

  const getTaskDueDateKey = (task) => {
    if (!task?.dueDate) return '';

    if (typeof task.dueDate === 'string') {
      return task.dueDate.slice(0, 10);
    }

    const date = new Date(task.dueDate);

    if (Number.isNaN(date.getTime())) return '';

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const getTaskIssueDateKey = (task) => {
    if (!task?.issueDate) return '';

    if (typeof task.issueDate === 'string') {
      return task.issueDate.slice(0, 10);
    }

    const date = new Date(task.issueDate);

    if (Number.isNaN(date.getTime())) return '';

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const formatDateForInput = (value) => {
    if (!value) return '';

    if (typeof value === 'string') return value.slice(0, 10);

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return '';

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const filterAndSortTasks = (taskList, filters) => {
    const today = getTodayDate();

    const search = String(searchValue || filters.search || '')
      .trim()
      .toLowerCase();

    const filtered = taskList.filter((task) => {
      const title = String(task?.title || '').toLowerCase();
      const clientName = String(getTaskClientName(task) || '').toLowerCase();
      const remarks = String(task?.remarks || '').toLowerCase();
      const status = String(task?.status || 'Not Started').toLowerCase();
      const priority = String(task?.priority || '').toLowerCase();
      const assignedByName = String(task?.assignedBy?.name || '').toLowerCase();
      const assignedByEmail = String(
        task?.assignedBy?.email || '',
      ).toLowerCase();

      // Get the task's due date in YYYY-MM-DD format
      const dueDate = getTaskDueDateKey(task);

      if (
        search &&
        !title.includes(search) &&
        !clientName.includes(search) &&
        !remarks.includes(search) &&
        !status.includes(search) &&
        !priority.includes(search) &&
        !assignedByName.includes(search) &&
        !assignedByEmail.includes(search)
      ) {
        return false;
      }

      if (filters.status === 'pending') {
        if (status !== 'not started' && status !== 'pending') return false;
      }

      if (filters.status === 'in-progress') {
        if (status !== 'in progress' && status !== 'in-progress') return false;
      }

      if (filters.status === 'completed') {
        if (status !== 'completed') return false;
      }

      if (filters.client !== 'all') {
        if (
          String(getTaskClientName(task)).toLowerCase() !==
          String(filters.client).toLowerCase()
        ) {
          return false;
        }
      }

      if (filters.due === 'overdue') {
        if (!dueDate || dueDate >= today) return false;
      }

      if (filters.due === 'upcoming') {
        if (!dueDate || dueDate < today) return false;
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      if (filters.sort === 'title-asc') {
        return String(a?.title || '').localeCompare(
          String(b?.title || ''),
          undefined,
          {
            sensitivity: 'base',
          },
        );
      }

      const aDue = getTaskDueDateKey(a);
      const bDue = getTaskDueDateKey(b);

      // Tasks without a due date stay at the bottom for both date sorts.
      if (!aDue && !bDue) return 0;
      if (!aDue) return 1;
      if (!bDue) return -1;

      if (filters.sort === 'due-desc') {
        return bDue.localeCompare(aDue);
      }

      return aDue.localeCompare(bDue);
    });
  };

  const getUniqueClientNames = (taskList) => {
    const names = taskList
      .map((task) => getTaskClientName(task).trim())
      .filter(Boolean);

    return [...new Set(names)].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' }),
    );
  };

  const renderTableFilters = ({
    taskList,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    clientFilter,
    setClientFilter,
    dueFilter,
    setDueFilter,
    sort,
    setSort,
  }) => {
    const clientNames = getUniqueClientNames(taskList);

    return (
      <div className="mb-0 rounded-t-xl border-b border-slate-200 bg-slate-50/70 p-3 sm:p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <svg
              className="h-4 w-4 text-blue-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M7 12h10M10 18h4"
              />
            </svg>
            <span>Table Filters:</span>
          </div>

          <span className="text-xs text-slate-500 sm:text-sm">
            Showing{' '}
            {
              filterAndSortTasks(taskList, {
                search,
                status: statusFilter,
                client: clientFilter,
                due: dueFilter,
                sort,
              }).length
            }{' '}
            of {taskList.length} tasks
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="relative md:col-span-2 xl:col-span-1">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by title, client or remarks..."
              aria-label="Search tasks by title, client or remarks"
              className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter tasks by status"
            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            aria-label="Filter tasks by client"
            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">All Clients</option>
            {clientNames.map((clientName) => (
              <option key={clientName} value={clientName}>
                {clientName}
              </option>
            ))}
          </select>

          <select
            value={dueFilter}
            onChange={(e) => setDueFilter(e.target.value)}
            aria-label="Filter tasks by due date"
            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">All Due Dates</option>
            <option value="overdue">Overdue</option>
            <option value="upcoming">Upcoming</option>
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort tasks"
            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            <option value="due-asc">Due: Earliest First</option>
            <option value="due-desc">Due: Latest First</option>
            <option value="title-asc">Title A to Z</option>
          </select>
        </div>
      </div>
    );
  };

  const renderTaskTable = (
    taskList,
    emptyMessage,
    readOnlyAssignmentFields = false,
    filterProps,
  ) => {
    const visibleTasks = filterAndSortTasks(taskList, filterProps);

    const Row = readOnlyAssignmentFields
      ? ({ task }) => (
          <tr
            key={task._id}
            className="border-b border-slate-100 hover:bg-slate-50"
          >
            <td className="px-4 py-3 font-medium text-slate-700">
              <span>{task.title}</span>
            </td>

            <td className="px-4 py-3">
              <input
                type="date"
                readOnly
                value={formatDateForInput(task.issueDate)}
                className="min-w-32.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-600"
              />
            </td>

            <td className="px-4 py-3">
              <input
                type="date"
                readOnly
                value={formatDateForInput(task.dueDate)}
                className="min-w-32.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-600"
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
              <span className="text-slate-700">
                {getTaskClientName(task) || 'No client'}
              </span>
            </td>

            <td className="px-4 py-3 text-slate-600">
              {task.assignedBy?.name || ''}
            </td>

            <td className="px-4 py-3">
              <textarea
                value={
                  editingRemarks[task._id] !== undefined
                    ? editingRemarks[task._id]
                    : task.remarks || ''
                }
                onChange={(e) => handleRemarkChange(task._id, e.target.value)}
                placeholder="Add your remarks..."
                rows={2}
                className="min-w-45 resize-y rounded-md border border-slate-300 bg-green-50 px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-green-300"
              />
            </td>
          </tr>
        )
      : ({ task }) => (
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
                value={formatDateForInput(task.issueDate)}
                className="min-w-32.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-600"
              />
            </td>

            <td className="px-4 py-3">
              <input
                type="date"
                value={formatDateForInput(task.dueDate)}
                onChange={(e) => handleDueDateChange(task._id, e.target.value)}
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
                  clientSearchTaskId === task._id ? taskClientDropdownRef : null
                }
                className="relative z-40 w-48 min-w-48"
              >
                {clientSearchTaskId !== task._id && task.client?.name ? (
                  <button
                    type="button"
                    onClick={() => {
                      setClientSearchTaskId(task._id);
                      setClientSearchText(task.client.name);
                      setShowTaskClientDropdown(true);
                      setHighlightedTaskClientIndex(-1);
                    }}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-sm text-slate-700 hover:border-blue-400"
                  >
                    {task.client.name}
                  </button>
                ) : (
                  <input
                    type="text"
                    value={
                      clientSearchTaskId === task._id ? clientSearchText : ''
                    }
                    placeholder="Search client..."
                    autoComplete="off"
                    onFocus={() => {
                      setClientSearchTaskId(task._id);
                      setClientSearchText('');
                      setShowTaskClientDropdown(true);
                      setHighlightedTaskClientIndex(-1);
                    }}
                    onChange={(e) => {
                      setClientSearchTaskId(task._id);
                      setClientSearchText(e.target.value);
                      setShowTaskClientDropdown(true);
                      setHighlightedTaskClientIndex(-1);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowDown' && filteredTaskClients.length) {
                        e.preventDefault();

                        setHighlightedTaskClientIndex((i) =>
                          i < filteredTaskClients.length - 1 ? i + 1 : 0,
                        );
                      }

                      if (e.key === 'ArrowUp' && filteredTaskClients.length) {
                        e.preventDefault();

                        setHighlightedTaskClientIndex((i) =>
                          i > 0 ? i - 1 : filteredTaskClients.length - 1,
                        );
                      }

                      if (e.key === 'Enter') {
                        e.preventDefault();

                        const selected =
                          filteredTaskClients[highlightedTaskClientIndex];

                        if (selected) {
                          handleTaskClientChange(task._id, selected._id);
                        }
                      }

                      if (e.key === 'Escape') {
                        setShowTaskClientDropdown(false);
                        setClientSearchTaskId(null);
                        setHighlightedTaskClientIndex(-1);
                      }
                    }}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                  />
                )}

                {clientSearchTaskId === task._id && showTaskClientDropdown && (
                  <div
                    className={`absolute left-0 right-0 z-100 max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl ${
                      taskList.indexOf(task) >= taskList.length - 2
                        ? 'bottom-full mb-1'
                        : 'top-full mt-1'
                    }`}
                  >
                    {filteredTaskClients.length ? (
                      filteredTaskClients.map((client, index) => {
                        const name =
                          client.name ||
                          client.company ||
                          client.clientName ||
                          'Unnamed Client';

                        return (
                          <button
                            key={client._id}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onMouseEnter={() =>
                              setHighlightedTaskClientIndex(index)
                            }
                            onClick={() =>
                              handleTaskClientChange(task._id, client._id)
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
                        No clients found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </td>

            <td className="px-4 py-3">Me</td>

            <td className="px-4 py-3">
              <textarea
                value={
                  editingRemarks[task._id] !== undefined
                    ? editingRemarks[task._id]
                    : task.remarks || ''
                }
                onChange={(e) => handleRemarkChange(task._id, e.target.value)}
                placeholder="Add your remarks..."
                rows={2}
                className="min-w-45 resize-y rounded-md border border-slate-300 bg-green-50 px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-green-300"
              />
            </td>
          </tr>
        );

    return (
      <div className="relative w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {renderTableFilters({ ...filterProps, taskList })}

        <div className="w-full overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-237.5 border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-white">
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
              ) : visibleTasks.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    {taskList.length === 0
                      ? emptyMessage
                      : 'No tasks match the selected filters.'}
                  </td>
                </tr>
              ) : (
                visibleTasks.map((task) => Row({ task }))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

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
                title="Quick add task — Assigned By: Me"
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
              Assigned By <span className="text-red-500">*</span>
            </label>
            <select
              name="assignedBy"
              value={newTask.assignedBy}
              onChange={handleChange}
              required
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Select user</option>
              {employees.map((employee) => (
                <option key={employee._id} value={employee._id}>
                  {employee.name ||
                    employee.fullName ||
                    employee.email ||
                    'Unnamed User'}
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

      {(() => {
        const currentUserId = String(user?._id || user?.id || '');
        const getId = (value) => {
          if (!value) return '';
          return value._id || value.id || value;
        };
        const selfCreatedTasks = tasks.filter((task) => {
          const assignedToId = getId(task.assignedTo);
          const assignedById = getId(task.assignedBy);

          return (
            String(assignedToId) === currentUserId &&
            String(assignedById) === currentUserId
          );
        });

        // =========================
        // ASSIGNED TO ME
        // =========================
        const assignedToMeTasks = tasks.filter((task) => {
          const assignedToId = getId(task.assignedTo);
          const assignedById = getId(task.assignedBy);

          return (
            String(assignedToId) === currentUserId &&
            String(assignedById) !== currentUserId
          );
        });

        return (
          <div className="space-y-8">
            <section>
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 sm:text-xl">
                    My Tasks
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Tasks created by you for yourself. User employees can edit
                    Due Date, Status and add Remarks directly in the table.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleRefreshTasks}
                  disabled={refreshing}
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <svg
                    className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M20 11a8.1 8.1 0 0 0-15.5-2M4 5v4h4M4 13a8.1 8.1 0 0 0 15.5 2M20 19v-4h-4"
                    />
                  </svg>

                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>

              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Pending */}
                <button
                  type="button"
                  onClick={() => {
                    setTaskStatusFilter('pending');
                  }}
                  className={`rounded-xl border p-5 text-center shadow-sm transition ${
                    taskStatusFilter === 'pending'
                      ? 'border-orange-300 bg-orange-100'
                      : 'border-orange-100 bg-orange-50 hover:bg-orange-100'
                  }`}
                >
                  <h4 className="text-sm font-semibold text-orange-700">
                    Pending
                  </h4>

                  <strong className="mt-1 block text-3xl font-bold text-slate-800">
                    {
                      selfCreatedTasks.filter(
                        (task) =>
                          task.status === 'Not Started' ||
                          task.status === 'Pending',
                      ).length
                    }
                  </strong>

                  <span className="text-xs text-slate-500">Tasks</span>
                </button>

                {/* In Progress */}
                <button
                  type="button"
                  onClick={() => {
                    setTaskStatusFilter('in-progress');
                  }}
                  className={`rounded-xl border p-5 text-center shadow-sm transition ${
                    taskStatusFilter === 'in-progress'
                      ? 'border-blue-300 bg-blue-100'
                      : 'border-blue-100 bg-blue-50 hover:bg-blue-100'
                  }`}
                >
                  <h4 className="text-sm font-semibold text-blue-700">
                    In Progress
                  </h4>

                  <strong className="mt-1 block text-3xl font-bold text-slate-800">
                    {
                      selfCreatedTasks.filter(
                        (task) =>
                          task.status === 'In Progress' ||
                          task.status === 'in-progress',
                      ).length
                    }
                  </strong>

                  <span className="text-xs text-slate-500">Tasks</span>
                </button>

                {/* Completed */}
                <button
                  type="button"
                  onClick={() => {
                    setTaskStatusFilter('completed');
                  }}
                  className={`rounded-xl border p-5 text-center shadow-sm transition ${
                    taskStatusFilter === 'completed'
                      ? 'border-green-300 bg-green-100'
                      : 'border-green-100 bg-green-50 hover:bg-green-100'
                  }`}
                >
                  <h4 className="text-sm font-semibold text-green-700">
                    Completed
                  </h4>

                  <strong className="mt-1 block text-3xl font-bold text-slate-800">
                    {
                      selfCreatedTasks.filter(
                        (task) => task.status === 'Completed',
                      ).length
                    }
                  </strong>

                  <span className="text-xs text-slate-500">Tasks</span>
                </button>
              </div>

              {renderTaskTable(
                selfCreatedTasks,
                'No self-created tasks found.',
                false,
                {
                  search: myTaskSearch,
                  status: taskStatusFilter,
                  client: myTaskClientFilter,
                  due: myTaskDueFilter,
                  sort: myTaskSort,
                  setSearch: setMyTaskSearch,
                  setStatusFilter: setTaskStatusFilter,
                  setClientFilter: setMyTaskClientFilter,
                  setDueFilter: setMyTaskDueFilter,
                  setSort: setMyTaskSort,
                },
              )}
            </section>

            <section>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-800 sm:text-xl">
                  Assigned to Me
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Tasks assigned to you by another employee. User employee can
                  edit Status and add remarks to assigned tasks.
                </p>
              </div>

              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Pending */}
                <button
                  type="button"
                  onClick={() => {
                    setAssignedTaskStatusFilter('pending');
                  }}
                  className={`rounded-xl border p-5 text-center shadow-sm transition ${
                    assignedTaskStatusFilter === 'pending'
                      ? 'border-orange-300 bg-orange-100'
                      : 'border-orange-100 bg-orange-50 hover:bg-orange-100'
                  }`}
                >
                  <h4 className="text-sm font-semibold text-orange-700">
                    Pending
                  </h4>

                  <strong className="mt-1 block text-3xl font-bold text-slate-800">
                    {
                      assignedToMeTasks.filter(
                        (task) =>
                          task.status === 'Not Started' ||
                          task.status === 'Pending',
                      ).length
                    }
                  </strong>

                  <span className="text-xs text-slate-500">Tasks</span>
                </button>

                {/* In Progress */}
                <button
                  type="button"
                  onClick={() => {
                    setAssignedTaskStatusFilter('in-progress');
                  }}
                  className={`rounded-xl border p-5 text-center shadow-sm transition ${
                    assignedTaskStatusFilter === 'in-progress'
                      ? 'border-blue-300 bg-blue-100'
                      : 'border-blue-100 bg-blue-50 hover:bg-blue-100'
                  }`}
                >
                  <h4 className="text-sm font-semibold text-blue-700">
                    In Progress
                  </h4>

                  <strong className="mt-1 block text-3xl font-bold text-slate-800">
                    {
                      assignedToMeTasks.filter(
                        (task) =>
                          task.status === 'In Progress' ||
                          task.status === 'in-progress',
                      ).length
                    }
                  </strong>

                  <span className="text-xs text-slate-500">Tasks</span>
                </button>

                {/* Completed */}
                <button
                  type="button"
                  onClick={() => {
                    setAssignedTaskStatusFilter('completed');
                  }}
                  className={`rounded-xl border p-5 text-center shadow-sm transition ${
                    assignedTaskStatusFilter === 'completed'
                      ? 'border-green-300 bg-green-100'
                      : 'border-green-100 bg-green-50 hover:bg-green-100'
                  }`}
                >
                  <h4 className="text-sm font-semibold text-green-700">
                    Completed
                  </h4>

                  <strong className="mt-1 block text-3xl font-bold text-slate-800">
                    {
                      assignedToMeTasks.filter(
                        (task) => task.status === 'Completed',
                      ).length
                    }
                  </strong>

                  <span className="text-xs text-slate-500">Tasks</span>
                </button>
              </div>

              {renderTaskTable(
                assignedToMeTasks,
                'No tasks have been assigned to you.',
                true,
                {
                  search: assignedTaskSearch,
                  status: assignedTaskStatusFilter,
                  client: assignedTaskClientFilter,
                  due: assignedTaskDueFilter,
                  sort: assignedTaskSort,
                  setSearch: setAssignedTaskSearch,
                  setStatusFilter: setAssignedTaskStatusFilter,
                  setClientFilter: setAssignedTaskClientFilter,
                  setDueFilter: setAssignedTaskDueFilter,
                  setSort: setAssignedTaskSort,
                },
              )}
            </section>
          </div>
        );
      })()}

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
