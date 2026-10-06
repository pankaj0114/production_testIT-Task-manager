//import { useState, useEffect } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/EmployeeDashboard.css';
//import '../css/Popup.css';
import '../css/MyTaskform.css';
import '../css/AssignTaskPage.css';
import AssignTaskPage from './AssignTaskPage';
import MyTasks from './MyTasks.jsx';
import EmployeeAttendance from './EmployeeAttendance';
import EmployeeNavbar from './EmployeeNavbar';
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

//import DatePicker from 'react-datepicker';
//import { useRef } from 'react';
import socket from '../services/socket.js';

//import { io } from 'socket.io-client';

import {
  MdDashboard,
  MdListAlt,
  MdEdit,
  MdOutlineNearMe,
  MdOutlineChecklist,
  MdNotificationsNone,
  MdDelete,
} from 'react-icons/md';

import { MdCalendarMonth } from 'react-icons/md';

const API_BASE = (
  import.meta.env.VITE_API_URL || 'http://localhost:5005'
).replace(/\/+$/, '');

const getTodayDate = () => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const authConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
    'Content-Type': 'application/json',
  },
});

export default function EmployeeDashboard() {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('activeTab') || 'myTasks';
  });
  const [notifications, setNotifications] = useState([]);
  const [searchValue, setSearchValue] = useState('');

  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [user, setUser] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupTaskId, setPopupTaskId] = useState(null);
  const [hours, setHours] = useState('');
  //const [totalHours, setTotalHours] = useState('');
  //const [totalMinutes, setTotalMinutes] = useState('');

  const [editingTimeTaskId, setEditingTimeTaskId] = useState(null);
  // const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  const [editHours, setEditHours] = useState('');
  const [editMinutes, setEditMinutes] = useState('');
  //const [typingTimeouts, setTypingTimeouts] = useState({});
  const [minutes, setMinutes] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState([]);

  const [assignedTaskSearch, setAssignedTaskSearch] = useState('');
  const [assignedTaskStatusFilter, setAssignedTaskStatusFilter] =
    useState('all');
  const [assignedTaskEmployeeFilter, setAssignedTaskEmployeeFilter] =
    useState('all');
  const [assignedTaskClientFilter, setAssignedTaskClientFilter] =
    useState('all');
  const [assignedTaskDueFilter, setAssignedTaskDueFilter] = useState('all');
  const [assignedTaskSort, setAssignedTaskSort] = useState('due-asc');

  const [refreshingAssignedTasks, setRefreshingAssignedTasks] = useState(false);
  const remarkTimeouts = useRef({});
  const [myClients, setMyClients] = useState([]);
  const [loadingMyClients, setLoadingMyClients] = useState(false);

  const [editingRemarks, setEditingRemarks] = useState({});

  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [clientSearchTaskId, setClientSearchTaskId] = useState(null);
  const [clientSearchText, setClientSearchText] = useState('');
  const [showTaskClientDropdown, setShowTaskClientDropdown] = useState(false);
  //const [highlightedTaskClientIndex, setHighlightedTaskClientIndex] =
  useState(-1);

  const taskClientDropdownRef = useRef(null);
  const [newTask, setNewTask] = useState({
    title: '',
    dueDate: getTodayDate(),
    assignedTo: '',
    assignedBy: '',
    priority: 'Medium',
    remarks: '',
    client: '',
  });

  const navigate = useNavigate();
  //const socket = io('http://localhost:5005');
  // ==========================================
  // UNREAD COUNT
  // ==========================================

  const unreadCount = notifications.filter(
    (notification) => notification.isRead !== true,
  ).length;

  // ==========================================
  // FETCH NOTIFICATIONS
  // ==========================================

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('accessToken');

      const response = await axios.get(`${API_BASE}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Notifications API response:', response.data);

      const notifications = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data.notifications)
          ? response.data.notifications
          : [];

      console.log('Notifications array:', notifications);

      // Remove duplicates
      const uniqueNotifications = notifications.filter(
        (notification, index, self) =>
          index === self.findIndex((item) => item._id === notification._id),
      );

      setNotifications(uniqueNotifications);
    } catch (error) {
      console.error(
        'Error fetching notifications:',
        error.response?.data || error.message,
      );

      setNotifications([]);
    }
  };
  // ==========================================
  // LOAD NOTIFICATIONS WHEN USER IS AVAILABLE
  // ==========================================

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  // ==========================================
  // MARK NOTIFICATIONS AS READ
  // ==========================================

  const markNotificationsAsRead = async () => {
    try {
      const token = localStorage.getItem('accessToken');

      const response = await axios.put(
        `${API_BASE}/api/notifications/read-all`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('MARK READ RESPONSE:', response.data);

      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      );

      return response.data;
    } catch (error) {
      console.error(
        'Error marking notifications as read:',
        error.response?.data || error.message,
      );

      throw error;
    }
  };

  // ==========================================
  // MARK READ WHEN NOTIFICATION TAB OPENS
  // ==========================================
  useEffect(() => {
    if (!user?._id) return;

    const loadNotifications = async () => {
      try {
        // If Notifications tab is open,
        // mark them read FIRST.
        if (activeTab === 'notifications') {
          await markNotificationsAsRead();
        }

        // Then fetch from database.
        await fetchNotifications();
      } catch (error) {
        console.error(
          'Notification loading error:',
          error.response?.data || error.message,
        );
      }
    };

    loadNotifications();
  }, [user?._id, activeTab]);
  // ==========================================
  // SOCKET.IO
  // ==========================================

  useEffect(() => {
    if (!user?._id) return;

    console.log('Joining notification room:', user._id);

    socket.emit('join', user._id);

    const handleNotification = (notification) => {
      console.log('New notification received:', notification);

      setNotifications((prev) => {
        // =====================================
        // PREVENT DUPLICATES
        // =====================================

        const alreadyExists = prev.some(
          (item) => item._id === notification._id,
        );

        if (alreadyExists) {
          console.log('Duplicate notification ignored:', notification._id);

          return prev;
        }

        // =====================================
        // ADD NEW NOTIFICATION
        // =====================================

        return [
          {
            ...notification,
            read: false,
          },
          ...prev,
        ];
      });
    };

    socket.on('newNotification', handleNotification);

    return () => {
      socket.off('newNotification', handleNotification);
    };
  }, [user?._id]);

  useEffect(() => {
    const handleConnect = () => {
      console.log('Socket connected:', socket.id);
    };

    const handleDisconnect = () => {
      console.log('Socket disconnected');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, []);

  const openPopup = (taskId) => {
    setSelectedTaskId(taskId);
    setShowPopup(true);
  };

  const getAssignedTaskClientName = (task) => {
    const client = task?.client;

    if (!client) return '';

    if (typeof client === 'string') {
      const matchedClient = clients.find(
        (item) => String(item._id) === String(client),
      );

      return matchedClient?.name || '';
    }

    return client.name || client.company || client.clientName || '';
  };

  const getAssignedTaskDueDateKey = (task) => {
    if (!task?.dueDate) return '';

    if (typeof task.dueDate === 'string') {
      return task.dueDate.slice(0, 10);
    }

    const date = new Date(task.dueDate);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const filteredAndSortedAssignedTasks = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);

    const search = String(assignedTaskSearch || '')
      .trim()
      .toLowerCase();

    const filtered = assignedTasks.filter((task) => {
      const title = String(task?.title || '').toLowerCase();

      const remarks = String(task?.remarks || '').toLowerCase();

      const status = String(task?.status || 'Not Started').toLowerCase();

      const priority = String(task?.priority || '').toLowerCase();

      const clientName = getAssignedTaskClientName(task).toLowerCase();

      const assignedToName = String(
        task?.assignedTo?.name ||
          task?.assignedTo?.fullName ||
          task?.assignedTo?.email ||
          '',
      ).toLowerCase();

      const dueDate = getAssignedTaskDueDateKey(task);

      /*
       * Search
       */
      if (
        search &&
        !title.includes(search) &&
        !remarks.includes(search) &&
        !status.includes(search) &&
        !priority.includes(search) &&
        !clientName.includes(search) &&
        !assignedToName.includes(search)
      ) {
        return false;
      }

      /*
       * Status filter
       */
      if (assignedTaskStatusFilter === 'pending') {
        if (status !== 'not started' && status !== 'pending') {
          return false;
        }
      }

      if (assignedTaskStatusFilter === 'in-progress') {
        if (status !== 'in progress' && status !== 'in-progress') {
          return false;
        }
      }

      if (assignedTaskStatusFilter === 'completed') {
        if (status !== 'completed') {
          return false;
        }
      }

      /*
       * Employee filter
       */
      if (assignedTaskEmployeeFilter !== 'all') {
        const assignedToId =
          task?.assignedTo?._id ||
          task?.assignedTo?.id ||
          task?.assignedTo ||
          '';

        if (String(assignedToId) !== String(assignedTaskEmployeeFilter)) {
          return false;
        }
      }

      /*
       * Client filter
       */
      if (assignedTaskClientFilter !== 'all') {
        const clientId =
          task?.client?._id || task?.client?.id || task?.client || '';

        if (String(clientId) !== String(assignedTaskClientFilter)) {
          return false;
        }
      }

      /*
       * Due date filter
       */
      if (assignedTaskDueFilter === 'overdue') {
        if (!dueDate || dueDate >= today) {
          return false;
        }
      }

      if (assignedTaskDueFilter === 'upcoming') {
        if (!dueDate || dueDate < today) {
          return false;
        }
      }

      return true;
    });

    /*
     * Sorting
     */
    return [...filtered].sort((a, b) => {
      if (assignedTaskSort === 'title-asc') {
        return String(a?.title || '').localeCompare(
          String(b?.title || ''),
          undefined,
          {
            sensitivity: 'base',
          },
        );
      }

      const aDue = getAssignedTaskDueDateKey(a);
      const bDue = getAssignedTaskDueDateKey(b);

      if (!aDue && !bDue) return 0;
      if (!aDue) return 1;
      if (!bDue) return -1;

      if (assignedTaskSort === 'due-desc') {
        return bDue.localeCompare(aDue);
      }

      return aDue.localeCompare(bDue);
    });
  }, [
    assignedTasks,
    assignedTaskSearch,
    assignedTaskStatusFilter,
    assignedTaskEmployeeFilter,
    assignedTaskClientFilter,
    assignedTaskDueFilter,
    assignedTaskSort,
    clients,
  ]);

  const handleUpdateAssignedTaskRemarks = async (taskId, remarks) => {
    try {
      if (!taskId) {
        console.error('No task ID provided');
        return;
      }

      const response = await axios.put(
        `${API_BASE}/api/tasks/${taskId}/assigned-task/remarks`,
        {
          remarks,
        },
        authConfig(),
      );

      console.log('Remarks update response:', response.data);

      await fetchTasks();
    } catch (error) {
      console.error('Failed to update assigned task remarks:', error);

      console.error('Remarks error response:', error.response?.data);
    }
  };

  const handleUpdateTaskTitle = async (taskId) => {
    const trimmedTitle = editingTitle.trim();

    if (!trimmedTitle) {
      alert('Task title cannot be empty.');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');

      const response = await axios.put(
        `${API_BASE}/api/tasks/${taskId}`,
        {
          title: trimmedTitle,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log('Task title updated:', response.data);

      // Exit edit mode
      setEditingTaskId(null);
      setEditingTitle('');

      // Refresh tasks
      await fetchTasks();
    } catch (error) {
      console.error(
        'Error updating task title:',
        error.response?.data || error.message,
      );
    }
  };

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(`${API_BASE}/api/tasks/my-tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(res.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };
  const fetchAssignedTasks = async () => {
    try {
      const token = localStorage.getItem('accessToken');

      const response = await axios.get(`${API_BASE}/api/tasks/assigned-by-me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('ASSIGNED BY ME:', response.data);

      const serverTasks = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data.tasks)
          ? response.data.tasks
          : [];

      setAssignedTasks((prevTasks) =>
        serverTasks.map((serverTask) => {
          const localRemark = editingRemarks[serverTask._id];

          return {
            ...serverTask,
            remarks:
              localRemark !== undefined
                ? localRemark
                : serverTask.remarks || '',
          };
        }),
      );
    } catch (error) {
      console.error(
        'Error fetching assigned tasks:',
        error.response?.data || error.message,
      );
    }
  };
  const handleRefreshAssignedTasks = async () => {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      alert('Authentication token not found. Please login again.');
      return;
    }

    try {
      setRefreshingAssignedTasks(true);

      // Always fetch the Assigned Tasks endpoint again.
      // This updates assignedTasks directly, which is the state used
      // by the Assigned Tasks table and its counters.
      const response = await axios.get(`${API_BASE}/api/tasks/assigned-by-me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          _refresh: Date.now(),
        },
      });

      const serverTasks = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data.tasks)
          ? response.data.tasks
          : [];

      setAssignedTasks(
        serverTasks.map((serverTask) => {
          const localRemark = editingRemarks[serverTask._id];

          return {
            ...serverTask,
            remarks:
              localRemark !== undefined
                ? localRemark
                : serverTask.remarks || '',
          };
        }),
      );

      console.log('Assigned Tasks refreshed successfully:', serverTasks.length);
    } catch (error) {
      console.error(
        'Failed to refresh Assigned Tasks:',
        error.response?.data || error.message,
      );

      alert(
        error.response?.data?.message ||
          'Failed to refresh Assigned Tasks. Please try again.',
      );
    } finally {
      setRefreshingAssignedTasks(false);
    }
  };

  const handleUpdateCompletedTime = async (taskId) => {
    try {
      const totalHours = Number(editHours);
      const totalMinutes = Number(editMinutes);

      // Validate hours
      if (!Number.isInteger(totalHours) || totalHours < 0) {
        alert('Please enter valid hours.');
        return;
      }

      // Validate minutes
      if (
        !Number.isInteger(totalMinutes) ||
        totalMinutes < 0 ||
        totalMinutes > 59
      ) {
        alert('Minutes must be between 0 and 59.');
        return;
      }

      const token = localStorage.getItem('accessToken');

      console.log('Updating completed task time:', {
        taskId,
        totalHours,
        totalMinutes,
      });

      const response = await axios.put(
        `${API_BASE}/api/tasks/${taskId}/completed-time`,
        {
          totalHours,
          totalMinutes,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log('Updated completed task:', response.data);

      const updatedTask = response.data.task || response.data;

      setTasks((prev) =>
        prev.map((task) => (task._id === selectedTaskId ? updatedTask : task)),
      );

      // Refresh completed tasks
      await fetchCompletedTasks();

      // Refresh assigned tasks
      await fetchAssignedTasks();
      // Update completed task card immediately
      setCompletedTasks((prev) =>
        prev.map((task) =>
          task._id === taskId
            ? {
                ...task,
                totalHours: updatedTask.totalHours,
                totalMinutes: updatedTask.totalMinutes,
              }
            : task,
        ),
      );

      // Exit edit mode
      setEditingTimeTaskId(null);
      setEditHours('');
      setEditMinutes('');
    } catch (error) {
      console.error(
        'Error updating completed task time:',
        error.response?.data || error.message,
      );
    }
  };

  const handleAssignedTaskTitleChange = async (taskId, title) => {
    try {
      // Update UI immediately
      setAssignedTasks((prev) =>
        prev.map((task) => (task._id === taskId ? { ...task, title } : task)),
      );

      await axios.put(
        `${API_BASE}/api/tasks/${taskId}`,
        {
          title: title.trim(),
        },
        authConfig(),
      );
    } catch (error) {
      console.error('Failed to update assigned task title:', error);

      alert(error.response?.data?.message || 'Failed to update task title.');

      fetchTasks();
    }
  };

  const handleAssignedTaskDueDateChange = async (taskId, dueDate) => {
    try {
      setAssignedTasks((prev) =>
        prev.map((task) => (task._id === taskId ? { ...task, dueDate } : task)),
      );

      await axios.put(
        `${API_BASE}/api/tasks/${taskId}/assigned-task/due-date`,
        {
          dueDate,
        },
        authConfig(),
      );
    } catch (error) {
      console.error('Failed to update assigned task due date:', error);

      alert(error.response?.data?.message || 'Failed to update due date.');

      fetchTasks();
    }
  };

  const handleAssignedTaskStatusChange = async (taskId, status) => {
    try {
      if (!['Not Started', 'In Progress'].includes(status)) {
        return;
      }

      setAssignedTasks((prev) =>
        prev.map((task) => (task._id === taskId ? { ...task, status } : task)),
      );

      await axios.put(
        `${API_BASE}/api/tasks/${taskId}`,
        {
          status,
        },
        authConfig(),
      );
    } catch (error) {
      console.error('Failed to update assigned task status:', error);

      alert(error.response?.data?.message || 'Failed to update task status.');

      fetchTasks();
    }
  };

  const fetchMyTasks = async () => {
    try {
      const token = localStorage.getItem('accessToken');

      const response = await axios.get(`${API_BASE}/api/tasks/my-tasks`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('MY TASKS:', response.data);

      setMyTasks(response.data);
    } catch (error) {
      console.error(
        'Error fetching my tasks:',
        error.response?.data || error.message,
      );
    }
  };

  useEffect(() => {
    if (!user?._id) return;

    fetchMyTasks();
    fetchAssignedTasks();
  }, [user?._id]);

  useEffect(() => {
    if (activeTab === 'assignedTasks') {
      fetchAssignedTasks();
    }
  }, [activeTab]);

  // ✅ Fetch functions
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(`${API_BASE}/api/clients/my-clients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClients(res.data);
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  const handleDueDateChange = async (taskId, dueDate) => {
    try {
      const token = localStorage.getItem('accessToken');

      // Update UI immediately
      setTasks((prev) =>
        prev.map((task) => (task._id === taskId ? { ...task, dueDate } : task)),
      );

      await axios.put(
        `${API_BASE}/api/tasks/${taskId}/due-date`,
        {
          dueDate,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log('Due date updated successfully');
    } catch (error) {
      console.error(
        'Error updating due date:',
        error.response?.data || error.message,
      );
    }
  };

  const handleDeleteAssignedTask = async (taskId) => {
    try {
      console.log('========== DELETE DEBUG ==========');
      console.log('taskId received:', taskId);
      console.log('taskId type:', typeof taskId);
      console.log('taskId length:', taskId?.length);
      console.log('==================================');

      if (!taskId) {
        console.error('No task ID provided for deletion');
        return;
      }

      const response = await axios.delete(
        `${API_BASE}/api/tasks/${taskId}/assigned-task`,
        authConfig(),
      );

      console.log('Delete response:', response.data);

      await fetchTasks();

      setSuccessMessage('Task deleted successfully.');
      setShowSuccessMessage(true);

      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to delete assigned task:', error);
      console.error('Delete error response:', error.response?.data);

      setErrorMessage(
        error.response?.data?.message || 'Failed to delete the task.',
      );
      setShowErrorMessage(true);

      setTimeout(() => {
        setShowErrorMessage(false);
      }, 3000);
    }
  };

  const handleRemarkChange = (taskId, value) => {
    console.log('========== REMARK CHANGE ==========');
    console.log('Task ID:', taskId);
    console.log('Remark:', value);

    // Keep the text being typed independently from server data
    setEditingRemarks((prev) => ({
      ...prev,
      [taskId]: value,
    }));

    // Immediately update Assigned Tasks UI
    setAssignedTasks((prevTasks) =>
      prevTasks.map((task) =>
        String(task._id) === String(taskId)
          ? {
              ...task,
              remarks: value,
            }
          : task,
      ),
    );

    // Also update the normal tasks state if needed
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

    // Clear previous timer
    if (remarkTimeouts.current[taskId]) {
      clearTimeout(remarkTimeouts.current[taskId]);
    }

    // Save after user stops typing
    remarkTimeouts.current[taskId] = setTimeout(async () => {
      try {
        const token = localStorage.getItem('accessToken');

        console.log('Saving remark for task:', taskId);
        console.log('Remark being saved:', value);

        const response = await axios.put(
          `${API_BASE}/api/tasks/${taskId}/remarks`,
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

        console.log('Remark saved successfully:', response.data);

        // Keep the locally typed value visible
        setEditingRemarks((prev) => ({
          ...prev,
          [taskId]: value,
        }));

        setAssignedTasks((prevTasks) =>
          prevTasks.map((task) =>
            String(task._id) === String(taskId)
              ? {
                  ...task,
                  remarks: value,
                }
              : task,
          ),
        );
      } catch (error) {
        console.error(
          'Error saving remark:',
          error.response?.data || error.message,
        );
      }
    }, 1000);
  };
  const fetchMyClients = async () => {
    try {
      const token = localStorage.getItem('accessToken');

      console.log('========== FETCH MY CLIENTS ==========');
      console.log('Token exists:', !!token);
      console.log('Token:', token);

      if (!token) {
        console.error('❌ No accessToken found in localStorage');
        return;
      }

      const response = await axios.get(`${API_BASE}/api/clients/my-clients`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('✅ MY CLIENTS:', response.data);

      setMyClients(response.data);
    } catch (error) {
      console.error(
        '❌ FETCH MY CLIENTS ERROR:',
        error.response?.status,
        error.response?.data || error.message,
      );
    }
  };

  useEffect(() => {
    fetchMyClients();
  }, []);

  {
    activeTab === 'attendance' && <EmployeeAttendance />;
  }

  const fetchCompletedTasks = async () => {
    try {
      const token = localStorage.getItem('accessToken');

      const response = await axios.get(
        `${API_BASE}/api/tasks/completed-tasks`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      //console.log('COMPLETED TASKS API RESPONSE:', response.data);

      setCompletedTasks(response.data);
    } catch (error) {
      console.error(
        'Error fetching completed tasks:',
        error.response?.data || error.message,
      );
    }
  };

  useEffect(() => {
    if (activeTab === 'completed') {
      fetchCompletedTasks();
    }
  }, [activeTab]);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(`${API_BASE}/api/users/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployees(res.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleUpdateDateOfBirth = async (dateOfBirth) => {
    try {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      // IMPORTANT:
      // Replace the API call below with your existing backend
      // employee/profile update endpoint.

      const response = await axios.put(
        `${API_BASE}/api/users/${user._id}`,
        {
          dateOfBirth,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log('Date of birth updated:', response.data);

      // Update the employee in Dashboard immediately
      setUser((previousUser) => ({
        ...previousUser,
        ...(response.data.user || response.data),
        dateOfBirth,
      }));

      return response.data;
    } catch (error) {
      console.error(
        'Error updating date of birth:',
        error.response?.data || error.message,
      );

      throw error;
    }
  };
  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      if (!notificationId) {
        console.error('Notification ID is missing');
        return;
      }

      const token = localStorage.getItem('accessToken');

      await axios.delete(`${API_BASE}/api/notifications/${notificationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Remove notification immediately from UI
      setNotifications((prevNotifications) =>
        prevNotifications.filter(
          (notification) => String(notification._id) !== String(notificationId),
        ),
      );

      console.log('Notification deleted successfully');
    } catch (error) {
      console.error(
        'Error deleting notification:',
        error.response?.data || error.message,
      );
    }
  };

  useEffect(() => {
    fetchClients();
    fetchEmployees();
    fetchUser();
  }, [activeTab]);

  const handleChange = (e) => {
    setNewTask({ ...newTask, [e.target.name]: e.target.value });
  };

  // ===============================
  // ASSIGNED TASKS
  // ===============================

  // Tasks that I assigned to OTHER employees
  const filteredAssignedTasks = tasks.filter((task) => {
    const assignedByMe = String(task.assignedBy?._id) === String(user?._id);

    const assignedToOther = String(task.assignedTo?._id) !== String(user?._id);

    return assignedByMe && assignedToOther;
  });

  // Pending / Not Started
  const pendingAssignedTasks = assignedTasks.filter(
    (task) => task.status === 'Not Started' || task.status === 'Pending',
  );

  // In Progress
  const inprogressAssignedTasks = assignedTasks.filter(
    (task) => task.status === 'In Progress' || task.status === 'in-progress',
  );

  // Completed
  const completedAssignedTasks = assignedTasks.filter(
    (task) => task.status === 'Completed',
  );

  const handleAddTask = async () => {
    try {
      if (!newTask.title || newTask.title.trim() === '') {
        alert('Please add a task title');
        return;
      }

      if (!newTask.client) {
        alert('Please select a client');
        return;
      }

      if (!newTask.assignedBy) {
        alert('Please select Assigned By');
        return;
      }

      // Get today's date in YYYY-MM-DD format
      const today = new Date();
      const todayDate = `${today.getFullYear()}-${String(
        today.getMonth() + 1,
      ).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      // If user selected a date, use it.
      // Otherwise, use today's date.
      const finalDueDate = newTask.dueDate || todayDate;

      const token = localStorage.getItem('accessToken');

      const payload = {
        title: newTask.title.trim(),

        // Use selected date OR today's date
        dueDate: finalDueDate,

        client: newTask.client,
        priority: newTask.priority || 'Medium',

        // Employee selected in Assigned By dropdown
        assignedBy: newTask.assignedBy,

        // Current logged-in employee
        assignedTo: user?._id,

        remarks: newTask.remarks || '',

        issueDate: todayDate,

        // Normal task
        quickAdd: false,
      };

      console.log('========== FRONTEND TASK PAYLOAD ==========');
      console.log('Logged-in employee:', user?._id);
      console.log('Selected Assigned By:', newTask.assignedBy);
      console.log('Selected Client:', newTask.client);
      console.log('Selected Due Date:', newTask.dueDate);
      console.log('Final Due Date:', finalDueDate);
      console.log('Payload:', payload);

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
      setNewTask({
        title: '',

        // Keep today's date after adding the task
        dueDate: todayDate,

        assignedBy: '',
        assignedTo: '',
        priority: 'Medium',
        client: '',
        remarks: '',
      });

      await fetchTasks();
    } catch (error) {
      console.error(
        'Error adding task:',
        error.response?.data || error.message,
      );
    }
  };

  // clients

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

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const updateIssueDate = async (taskId, newDate) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.put(
        `${API_BASE}/api/tasks/${taskId}`,
        { issueDate: newDate },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setTasks((prev) => prev.map((t) => (t._id === taskId ? res.data : t)));
    } catch (err) {
      console.error('Error updating issue date:', err);
    }
  };

  const handleCompleteTask = async () => {
    try {
      const totalHours = Number(hours);
      const totalMinutes = Number(minutes);
      /*
      console.log('========== COMPLETE TASK ==========');
      console.log('Selected Task ID:', selectedTaskId);
      console.log('Hours:', totalHours);
      console.log('Minutes:', totalMinutes);
      */

      if (!Number.isFinite(totalHours) || !Number.isFinite(totalMinutes)) {
        alert('Please enter valid hours and minutes.');
        return;
      }

      if (totalHours < 0) {
        alert('Hours cannot be negative.');
        return;
      }

      if (totalMinutes < 0 || totalMinutes > 59) {
        alert('Minutes must be between 0 and 59.');
        return;
      }

      const payload = {
        status: 'Completed',
        totalHours,
        totalMinutes,
      };

      //console.log('Sending payload:', payload);

      const token = localStorage.getItem('accessToken');

      const res = await axios.put(
        `${API_BASE}/api/tasks/${selectedTaskId}/complete`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      //console.log('API RESPONSE:', res.data);
      //console.log('UPDATED TASK:', res.data.task);

      // IMPORTANT
      const updatedTask = res.data.task;

      setTasks((prev) =>
        prev.map((task) => (task._id === selectedTaskId ? updatedTask : task)),
      );

      setShowPopup(false);
      setSelectedTaskId(null);
      setHours('');
      setMinutes('');
    } catch (error) {
      console.error(
        'Error completing task:',
        error.response?.data || error.message,
      );
    }
  };

  const handleAssignedTaskClientChange = async (taskId, clientId) => {
    try {
      if (!taskId) {
        console.error('Task ID is missing');
        return;
      }

      const token = localStorage.getItem('accessToken');

      if (!token) {
        alert('Authentication token not found. Please login again.');
        return;
      }

      console.log('UPDATING ASSIGNED TASK CLIENT:', {
        taskId,
        clientId,
      });

      const response = await axios.put(
        `${API_BASE}/api/tasks/${taskId}`,
        {
          client: clientId || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log('ASSIGNED TASK CLIENT UPDATED:', response.data);

      const updatedTask = response.data.task || response.data;

      setAssignedTasks((prevTasks) =>
        prevTasks.map((task) =>
          String(task._id) === String(taskId)
            ? {
                ...task,
                ...updatedTask,
                client: updatedTask.client || clientId || null,
              }
            : task,
        ),
      );

      // Keep main task state synchronized too
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          String(task._id) === String(taskId)
            ? {
                ...task,
                ...updatedTask,
                client: updatedTask.client || clientId || null,
              }
            : task,
        ),
      );
    } catch (error) {
      console.error(
        'ASSIGNED TASK CLIENT UPDATE ERROR:',
        error.response?.data || error.message,
      );

      alert(error.response?.data?.message || 'Failed to update client.');
    }
  };
  const handleUpdateTask = async (taskId) => {
    try {
      if (!taskId) {
        console.error('Task ID is missing');
        return;
      }

      const token = localStorage.getItem('accessToken');

      if (!token) {
        alert('Authentication token not found. Please login again.');
        return;
      }

      const task = assignedTasks.find(
        (item) => String(item._id) === String(taskId),
      );

      if (!task) {
        console.error('Task not found:', taskId);
        return;
      }

      const clientId =
        typeof task.client === 'object'
          ? task.client?._id
          : task.client || null;

      const payload = {
        title: task.title,
        dueDate: task.dueDate || null,
        priority: task.priority || 'Medium',
        remarks: task.remarks || '',
        client: clientId,
        status: task.status || 'Not Started',
      };

      console.log('========== UPDATING ASSIGNED TASK ==========');
      console.log('Task ID:', taskId);
      console.log('Payload:', payload);

      const response = await axios.put(
        `${API_BASE}/api/tasks/${taskId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log('ASSIGNED TASK UPDATE RESPONSE:', response.data);

      const updatedTask = response.data.task || response.data;

      // Update Assigned Tasks table
      setAssignedTasks((prevTasks) =>
        prevTasks.map((item) =>
          String(item._id) === String(taskId)
            ? {
                ...item,
                ...updatedTask,
              }
            : item,
        ),
      );

      // Keep main tasks synchronized
      setTasks((prevTasks) =>
        prevTasks.map((item) =>
          String(item._id) === String(taskId)
            ? {
                ...item,
                ...updatedTask,
              }
            : item,
        ),
      );

      alert('Task updated successfully.');

      // Optional: reload from database
      await fetchAssignedTasks();
    } catch (error) {
      console.error(
        'ASSIGNED TASK UPDATE ERROR:',
        error.response?.data || error.message,
      );

      alert(error.response?.data?.message || 'Failed to update task.');
    }
  };
  /*
  const markUncomplete = async (taskId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.put(
        `${API_BASE}/api/tasks/${taskId}`,
        { status: 'in-progress' }, // or "to-do"
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setTasks((prev) => prev.map((t) => (t._id === taskId ? res.data : t)));
    } catch (err) {
      console.error('Error marking uncomplete:', err);
    }
  };
  */

  const handleUncompleteTask = async (taskId) => {
    try {
      const token = localStorage.getItem('accessToken');

      const response = await axios.put(
        `${API_BASE}/api/tasks/${taskId}/uncomplete`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const updatedTask = response.data.task;

      // Remove it from completed tasks
      setCompletedTasks((prev) => prev.filter((task) => task._id !== taskId));

      // Update main tasks state if you use it elsewhere
      setTasks((prev) =>
        prev.map((task) => (task._id === taskId ? updatedTask : task)),
      );
    } catch (error) {
      console.error(
        'Error uncompleting task:',
        error.response?.data || error.message,
      );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen w-full bg-slate-50">
      {/* =========================================================
        EMPLOYEE NAVBAR
    ========================================================= */}
      <EmployeeNavbar
        user={user}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        notifications={notifications}
        onViewAllNotifications={() => {
          setActiveTab('notifications');
        }}
        onLogout={handleLogout}
        onUpdateDateOfBirth={handleUpdateDateOfBirth}
      />

      <div className="flex w-full flex-col lg:flex-row">
        {/* =========================================================
      SIDEBAR
  ========================================================= */}

        <div
          className="
          fixed
      left-0
     top-16
      w-full lg:w-64
      lg:min-h-screen
      bg-linear-to-b from-blue-500 to-blue-600
      text-white
      shrink-0
      p-4
      lg:sticky lg:top-0
      lg:h-screen
      overflow-y-auto
    "
        >
          {/* Employee Info 
          <div className="px-3 py-4 mb-4">
            {user ? (
              <h3 className="text-lg font-semibold truncate">{user.name}</h3>
            ) : (
              <h3 className="text-lg font-semibold">Loading...</h3>
            )}
          </div>

          {/* Logout 
          <button
            className="
        w-full
        px-4 py-2
        mb-5
        rounded-md
        bg-red-500
        hover:bg-red-600
        active:bg-red-700
        text-white
        font-medium
        text-sm
        transition-all
        duration-200
        shadow-sm
      "
            onClick={handleLogout}
          >
            Logout
          </button>

          */}

          {/* Navigation */}
          <ul className="space-y-1">
            {/* My Tasks */}
            <li
              onClick={() => setActiveTab('myTasks')}
              className={`
          flex items-center
          gap-2
          px-3 py-3
          rounded-md
          cursor-pointer
          text-sm
          transition-all
          duration-200
          ${
            activeTab === 'myTasks'
              ? 'bg-white/20 font-semibold shadow-sm'
              : 'hover:bg-white/10'
          }
        `}
            >
              <MdListAlt size={20} />
              <span>My Tasks</span>
            </li>

            {/* Assigned Tasks */}
            <li
              onClick={() => setActiveTab('assignedTasks')}
              className={`
          flex items-center
          gap-2
          px-3 py-3
          rounded-md
          cursor-pointer
          text-sm
          transition-all
          duration-200
          ${
            activeTab === 'assignedTasks'
              ? 'bg-white/20 font-semibold shadow-sm'
              : 'hover:bg-white/10'
          }
        `}
            >
              <MdOutlineNearMe size={20} />
              <span>Assigned Task</span>
            </li>

            {/* Completed Tasks */}
            <li
              onClick={() => {
                setActiveTab('completedTasks');
                fetchCompletedTasks();
              }}
              className={`
          flex items-center
          gap-2
          px-3 py-3
          rounded-md
          cursor-pointer
          text-sm
          transition-all
          duration-200
          ${
            activeTab === 'completedTasks'
              ? 'bg-white/20 font-semibold shadow-sm'
              : 'hover:bg-white/10'
          }
        `}
            >
              <MdOutlineChecklist size={20} />
              <span>Completed Tasks</span>
            </li>

            <li
              onClick={() => setActiveTab('attendance')}
              className={`
    flex items-center
    gap-2
    px-3 py-3
    rounded-md
    cursor-pointer
    text-sm
    transition-all
    duration-200
    ${
      activeTab === 'attendance'
        ? 'bg-white/20 font-semibold shadow-sm'
        : 'hover:bg-white/10'
    }
  `}
            >
              <MdCalendarMonth size={20} />
              <span>Attendance</span>
            </li>

            {/* Clients */}
            <li
              onClick={() => setActiveTab('clients')}
              className={`
          flex items-center
          gap-2
          px-3 py-3
          rounded-md
          cursor-pointer
          text-sm
          transition-all
          duration-200
          ${
            activeTab === 'clients'
              ? 'bg-white/20 font-semibold shadow-sm'
              : 'hover:bg-white/10'
          }
        `}
            >
              <span className="w-5 text-center">◉</span>
              <span>Clients</span>
            </li>
          </ul>
        </div>

        {/* =========================================================
      MAIN PANEL
  ========================================================= */}
        <div
          className="
      flex-1
      min-w-0
      p-3
      sm:p-5
      lg:p-6
      overflow-x-hidden
    "
        >
          {activeTab === 'attendance' && (
            <div className="w-full">
              <EmployeeAttendance />
            </div>
          )}
          {activeTab === 'myTasks' && (
            <MyTasks user={user} searchValue={searchValue} />
          )}
          {/* =======================================================
        ASSIGNED TASKS
    ======================================================= */}

          {showSuccessMessage && (
            <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/40">
              <div className="w-[90%] max-w-md rounded-xl bg-white p-6 shadow-2xl">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>

                  <h2 className="text-xl font-semibold text-gray-900">
                    Task Deleted
                  </h2>

                  <p className="mt-2 text-sm text-gray-600">{successMessage}</p>

                  <button
                    type="button"
                    onClick={() => setShowSuccessMessage(false)}
                    className="mt-5 rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          )}

          {showErrorMessage && (
            <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/40">
              <div className="w-[90%] max-w-md rounded-xl bg-white p-6 shadow-2xl">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                  </div>

                  <h2 className="text-xl font-semibold text-gray-900">
                    Unable to Delete Task
                  </h2>

                  <p className="mt-2 text-sm text-gray-600">{errorMessage}</p>

                  <button
                    type="button"
                    onClick={() => setShowErrorMessage(false)}
                    className="mt-5 rounded-lg bg-red-600 px-6 py-2 text-sm font-medium text-white hover:bg-red-700"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'assignedTasks' && (
            <div className="w-full">
              {/* Assign Task Form */}
              <AssignTaskPage
                onTaskCreated={fetchTasks}
                user={user}
                clients={clients}
                employees={employees}
                setActiveTab={setActiveTab}
              />

              <h3
                className="
            mt-6
            mb-5
            text-xl
            font-semibold
            text-slate-800
          "
              >
                Assigned Tasks
              </h3>

              {/* ================= STATUS SUMMARY ================= */}
              <div
                className="
            grid
            grid-cols-1
            sm:grid-cols-2
            xl:grid-cols-3
            gap-4
            mb-6
          "
              >
                {/* Pending */}
                <div
                  className="
              rounded-xl
              border
              border-orange-100
              bg-orange-50
              p-5
              shadow-sm
              flex
              items-center
              gap-4
            "
                >
                  <div
                    className="
                w-11 h-11
                rounded-full
                bg-orange-100
                flex items-center justify-center
                text-xl
              "
                  >
                    🕐
                  </div>

                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-orange-700">
                      Pending
                    </h4>

                    <strong className="block text-2xl font-bold text-slate-800">
                      {pendingAssignedTasks.length}
                    </strong>

                    <span className="text-xs text-slate-500">Tasks</span>
                  </div>

                  <button
                    onClick={() => navigate('/assigned-tasks/pending')}
                    className="
                px-3 py-2
                rounded-md
                bg-orange-500
                hover:bg-orange-600
                text-white
                text-xs
                font-medium
              "
                  >
                    View All
                  </button>
                </div>

                {/* In Progress */}
                <div
                  className="
              rounded-xl
              border
              border-blue-100
              bg-blue-50
              p-5
              shadow-sm
              flex
              items-center
              gap-4
            "
                >
                  <div
                    className="
                w-11 h-11
                rounded-full
                bg-blue-100
                flex items-center justify-center
                text-xl
              "
                  >
                    ↻
                  </div>

                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-blue-700">
                      In Progress
                    </h4>

                    <strong className="block text-2xl font-bold text-slate-800">
                      {inprogressAssignedTasks.length}
                    </strong>

                    <span className="text-xs text-slate-500">Tasks</span>
                  </div>

                  <button
                    onClick={() => navigate('/assigned-tasks/in-progress')}
                    className="
                px-3 py-2
                rounded-md
                bg-blue-500
                hover:bg-blue-600
                text-white
                text-xs
                font-medium
              "
                  >
                    View All
                  </button>
                </div>

                {/* Completed */}
                <div
                  className="
              rounded-xl
              border
              border-green-100
              bg-green-50
              p-5
              shadow-sm
              flex
              items-center
              gap-4
            "
                >
                  <div
                    className="
                w-11 h-11
                rounded-full
                bg-green-100
                flex items-center justify-center
                text-xl
              "
                  >
                    ✓
                  </div>

                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-green-700">
                      Completed
                    </h4>

                    <strong className="block text-2xl font-bold text-slate-800">
                      {completedAssignedTasks.length}
                    </strong>

                    <span className="text-xs text-slate-500">Tasks</span>
                  </div>

                  <button
                    onClick={() => navigate('/assigned-tasks/completed')}
                    className="
                px-3 py-2
                rounded-md
                bg-green-500
                hover:bg-green-600
                text-white
                text-xs
                font-medium
              "
                  >
                    View All
                  </button>
                </div>
              </div>

              {/* ================= THREE TASK SECTIONS ================= */}

              {/* ================= FULL ASSIGNED TASK TABLE ================= */}
              <div
                className="
    bg-white
    rounded-xl
    border
    border-slate-200
    shadow-sm
    overflow-hidden
  "
              >
                <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-slate-800">
                    Assigned Tasks
                  </h3>

                  <button
                    type="button"
                    onClick={handleRefreshAssignedTasks}
                    disabled={refreshingAssignedTasks}
                    className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                    title="Refresh assigned tasks"
                  >
                    <RefreshCw
                      size={16}
                      className={refreshingAssignedTasks ? 'animate-spin' : ''}
                    />
                    {refreshingAssignedTasks ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
                {/* Assigned Tasks Table Filters */}
                <div className="border-b border-slate-200 bg-slate-50/70 p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800">
                        Table Filters
                      </span>
                    </div>

                    <span className="text-xs text-slate-500 sm:text-sm">
                      Showing{' '}
                      <span className="font-semibold text-slate-700">
                        {filteredAndSortedAssignedTasks.length}
                      </span>{' '}
                      of{' '}
                      <span className="font-semibold text-slate-700">
                        {assignedTasks.length}
                      </span>{' '}
                      tasks
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
                    {/* Search */}
                    <div className="xl:col-span-2">
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Search
                      </label>

                      <input
                        type="text"
                        value={assignedTaskSearch}
                        onChange={(e) => setAssignedTaskSearch(e.target.value)}
                        placeholder="Title, client, remarks, employee..."
                        className="
          w-full
          rounded-md
          border border-slate-300
          bg-white
          px-3
          py-2
          text-sm
          outline-none
          transition
          focus:border-blue-400
          focus:ring-2
          focus:ring-blue-200
        "
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Status
                      </label>

                      <select
                        value={assignedTaskStatusFilter}
                        onChange={(e) =>
                          setAssignedTaskStatusFilter(e.target.value)
                        }
                        className="
          w-full
          rounded-md
          border border-slate-300
          bg-white
          px-3
          py-2
          text-sm
          outline-none
          focus:border-blue-400
          focus:ring-2
          focus:ring-blue-200
        "
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>

                    {/* Employee */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Assigned To
                      </label>

                      <select
                        value={assignedTaskEmployeeFilter}
                        onChange={(e) =>
                          setAssignedTaskEmployeeFilter(e.target.value)
                        }
                        className="
          w-full
          rounded-md
          border border-slate-300
          bg-white
          px-3
          py-2
          text-sm
          outline-none
          focus:border-blue-400
          focus:ring-2
          focus:ring-blue-200
        "
                      >
                        <option value="all">All Employees</option>

                        {employees.map((employee) => (
                          <option key={employee._id} value={employee._id}>
                            {employee.name ||
                              employee.fullName ||
                              employee.email ||
                              'Unnamed Employee'}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Client */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Client
                      </label>

                      <select
                        value={assignedTaskClientFilter}
                        onChange={(e) =>
                          setAssignedTaskClientFilter(e.target.value)
                        }
                        className="
          w-full
          rounded-md
          border border-slate-300
          bg-white
          px-3
          py-2
          text-sm
          outline-none
          focus:border-blue-400
          focus:ring-2
          focus:ring-blue-200
        "
                      >
                        <option value="all">All Clients</option>

                        {clients.map((client) => (
                          <option key={client._id} value={client._id}>
                            {client.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Due Date */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Due Date
                      </label>

                      <select
                        value={assignedTaskDueFilter}
                        onChange={(e) =>
                          setAssignedTaskDueFilter(e.target.value)
                        }
                        className="
          w-full
          rounded-md
          border border-slate-300
          bg-white
          px-3
          py-2
          text-sm
          outline-none
          focus:border-blue-400
          focus:ring-2
          focus:ring-blue-200
        "
                      >
                        <option value="all">All Dates</option>
                        <option value="overdue">Overdue</option>
                        <option value="upcoming">Upcoming</option>
                      </select>
                    </div>

                    {/* Sort */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Sort By
                      </label>

                      <select
                        value={assignedTaskSort}
                        onChange={(e) => setAssignedTaskSort(e.target.value)}
                        className="
          w-full
          rounded-md
          border border-slate-300
          bg-white
          px-3
          py-2
          text-sm
          outline-none
          focus:border-blue-400
          focus:ring-2
          focus:ring-blue-200
        "
                      >
                        <option value="due-asc">Due Date: Earliest</option>

                        <option value="due-desc">Due Date: Latest</option>

                        <option value="title-asc">Title: A-Z</option>
                      </select>
                    </div>
                  </div>

                  {/* Clear Filters */}
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setAssignedTaskSearch('');
                        setAssignedTaskStatusFilter('all');
                        setAssignedTaskEmployeeFilter('all');
                        setAssignedTaskClientFilter('all');
                        setAssignedTaskDueFilter('all');
                        setAssignedTaskSort('due-asc');
                      }}
                      className="
        rounded-md
        border border-slate-300
        bg-white
        px-3
        py-2
        text-xs
        font-medium
        text-slate-700
        transition
        hover:bg-slate-100
      "
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-250 text-sm">
                    <thead>
                      <tr className="bg-slate-100 border-b">
                        <th className="px-4 py-3 text-left">Title</th>
                        <th className="px-4 py-3 text-left">Due Date</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Remarks</th>
                        <th className="px-4 py-3 text-left">Client</th>
                        <th className="px-4 py-3 text-left">Assigned To</th>
                        <th className="px-4 py-3 text-left">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredAndSortedAssignedTasks.map((task) => (
                        <tr
                          key={task._id}
                          className="border-b border-slate-100 hover:bg-slate-50"
                        >
                          {/* Title */}
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={task.title || ''}
                              onChange={(e) =>
                                handleAssignedTaskTitleChange(
                                  task._id,
                                  e.target.value,
                                )
                              }
                              className="
                  w-full
                  min-w-40
                  px-3
                  py-2
                  rounded-md
                  border border-slate-300
                  outline-none
                  text-sm
                  focus:ring-2
                  focus:ring-blue-300
                  focus:border-blue-300
                "
                            />
                          </td>

                          {/* Due Date */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <input
                              type="date"
                              value={
                                task.dueDate
                                  ? new Date(task.dueDate)
                                      .toISOString()
                                      .split('T')[0]
                                  : ''
                              }
                              onChange={(e) =>
                                handleAssignedTaskDueDateChange(
                                  task._id,
                                  e.target.value,
                                )
                              }
                              className="
                  px-3
                  py-2
                  rounded-md
                  border border-slate-300
                  bg-white
                  text-sm
                  outline-none
                  focus:ring-2
                  focus:ring-blue-300
                  focus:border-blue-300
                "
                            />
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            <select
                              value={task.status || 'Not Started'}
                              onChange={(e) =>
                                handleAssignedTaskStatusChange(
                                  task._id,
                                  e.target.value,
                                )
                              }
                              className="
                  px-3
                  py-2
                  rounded-md
                  border border-slate-300
                  bg-white
                  text-sm
                  outline-none
                  focus:ring-2
                  focus:ring-blue-300
                  focus:border-blue-300
                "
                            >
                              <option value="Not Started">Not Started</option>

                              <option value="In Progress">In Progress</option>
                            </select>
                          </td>

                          {/* Remarks */}
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={task.remarks || ''}
                              onChange={(e) =>
                                handleRemarkChange(task._id, e.target.value)
                              }
                              placeholder="Add remarks..."
                              className="
                  w-full
                  min-w-45
                  px-3
                  py-2
                  rounded-md
                  border border-slate-300
                  outline-none
                  text-sm
                  focus:ring-2
                  focus:ring-green-300
                  focus:border-green-300
                "
                            />
                          </td>

                          {/* Client */}
                          <td className="px-4 py-3">
                            <select
                              value={task.client?._id || task.client || ''}
                              onChange={(e) =>
                                handleAssignedTaskClientChange(
                                  task._id,
                                  e.target.value,
                                )
                              }
                              className="
                  px-2
                  py-2
                  rounded-md
                  border border-slate-300
                  bg-white
                  text-xs
                  outline-none
                  focus:ring-2
                  focus:ring-blue-400
                "
                            >
                              <option value="">-- Select Client --</option>

                              {clients.map((c) => (
                                <option key={c._id} value={c._id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Assigned To - READ ONLY */}
                          <td className="px-4 py-3 text-slate-600">
                            {task.assignedTo?.name || 'Unknown'}
                          </td>

                          {/* Delete */}
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => handleDeleteAssignedTask(task._id)}
                              className="
                  px-4
                  py-2
                  rounded-md
                  bg-red-500
                  hover:bg-red-600
                  text-white
                  text-xs
                  font-medium
                  transition
                "
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =======================================================
        COMPLETED TASKS
    ======================================================= */}
          {activeTab === 'completedTasks' && (
            <div className="w-full">
              <h3 className="text-xl font-semibold text-slate-800 mb-5">
                Completed Tasks
              </h3>

              {completedTasks.length === 0 ? (
                <div
                  className="
              bg-white
              rounded-xl
              border
              border-slate-200
              p-8
              text-center
              text-slate-500
            "
                >
                  No completed tasks found.
                </div>
              ) : (
                <div className="space-y-4">
                  {completedTasks.map((task) => {
                    const isEditing = editingTimeTaskId === task._id;

                    return (
                      <div
                        className="
                    bg-white
                    rounded-xl
                    border
                    border-green-100
                    shadow-sm
                    p-5
                  "
                        key={task._id}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                          <h4 className="text-lg font-semibold text-slate-800">
                            {task.title}
                          </h4>

                          <span
                            className="
                        inline-flex
                        w-fit
                        px-3
                        py-1
                        rounded-full
                        bg-green-100
                        text-green-700
                        text-xs
                        font-semibold
                      "
                          >
                            Completed
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <p className="text-sm text-slate-600">
                            <strong className="text-slate-800">Remarks:</strong>{' '}
                            {task.remarks || 'No remarks'}
                          </p>

                          <p className="text-sm text-slate-600">
                            <strong className="text-slate-800">
                              Priority:
                            </strong>{' '}
                            {task.priority || 'Normal'}
                          </p>

                          <p className="text-sm text-slate-600">
                            <strong className="text-slate-800">
                              Due Date:
                            </strong>{' '}
                            {task.dueDate
                              ? new Date(task.dueDate).toLocaleDateString()
                              : 'N/A'}
                          </p>

                          <p className="text-sm text-slate-600">
                            <strong className="text-slate-800">
                              Time Spent:
                            </strong>{' '}
                            {task.totalHours ?? 0} hours{' '}
                            {task.totalMinutes ?? 0} minutes
                          </p>
                        </div>

                        {/* Time Editing */}
                        {isEditing && (
                          <div
                            className="
                        mt-5
                        p-4
                        rounded-lg
                        bg-green-50
                        border
                        border-green-100
                      "
                          >
                            <strong className="block mb-3 text-green-800">
                              Edit Time Spent
                            </strong>

                            <div
                              className="
                          grid
                          grid-cols-1
                          sm:grid-cols-2
                          gap-3
                        "
                            >
                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                  Hours
                                </label>

                                <input
                                  type="number"
                                  min="0"
                                  value={editHours}
                                  onChange={(e) => setEditHours(e.target.value)}
                                  placeholder="Hours"
                                  className="
                              w-full
                              px-3
                              py-2
                              rounded-md
                              border
                              border-slate-300
                              bg-white
                              outline-none
                              focus:ring-2
                              focus:ring-green-300
                            "
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                  Minutes
                                </label>

                                <input
                                  type="number"
                                  min="0"
                                  max="59"
                                  value={editMinutes}
                                  onChange={(e) =>
                                    setEditMinutes(e.target.value)
                                  }
                                  placeholder="Minutes"
                                  className="
                              w-full
                              px-3
                              py-2
                              rounded-md
                              border
                              border-slate-300
                              bg-white
                              outline-none
                              focus:ring-2
                              focus:ring-green-300
                            "
                                />
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mt-4">
                              <button
                                className="
                            px-4
                            py-2
                            rounded-md
                            bg-green-500
                            hover:bg-green-600
                            text-white
                            text-sm
                            font-medium
                          "
                                onClick={() =>
                                  handleUpdateCompletedTime(task._id)
                                }
                              >
                                Save
                              </button>

                              <button
                                className="
                            px-4
                            py-2
                            rounded-md
                            bg-slate-200
                            hover:bg-slate-300
                            text-slate-700
                            text-sm
                            font-medium
                          "
                                onClick={() => {
                                  setEditingTimeTaskId(null);
                                  setEditHours('');
                                  setEditMinutes('');
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2 mt-5">
                          {!isEditing && (
                            <button
                              className="
                          px-4
                          py-2
                          rounded-md
                          bg-green-500
                          hover:bg-green-600
                          text-white
                          text-sm
                          font-medium
                        "
                              onClick={() => {
                                setEditingTimeTaskId(task._id);

                                setEditHours(String(task.totalHours ?? 0));

                                setEditMinutes(String(task.totalMinutes ?? 0));
                              }}
                            >
                              Edit Time
                            </button>
                          )}

                          <button
                            onClick={() => handleUncompleteTask(task._id)}
                            className="
                        px-4
                        py-2
                        rounded-md
                        bg-orange-500
                        hover:bg-orange-600
                        text-white
                        text-sm
                        font-medium
                      "
                          >
                            Uncomplete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* =======================================================
        COMPLETION TIME POPUP
    ======================================================= */}
          {showPopup && (
            <div
              className="
          fixed
          inset-0
          z-50
          bg-black/50
          flex
          items-center
          justify-center
          p-4
        "
            >
              <div
                className="
            w-full
            max-w-md
            bg-white
            rounded-xl
            shadow-2xl
            p-5
          "
              >
                <h3 className="text-lg font-semibold text-slate-800 mb-4">
                  Upon Completion of your task, Please Log your Time
                </h3>

                <div className="space-y-3">
                  <input
                    id="hours"
                    type="number"
                    placeholder="Hours"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    className="
                w-full
                px-3
                py-2
                rounded-md
                border
                border-slate-300
                outline-none
                focus:ring-2
                focus:ring-blue-400
              "
                  />

                  <input
                    id="minutes"
                    type="number"
                    placeholder="Minutes"
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    className="
                w-full
                px-3
                py-2
                rounded-md
                border
                border-slate-300
                outline-none
                focus:ring-2
                focus:ring-blue-400
              "
                  />
                </div>

                <div className="flex justify-end gap-2 mt-5">
                  <button
                    onClick={() => setShowPopup(false)}
                    className="
                px-4
                py-2
                rounded-md
                bg-slate-200
                hover:bg-slate-300
                text-slate-700
                text-sm
              "
                  >
                    Cancel
                  </button>

                  <button
                    onClick={() => {
                      handleCompleteTask();
                    }}
                    className="
                px-4
                py-2
                rounded-md
                bg-green-500
                hover:bg-green-600
                text-white
                text-sm
                font-medium
              "
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =======================================================
        CLIENTS
    ======================================================= */}
          {activeTab === 'clients' && (
            <div className="w-full">
              {/* Header */}
              <div className="mb-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">
                      My Clients
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Clients assigned to you by the administrator.
                    </p>
                  </div>

                  <span
                    className="
            w-fit
            rounded-full
            bg-blue-50
            px-3 py-1
            text-xs
            font-semibold
            text-blue-600
          "
                  >
                    {myClients.length} client
                    {myClients.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Client Table */}
              <div
                className="
        overflow-hidden
        rounded-2xl
        border
        border-slate-200
        bg-white
        shadow-sm
      "
              >
                <div className="w-full overflow-x-auto">
                  <table className="w-full min-w-162.5 text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50">
                      <tr>
                        <th className="px-6 py-4 text-left font-semibold text-slate-600">
                          Client
                        </th>

                        <th className="px-6 py-4 text-left font-semibold text-slate-600">
                          Email
                        </th>

                        <th className="px-6 py-4 text-left font-semibold text-slate-600">
                          Company
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {loadingMyClients ? (
                        <tr>
                          <td
                            colSpan={3}
                            className="
                    px-6
                    py-12
                    text-center
                    text-slate-500
                  "
                          >
                            Loading your clients...
                          </td>
                        </tr>
                      ) : myClients.length === 0 ? (
                        <tr>
                          <td
                            colSpan={3}
                            className="
                    px-6
                    py-12
                    text-center
                    text-slate-500
                  "
                          >
                            No clients have been assigned to you.
                          </td>
                        </tr>
                      ) : (
                        myClients.map((client) => (
                          <tr
                            key={client._id}
                            className="transition hover:bg-slate-50"
                          >
                            <td className="px-6 py-4 font-medium text-slate-800">
                              {client.name}
                            </td>

                            <td className="px-6 py-4 text-slate-600">
                              {client.email || 'N/A'}
                            </td>

                            <td className="px-6 py-4 text-slate-600">
                              {client.company || 'N/A'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =======================================================
        NOTIFICATIONS
    ======================================================= */}
          {activeTab === 'notifications' && (
            <div className="w-full">
              {/* ================= NOTIFICATION HEADER ================= */}
              <div
                className="
      mb-5
      flex
      flex-col
      gap-2
      sm:flex-row
      sm:items-center
      sm:justify-between
    "
              >
                <h2 className="text-xl font-semibold text-slate-800">
                  Notifications
                </h2>

                <span className="text-sm text-slate-500">
                  {notifications.length} notification
                  {notifications.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* ================= EMPTY STATE ================= */}
              {notifications.length === 0 ? (
                <div
                  className="
        rounded-xl
        border
        border-slate-200
        bg-white
        p-10
        text-center
        shadow-sm
      "
                >
                  <MdNotificationsNone
                    size={50}
                    className="mx-auto mb-3 text-slate-400"
                  />

                  <h3 className="text-lg font-semibold text-slate-700">
                    No notifications
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    You don't have any notifications right now.
                  </p>
                </div>
              ) : (
                /* ================= NOTIFICATION LIST ================= */
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className="
            flex
            items-start
            gap-3
            rounded-xl
            border
            border-slate-200
            bg-white
            p-4
            shadow-sm
            transition
            hover:shadow-md
            sm:gap-4
          "
                    >
                      {/* ================= ICON ================= */}
                      <div
                        className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-blue-50
              text-lg
            "
                      >
                        🔔
                      </div>

                      {/* ================= CONTENT ================= */}
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-slate-800">
                          New Notification
                        </h4>

                        <p
                          className="
                mt-1
                wrap-break-word
                text-sm
                leading-6
                text-slate-600
              "
                        >
                          {notification.message}
                        </p>

                        <small className="mt-2 block text-xs text-slate-400">
                          {notification.createdAt
                            ? new Date(notification.createdAt).toLocaleString()
                            : ''}
                        </small>
                      </div>

                      {/* ================= DELETE BUTTON ================= */}
                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteNotification(notification._id)
                        }
                        title="Delete notification"
                        aria-label="Delete notification"
                        className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-lg
              text-slate-400
              transition
              hover:bg-red-50
              hover:text-red-600
              active:scale-95
            "
                      >
                        <MdDelete size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
