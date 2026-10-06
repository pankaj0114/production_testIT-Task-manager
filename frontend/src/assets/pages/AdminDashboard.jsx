import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { MdPersonAdd, MdLogout } from 'react-icons/md';
import '../css/EmployeeDashboard.css';
import { Eye, EyeOff } from 'lucide-react';
import MyTasks from '../components/admin/MyTasks';
import AssignedTasks from '../components/admin/AssignedTasks';
import AdminAttendance from '../components/admin/AdminAttendance';

import { io } from 'socket.io-client';
import { MdCalendarMonth } from 'react-icons/md';

const API_BASE = (
  import.meta.env.VITE_API_URL || 'http://localhost:5005'
).replace(/\/+$/, '');

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState({});
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [dateOfJoining, setDateOfJoining] = useState('');

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const [editingEmployeeId, setEditingEmployeeId] = useState(null);

  const [editingEmployeeData, setEditingEmployeeData] = useState({
    name: '',
    email: '',
    dateOfJoining: '',
  });

  const [employeeUpdateLoading, setEmployeeUpdateLoading] = useState(false);
  const [employeeUpdateError, setEmployeeUpdateError] = useState('');

  // Keep the selected Admin Dashboard section after a page refresh.
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem('adminActiveTab');

    const validTabs = [
      'myTasks',
      'assignedTasks',
      'completedTasks',
      'userRegistration',
      'clients',
      'allTasks',
      'attendance',
      'employeePerformance',
      'notifications',
    ];

    return validTabs.includes(savedTab) ? savedTab : 'myTasks';
  });

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('adminActiveTab', tab);
  };

  const [employees, setEmployees] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [clients, setClients] = useState([]);
  //const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [clientForm, setClientForm] = useState({
    name: '',
    email: '',
    company: '',
  });

  const [creatingClient, setCreatingClient] = useState(false);

  const [clientMessage, setClientMessage] = useState('');

  const [clientError, setClientError] = useState('');

  const [selectedClient, setSelectedClient] = useState('');

  const [selectedEmployees, setSelectedEmployees] = useState([]);

  const [adminTasks, setAdminTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState(null);

  const [employeePerformance, setEmployeePerformance] = useState([]);

  const [loadingPerformance, setLoadingPerformance] = useState(false);

  const [notifications, setNotifications] = useState([]);

  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const [showResetPassword, setShowResetPassword] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState('');
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState('');

  //const [selectedEmployee, setSelectedEmployee] = useState('');
  const storedUser = localStorage.getItem('user');

  let loggedInAdmin = null;

  try {
    loggedInAdmin = storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error('Invalid user data:', error);
  }

  const [admin, setAdmin] = useState(loggedInAdmin);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfJoining: '',
  });

  const [loading, setLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');

  const [successMessage, setSuccessMessage] = useState('');

  // ==========================================
  // GET LOGGED-IN USER
  // ==========================================

  useEffect(() => {
    const storedUser = localStorage.getItem('user');

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Invalid user data');
      }
    }
  }, []);

  // ==========================================
  // EDIT EMPLOYEE
  // ==========================================

  const handleStartEditEmployee = (employee) => {
    setEditingEmployeeId(employee._id);

    setEditingEmployeeData({
      name: employee.name || '',
      email: employee.email || '',
      dateOfJoining: employee.dateOfJoining
        ? String(employee.dateOfJoining).slice(0, 10)
        : '',
    });

    setEmployeeUpdateError('');
  };

  const handleCancelEditEmployee = () => {
    setEditingEmployeeId(null);

    setEditingEmployeeData({
      name: '',
      email: '',
      dateOfJoining: '',
    });

    setEmployeeUpdateError('');
  };

  const handleEmployeeEditChange = (field, value) => {
    setEditingEmployeeData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSaveEmployee = async (employeeId) => {
    if (!employeeId) {
      return;
    }

    const name = editingEmployeeData.name.trim();
    const email = editingEmployeeData.email.trim();
    const dateOfJoining = editingEmployeeData.dateOfJoining;

    if (!name) {
      setEmployeeUpdateError('Employee name is required.');
      return;
    }

    if (!email) {
      setEmployeeUpdateError('Employee email is required.');
      return;
    }

    if (!dateOfJoining) {
      setEmployeeUpdateError('Date of joining is required.');
      return;
    }

    try {
      setEmployeeUpdateLoading(true);
      setEmployeeUpdateError('');

      const token = localStorage.getItem('accessToken');

      if (!token) {
        setEmployeeUpdateError(
          'Authentication token not found. Please login again.',
        );
        return;
      }

      const response = await axios.put(
        `${API_BASE}/api/admin/employees/${employeeId}`,
        {
          name,
          email,
          dateOfJoining,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const updatedEmployee = response.data.employee || response.data;

      setEmployees((previousEmployees) =>
        previousEmployees.map((employee) =>
          String(employee._id) === String(employeeId)
            ? {
                ...employee,
                ...updatedEmployee,
                name,
                email,
                dateOfJoining,
              }
            : employee,
        ),
      );

      setEditingEmployeeId(null);

      setEditingEmployeeData({
        name: '',
        email: '',
        dateOfJoining: '',
      });

      setEmployeeUpdateError('');
    } catch (error) {
      console.error(
        'UPDATE EMPLOYEE ERROR:',
        error.response?.data || error.message,
      );

      setEmployeeUpdateError(
        error.response?.data?.message || 'Failed to update employee details.',
      );
    } finally {
      setEmployeeUpdateLoading(false);
    }
  };

  const fetchAdmin = async () => {
    try {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        navigate('/', { replace: true });
        return;
      }

      const response = await axios.get(`${API_BASE}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Logged-in admin:', response.data);

      if (response.data?.role !== 'admin') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        navigate('/', { replace: true });
        return;
      }

      setAdmin(response.data);
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
    } catch (error) {
      console.error(
        'Admin authentication failed:',
        error.response?.data || error.message,
      );
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      navigate('/', { replace: true });
    }
  };

  useEffect(() => {
    fetchAdmin();
  }, [navigate]);

  // ==========================================
  // FETCH EMPLOYEES
  // ==========================================

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('accessToken');

      const response = await axios.get(`${API_BASE}/api/admin/employees`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setEmployees(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(
        'Error fetching employees:',
        error.response?.data || error.message,
      );
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // ==========================================
  // FETCH ALL CLIENTS
  // ==========================================

  const fetchAdminClients = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');

      if (!accessToken) {
        console.error('Access token not found');
        return;
      }

      const response = await axios.get(`${API_BASE}/api/admin/clients`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log('CLIENTS FROM API:', response.data);

      setClients(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(
        'Error fetching admin clients:',
        error.response?.data || error.message,
      );

      setClients([]);
    }
  };

  useEffect(() => {
    fetchAdminClients();
  }, []);

  // ==========================================
  // INPUT CHANGE
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================
  // REGISTER EMPLOYEE
  // ==========================================

  const handleRegisterEmployee = async (e) => {
    e.preventDefault();

    try {
      setErrorMessage('');
      setSuccessMessage('');

      if (!name.trim()) {
        setErrorMessage('Please enter employee name.');
        return;
      }

      if (!email.trim()) {
        setErrorMessage('Please enter employee email.');
        return;
      }

      if (!password) {
        setErrorMessage('Please enter password.');
        return;
      }

      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        return;
      }

      if (!dateOfJoining) {
        setErrorMessage('Please select date of joining.');
        return;
      }

      const accessToken = localStorage.getItem('accessToken');

      if (!accessToken) {
        setErrorMessage('Authentication token not found.');
        return;
      }

      const response = await axios.post(
        `${API_BASE}/api/admin/register-employee`,
        {
          name: name.trim(),
          email: email.trim(),
          password,
          confirmPassword,
          dateOfJoining,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log('Employee registered:', response.data);

      // Add newly registered employee immediately
      const newEmployee = response.data.employee;

      setEmployees((prevEmployees) => [newEmployee, ...prevEmployees]);

      //setSuccessMessage('Employee registered successfully.');

      // Clear form
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setDateOfJoining('');
    } catch (error) {
      console.error(
        'Error registering employee:',
        error.response?.data || error.message,
      );

      setErrorMessage(
        error.response?.data?.message || 'Unable to register employee.',
      );
    }
  };

  const handleOpenResetPassword = (employee) => {
    setSelectedEmployee(employee);

    setNewPassword('');
    setConfirmNewPassword('');

    setResetPasswordError('');
    setResetPasswordSuccess('');

    setShowResetPassword(true);
  };

  const handleCloseResetPassword = () => {
    setShowResetPassword(false);

    setSelectedEmployee(null);

    setNewPassword('');
    setConfirmNewPassword('');

    setResetPasswordError('');
    setResetPasswordSuccess('');
  };

  const handleResetPassword = async () => {
    if (!selectedEmployee) {
      return;
    }

    if (!newPassword) {
      setResetPasswordError('Please enter a new password.');
      return;
    }

    if (newPassword.length < 6) {
      setResetPasswordError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setResetPasswordError('Passwords do not match.');
      return;
    }

    try {
      setResetPasswordLoading(true);
      setResetPasswordError('');
      setResetPasswordSuccess('');

      const token = localStorage.getItem('accessToken');

      if (!token) {
        setResetPasswordError(
          'Authentication token not found. Please login again.',
        );
        return;
      }

      const response = await axios.put(
        `${API_BASE}/api/admin/employees/${selectedEmployee._id}/reset-password`,
        {
          newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('RESET PASSWORD RESPONSE:', response.data);

      setResetPasswordSuccess('Password reset successfully.');

      setNewPassword('');
      setConfirmNewPassword('');

      setTimeout(() => {
        handleCloseResetPassword();
      }, 1200);
    } catch (error) {
      console.error('RESET PASSWORD ERROR:', error);
      console.error('STATUS:', error.response?.status);
      console.error('DATA:', error.response?.data);

      setResetPasswordError(
        error.response?.data?.message || 'Failed to reset password.',
      );
    } finally {
      setResetPasswordLoading(false);
    }
  };

  // ==========================================
  // CLIENT FORM CHANGE
  // ==========================================

  const handleClientFormChange = (e) => {
    const { name, value } = e.target;

    setClientForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================
  // CREATE CLIENT
  // ==========================================

  const handleCreateClient = async (e) => {
    e.preventDefault();

    setClientMessage('');
    setClientError('');

    const clientName = clientForm.name.trim();
    const clientEmail = clientForm.email.trim();
    const clientCompany = clientForm.company.trim();

    if (!clientName) {
      setClientError('Please enter client name.');
      return;
    }

    if (!clientEmail) {
      setClientError('Please enter client email.');
      return;
    }

    if (!clientCompany) {
      setClientError('Please enter company name.');
      return;
    }

    try {
      setCreatingClient(true);

      const accessToken = localStorage.getItem('accessToken');

      if (!accessToken) {
        setClientError('Authentication token not found. Please login again.');
        return;
      }

      const response = await axios.post(
        `${API_BASE}/api/admin/clients`,
        {
          name: clientName,
          email: clientEmail,
          company: clientCompany,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log('Client created successfully:', response.data);

      if (response.data?.client) {
        setClients((prevClients) => [response.data.client, ...prevClients]);
      }

      setClientForm({
        name: '',
        email: '',
        company: '',
      });

      setClientMessage(
        response.data?.message || 'Client created successfully.',
      );
    } catch (error) {
      console.error(
        'CREATE CLIENT ERROR:',
        error.response?.data || error.message,
      );

      setClientError(
        error.response?.data?.message || 'Failed to create client.',
      );
    } finally {
      setCreatingClient(false);
    }
  };

  const handleAssignClient = async () => {
    setClientMessage('');
    setClientError('');

    if (!selectedClient) {
      setClientError('Please select a client.');
      return;
    }

    if (selectedEmployees.length === 0) {
      setClientError('Please select at least one employee.');
      return;
    }

    try {
      const accessToken = localStorage.getItem('accessToken');

      if (!accessToken) {
        setClientError('Authentication token not found. Please login again.');
        return;
      }

      console.log('ASSIGNING CLIENT:', {
        clientId: selectedClient,
        employeeIds: selectedEmployees,
      });

      const response = await axios.put(
        `${API_BASE}/api/admin/clients/assign`,
        {
          clientId: selectedClient,
          employeeIds: selectedEmployees,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log('ASSIGN CLIENT RESPONSE:', response.data);

      if (response.data?.client) {
        setClients((prevClients) =>
          prevClients.map((client) =>
            String(client._id) === String(selectedClient)
              ? response.data.client
              : client,
          ),
        );
      }

      setSelectedClient('');
      setSelectedEmployees([]);
    } catch (error) {
      console.error(
        'ASSIGN CLIENT ERROR:',
        error.response?.data || error.message,
      );

      setClientError(
        error.response?.data?.message || 'Failed to assign client.',
      );
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('accessToken');

      console.log('Token exists:', !!token);

      if (!token) {
        console.error('Admin authentication token not found');
        return;
      }

      const dNotification = notifications.find(
        (notification) => notification._id === notificationId,
      );

      await axios.delete(`${API_BASE}/api/notifications/${notificationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNotifications((prev) =>
        prev.filter((notification) => notification._id !== notificationId),
      );

      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadNotificationCount((prev) => Math.max(0, prev - 1));
      }

      console.log('Notification deleted successfully');
    } catch (error) {
      console.error(
        'DELETE NOTIFICATION ERROR:',
        error.response?.data || error.message,
      );
    }
  };

  const fetchAdminTasks = async () => {
    try {
      setLoadingTasks(true);

      const accessToken = localStorage.getItem('accessToken');

      if (!accessToken) {
        console.error('Access token not found');
        return;
      }

      const response = await axios.get(`${API_BASE}/api/admin/tasks`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log('ALL ADMIN TASKS:', response.data);

      setAdminTasks(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(
        'Error fetching admin tasks:',
        error.response?.data || error.message,
      );

      setAdminTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    if (
      activeTab === 'allTasks' ||
      activeTab === 'myTasks' ||
      activeTab === 'assignedTasks'
    ) {
      fetchAdminTasks();
    }
  }, [activeTab]);

  const handleDeleteTask = async (taskId) => {
    if (!taskId) {
      console.error('Task ID is missing');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to delete this task?',
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingTaskId(taskId);

      const accessToken = localStorage.getItem('accessToken');

      await axios.delete(`${API_BASE}/api/admin/tasks/${taskId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setAdminTasks((prevTasks) =>
        prevTasks.filter((task) => String(task._id) !== String(taskId)),
      );
    } catch (error) {
      console.error(
        'Error deleting task:',
        error.response?.data || error.message,
      );

      alert(error.response?.data?.message || 'Failed to delete task.');
    } finally {
      setDeletingTaskId(null);
    }
  };

  useEffect(() => {
    if (activeTab === 'employeePerformance') {
      fetchEmployeePerformance();
    }
  }, [activeTab]);

  // ==========================================
  // FETCH EMPLOYEE PERFORMANCE
  // ==========================================

  const fetchEmployeePerformance = async () => {
    try {
      setLoadingPerformance(true);

      const token = localStorage.getItem('accessToken');

      if (!token) {
        console.error('Access token not found.');
        return;
      }

      const response = await axios.get(
        `${API_BASE}/api/admin/employee-performance`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('EMPLOYEE PERFORMANCE:', response.data);

      setEmployeePerformance(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(
        'Error fetching employee performance:',
        error.response?.data || error.message,
      );

      setEmployeePerformance([]);
    } finally {
      setLoadingPerformance(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);

      const token = localStorage.getItem('accessToken');

      if (!token) {
        return;
      }

      const response = await axios.get(`${API_BASE}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = Array.isArray(response.data) ? response.data : [];

      setNotifications(data);

      setUnreadNotificationCount(
        data.filter((notification) => !notification.isRead).length,
      );
    } catch (error) {
      console.error(
        'Fetch admin notifications error:',
        error.response?.data || error.message,
      );
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markNotificationsAsRead = async () => {
    try {
      const token = localStorage.getItem('accessToken');

      await axios.put(
        `${API_BASE}/api/notifications/read-all`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      );

      setUnreadNotificationCount(0);
    } catch (error) {
      console.error('MARK READ ERROR:', error.response?.data || error.message);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (!admin?._id) {
      return;
    }

    console.log('Connecting admin socket for:', admin._id);

    const socket = io(`${API_BASE}`, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('ADMIN SOCKET CONNECTED:', socket.id);

      socket.emit('join', String(admin._id));

      console.log('ADMIN JOINED ROOM:', String(admin._id));
    });

    socket.on('newNotification', (notification) => {
      console.log('NEW ADMIN NOTIFICATION:', notification);

      setNotifications((prev) => [notification, ...prev]);

      setUnreadNotificationCount((prev) => prev + 1);
    });

    socket.on('connect_error', (error) => {
      console.error('ADMIN SOCKET ERROR:', error);
    });

    return () => {
      socket.disconnect();
    };
  }, [admin?._id]);

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ======================================
          SIDEBAR
      ====================================== */}

      <aside
        className="
    fixed
    left-0
    top-0
    bottom-0
    z-40

    w-16
    sm:w-20
    lg:w-64

    min-h-screen

    flex
    flex-col

    overflow-y-auto

    bg-slate-900
    text-white

    border-r
    border-slate-700
    shadow-lg

    transition-all
    duration-300
  "
      >
        {/* Admin Info */}

        <div
          className="
          px-2
          py-4
          border-b
          border-slate-700
          sm:px-4
          sm:py-5
          lg:px-6
          lg:py-6
        "
        >
          <p
            className="
            text-center
            text-[10px]
            text-slate-400
            uppercase
            tracking-wider
            lg:text-left
            lg:text-xs
          "
          >
            <span className="hidden lg:inline">Admin</span>
            <span className="lg:hidden">A</span>
          </p>

          <h3
            className="
            mt-1
            hidden
            truncate
            text-center
            text-lg
            font-semibold
            lg:block
            lg:text-left
          "
          >
            {admin?.name || 'Loading...'}
          </h3>

          <div
            className="
              mx-auto
              mt-1
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-full
              bg-blue-600
              text-sm
              font-bold
              lg:hidden
            "
          >
            {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
        </div>

        {/* Navigation */}

        <nav className="flex-1 space-y-1.5 px-1.5 py-4 sm:space-y-2 sm:px-2 sm:py-5 lg:px-3">
          {/* My Tasks */}
          <button
            type="button"
            onClick={() => handleTabChange('myTasks')}
            className={`
    flex
    w-full
    items-center
    justify-center
    gap-3
    rounded-lg
    px-3
    py-3
    text-left
    transition
    lg:justify-start
    lg:px-4
    ${
      activeTab === 'myTasks'
        ? 'bg-blue-600 text-white'
        : 'text-slate-300 hover:bg-slate-800'
    }
  `}
          >
            <span className="text-lg">📋</span>

            <span className="hidden lg:inline">My Tasks</span>
          </button>

          {/* Assigned Tasks */}
          <button
            type="button"
            onClick={() => handleTabChange('assignedTasks')}
            className={`
    flex
    w-full
    items-center
    justify-center
    gap-3
    rounded-lg
    px-3
    py-3
    text-left
    transition
    lg:justify-start
    lg:px-4
    ${
      activeTab === 'assignedTasks'
        ? 'bg-blue-600 text-white'
        : 'text-slate-300 hover:bg-slate-800'
    }
  `}
          >
            <span className="text-lg">📤</span>

            <span className="hidden lg:inline">Assigned Tasks</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('userRegistration')}
            className={`
              flex
              w-full
              items-center
              justify-center
              gap-3
              rounded-lg
              px-3
              py-3
              text-left
              transition
              lg:justify-start
              lg:px-4
              ${
                activeTab === 'userRegistration'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }
            `}
          >
            <MdPersonAdd size={22} />

            <span className="hidden lg:inline">User Registration</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('clients')}
            className={`
              flex
              w-full
              items-center
              justify-center
              gap-3
              rounded-lg
              px-3
              py-3
              text-left
              transition
              lg:justify-start
              lg:px-4
              ${
                activeTab === 'clients'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }
            `}
          >
            <span className="shrink-0 text-lg">👥</span>

            <span className="hidden lg:inline">Clients</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('allTasks')}
            className={`
    w-full
    flex
    items-center
    justify-center
    gap-3
    rounded-lg
    px-3
    py-3
    text-left
    transition
    lg:justify-start
    lg:px-4
    ${
      activeTab === 'allTasks'
        ? 'bg-blue-600 text-white'
        : 'text-slate-300 hover:bg-slate-800'
    }
  `}
          >
            <span className="text-lg">📋</span>
            <span className="hidden lg:inline">All Tasks</span>
          </button>

          {/* Attendance */}
          <button
            type="button"
            onClick={() => handleTabChange('attendance')}
            className={`
    flex
    w-full
    items-center
    justify-center
    gap-3
    rounded-lg
    px-3
    py-3
    text-left
    transition
    lg:justify-start
    lg:px-4
    ${
      activeTab === 'attendance'
        ? 'bg-blue-600 text-white'
        : 'text-slate-300 hover:bg-slate-800'
    }
  `}
          >
            <MdCalendarMonth size={22} />

            <span className="hidden lg:inline">Attendance</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('employeePerformance')}
            className={`
    mt-2
    flex
    w-full
    items-center
    justify-center
    gap-2
    rounded-lg
    px-2
    py-3
    text-left
    transition
    lg:justify-start
    lg:gap-3
    lg:px-4

    ${
      activeTab === 'employeePerformance'
        ? 'bg-blue-600 text-white'
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }
  `}
          >
            <span className="text-lg">📊</span>

            <span className="hidden lg:inline">Employee Performance</span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleTabChange('notifications');
              markNotificationsAsRead();
              fetchNotifications();
            }}
            className={`
    mt-2
    flex
    w-full
    items-center
    justify-between
    gap-2
    rounded-lg
    px-2
    py-3
    text-left
    transition
    lg:px-4

    ${
      activeTab === 'notifications'
        ? 'bg-blue-600 text-white'
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }
  `}
          >
            <div className="flex min-w-0 items-center justify-center gap-2 lg:justify-start lg:gap-3">
              <span className="shrink-0 text-lg">🔔</span>

              <span className="hidden lg:inline">Notifications</span>
            </div>

            {unreadNotificationCount > 0 && (
              <span
                className="
        min-w-6
        rounded-full
        bg-red-500
        px-2
        py-0.5
        text-center
        text-xs
        font-bold
        text-white
      "
              >
                {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
              </span>
            )}
          </button>
        </nav>

        {/* Logout */}

        <div className="border-t border-slate-700 p-2 lg:p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="
              w-full
              flex
              items-center
              justify-center
              gap-2
              px-4
              py-3
              rounded-lg
              bg-red-500
              hover:bg-red-600
              transition
              font-medium
            "
          >
            <MdLogout size={20} />
            <span className="hidden lg:inline">Logout</span>
          </button>
        </div>
      </aside>

      {/* ======================================
          MAIN PANEL
      ====================================== */}

      <main
        className="
    min-h-screen
    min-w-0

    ml-8
    w-[calc(100%-4.5rem)]

    px-3
    py-4

    sm:ml-22
    sm:w-[calc(100%-5.5rem)]
    sm:px-5
    sm:py-6

    lg:ml-68
    lg:w-[calc(100%-17rem)]
    lg:px-6
    lg:py-8

    pb-8

    bg-slate-50

    transition-all
    duration-300
  "
      >
        {/* ==========================================
    MY TASKS
========================================== */}

        {activeTab === 'myTasks' && (
          <MyTasks tasks={adminTasks} loading={loadingTasks} admin={admin} />
        )}

        {activeTab === 'attendance' && <AdminAttendance />}

        {/* ==========================================
    ASSIGNED TASKS
========================================== */}

        {activeTab === 'assignedTasks' && (
          <AssignedTasks
            tasks={adminTasks}
            loading={loadingTasks}
            admin={admin}
          />
        )}
        {activeTab === 'userRegistration' && (
          <div className="mx-auto w-full min-w-0 max-w-7xl">
            {/* Header */}
            <div className="mb-6">
              <h1
                className="
                text-2xl
                sm:text-3xl
                font-bold
                text-slate-800
              "
              >
                User Registration
              </h1>

              <p
                className="
                mt-1
                text-sm
                text-slate-500
              "
              >
                Register new employees and manage registered employees.
              </p>
            </div>
            {/* ==================================
                REGISTRATION FORM
            ================================== */}
            <div
              className="
              bg-white
              rounded-xl
              border
              border-slate-200
              shadow-sm
              p-5
              sm:p-6
              mb-8
            "
            >
              <h2
                className="
                text-lg
                font-semibold
                text-slate-800
                mb-5
              "
              >
                Register Employee
              </h2>

              <form onSubmit={handleRegisterEmployee}>
                <div
                  className="
                  grid
                  grid-cols-1
                  md:grid-cols-2
                  gap-5
                "
                >
                  {/* Name */}

                  <div>
                    <label
                      className="
                      block
                      text-sm
                      font-medium
                      text-slate-700
                      mb-1.5
                    "
                    >
                      Name
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter employee name"
                      className="
                        w-full
                        px-4
                        py-2.5
                        rounded-lg
                        border
                        border-slate-300
                        outline-none
                        focus:ring-2
                        focus:ring-blue-500
                        focus:border-blue-500
                      "
                    />
                  </div>

                  {/* Email */}

                  <div>
                    <label
                      className="
                      block
                      text-sm
                      font-medium
                      text-slate-700
                      mb-1.5
                    "
                    >
                      Email
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="employee@example.com"
                      className="
                        w-full
                        px-4
                        py-2.5
                        rounded-lg
                        border
                        border-slate-300
                        outline-none
                        focus:ring-2
                        focus:ring-blue-500
                        focus:border-blue-500
                      "
                    />
                  </div>

                  {/* Password */}

                  {/* Password */}
                  <div>
                    <label
                      className="
      block
      text-sm
      font-medium
      text-slate-700
      mb-1.5
    "
                    >
                      Password
                    </label>

                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        className="
        w-full
        px-4
        py-2.5
        pr-11
        rounded-lg
        border
        border-slate-300
        outline-none
        focus:ring-2
        focus:ring-blue-500
        focus:border-blue-500
      "
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="
        absolute
        right-3
        top-1/2
        -translate-y-1/2
        text-slate-500
        hover:text-slate-700
        focus:outline-none
      "
                        aria-label={
                          showPassword ? 'Hide password' : 'Show password'
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label
                      className="
      block
      text-sm
      font-medium
      text-slate-700
      mb-1.5
    "
                    >
                      Confirm Password
                    </label>

                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        className="
        w-full
        px-4
        py-2.5
        pr-11
        rounded-lg
        border
        border-slate-300
        outline-none
        focus:ring-2
        focus:ring-blue-500
        focus:border-blue-500
      "
                      />

                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="
        absolute
        right-3
        top-1/2
        -translate-y-1/2
        text-slate-500
        hover:text-slate-700
        focus:outline-none
      "
                        aria-label={
                          showConfirmPassword
                            ? 'Hide confirm password'
                            : 'Show confirm password'
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </button>
                    </div>
                  </div>
                  {/* Date of Birth */}

                  <div>
                    <label
                      className="
                      block
                      text-sm
                      font-medium
                      text-slate-700
                      mb-1.5
                    "
                    >
                      Date of Joining
                    </label>

                    <input
                      type="date"
                      name="dateOfJoining"
                      value={dateOfJoining}
                      onChange={(e) => setDateOfJoining(e.target.value)}
                      className="
                        w-full
                        px-4
                        py-2.5
                        rounded-lg
                        border
                        border-slate-300
                        outline-none
                        focus:ring-2
                        focus:ring-blue-500
                        focus:border-blue-500
                      "
                    />
                  </div>
                </div>

                {/* Messages */}

                {errorMessage && (
                  <div
                    className="
                    mt-5
                    px-4
                    py-3
                    rounded-lg
                    bg-red-50
                    border
                    border-red-200
                    text-red-600
                    text-sm
                  "
                  >
                    {errorMessage}
                  </div>
                )}

                {successMessage && (
                  <div
                    className="
                    mt-5
                    px-4
                    py-3
                    rounded-lg
                    bg-green-50
                    border
                    border-green-200
                    text-green-600
                    text-sm
                  "
                  >
                    {successMessage}
                  </div>
                )}

                {/* Submit */}

                <div
                  className="
                  mt-6
                  flex
                  flex-col-reverse
                  gap-2
                  sm:flex-row
                  sm:justify-end
                "
                >
                  <button
                    type="submit"
                    disabled={loading}
                    className="
                      w-full
                      px-6
                      py-2.5
                      rounded-lg
                      bg-blue-600
                      sm:w-auto
                      text-white
                      font-medium
                      hover:bg-blue-700
                      disabled:opacity-50
                      disabled:cursor-not-allowed
                      transition
                    "
                  >
                    {loading ? 'Registering...' : 'Register Employee'}
                  </button>
                </div>
              </form>
            </div>
            {/* ==================================
                EMPLOYEE TABLE
            ================================== */}
            <div
              className="
    w-full
    overflow-hidden
    rounded-2xl
    border
    border-slate-200
    bg-white
    shadow-sm
  "
            >
              {/* Table Header */}
              <div
                className="
      flex
      flex-col
      gap-2
      border-b
      border-slate-200
      px-5
      py-5
      sm:flex-row
      sm:items-center
      sm:justify-between
      sm:px-6
    "
              >
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    Registered Employees
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    View registered employee details.
                  </p>
                </div>

                <span
                  className="
        w-fit
        rounded-full
        bg-blue-50
        px-3
        py-1
        text-xs
        font-semibold
        text-blue-600
      "
                >
                  {employees.length} employee
                  {employees.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Responsive Table */}

              {employeeUpdateError && (
                <div
                  className="
      mb-4
      rounded-lg
      border
      border-red-200
      bg-red-50
      px-4
      py-3
      text-sm
      text-red-600
    "
                >
                  {employeeUpdateError}
                </div>
              )}
              <div className="w-full overflow-x-auto overscroll-x-contain">
                <table className="w-full min-w-200 text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-3 py-3 sm:px-5 sm:py-4 text-left font-semibold text-slate-600">
                        Name
                      </th>

                      <th className="px-3 py-3 sm:px-5 sm:py-4 text-left font-semibold text-slate-600">
                        Email
                      </th>

                      <th className="px-3 py-3 sm:px-5 sm:py-4 text-left font-semibold text-slate-600">
                        Date of Joining
                      </th>

                      <th className="px-3 py-3 sm:px-5 sm:py-4 text-left font-semibold text-slate-600">
                        Reset Password
                      </th>

                      <th className="px-3 py-3 sm:px-5 sm:py-4 text-left font-semibold text-slate-600">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {employees.map((employee) => {
                      const isEditing =
                        String(editingEmployeeId) === String(employee._id);

                      return (
                        <tr
                          key={employee._id}
                          className="transition hover:bg-slate-50"
                        >
                          {/* ==================================================
          NAME
      =================================================== */}

                          <td className="px-3 py-3 sm:px-5 sm:py-4">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editingEmployeeData.name}
                                onChange={(e) =>
                                  handleEmployeeEditChange(
                                    'name',
                                    e.target.value,
                                  )
                                }
                                className="
              h-10
              w-full
              min-w-45
              rounded-lg
              border
              border-slate-300
              bg-white
              px-3
              text-sm
              text-slate-800
              outline-none
              focus:border-blue-500
              focus:ring-2
              focus:ring-blue-100
            "
                              />
                            ) : (
                              <span className="font-medium text-slate-800">
                                {employee.name || 'N/A'}
                              </span>
                            )}
                          </td>

                          {/* ==================================================
          EMAIL
      =================================================== */}

                          <td className="px-3 py-3 sm:px-5 sm:py-4">
                            {isEditing ? (
                              <input
                                type="email"
                                value={editingEmployeeData.email}
                                onChange={(e) =>
                                  handleEmployeeEditChange(
                                    'email',
                                    e.target.value,
                                  )
                                }
                                className="
              h-10
              w-full
              <min-w-55></min-w-55>
              rounded-lg
              border
              border-slate-300
              bg-white
              px-3
              text-sm
              text-slate-800
              outline-none
              focus:border-blue-500
              focus:ring-2
              focus:ring-blue-100
            "
                              />
                            ) : (
                              <span className="text-slate-600">
                                {employee.email || 'N/A'}
                              </span>
                            )}
                          </td>

                          {/* ==================================================
          DATE OF JOINING
      =================================================== */}

                          <td className="px-3 py-3 sm:px-5 sm:py-4">
                            {isEditing ? (
                              <input
                                type="date"
                                value={editingEmployeeData.dateOfJoining}
                                onChange={(e) =>
                                  handleEmployeeEditChange(
                                    'dateOfJoining',
                                    e.target.value,
                                  )
                                }
                                className="
              h-10
              w-full
              min-w-42.5
              rounded-lg
              border
              border-slate-300
              bg-white
              px-3
              text-sm
              text-slate-800
              outline-none
              focus:border-blue-500
              focus:ring-2
              focus:ring-blue-100
            "
                              />
                            ) : (
                              <span className="text-slate-600">
                                {employee.dateOfJoining
                                  ? new Date(
                                      employee.dateOfJoining,
                                    ).toLocaleDateString()
                                  : 'N/A'}
                              </span>
                            )}
                          </td>

                          {/* ==================================================
          RESET PASSWORD
          DO NOT CHANGE THIS BUTTON
      =================================================== */}

                          <td className="px-3 py-3 sm:px-5 sm:py-4">
                            <button
                              type="button"
                              onClick={() => handleOpenResetPassword(employee)}
                              className="
            rounded-lg
            bg-blue-600
            px-4
            py-2
            text-sm
            font-medium
            text-white
            transition
            hover:bg-blue-700
            focus:outline-none
            focus:ring-2
            focus:ring-blue-200
          "
                            >
                              Reset Password
                            </button>
                          </td>

                          {/* ==================================================
          EDIT / SAVE / CANCEL
      =================================================== */}

                          <td className="px-3 py-3 sm:px-5 sm:py-4">
                            {isEditing ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSaveEmployee(employee._id)
                                  }
                                  disabled={employeeUpdateLoading}
                                  className="
                rounded-lg
                bg-green-600
                px-4
                py-2
                text-sm
                font-medium
                text-white
                transition
                hover:bg-green-700
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
                                >
                                  {employeeUpdateLoading ? 'Saving...' : 'Save'}
                                </button>

                                <button
                                  type="button"
                                  onClick={handleCancelEditEmployee}
                                  disabled={employeeUpdateLoading}
                                  className="
                rounded-lg
                bg-slate-100
                px-4
                py-2
                text-sm
                font-medium
                text-slate-700
                transition
                hover:bg-slate-200
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  handleStartEditEmployee(employee)
                                }
                                className="
              rounded-lg
              border
              border-slate-300
              bg-white
              px-4
              py-2
              text-sm
              font-medium
              text-slate-700
              transition
              hover:bg-slate-50
              hover:border-blue-400
              hover:text-blue-600
            "
                              >
                                Edit
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {showResetPassword && selectedEmployee && (
                  <div
                    className="
      fixed
      inset-0
      z-50
      flex
      items-center
      justify-center
      bg-black/50
      p-4
    "
                  >
                    <div
                      className="
        w-full
        max-w-md
        rounded-xl
        bg-white
        p-6
        shadow-2xl
      "
                    >
                      {/* Header */}
                      <div className="mb-5">
                        <h3 className="text-xl font-semibold text-slate-800">
                          Reset Password
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          Set a new password for{' '}
                          <span className="font-medium text-slate-700">
                            {selectedEmployee.name}
                          </span>
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {selectedEmployee.email}
                        </p>
                      </div>

                      {/* New Password */}
                      <div className="mb-4">
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          New Password
                        </label>

                        <div className="relative">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="
        h-12
        w-full
        rounded-lg
        border
        border-slate-300
        px-4
        pr-12
        text-sm
        text-slate-800
        outline-none
        focus:border-blue-500
        focus:ring-2
        focus:ring-blue-100
      "
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setShowNewPassword((previous) => !previous)
                            }
                            className="
        absolute
        right-0
        top-0
        flex
        h-12
        w-12
        items-center
        justify-center
        rounded-r-lg
        text-slate-500
        transition
        hover:bg-slate-50
        hover:text-slate-700
        focus:outline-none
        focus:ring-2
        focus:ring-blue-100
      "
                            aria-label={
                              showNewPassword
                                ? 'Hide new password'
                                : 'Show new password'
                            }
                          >
                            {showNewPassword ? (
                              <EyeOff size={19} />
                            ) : (
                              <Eye size={19} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Confirm Password */}
                      <div className="mb-4">
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Confirm New Password
                        </label>

                        <div className="relative">
                          <input
                            type={showConfirmNewPassword ? 'text' : 'password'}
                            value={confirmNewPassword}
                            onChange={(e) =>
                              setConfirmNewPassword(e.target.value)
                            }
                            placeholder="Confirm new password"
                            className="
        h-12
        w-full
        rounded-lg
        border
        border-slate-300
        px-4
        pr-12
        text-sm
        text-slate-800
        outline-none
        focus:border-blue-500
        focus:ring-2
        focus:ring-blue-100
      "
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmNewPassword((previous) => !previous)
                            }
                            className="
        absolute
        right-0
        top-0
        flex
        h-12
        w-12
        items-center
        justify-center
        rounded-r-lg
        text-slate-500
        transition
        hover:bg-slate-50
        hover:text-slate-700
        focus:outline-none
        focus:ring-2
        focus:ring-blue-100
      "
                            aria-label={
                              showConfirmNewPassword
                                ? 'Hide confirm password'
                                : 'Show confirm password'
                            }
                          >
                            {showConfirmNewPassword ? (
                              <EyeOff size={19} />
                            ) : (
                              <Eye size={19} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Error */}
                      {resetPasswordError && (
                        <div
                          className="
            mb-4
            rounded-lg
            border
            border-red-200
            bg-red-50
            px-4
            py-3
            text-sm
            text-red-600
          "
                        >
                          {resetPasswordError}
                        </div>
                      )}

                      {/* Success */}
                      {resetPasswordSuccess && (
                        <div
                          className="
            mb-4
            rounded-lg
            border
            border-green-200
            bg-green-50
            px-4
            py-3
            text-sm
            text-green-600
          "
                        >
                          {resetPasswordSuccess}
                        </div>
                      )}

                      {/* Buttons */}
                      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
                        <button
                          type="button"
                          onClick={handleCloseResetPassword}
                          disabled={resetPasswordLoading}
                          className="
            w-full
            rounded-lg
            bg-slate-100
            px-5
            sm:w-auto
            py-2.5
            text-sm
            font-medium
            text-slate-700
            hover:bg-slate-200
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          onClick={handleResetPassword}
                          disabled={resetPasswordLoading}
                          className="
            w-full
            rounded-lg
            bg-blue-600
            px-5
            sm:w-auto
            py-2.5
            text-sm
            font-medium
            text-white
            hover:bg-blue-700
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
                        >
                          {resetPasswordLoading
                            ? 'Resetting...'
                            : 'Reset Password'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>{' '}
          </div>
        )}

        {activeTab === 'clients' && (
          <div className="mx-auto w-full min-w-0 max-w-7xl">
            {/* ==========================================
        PAGE HEADER
    ========================================== */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
                Clients
              </h1>

              <p className="mt-1 text-sm text-slate-500 sm:text-base">
                Create clients and assign them to one or multiple employees.
              </p>
            </div>

            {/* ==========================================
        ADD NEW CLIENT
    ========================================== */}
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-slate-800">
                  Add New Client
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Add a new client to your CRM.
                </p>
              </div>

              <form onSubmit={handleCreateClient}>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                  {/* Client Name */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Client Name
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={clientForm.name}
                      onChange={handleClientFormChange}
                      placeholder="Enter client name"
                      className="
                w-full
                rounded-lg
                border border-slate-300
                px-4 py-2.5
                text-sm
                outline-none
                transition
                focus:border-blue-500
                focus:ring-2
                focus:ring-blue-100
              "
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Email
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={clientForm.email}
                      onChange={handleClientFormChange}
                      placeholder="client@example.com"
                      className="
                w-full
                rounded-lg
                border border-slate-300
                px-4 py-2.5
                text-sm
                outline-none
                transition
                focus:border-blue-500
                focus:ring-2
                focus:ring-blue-100
              "
                    />
                  </div>

                  {/* Company */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Company
                    </label>

                    <input
                      type="text"
                      name="company"
                      value={clientForm.company}
                      onChange={handleClientFormChange}
                      placeholder="Enter company name"
                      className="
                w-full
                rounded-lg
                border border-slate-300
                px-4 py-2.5
                text-sm
                outline-none
                transition
                focus:border-blue-500
                focus:ring-2
                focus:ring-blue-100
              "
                    />
                  </div>
                </div>

                {/* Error */}
                {clientError && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {clientError}
                  </div>
                )}

                {/* Success */}
                {clientMessage && (
                  <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">
                    {clientMessage}
                  </div>
                )}

                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="submit"
                    disabled={creatingClient}
                    className="
              w-full
              rounded-lg
              bg-blue-600
              px-6 py-2.5
              sm:w-auto
              text-sm
              font-semibold
              text-white
              shadow-sm
              transition
              hover:bg-blue-700
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
                  >
                    {creatingClient ? 'Adding Client...' : 'Add Client'}
                  </button>
                </div>
              </form>
            </div>

            {/* ==========================================
        ASSIGN CLIENT
    ========================================== */}
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-slate-800">
                  Assign Client
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Assign one client to one or multiple employees.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {/* ================= CLIENT SELECT ================= */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Select Client
                  </label>

                  <select
                    value={selectedClient}
                    onChange={(e) => {
                      const clientId = e.target.value;

                      setSelectedClient(clientId);

                      const selectedClientData = clients.find(
                        (client) => String(client._id) === String(clientId),
                      );

                      if (
                        selectedClientData &&
                        Array.isArray(selectedClientData.assignedTo)
                      ) {
                        setSelectedEmployees(
                          selectedClientData.assignedTo.map((employee) =>
                            String(employee._id || employee),
                          ),
                        );
                      } else {
                        setSelectedEmployees([]);
                      }
                    }}
                    className="
              w-full
              rounded-lg
              border border-slate-300
              bg-white
              px-4 py-2.5
              text-sm
              text-slate-700
              outline-none
              focus:border-blue-500
              focus:ring-2
              focus:ring-blue-100
            "
                  >
                    <option value="">-- Select Client --</option>

                    {clients.map((client) => (
                      <option key={client._id} value={client._id}>
                        {client.name}
                        {client.company ? ` - ${client.company}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ================= EMPLOYEES ================= */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Assign To Employee(s)
                  </label>

                  <div
                    className="
            max-h-60
            overflow-y-auto
            rounded-lg
            border border-slate-300
            bg-white
            p-2
          "
                  >
                    {employees.length === 0 ? (
                      <p className="px-3 py-3 text-sm text-slate-500">
                        No employees available.
                      </p>
                    ) : (
                      employees.map((employee) => {
                        const employeeId = String(employee._id);

                        const isChecked =
                          selectedEmployees.includes(employeeId);

                        return (
                          <label
                            key={employee._id}
                            className={`
                      flex
                      cursor-pointer
                      items-center
                      gap-3
                      rounded-lg
                      px-3
                      py-3
                      transition
                      ${isChecked ? 'bg-blue-50' : 'hover:bg-slate-50'}
                    `}
                          >
                            <input
                              type="checkbox"
                              value={employeeId}
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedEmployees((prev) => [
                                    ...prev,
                                    employeeId,
                                  ]);
                                } else {
                                  setSelectedEmployees((prev) =>
                                    prev.filter((id) => id !== employeeId),
                                  );
                                }
                              }}
                              className="
                        h-4 w-4
                        rounded
                        border-slate-300
                        text-blue-600
                        focus:ring-blue-500
                      "
                            />

                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-700">
                                {employee.name}
                              </p>

                              <p className="text-xs text-slate-400">
                                {employee.email}
                              </p>
                            </div>

                            {isChecked && (
                              <span className="ml-auto text-xs font-semibold text-blue-600">
                                Selected
                              </span>
                            )}
                          </label>
                        );
                      })
                    )}
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    {selectedEmployees.length} employee
                    {selectedEmployees.length !== 1 ? 's' : ''} selected
                  </p>
                </div>
              </div>

              {/* Assign button */}
              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleAssignClient}
                  disabled={!selectedClient || selectedEmployees.length === 0}
                  className="
            rounded-lg
            bg-emerald-600
            px-6 py-2.5
            text-sm
            font-semibold
            text-white
            shadow-sm
            transition
            hover:bg-emerald-700
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
                >
                  Assign Client
                </button>
              </div>
            </div>

            {/* ==========================================
        CLIENT TABLE
    ========================================== */}
            <div
              className="
      overflow-hidden
      rounded-2xl
      border border-slate-200
      bg-white
      shadow-sm
    "
            >
              {/* Table header */}
              <div
                className="
        flex
        flex-col
        gap-2
        border-b border-slate-200
        px-5 py-5
        sm:flex-row
        sm:items-center
        sm:justify-between
        sm:px-6
      "
              >
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    All Clients
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    View clients and their employee assignments.
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
                  {clients.length} client
                  {clients.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Table */}
              <div className="overflow-x-auto overscroll-x-contain">
                <table className="w-full min-w-212.5 text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-3 py-3 sm:px-5 sm:py-4 text-left font-semibold text-slate-600">
                        Client
                      </th>

                      <th className="px-3 py-3 sm:px-5 sm:py-4 text-left font-semibold text-slate-600">
                        Email
                      </th>

                      <th className="px-3 py-3 sm:px-5 sm:py-4 text-left font-semibold text-slate-600">
                        Company
                      </th>

                      <th className="px-3 py-3 sm:px-5 sm:py-4 text-left font-semibold text-slate-600">
                        Assigned To
                      </th>

                      <th className="px-3 py-3 sm:px-5 sm:py-4 text-left font-semibold text-slate-600">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {clients.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="
                    px-6
                    py-12
                    text-center
                    text-slate-500
                  "
                        >
                          No clients available.
                        </td>
                      </tr>
                    ) : (
                      clients.map((client) => (
                        <tr
                          key={client._id}
                          className="transition hover:bg-slate-50"
                        >
                          {/* Client */}
                          <td className="px-3 py-3 sm:px-5 sm:py-4 font-medium text-slate-800">
                            {client.name || 'N/A'}
                          </td>

                          {/* Email */}
                          <td className="px-3 py-3 sm:px-5 sm:py-4 text-slate-600">
                            {client.email || 'N/A'}
                          </td>

                          {/* Company */}
                          <td className="px-3 py-3 sm:px-5 sm:py-4 text-slate-600">
                            {client.company || 'N/A'}
                          </td>

                          {/* Assigned Employees */}
                          <td className="px-3 py-3 sm:px-5 sm:py-4">
                            {Array.isArray(client.assignedTo) &&
                            client.assignedTo.length > 0 ? (
                              <div
                                className="
                        flex
                        max-w-md
                        flex-wrap
                        gap-1.5
                      "
                              >
                                {client.assignedTo.map((employee) => (
                                  <span
                                    key={employee._id}
                                    className="
                                rounded-full
                                bg-blue-50
                                px-2.5 py-1
                                text-xs
                                font-medium
                                text-blue-700
                              "
                                  >
                                    {employee.name || 'Unknown'}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400">Unassigned</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-3 py-3 sm:px-5 sm:py-4">
                            {Array.isArray(client.assignedTo) &&
                            client.assignedTo.length > 0 ? (
                              <span
                                className="
                        rounded-full
                        bg-green-100
                        px-3 py-1
                        text-xs
                        font-semibold
                        text-green-700
                      "
                              >
                                Assigned
                              </span>
                            ) : (
                              <span
                                className="
                        rounded-full
                        bg-orange-100
                        px-3 py-1
                        text-xs
                        font-semibold
                        text-orange-700
                      "
                              >
                                Available
                              </span>
                            )}
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

        {activeTab === 'allTasks' && (
          <div className="mx-auto w-full min-w-0 max-w-7xl">
            {/* Header */}
            <div className="mb-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
                    All Tasks
                  </h1>

                  <p className="mt-1 text-sm text-slate-500">
                    View and manage every task in the system.
                  </p>
                </div>

                <span
                  className="
            w-fit
            rounded-full
            bg-blue-50
            px-3
            py-1
            text-xs
            font-semibold
            text-blue-600
          "
                >
                  {adminTasks.length} task
                  {adminTasks.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Table */}
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
              <div className="overflow-x-auto overscroll-x-contain">
                <table className="w-full min-w-350 text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-5 py-4 text-left font-semibold text-slate-600">
                        Title
                      </th>

                      <th className="px-5 py-4 text-left font-semibold text-slate-600">
                        Assigned By
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

                      <th className="px-5 py-4 text-left font-semibold text-slate-600">
                        Time Taken
                      </th>

                      <th className="px-5 py-4 text-left font-semibold text-slate-600">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {loadingTasks ? (
                      <tr>
                        <td
                          colSpan={10}
                          className="px-3 py-10 sm:px-6 sm:py-12 text-center text-slate-500"
                        >
                          Loading tasks...
                        </td>
                      </tr>
                    ) : adminTasks.length === 0 ? (
                      <tr>
                        <td
                          colSpan={10}
                          className="px-3 py-10 sm:px-6 sm:py-12 text-center text-slate-500"
                        >
                          No tasks found.
                        </td>
                      </tr>
                    ) : (
                      adminTasks.map((task) => (
                        <tr
                          key={task._id}
                          className="transition hover:bg-slate-50"
                        >
                          {/* TITLE */}
                          <td className="px-5 py-4 font-medium text-slate-800">
                            {task.title || 'No title'}
                          </td>

                          {/* ASSIGNED BY */}
                          <td className="px-5 py-4 text-slate-600">
                            {task.assignedBy?.name || 'Unknown'}
                          </td>

                          {/* ASSIGNED TO */}
                          <td className="px-5 py-4 text-slate-600">
                            {task.assignedTo?.name || 'Unknown'}
                          </td>

                          {/* DUE DATE */}
                          <td className="px-5 py-4 text-slate-600">
                            {task.dueDate
                              ? new Date(task.dueDate).toLocaleDateString()
                              : 'N/A'}
                          </td>

                          {/* STATUS */}
                          <td className="px-5 py-4">
                            <span
                              className={`
                        rounded-full
                        px-3
                        py-1
                        text-xs
                        font-semibold
                        ${
                          task.status === 'Not Started'
                            ? 'bg-orange-100 text-orange-700'
                            : task.status === 'In Progress'
                              ? 'bg-blue-100 text-blue-700'
                              : task.status === 'Completed'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-slate-100 text-slate-600'
                        }
                      `}
                            >
                              {task.status || 'Not Started'}
                            </span>
                          </td>

                          {/* PRIORITY */}

                          {/* CLIENT */}
                          <td className="px-5 py-4 text-slate-600">
                            {task.client?.name || 'No client'}
                          </td>

                          {/* REMARKS */}
                          <td className="max-w-65 px-3 py-4 sm:px-5 text-slate-600">
                            <div className="line-clamp-2">
                              {task.remarks || 'No remarks'}
                            </div>
                          </td>

                          {/* TIME */}
                          <td className="px-5 py-4 text-slate-600">
                            {task.status === 'Completed'
                              ? `${task.totalHours ?? 0}h ${
                                  task.totalMinutes ?? 0
                                }m`
                              : '—'}
                          </td>

                          {/* DELETE */}
                          <td className="px-5 py-4">
                            <button
                              type="button"
                              disabled={deletingTaskId === task._id}
                              onClick={() => handleDeleteTask(task._id)}
                              className="
                        rounded-lg
                        bg-red-50
                        px-3
                        py-2
                        text-xs
                        font-semibold
                        text-red-600
                        transition
                        hover:bg-red-100
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                      "
                            >
                              {deletingTaskId === task._id
                                ? 'Deleting...'
                                : 'Delete'}
                            </button>
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

        {activeTab === 'employeePerformance' && (
          <div className="mx-auto w-full min-w-0 max-w-7xl">
            {/* ==========================================
        HEADER
    ========================================== */}

            <div className="mb-6">
              <div
                className="
        flex
        flex-col
        gap-3
        sm:flex-row
        sm:items-center
        sm:justify-between
      "
              >
                <div>
                  <h1
                    className="
            text-2xl
            font-bold
            text-slate-800
            sm:text-3xl
          "
                  >
                    Employee Performance
                  </h1>

                  <p
                    className="
            mt-1
            text-sm
            text-slate-500
            sm:text-base
          "
                  >
                    Monitor completed tasks and total time spent by each
                    employee.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={fetchEmployeePerformance}
                  disabled={loadingPerformance}
                  className="
            w-fit
            rounded-lg
            border
            border-slate-300
            bg-white
            px-4
            py-2.5
            text-sm
            font-medium
            text-slate-600
            shadow-sm
            transition
            hover:bg-slate-50
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
                >
                  {loadingPerformance ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>

            {/* ==========================================
        SUMMARY CARDS
    ========================================== */}

            <div
              className="
      mb-6
      grid
      grid-cols-1
      gap-4
      sm:grid-cols-2
      lg:grid-cols-3
    "
            >
              {/* Employees */}
              <div
                className="
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-5
        shadow-sm
        sm:p-6
      "
              >
                <div
                  className="
          flex
          items-center
          justify-between
        "
                >
                  <div>
                    <p
                      className="
              text-sm
              font-medium
              text-slate-500
            "
                    >
                      Total Employees
                    </p>

                    <p
                      className="
              mt-2
              text-3xl
              font-bold
              text-slate-800
            "
                    >
                      {employeePerformance.length}
                    </p>
                  </div>

                  <div
                    className="
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-xl
            bg-blue-50
            text-xl
          "
                  >
                    👥
                  </div>
                </div>
              </div>

              {/* Completed Tasks */}
              <div
                className="
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-5
        shadow-sm
        sm:p-6
      "
              >
                <div
                  className="
          flex
          items-center
          justify-between
        "
                >
                  <div>
                    <p
                      className="
              text-sm
              font-medium
              text-slate-500
            "
                    >
                      Completed Tasks
                    </p>

                    <p
                      className="
              mt-2
              text-3xl
              font-bold
              text-slate-800
            "
                    >
                      {employeePerformance.reduce(
                        (total, employee) =>
                          total + Number(employee.completedTasks || 0),
                        0,
                      )}
                    </p>
                  </div>

                  <div
                    className="
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-xl
            bg-green-50
            text-xl
            text-green-600
          "
                  >
                    ✓
                  </div>
                </div>
              </div>

              {/* Total Time */}
              <div
                className="
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-5
        shadow-sm
        sm:p-6
      "
              >
                <div
                  className="
          flex
          items-center
          justify-between
        "
                >
                  <div>
                    <p
                      className="
              text-sm
              font-medium
              text-slate-500
            "
                    >
                      Total Time Spent
                    </p>

                    <p
                      className="
              mt-2
              text-3xl
              font-bold
              text-slate-800
            "
                    >
                      {(() => {
                        const totalMinutes = employeePerformance.reduce(
                          (total, employee) =>
                            total + Number(employee.totalMinutesSpent || 0),
                          0,
                        );

                        return `${Math.floor(
                          totalMinutes / 60,
                        )}h ${totalMinutes % 60}m`;
                      })()}
                    </p>
                  </div>

                  <div
                    className="
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-xl
            bg-purple-50
            text-xl
          "
                  >
                    ⏱
                  </div>
                </div>
              </div>
            </div>

            {/* ==========================================
        PERFORMANCE TABLE
    ========================================== */}

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
              {/* Table Header */}

              <div
                className="
        flex
        flex-col
        gap-2
        border-b
        border-slate-200
        px-5
        py-5
        sm:flex-row
        sm:items-center
        sm:justify-between
        sm:px-6
      "
              >
                <div>
                  <h2
                    className="
            text-lg
            font-semibold
            text-slate-800
          "
                  >
                    Employee Performance
                  </h2>

                  <p
                    className="
            mt-1
            text-sm
            text-slate-500
          "
                  >
                    Summary of completed work and time spent.
                  </p>
                </div>

                <span
                  className="
          w-fit
          rounded-full
          bg-blue-50
          px-3
          py-1
          text-xs
          font-semibold
          text-blue-600
        "
                >
                  {employeePerformance.length} employees
                </span>
              </div>

              {/* Responsive Table */}

              <div className="overflow-x-auto overscroll-x-contain">
                <table
                  className="
          w-full
          min-w-237.5
          text-sm
        "
                >
                  <thead
                    className="
            border-b
            border-slate-200
            bg-slate-50
          "
                  >
                    <tr>
                      <th
                        className="
                px-6
                py-4
                text-left
                font-semibold
                text-slate-600
              "
                      >
                        Employee
                      </th>

                      <th
                        className="
                px-6
                py-4
                text-left
                font-semibold
                text-slate-600
              "
                      >
                        Email
                      </th>

                      <th
                        className="
                px-6
                py-4
                text-center
                font-semibold
                text-slate-600
              "
                      >
                        Completed Tasks
                      </th>

                      <th
                        className="
                px-6
                py-4
                text-center
                font-semibold
                text-slate-600
              "
                      >
                        Total Hours
                      </th>

                      <th
                        className="
                px-6
                py-4
                text-center
                font-semibold
                text-slate-600
              "
                      >
                        Total Minutes
                      </th>

                      <th
                        className="
                px-6
                py-4
                text-center
                font-semibold
                text-slate-600
              "
                      >
                        Total Time
                      </th>

                      <th
                        className="
                px-6
                py-4
                text-center
                font-semibold
                text-slate-600
              "
                      >
                        Avg. Time / Task
                      </th>
                    </tr>
                  </thead>

                  <tbody
                    className="
            divide-y
            divide-slate-100
          "
                  >
                    {loadingPerformance ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="
                    px-6
                    py-14
                    text-center
                    text-slate-500
                  "
                        >
                          Loading employee performance...
                        </td>
                      </tr>
                    ) : employeePerformance.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="
                    px-6
                    py-14
                    text-center
                    text-slate-500
                  "
                        >
                          No employee performance data available.
                        </td>
                      </tr>
                    ) : (
                      employeePerformance.map((employee) => (
                        <tr
                          key={employee.employeeId}
                          className="
                      transition
                      hover:bg-slate-50
                    "
                        >
                          {/* Employee */}

                          <td
                            className="
                      px-6
                      py-5
                    "
                          >
                            <div
                              className="
                        flex
                        items-center
                        gap-3
                      "
                            >
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
                          font-semibold
                          text-blue-600
                        "
                              >
                                {employee.name?.charAt(0)?.toUpperCase() || 'E'}
                              </div>

                              <div>
                                <p
                                  className="
                            font-semibold
                            text-slate-800
                          "
                                >
                                  {employee.name}
                                </p>

                                <p
                                  className="
                            text-xs
                            text-slate-400
                          "
                                >
                                  Employee
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Email */}

                          <td
                            className="
                      px-6
                      py-5
                      text-slate-600
                    "
                          >
                            {employee.email}
                          </td>

                          {/* Completed Tasks */}

                          <td
                            className="
                      px-6
                      py-5
                      text-center
                    "
                          >
                            <span
                              className="
                        inline-flex
                        min-w-12
                        items-center
                        justify-center
                        rounded-full
                        bg-green-50
                        px-3
                        py-1.5
                        font-semibold
                        text-green-700
                      "
                            >
                              {employee.completedTasks}
                            </span>
                          </td>

                          {/* Hours */}

                          <td
                            className="
                      px-6
                      py-5
                      text-center
                      font-semibold
                      text-slate-700
                    "
                          >
                            {employee.totalHours}h
                          </td>

                          {/* Minutes */}

                          <td
                            className="
                      px-6
                      py-5
                      text-center
                      font-semibold
                      text-slate-700
                    "
                          >
                            {employee.totalMinutes}m
                          </td>

                          {/* Total Time */}

                          <td
                            className="
                      px-6
                      py-5
                      text-center
                    "
                          >
                            <span
                              className="
                        inline-flex
                        rounded-lg
                        bg-blue-50
                        px-3
                        py-1.5
                        font-semibold
                        text-blue-700
                      "
                            >
                              {employee.totalHours}h {employee.totalMinutes}m
                            </span>
                          </td>

                          {/* Average */}

                          <td
                            className="
                      px-6
                      py-5
                      text-center
                      text-slate-600
                    "
                          >
                            {employee.averageTime}
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

        {activeTab === 'notifications' && (
          <div className="mx-auto w-full min-w-0 max-w-5xl">
            {/* Header */}

            <div className="mb-6">
              <div
                className="
        flex
        flex-col
        gap-3
        sm:flex-row
        sm:items-center
        sm:justify-between
      "
              >
                <div>
                  <h1
                    className="
            text-2xl
            font-bold
            text-slate-800
            sm:text-3xl
          "
                  >
                    Notifications
                  </h1>

                  <p
                    className="
            mt-1
            text-sm
            text-slate-500
          "
                  >
                    Important activity and security notifications.
                  </p>
                </div>

                <span
                  className="
          w-fit
          rounded-full
          bg-blue-50
          px-3
          py-1
          text-xs
          font-semibold
          text-blue-600
        "
                >
                  {unreadNotificationCount} unread
                </span>
              </div>
            </div>

            {/* Notifications */}

            {loadingNotifications ? (
              <div
                className="
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-10
        text-center
        text-slate-500
        shadow-sm
      "
              >
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div
                className="
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-10
        text-center
        shadow-sm
      "
              >
                <div
                  className="
          mx-auto
          mb-4
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-full
          bg-slate-100
          text-2xl
        "
                >
                  🔔
                </div>

                <h3
                  className="
          text-lg
          font-semibold
          text-slate-700
        "
                >
                  No notifications
                </h3>

                <p
                  className="
          mt-1
          text-sm
          text-slate-500
        "
                >
                  You don't have any notifications right now.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`
      rounded-2xl
      border
      bg-white
      p-4
      shadow-sm
      transition
      sm:p-5
      ${
        notification.isRead
          ? 'border-slate-200'
          : 'border-blue-200 bg-blue-50/30'
      }
    `}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div
                        className="
          flex
          h-11
          w-11
          shrink-0
          items-center
          justify-center
          rounded-full
          bg-blue-100
          text-lg
        "
                      >
                        {notification.type === 'password_changed' ? '🔐' : '🔔'}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        {/* Header */}
                        <div
                          className="
            flex
            flex-col
            gap-2
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
                        >
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-slate-800">
                              {notification.type === 'password_changed'
                                ? 'Password Changed'
                                : 'Notification'}
                            </h4>

                            {!notification.isRead && (
                              <span
                                className="
                  rounded-full
                  bg-blue-100
                  px-2.5
                  py-1
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-wide
                  text-blue-700
                "
                              >
                                New
                              </span>
                            )}
                          </div>

                          {/* DELETE BUTTON */}
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteNotification(notification._id)
                            }
                            className="
              self-start
              rounded-lg
              px-3
              py-1.5
              text-xs
              font-semibold
              text-red-600
              transition
              hover:bg-red-50
              hover:text-red-700
              sm:self-auto
            "
                          >
                            Delete
                          </button>
                        </div>

                        {/* Message */}
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

                        {/* Metadata */}
                        <div
                          className="
            mt-2
            flex
            flex-col
            gap-1
            text-xs
            text-slate-400
            sm:flex-row
            sm:items-center
            sm:gap-3
          "
                        >
                          {notification.sender?.name && (
                            <span>Employee: {notification.sender.name}</span>
                          )}

                          <span>
                            {notification.createdAt
                              ? new Date(
                                  notification.createdAt,
                                ).toLocaleString()
                              : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
