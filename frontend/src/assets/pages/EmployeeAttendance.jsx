import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5005';

const STATUS_CONFIG = {
  WFO: {
    label: 'Work From Office',
    short: 'WFO',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },

  WFH: {
    label: 'Work From Home',
    short: 'WFH',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
  },

  LEAVE: {
    label: 'Leave',
    short: 'Leave',
    className: 'bg-rose-100 text-rose-700 border-rose-200',
  },
};

const getToken = () => localStorage.getItem('accessToken');

const authConfig = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`,
  },
});

const getDateKey = (date) => {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, '0');

  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const getTodayKey = () => getDateKey(new Date());

const formatMonth = (date) =>
  date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

const getMonthKey = (date) => {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, '0');

  return `${year}-${month}`;
};

const getDaysInMonth = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();

  const totalDays = new Date(year, month + 1, 0).getDate();

  return Array.from(
    { length: totalDays },
    (_, index) => new Date(year, month, index + 1),
  );
};

const formatDate = (dateKey) => {
  if (!dateKey) return '';

  const [year, month, day] = dateKey.split('-');

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
  ).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const isDateInRange = (dateKey, startDate, endDate) => {
  return dateKey >= startDate && dateKey <= endDate;
};

export default function EmployeeAttendance() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [attendance, setAttendance] = useState([]);

  const [leaveRequests, setLeaveRequests] = useState([]);
  const [wfhRequests, setWfhRequests] = useState([]);

  const [loading, setLoading] = useState(true);

  const [savingDate, setSavingDate] = useState(null);

  const [error, setError] = useState('');

  const [success, setSuccess] = useState('');

  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const [showWfhModal, setShowWfhModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [selectedDate, setSelectedDate] = useState('');

  const [wfhStartDate, setWfhStartDate] = useState('');
  const [wfhEndDate, setWfhEndDate] = useState('');
  const [wfhReason, setWfhReason] = useState('');
  const [submittingWfh, setSubmittingWfh] = useState(false);

  // const [wfhRequests, setWfhRequests] = useState([]);

  const [leaveStartDate, setLeaveStartDate] = useState('');

  const [leaveEndDate, setLeaveEndDate] = useState('');

  const [leaveReason, setLeaveReason] = useState('');

  const [submittingLeave, setSubmittingLeave] = useState(false);

  const [leaveForm, setLeaveForm] = useState({
    startDate: '',
    endDate: '',
    reason: '',
  });

  /*
  |--------------------------------------------------------------------------
  | LOAD MONTH
  |--------------------------------------------------------------------------
  */

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError('');

      const month = getMonthKey(currentMonth);

      const response = await axios.get(`${API_BASE}/api/attendance/my`, {
        ...authConfig(),
        params: {
          month,
        },
      });

      setAttendance(
        Array.isArray(response.data?.attendance)
          ? response.data.attendance
          : [],
      );

      setLeaveRequests(
        Array.isArray(response.data?.leaveRequests)
          ? response.data.leaveRequests
          : [],
      );

      setWfhRequests(
        Array.isArray(response.data?.wfhRequests)
          ? response.data.wfhRequests
          : [],
      );
    } catch (err) {
      console.error('Attendance loading error:', err);

      setError(err.response?.data?.message || 'Unable to load attendance.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [currentMonth]);

  /*
  |--------------------------------------------------------------------------
  | DAYS
  |--------------------------------------------------------------------------
  */

  const days = useMemo(() => getDaysInMonth(currentMonth), [currentMonth]);

  /*
  |--------------------------------------------------------------------------
  | ATTENDANCE MAP
  |--------------------------------------------------------------------------
  */

  const attendanceMap = useMemo(() => {
    const map = {};

    attendance.forEach((item) => {
      map[item.dateKey] = item.status;
    });

    return map;
  }, [attendance]);

  /*
  |--------------------------------------------------------------------------
  | LEAVE REQUEST MAP
  |--------------------------------------------------------------------------
  */

  const getLeaveRequestForDate = (dateKey) => {
    return leaveRequests.find((request) =>
      isDateInRange(dateKey, request.startDate, request.endDate),
    );
  };

  /*
  |--------------------------------------------------------------------------
  | MARK WFO / WFH
  |--------------------------------------------------------------------------
  */

  const getWfhRequestForDate = (dateKey) => {
    return wfhRequests.find((request) =>
      isDateInRange(dateKey, request.startDate, request.endDate),
    );
  };

  const getActiveRequestForDate = (dateKey) => {
    const leaveRequest = getLeaveRequestForDate(dateKey);
    const wfhRequest = getWfhRequestForDate(dateKey);

    if (leaveRequest && ['PENDING', 'APPROVED'].includes(leaveRequest.status)) {
      return {
        type: 'LEAVE',
        request: leaveRequest,
      };
    }

    if (wfhRequest && ['PENDING', 'APPROVED'].includes(wfhRequest.status)) {
      return {
        type: 'WFH',
        request: wfhRequest,
      };
    }

    return null;
  };

  const handleAttendanceChange = async (dateKey, status) => {
    try {
      setSavingDate(dateKey);
      setError('');
      setSuccess('');

      const response = await axios.put(
        `${API_BASE}/api/attendance/my`,
        {
          dateKey,
          status,
        },
        authConfig(),
      );

      const updated = response.data?.attendance;

      if (updated) {
        setAttendance((prev) => {
          const exists = prev.some((item) => item.dateKey === dateKey);

          if (exists) {
            return prev.map((item) =>
              item.dateKey === dateKey ? updated : item,
            );
          }

          return [...prev, updated];
        });
      }

      setSuccess(
        status === 'WFO'
          ? 'Marked as Work From Office.'
          : 'Marked as Work From Home.',
      );
    } catch (err) {
      console.error(err);

      setError(err.response?.data?.message || 'Unable to update attendance.');
    } finally {
      setSavingDate(null);
    }
  };

  const openEditModal = (dateKey) => {
    setSelectedDate(dateKey);
    setError('');
    setSuccess('');
    setShowEditModal(true);
  };

  const openLeaveModal = (dateKey = '') => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tomorrowKey = getDateKey(tomorrow);

    setLeaveForm({
      startDate: dateKey || tomorrowKey,
      endDate: dateKey || tomorrowKey,
      reason: '',
    });

    setShowLeaveModal(true);
  };

  const closeLeaveModal = () => {
    setShowLeaveModal(false);

    setLeaveForm({
      startDate: '',
      endDate: '',
      reason: '',
    });
  };

  const handleLeaveFormChange = (e) => {
    const { name, value } = e.target;

    setLeaveForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submitLeaveRequest = async () => {
    if (!leaveForm.startDate || !leaveForm.endDate) {
      alert('Please select the leave dates.');
      return;
    }

    if (!leaveForm.reason.trim()) {
      alert('Please enter a leave reason.');
      return;
    }

    try {
      setSavingDate(leaveForm.startDate);

      const response = await axios.post(
        `${API_BASE}/api/attendance/leave-requests`,
        {
          startDate: leaveForm.startDate,
          endDate: leaveForm.endDate,
          reason: leaveForm.reason.trim(),
        },
        authConfig(),
      );

      // Remove existing WFO/WFH attendance from the calendar
      setAttendance((prev) =>
        prev.filter(
          (item) => !isDateInRange(item.dateKey, leaveStartDate, leaveEndDate),
        ),
      );

      setSuccess(response.data?.message || 'Leave request submitted.');

      setShowLeaveModal(false);

      setLeaveReason('');

      await fetchAttendance();
    } catch (err) {
      console.error('LEAVE REQUEST ERROR:', err.response?.data || err.message);

      console.error('LEAVE REQUEST STATUS:', err.response?.status);

      setError(
        err.response?.data?.message || 'Unable to submit leave request.',
      );
    } finally {
      setSavingDate('');
    }
  };
  const deletePendingRequestsForDate = async (dateKey) => {
    if (!dateKey) return;

    const pendingLeaveRequests = leaveRequests.filter(
      (request) =>
        request.status === 'PENDING' &&
        isDateInRange(dateKey, request.startDate, request.endDate),
    );

    const pendingWfhRequests = wfhRequests.filter(
      (request) =>
        request.status === 'PENDING' &&
        isDateInRange(dateKey, request.startDate, request.endDate),
    );

    // Delete pending Leave request(s)
    for (const request of pendingLeaveRequests) {
      if (!request._id) continue;

      await axios.delete(
        `${API_BASE}/api/attendance/leave-requests/${request._id}`,
        authConfig(),
      );
    }

    // Delete pending WFH request(s)
    for (const request of pendingWfhRequests) {
      if (!request._id) continue;

      await axios.delete(
        `${API_BASE}/api/attendance/wfh-requests/${request._id}`,
        authConfig(),
      );
    }

    // Remove deleted requests from frontend state
    if (pendingLeaveRequests.length > 0) {
      const deletedLeaveIds = new Set(
        pendingLeaveRequests.map((request) => request._id),
      );

      setLeaveRequests((prev) =>
        prev.filter((request) => !deletedLeaveIds.has(request._id)),
      );
    }

    if (pendingWfhRequests.length > 0) {
      const deletedWfhIds = new Set(
        pendingWfhRequests.map((request) => request._id),
      );

      setWfhRequests((prev) =>
        prev.filter((request) => !deletedWfhIds.has(request._id)),
      );
    }
  };

  const handleEditAttendance = async (status) => {
    if (!selectedDate) return;

    if (status === 'LEAVE') {
      setShowEditModal(false);

      setLeaveForm({
        startDate: selectedDate,
        endDate: selectedDate,
        reason: '',
      });

      setShowLeaveModal(true);
      return;
    }

    if (status === 'WFH') {
      setShowEditModal(false);

      setWfhStartDate(selectedDate);
      setWfhEndDate(selectedDate);
      setWfhReason('');

      setShowWfhModal(true);
      return;
    }

    if (status === 'WFO') {
      try {
        setShowEditModal(false);
        setSavingDate(selectedDate);
        setError('');
        setSuccess('');

        /*
         * If this date has a pending Leave request and/or
         * pending WFH request, delete those requests first.
         */
        await deletePendingRequestsForDate(selectedDate);

        /*
         * Now mark the date as WFO.
         */
        await handleAttendanceChange(selectedDate, 'WFO');

        /*
         * Refresh everything so the calendar and request
         * lists are fully synchronized with the database.
         */
        await fetchAttendance();

        setSuccess('Attendance updated to Work From Office.');
      } catch (error) {
        console.error(
          'Failed to change attendance to WFO:',
          error.response?.data || error.message,
        );

        setError(
          error.response?.data?.message ||
            'Unable to change attendance to Work From Office.',
        );
      } finally {
        setSavingDate(null);
      }

      return;
    }

    setShowEditModal(false);
  };

  const openWfhModal = (dateKey = '') => {
    const selectedDate = dateKey || getTodayKey();

    setWfhStartDate(selectedDate);
    setWfhEndDate(selectedDate);
    setWfhReason('');

    setShowWfhModal(true);
  };

  const submitWfhRequest = async (e) => {
    e.preventDefault();

    if (!wfhStartDate || !wfhEndDate) {
      setError('Please select the WFH dates.');
      return;
    }

    if (!wfhReason.trim()) {
      setError('Please enter the reason for WFH.');
      return;
    }

    try {
      setSubmittingWfh(true);
      setError('');
      setSuccess('');

      const response = await axios.post(
        `${API_BASE}/api/attendance/wfh-requests`,
        {
          startDate: wfhStartDate,
          endDate: wfhEndDate,
          reason: wfhReason.trim(),
        },
        authConfig(),
      );

      // ------------------------------------------
      // REMOVE OLD WFO/WFH FROM FRONTEND IMMEDIATELY
      // ------------------------------------------
      setAttendance((prev) =>
        prev.filter(
          (item) => !isDateInRange(item.dateKey, wfhStartDate, wfhEndDate),
        ),
      );

      // Refresh requests so Pending appears
      await fetchAttendance();

      setSuccess(response.data?.message || 'Work From Home request submitted.');

      setShowWfhModal(false);
      setWfhReason('');
    } catch (err) {
      console.error('WFH REQUEST ERROR:', err.response?.data || err.message);

      console.error('WFH REQUEST STATUS:', err.response?.status);

      console.error('WFH REQUEST PAYLOAD:', {
        startDate: wfhStartDate,
        endDate: wfhEndDate,
        reason: wfhReason.trim(),
      });

      setError(err.response?.data?.message || 'Unable to submit WFH request.');
    }
  };
  /*
  |--------------------------------------------------------------------------
  | MONTH NAVIGATION
  |--------------------------------------------------------------------------
  */

  const previousMonth = () => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
    );
  };

  const goToCurrentMonth = () => {
    setCurrentMonth(new Date());
  };

  const handleDeleteLeaveRequest = async (requestId) => {
    if (!requestId) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this leave request?',
    );

    if (!confirmed) return;

    try {
      setError('');
      setSuccess('');

      await axios.delete(
        `${API_BASE}/api/attendance/leave-requests/${requestId}`,
        authConfig(),
      );

      // Remove immediately from UI
      setLeaveRequests((prev) =>
        prev.filter((request) => request._id !== requestId),
      );

      setSuccess('Leave request deleted successfully.');
    } catch (err) {
      console.error(
        'DELETE LEAVE REQUEST ERROR:',
        err.response?.data || err.message,
      );

      setError(
        err.response?.data?.message || 'Unable to delete leave request.',
      );
    }
  };

  const handleDeleteWfhRequest = async (requestId) => {
    if (!requestId) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this WFH request?',
    );

    if (!confirmed) return;

    try {
      setError('');
      setSuccess('');

      await axios.delete(
        `${API_BASE}/api/attendance/wfh-requests/${requestId}`,
        authConfig(),
      );

      // Remove immediately from UI
      setWfhRequests((prev) =>
        prev.filter((request) => request._id !== requestId),
      );

      setSuccess('WFH request deleted successfully.');
    } catch (err) {
      console.error(
        'DELETE WFH REQUEST ERROR:',
        err.response?.data || err.message,
      );

      setError(err.response?.data?.message || 'Unable to delete WFH request.');
    }
  };

  /*
  |--------------------------------------------------------------------------
  | SUMMARY
  |--------------------------------------------------------------------------
  */

  const summary = useMemo(() => {
    return {
      WFO: attendance.filter((item) => item.status === 'WFO').length,

      WFH: attendance.filter((item) => item.status === 'WFH').length,

      LEAVE: attendance.filter((item) => item.status === 'LEAVE').length,
    };
  }, [attendance]);

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-full bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        {/* Header */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                My Attendance
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage your work location and request leave from one place.
              </p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        {/* Calendar */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Calendar header */}

          <div>
            <div className="flex min-h-22.5 items-center justify-between gap-5 px-1">
              {/* Left: Month navigation */}
              <div className="flex items-center gap-5">
                <button
                  type="button"
                  onClick={previousMonth}
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-xl font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
                >
                  ‹
                </button>

                <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  {formatMonth(currentMonth)}
                </h2>

                <button
                  type="button"
                  onClick={nextMonth}
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-xl font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
                >
                  ›
                </button>
              </div>

              {/* Right: Today's status */}
              <div className="flex items-center gap-2 pr-2">
                <span className="text-xl font-extrabold text-slate-900">
                  Today:
                </span>
                {(() => {
                  const todayStatus = attendanceMap[getTodayKey()];
                  const todayLeave = getLeaveRequestForDate(getTodayKey());
                  const todayWfh = getWfhRequestForDate(getTodayKey());

                  if (todayStatus && STATUS_CONFIG[todayStatus]) {
                    return (
                      <span
                        className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${STATUS_CONFIG[todayStatus].className}`}
                      >
                        {STATUS_CONFIG[todayStatus].short}
                      </span>
                    );
                  }

                  if (todayLeave?.status === 'PENDING') {
                    return (
                      <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700">
                        Leave Pending
                      </span>
                    );
                  }

                  if (todayLeave?.status === 'APPROVED') {
                    return (
                      <span className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-700">
                        Leave
                      </span>
                    );
                  }

                  if (todayWfh?.status === 'PENDING') {
                    return (
                      <span className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">
                        WFH Pending
                      </span>
                    );
                  }

                  if (todayWfh?.status === 'APPROVED') {
                    return (
                      <span className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">
                        WFH
                      </span>
                    );
                  }

                  return (
                    <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-500">
                      No attendance
                    </span>
                  );
                })()}
              </div>
            </div>{' '}
            {/* Monthly Summary */}
            {/* Attendance Summary */}
            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
              {/* WFO */}
              <div className="flex min-h-3.25 flex-col justify-between rounded-2xl border border-green-100 bg-green-50 p-6 shadow-sm">
                <div>
                  <h3 className="text-base font-medium text-green-700">
                    Work From Office
                  </h3>

                  <div className="mt-3 text-4xl font-bold text-green-700">
                    {summary.WFO}
                  </div>
                </div>

                <p className="text-sm font-medium text-green-600">Days</p>
              </div>

              {/* WFH */}
              <div className="flex min-h-36.25 flex-col justify-between rounded-2xl border border-blue-100 bg-blue-50 p-6 shadow-sm">
                <div>
                  <h3 className="text-base font-medium text-blue-700">
                    Work From Home
                  </h3>

                  <div className="mt-3 text-4xl font-bold text-blue-700">
                    {summary.WFH}
                  </div>
                </div>

                <p className="text-sm font-medium text-blue-600">Days</p>
              </div>

              {/* Leave */}
              <div className="flex min-h-36.25 flex-col justify-between rounded-2xl border border-rose-100 bg-rose-50 p-6 shadow-sm">
                <div>
                  <h3 className="text-base font-medium text-rose-700">Leave</h3>

                  <div className="mt-3 text-4xl font-bold text-rose-700">
                    {summary.LEAVE}
                  </div>
                </div>

                <p className="text-sm font-medium text-rose-600">Days</p>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 border-b border-slate-100 px-4 py-3">
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <div
                key={key}
                className="flex items-center gap-2 text-xs text-slate-600"
              >
                <span
                  className={`h-3 w-3 rounded-full border ${config.className}`}
                />

                {config.label}
              </div>
            ))}
          </div>

          {/* Calendar */}
          <div className="p-3 md:p-5">
            {loading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7">
                {Array.from({ length: 14 }, (_, index) => (
                  <div
                    key={index}
                    className="h-36 animate-pulse rounded-xl bg-slate-100"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7">
                {days.map((day) => {
                  const dateKey = getDateKey(day);
                  const status = attendanceMap[dateKey];

                  const leaveRequest = getLeaveRequestForDate(dateKey);
                  const wfhRequest = getWfhRequestForDate(dateKey);

                  const isToday = dateKey === getTodayKey();
                  const isPast = dateKey < getTodayKey();
                  const activeRequest = getActiveRequestForDate(dateKey);
                  const isPendingLeave = leaveRequest?.status === 'PENDING';
                  const isRejectedLeave = leaveRequest?.status === 'REJECTED';

                  const isPendingWfh = wfhRequest?.status === 'PENDING';
                  const isApprovedLeave = leaveRequest?.status === 'APPROVED';
                  const isApprovedWfh = wfhRequest?.status === 'APPROVED';

                  const hasPendingRequest = isPendingLeave || isPendingWfh;

                  return (
                    <div
                      key={dateKey}
                      className={`group relative min-h-36.25 rounded-xl border p-3 transition ${
                        isToday
                          ? 'border-slate-400 ring-2 ring-slate-100'
                          : 'border-slate-200'
                      } ${
                        status === 'WFO'
                          ? 'border-emerald-300 bg-emerald-50'
                          : status === 'WFH'
                            ? 'border-blue-300 bg-blue-50'
                            : status === 'LEAVE'
                              ? 'border-rose-300 bg-rose-50'
                              : hasPendingRequest
                                ? 'border-slate-200 bg-white'
                                : 'bg-white'
                      }`}
                    >
                      {/* Date */}
                      <div className="flex items-start justify-between pr-14">
                        <div>
                          <div className="text-xs font-medium uppercase text-slate-400">
                            {day.toLocaleDateString('en-US', {
                              weekday: 'short',
                            })}
                          </div>

                          <div className="mt-0.5 text-xl font-semibold text-slate-900">
                            {day.getDate()}
                          </div>
                        </div>
                        {isToday && (
                          <span className="rounded-full bg-slate-900 px-2 py-1 text-[10px] font-medium text-white">
                            Today
                          </span>
                        )}
                      </div>

                      {/* Current status */}
                      {/* Current status */}
                      {/* Current status */}
                      <div className="mt-3">
                        {/* Pending Leave */}
                        {/* Pending Leave */}
                        {!status && isPendingLeave && (
                          <span className="inline-flex rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                            Leave Pending
                          </span>
                        )}

                        {/* Pending WFH */}
                        {!status && !isPendingLeave && isPendingWfh && (
                          <span className="inline-flex rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                            WFH Pending
                          </span>
                        )}

                        {/* Actual attendance status */}
                        {/* Actual attendance status */}
                        {status && (
                          <span
                            className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold ${
                              STATUS_CONFIG[status]?.className || ''
                            }`}
                          >
                            {STATUS_CONFIG[status]?.short || status}
                          </span>
                        )}
                        {/* Approved Leave */}
                        {isApprovedLeave && (
                          <div className="mt-3 text-xs text-rose-600">
                            Approved leave
                          </div>
                        )}

                        {/* Approved WFH */}
                        {isApprovedWfh && (
                          <div className="mt-3 text-xs text-blue-600">
                            WFH Approved
                          </div>
                        )}

                        {/* Rejected Leave */}
                        {!status &&
                          !isPendingLeave &&
                          !isPendingWfh &&
                          isRejectedLeave && (
                            <span className="inline-flex rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                              Leave rejected
                            </span>
                          )}

                        {/* No attendance */}
                        {!status && !leaveRequest && !wfhRequest && isPast && (
                          <span className="text-xs text-slate-400">
                            No attendance
                          </span>
                        )}
                      </div>

                      {/* Controls */}
                      {/* Controls */}
                      {/* Controls */}
                      {!isPast &&
                        (status ||
                          isPendingLeave ||
                          isPendingWfh ||
                          (!status && !leaveRequest && !wfhRequest)) && (
                          <div className="mt-4 space-y-2">
                            {/* =========================================================
          EMPTY DATE
          Show WFO + WFH Request + Leave Request
         ========================================================= */}
                            {!status && !leaveRequest && !wfhRequest && (
                              <div className="space-y-2">
                                {/* WFO */}
                                <button
                                  type="button"
                                  disabled={savingDate === dateKey}
                                  onClick={() =>
                                    handleAttendanceChange(dateKey, 'WFO')
                                  }
                                  className="w-full rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {savingDate === dateKey ? 'Saving...' : 'WFO'}
                                </button>

                                {/* WFH Request */}
                                <button
                                  type="button"
                                  onClick={() => openWfhModal(dateKey)}
                                  className="w-full rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                                >
                                  WFH Request
                                </button>

                                {/* Leave Request */}
                                <button
                                  type="button"
                                  onClick={() => openLeaveModal(dateKey)}
                                  className="w-full rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                                >
                                  Leave Request
                                </button>
                              </div>
                            )}

                            {/* =========================================================
          PENDING REQUEST
         ========================================================= */}
                            {!status && (isPendingLeave || isPendingWfh) && (
                              <button
                                type="button"
                                onClick={() => openEditModal(dateKey)}
                                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                              >
                                ✎ Edit Attendance
                              </button>
                            )}

                            {/* =========================================================
          WFO
         ========================================================= */}
                            {status === 'WFO' && (
                              <button
                                type="button"
                                onClick={() => openEditModal(dateKey)}
                                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                              >
                                ✎ Edit Attendance
                              </button>
                            )}
                          </div>
                        )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Leave Requests */}
      </div>

      {/* Leave Request Modal */}
      {showLeaveModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeLeaveModal();
            }
          }}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Request Leave
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Submit your leave request for admin approval.
                </p>
              </div>

              <button
                type="button"
                onClick={closeLeaveModal}
                className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            {/* Form */}
            <form onSubmit={submitLeaveRequest} className="space-y-5 p-6">
              {/* Approval Notice */}
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex gap-3">
                  <div className="mt-0.5 text-lg">⚠️</div>

                  <div>
                    <p className="text-sm font-semibold text-amber-800">
                      Admin approval required
                    </p>

                    <p className="mt-1 text-xs leading-5 text-amber-700">
                      Leave must be requested at least one day in advance. Your
                      leave will only be marked as approved after an admin
                      reviews this request.
                    </p>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Start Date */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Start Date
                  </label>

                  <input
                    type="date"
                    name="startDate"
                    value={leaveForm.startDate}
                    onChange={handleLeaveFormChange}
                    min={getDateKey(new Date(Date.now() + 24 * 60 * 60 * 1000))}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    End Date
                  </label>

                  <input
                    type="date"
                    name="endDate"
                    value={leaveForm.endDate}
                    onChange={handleLeaveFormChange}
                    min={
                      leaveForm.startDate ||
                      getDateKey(new Date(Date.now() + 24 * 60 * 60 * 1000))
                    }
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-700">
                    Reason for Leave
                  </label>

                  <span className="text-xs text-slate-400">
                    {leaveForm.reason.length}/500
                  </span>
                </div>

                <textarea
                  name="reason"
                  value={leaveForm.reason}
                  onChange={handleLeaveFormChange}
                  maxLength={500}
                  rows={4}
                  placeholder="Enter the reason for your leave..."
                  required
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Footer Buttons */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeLeaveModal}
                  disabled={loading}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Leave Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Edit Attendance
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    {formatDate(selectedDate)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-400 hover:bg-slate-100"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="space-y-3 p-5">
              <button
                type="button"
                onClick={() => handleEditAttendance('WFO')}
                className="flex w-full items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-left transition hover:bg-emerald-100"
              >
                <div>
                  <div className="font-semibold text-emerald-800">
                    Work From Office
                  </div>
                  <div className="mt-1 text-xs text-emerald-600">
                    Mark this date as office attendance
                  </div>
                </div>

                <span className="rounded-lg bg-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800">
                  WFO
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleEditAttendance('WFH')}
                className="flex w-full items-center justify-between rounded-xl border border-blue-200 bg-blue-50 p-4 text-left transition hover:bg-blue-100"
              >
                <div>
                  <div className="font-semibold text-blue-800">
                    Work From Home
                  </div>
                  <div className="mt-1 text-xs text-blue-600">
                    Mark this date as WFH
                  </div>
                </div>

                <span className="rounded-lg bg-blue-200 px-3 py-1 text-xs font-bold text-blue-800">
                  WFH
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleEditAttendance('LEAVE')}
                className="flex w-full items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-left transition hover:bg-rose-100"
              >
                <div>
                  <div className="font-semibold text-rose-800">
                    Request Leave
                  </div>
                  <div className="mt-1 text-xs text-rose-600">
                    Requires admin approval
                  </div>
                </div>

                <span className="rounded-lg bg-rose-200 px-3 py-1 text-xs font-bold text-rose-800">
                  Leave
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WFH Request Modal */}
      {showWfhModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowWfhModal(false);
            }
          }}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Work From Home Request
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Submit your WFH request for admin approval.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowWfhModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            {/* Form */}
            <form onSubmit={submitWfhRequest} className="space-y-5 p-6">
              {/* Approval Notice */}
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <div className="flex gap-3">
                  <div className="mt-0.5 text-lg">🏠</div>

                  <div>
                    <p className="text-sm font-semibold text-blue-800">
                      Admin approval required
                    </p>

                    <p className="mt-1 text-xs leading-5 text-blue-700">
                      Your WFH request will remain pending until an admin
                      reviews and approves it.
                    </p>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Start Date */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Start Date
                  </label>

                  <input
                    type="date"
                    value={wfhStartDate}
                    min={getTodayKey()}
                    onChange={(e) => {
                      const newStartDate = e.target.value;

                      setWfhStartDate(newStartDate);

                      // Keep end date valid when start date changes
                      if (!wfhEndDate || wfhEndDate < newStartDate) {
                        setWfhEndDate(newStartDate);
                      }
                    }}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    End Date
                  </label>

                  <input
                    type="date"
                    value={wfhEndDate}
                    min={wfhStartDate || getTodayKey()}
                    onChange={(e) => setWfhEndDate(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-700">
                    Reason for WFH
                  </label>

                  <span className="text-xs text-slate-400">
                    {wfhReason.length}/500
                  </span>
                </div>

                <textarea
                  value={wfhReason}
                  onChange={(e) => setWfhReason(e.target.value)}
                  rows={4}
                  maxLength={500}
                  placeholder="Why do you need to work from home?"
                  required
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Information */}
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs leading-5 text-blue-700">
                  <span className="font-semibold">Note:</span> You can request
                  WFH for one or multiple consecutive days. Each request must be
                  approved by an admin before the dates are marked as WFH.
                </p>
              </div>

              {/* Footer */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowWfhModal(false)}
                  disabled={submittingWfh}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submittingWfh}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submittingWfh ? 'Submitting...' : 'Submit WFH Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Leave Requests */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Header */}
        <div className="border-b border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Leave Requests</h2>

              <p className="mt-1 text-sm text-slate-500">
                Track your leave applications and admin decisions.
              </p>
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {leaveRequests.length} Requests
            </span>
          </div>
        </div>

        {/* Leave Requests List */}
        {leaveRequests.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            No leave requests yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {leaveRequests.map((request) => (
              <div
                key={request._id}
                className="p-5 transition hover:bg-slate-50"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* Left Side */}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900">
                        Leave Request
                      </h3>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          request.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : request.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {request.status}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                      <span className="font-medium text-slate-800">Date:</span>

                      <span>
                        {formatDate(request.startDate)}

                        {request.startDate !== request.endDate && (
                          <> — {formatDate(request.endDate)}</>
                        )}
                      </span>
                    </div>

                    <div className="mt-2 text-sm text-slate-600">
                      <span className="font-medium text-slate-800">
                        Reason:
                      </span>{' '}
                      {request.reason || '—'}
                    </div>
                  </div>

                  {/* Right Side */}
                  {/* Right Side */}
                  <div className="shrink-0 text-left sm:text-right">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Request Status
                    </p>

                    <p
                      className={`mt-1 text-sm font-semibold ${
                        request.status === 'APPROVED'
                          ? 'text-emerald-600'
                          : request.status === 'REJECTED'
                            ? 'text-rose-600'
                            : 'text-amber-600'
                      }`}
                    >
                      {request.status === 'APPROVED'
                        ? 'Approved by Admin'
                        : request.status === 'REJECTED'
                          ? 'Rejected by Admin'
                          : 'Waiting for Admin'}
                    </p>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDeleteLeaveRequest(request._id)}
                      className="mt-3 inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 hover:text-rose-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* WFH Requests */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Header */}
        <div className="border-b border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">
                Work From Home Requests
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Track WFH requests and admin approval status.
              </p>
            </div>

            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {wfhRequests.length} Requests
            </span>
          </div>
        </div>

        {/* WFH Requests List */}
        {wfhRequests.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            No WFH requests yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {wfhRequests.map((request) => (
              <div
                key={request._id}
                className="p-5 transition hover:bg-slate-50"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* Left Side */}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900">
                        Work From Home
                      </h3>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          request.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : request.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {request.status}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                      <span className="font-medium text-slate-800">Date:</span>

                      <span>
                        {formatDate(request.startDate)}

                        {request.startDate !== request.endDate && (
                          <> — {formatDate(request.endDate)}</>
                        )}
                      </span>
                    </div>

                    <div className="mt-2 text-sm text-slate-600">
                      <span className="font-medium text-slate-800">
                        Reason:
                      </span>{' '}
                      {request.reason || '—'}
                    </div>
                  </div>

                  {/* Right Side */}
                  {/* Right Side */}
                  <div className="shrink-0 text-left sm:text-right">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Request Status
                    </p>

                    <p
                      className={`mt-1 text-sm font-semibold ${
                        request.status === 'APPROVED'
                          ? 'text-emerald-600'
                          : request.status === 'REJECTED'
                            ? 'text-rose-600'
                            : 'text-amber-600'
                      }`}
                    >
                      {request.status === 'APPROVED'
                        ? 'Approved by Admin'
                        : request.status === 'REJECTED'
                          ? 'Rejected by Admin'
                          : 'Waiting for Admin'}
                    </p>

                    {request.startDate && request.endDate && (
                      <p className="mt-2 text-xs text-slate-400">
                        {(() => {
                          const start = new Date(
                            `${request.startDate}T00:00:00`,
                          );

                          const end = new Date(`${request.endDate}T00:00:00`);

                          const days =
                            Math.floor((end - start) / (1000 * 60 * 60 * 24)) +
                            1;

                          return `${days} ${days === 1 ? 'Day' : 'Days'}`;
                        })()}
                      </p>
                    )}

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDeleteWfhRequest(request._id)}
                      className="mt-3 inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 hover:text-rose-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
