import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const API_BASE = (
  import.meta.env.VITE_API_URL || 'http://localhost:5005'
).replace(/\/+$/, '');

const getToken = () => localStorage.getItem('accessToken');

const authConfig = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`,
  },
});

const pad = (number) => String(number).padStart(2, '0');

const formatDate = (date) => {
  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1,
  )}-${pad(date.getDate())}`;
};

const getMonthDays = (year, month) => {
  const days = [];

  const totalDays = new Date(year, month, 0).getDate();

  for (let day = 1; day <= totalDays; day++) {
    days.push(new Date(year, month - 1, day));
  }

  return days;
};

const statusClass = (status) => {
  if (status === 'WFO') {
    return 'bg-blue-100 text-blue-700 border-blue-200';
  }

  if (status === 'WFH') {
    return 'bg-purple-100 text-purple-700 border-purple-200';
  }

  if (status === 'LEAVE') {
    return 'bg-red-100 text-red-700 border-red-200';
  }

  if (status === 'PENDING_LEAVE') {
    return 'bg-orange-50 text-orange-700 border-orange-200';
  }

  if (status === 'PENDING_WFH') {
    return 'bg-violet-50 text-violet-700 border-violet-200';
  }

  return 'bg-slate-50 text-slate-500 border-slate-200';
};

const statusLabel = (status) => {
  if (status === 'WFO') return 'Work From Office';
  if (status === 'WFH') return 'Work From Home';
  if (status === 'LEAVE') return 'Leave';
  if (status === 'PENDING_LEAVE') return 'Pending Leave';
  if (status === 'PENDING_WFH') return 'Pending WFH';

  return 'Not Marked';
};

export default function AdminAttendance() {
  const today = new Date();

  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');

  const [month, setMonth] = useState(today.getMonth() + 1);

  const [year, setYear] = useState(today.getFullYear());

  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState({
    WFO: 0,
    WFH: 0,
    LEAVE: 0,
    PENDING_LEAVE: 0,
    APPROVED_LEAVE: 0,
  });

  const [loading, setLoading] = useState(false);

  const [leaveRequests, setLeaveRequests] = useState([]);

  const [wfhRequests, setWfhRequests] = useState([]);

  const [myAttendance, setMyAttendance] = useState([]);

  const [mySummary, setMySummary] = useState({
    WFO: 0,
    WFH: 0,
    LEAVE: 0,
  });

  const [activeSection, setActiveSection] = useState('employees');

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/admin/attendance/employees`,
        authConfig(),
      );

      const list = response.data?.employees || [];

      setEmployees(list);

      if (!selectedEmployee && list.length > 0) {
        setSelectedEmployee(list[0]._id);
      }
    } catch (error) {
      console.error('Failed to load employees:', error);
    }
  };

  const fetchEmployeeAttendance = async () => {
    if (!selectedEmployee) return;

    setLoading(true);

    try {
      const response = await axios.get(
        `${API_BASE}/api/admin/attendance/employee/${selectedEmployee}`,
        {
          ...authConfig(),
          params: {
            month,
            year,
          },
        },
      );

      setAttendance(response.data?.attendance || []);

      setSummary(
        response.data?.summary || {
          WFO: 0,
          WFH: 0,
          LEAVE: 0,
          PENDING_LEAVE: 0,
          APPROVED_LEAVE: 0,
        },
      );
    } catch (error) {
      console.error('Failed to load attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyAttendance = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/admin/attendance/my`, {
        ...authConfig(),
        params: {
          month,
          year,
        },
      });

      setMyAttendance(response.data?.attendance || []);

      setMySummary(
        response.data?.summary || {
          WFO: 0,
          WFH: 0,
          LEAVE: 0,
        },
      );
    } catch (error) {
      console.error('Failed to load own attendance:', error);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/admin/attendance/leave-requests`,
        authConfig(),
      );

      setLeaveRequests(response.data?.requests || []);
    } catch (error) {
      console.error('Failed to load leave requests:', error);
    }
  };

  const fetchWfhRequests = async () => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/attendance/admin/wfh-requests`,
        authConfig(),
      );

      setWfhRequests(response.data?.requests || []);
    } catch (error) {
      console.error('Failed to load WFH requests:', error);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchLeaveRequests();
    fetchWfhRequests();
  }, []);

  useEffect(() => {
    fetchEmployeeAttendance();
    fetchMyAttendance();
  }, [selectedEmployee, month, year]);

  const attendanceMap = useMemo(() => {
    const map = {};

    attendance.forEach((item) => {
      const key =
        item.dateKey || (item.date ? formatDate(new Date(item.date)) : '');

      if (key) {
        map[key] = item;
      }
    });

    return map;
  }, [attendance]);

  const getEmployeeId = (value) => {
    if (!value) return '';

    if (typeof value === 'string') {
      return value;
    }

    return String(value._id || value.id || '');
  };

  const getPendingRequestForDate = (dateString) => {
    const employeeId = String(selectedEmployee || '');

    const pendingLeave = leaveRequests.find((request) => {
      if (request.status && request.status !== 'PENDING') {
        return false;
      }

      if (getEmployeeId(request.employee) !== employeeId) {
        return false;
      }

      if (!request.startDate || !request.endDate) {
        return false;
      }

      return (
        dateString >= String(request.startDate).slice(0, 10) &&
        dateString <= String(request.endDate).slice(0, 10)
      );
    });

    if (pendingLeave) {
      return {
        type: 'PENDING_LEAVE',
        label: 'Pending Leave',
        request: pendingLeave,
      };
    }

    const pendingWfh = wfhRequests.find((request) => {
      if (request.status && request.status !== 'PENDING') {
        return false;
      }

      if (getEmployeeId(request.employee) !== employeeId) {
        return false;
      }

      if (!request.startDate || !request.endDate) {
        return false;
      }

      return (
        dateString >= String(request.startDate).slice(0, 10) &&
        dateString <= String(request.endDate).slice(0, 10)
      );
    });

    if (pendingWfh) {
      return {
        type: 'PENDING_WFH',
        label: 'Pending WFH',
        request: pendingWfh,
      };
    }

    return null;
  };

  const updateMyAttendance = async (date, status) => {
    const dateString = formatDate(date);

    let reason = '';

    if (status === 'LEAVE') {
      reason = window.prompt('Enter leave reason:');

      if (!reason?.trim()) {
        return;
      }
    }

    try {
      await axios.put(
        `${API_BASE}/api/admin/attendance/my`,
        {
          date: dateString,
          status,
          reason,
        },
        authConfig(),
      );

      await fetchMyAttendance();
    } catch (error) {
      console.error('Own attendance update failed:', error);

      alert(error.response?.data?.message || 'Failed to update attendance');
    }
  };

  const processLeaveRequest = async (attendanceId, action) => {
    try {
      await axios.put(
        `${API_BASE}/api/attendance/admin/leave-requests/${attendanceId}`,
        {
          action,
        },
        authConfig(),
      );

      await fetchLeaveRequests();

      if (selectedEmployee) {
        await fetchEmployeeAttendance();
      }
    } catch (error) {
      console.error('Leave request action failed:', error);

      alert(error.response?.data?.message || 'Failed to process leave request');
    }
  };

  const processWfhRequest = async (requestId, action) => {
    try {
      await axios.put(
        `${API_BASE}/api/attendance/admin/wfh-requests/${requestId}`,
        {
          action,
        },
        authConfig(),
      );

      await fetchWfhRequests();

      if (selectedEmployee) {
        await fetchEmployeeAttendance();
      }
    } catch (error) {
      console.error('WFH request action failed:', error);

      alert(error.response?.data?.message || 'Failed to process WFH request');
    }
  };

  const days = useMemo(() => getMonthDays(year, month), [month, year]);

  return (
    <div className="w-full min-w-0 space-y-4 sm:space-y-6">
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Attendance</h2>

          <p className="mt-1 text-sm text-slate-500">
            Manage employee attendance, review leave requests and manage your
            own attendance.
          </p>
        </div>

        <div className="flex w-full flex-wrap gap-2 lg:w-auto">
          <button
            onClick={() => setActiveSection('employees')}
            className={`min-h-10 flex-1 whitespace-nowrap rounded-lg px-2.5 py-2 text-center text-xs font-medium transition sm:flex-none sm:px-4 sm:text-sm ${
              activeSection === 'employees'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Employee Attendance
          </button>

          <button
            onClick={() => setActiveSection('mine')}
            className={`min-h-10 flex-1 whitespace-nowrap rounded-lg px-2.5 py-2 text-center text-xs font-medium transition sm:flex-none sm:px-4 sm:text-sm ${
              activeSection === 'mine'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            My Attendance
          </button>

          <button
            onClick={() => setActiveSection('requests')}
            className={`relative min-h-10 flex-1 whitespace-nowrap rounded-lg px-2.5 py-2 text-center text-xs font-medium transition sm:flex-none sm:px-4 sm:text-sm ${
              activeSection === 'requests'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Leave Requests
            {leaveRequests.length > 0 && (
              <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                {leaveRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSection('wfhRequests')}
            className={`relative min-h-10 flex-1 whitespace-nowrap rounded-lg px-2.5 py-2 text-center text-xs font-medium transition sm:flex-none sm:px-4 sm:text-sm ${
              activeSection === 'wfhRequests'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            WFH Requests
            {wfhRequests.length > 0 && (
              <span className="ml-2 rounded-full bg-purple-500 px-2 py-0.5 text-xs text-white">
                {wfhRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeSection === 'employees' && (
        <>
          <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="grid min-w-0 grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Employee
                </label>

                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="h-11 min-w-0 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {employees.map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Month
                </label>

                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="h-11 min-w-0 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {Array.from(
                    {
                      length: 12,
                    },
                    (_, index) => (
                      <option key={index + 1} value={index + 1}>
                        {new Date(2000, index, 1).toLocaleString('default', {
                          month: 'long',
                        })}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Year
                </label>

                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="h-11 min-w-0 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {[year - 1, year, year + 1].map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 sm:p-5">
              <p className="text-sm font-medium text-blue-700">
                Work From Office
              </p>

              <p className="mt-1 text-3xl font-bold text-blue-800">
                {summary.WFO}
              </p>

              <p className="text-xs text-blue-600">Days</p>
            </div>

            <div className="rounded-xl border border-purple-100 bg-purple-50 p-4 sm:p-5">
              <p className="text-sm font-medium text-purple-700">
                Work From Home
              </p>

              <p className="mt-1 text-3xl font-bold text-purple-800">
                {summary.WFH}
              </p>

              <p className="text-xs text-purple-600">Days</p>
            </div>

            <div className="rounded-xl border border-red-100 bg-red-50 p-4 sm:p-5">
              <p className="text-sm font-medium text-red-700">Leave</p>

              <p className="mt-1 text-3xl font-bold text-red-800">
                {summary.LEAVE}
              </p>

              <p className="text-xs text-red-600">Days</p>
            </div>

            <div className="rounded-xl border border-orange-100 bg-orange-50 p-4 sm:p-5">
              <p className="text-sm font-medium text-orange-700">
                Pending Leave
              </p>

              <p className="mt-1 text-3xl font-bold text-orange-800">
                {summary.PENDING_LEAVE}
              </p>

              <p className="text-xs text-orange-600">Requests</p>
            </div>
          </div>

          <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex min-w-0 flex-col gap-3 border-b border-slate-200 p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">
                  Monthly Calendar
                </h3>

                <p className="text-sm text-slate-500">
                  Attendance is read-only here. Approve pending Leave/WFH
                  requests from their request sections.
                </p>
              </div>

              <div className="flex flex-wrap gap-x-3 gap-y-2 text-xs">
                <span className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded-full bg-blue-500" />
                  WFO
                </span>

                <span className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded-full bg-purple-500" />
                  WFH
                </span>

                <span className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded-full bg-red-500" />
                  Leave
                </span>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center text-sm text-slate-500 sm:p-12">
                Loading attendance...
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 p-3 min-[420px]:grid-cols-2 sm:grid-cols-4 sm:p-4 lg:grid-cols-7">
                {days.map((date) => {
                  const dateString = formatDate(date);
                  const record = attendanceMap[dateString];
                  const pendingRequest = getPendingRequestForDate(dateString);
                  const displayStatus =
                    record?.status || pendingRequest?.type || '';
                  const displayLabel = statusLabel(displayStatus);

                  return (
                    <div
                      key={dateString}
                      className={`min-h-28 rounded-xl border p-3 transition sm:min-h-32 ${statusClass(
                        displayStatus,
                      )}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">
                          {date.toLocaleDateString('en-US', {
                            weekday: 'short',
                          })}
                        </span>

                        <span className="text-lg font-bold">
                          {date.getDate()}
                        </span>
                      </div>

                      <div className="mt-3">
                        <div className="w-full rounded-lg border border-current/20 bg-white/80 px-3 py-2 text-xs font-semibold">
                          {displayLabel}
                        </div>
                      </div>

                      {pendingRequest ? (
                        <div className="mt-2 rounded-lg bg-white/70 px-2.5 py-2 text-[10px] font-semibold">
                          {pendingRequest.type === 'PENDING_LEAVE'
                            ? 'Approve/reject this Leave request from Leave Requests.'
                            : 'Approve/reject this WFH request from WFH Requests.'}
                        </div>
                      ) : record?.reason ? (
                        <p className="mt-2 line-clamp-2 text-xs opacity-80">
                          {record.reason}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {activeSection === 'mine' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            <div className="rounded-xl bg-blue-50 p-4 sm:p-5">
              <p className="text-sm text-blue-700">WFO</p>

              <p className="text-3xl font-bold text-blue-800">
                {mySummary.WFO}
              </p>
            </div>

            <div className="rounded-xl bg-purple-50 p-4 sm:p-5">
              <p className="text-sm text-purple-700">WFH</p>

              <p className="text-3xl font-bold text-purple-800">
                {mySummary.WFH}
              </p>
            </div>

            <div className="rounded-xl bg-red-50 p-4 sm:p-5">
              <p className="text-sm text-red-700">Leave</p>

              <p className="text-3xl font-bold text-red-800">
                {mySummary.LEAVE}
              </p>
            </div>
          </div>

          <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">
              Manage My Attendance
            </h3>

            <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:grid-cols-4 lg:grid-cols-7">
              {days.map((date) => {
                const dateString = formatDate(date);

                const record = myAttendance.find(
                  (item) => formatDate(new Date(item.date)) === dateString,
                );

                return (
                  <div
                    key={dateString}
                    className={`rounded-xl border p-3 ${statusClass(
                      record?.status,
                    )}`}
                  >
                    <div className="flex justify-between">
                      <span className="text-xs">
                        {date.toLocaleDateString('en-US', {
                          weekday: 'short',
                        })}
                      </span>

                      <strong>{date.getDate()}</strong>
                    </div>

                    <select
                      value={record?.status || ''}
                      onChange={(e) => updateMyAttendance(date, e.target.value)}
                      className="mt-3 w-full rounded-lg border border-current/20 bg-white/80 px-2 py-2 text-xs"
                    >
                      <option value="">Not Marked</option>
                      <option value="WFO">WFO</option>
                      <option value="WFH">WFH</option>
                      <option value="LEAVE">Leave</option>
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeSection === 'requests' && (
        <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4 sm:p-5">
            <h3 className="text-lg font-semibold text-slate-800">
              Pending Leave Requests
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Review employee leave requests before approving them.
            </p>
          </div>

          {leaveRequests.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500 sm:p-10">
              No pending leave requests.
            </div>
          ) : (
            <div className="max-w-full overflow-x-auto overscroll-x-contain">
              <table className="w-full min-w-180 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left sm:px-5 sm:py-4">
                      Employee
                    </th>
                    <th className="px-4 py-3 text-left sm:px-5 sm:py-4">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left sm:px-5 sm:py-4">
                      Reason
                    </th>
                    <th className="px-4 py-3 text-left sm:px-5 sm:py-4">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {leaveRequests.map((request) => (
                    <tr key={request._id} className="border-t border-slate-100">
                      <td className="px-4 py-3 sm:px-5 sm:py-4">
                        <div className="font-medium text-slate-800">
                          {request.employee?.name}
                        </div>

                        <div className="text-xs text-slate-500">
                          {request.employee?.email}
                        </div>
                      </td>

                      <td className="px-4 py-3 sm:px-5 sm:py-4">
                        {request.startDate
                          ? request.startDate === request.endDate
                            ? new Date(
                                `${request.startDate}T00:00:00`,
                              ).toLocaleDateString()
                            : `${new Date(`${request.startDate}T00:00:00`).toLocaleDateString()} - ${new Date(`${request.endDate}T00:00:00`).toLocaleDateString()}`
                          : 'No date'}
                      </td>

                      <td className="max-w-65 wrap-break-word px-4 py-3 text-slate-600 sm:px-5 sm:py-4">
                        {request.reason || 'No reason'}
                      </td>

                      <td className="px-4 py-3 sm:px-5 sm:py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              processLeaveRequest(request._id, 'approve')
                            }
                            className="w-full rounded-lg bg-green-500 px-3 py-2 text-xs font-semibold text-white hover:bg-green-600 sm:w-auto"
                          >
                            Approve
                          </button>

                          <button
                            onClick={() =>
                              processLeaveRequest(request._id, 'reject')
                            }
                            className="w-full rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white hover:bg-red-600 sm:w-auto"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeSection === 'wfhRequests' && (
        <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4 sm:p-5">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">
                  Pending WFH Requests
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Review employee Work From Home requests before approving them.
                </p>
              </div>

              <span className="w-fit rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                {wfhRequests.length} Requests
              </span>
            </div>
          </div>

          {wfhRequests.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500 sm:p-10">
              No WFH requests.
            </div>
          ) : (
            <div className="max-w-full overflow-x-auto overscroll-x-contain">
              <table className="w-full min-w-225 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left sm:px-5 sm:py-4">
                      Employee
                    </th>
                    <th className="px-4 py-3 text-left sm:px-5 sm:py-4">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left sm:px-5 sm:py-4">
                      Days
                    </th>
                    <th className="px-4 py-3 text-left sm:px-5 sm:py-4">
                      Reason
                    </th>
                    <th className="px-4 py-3 text-left sm:px-5 sm:py-4">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left sm:px-5 sm:py-4">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {wfhRequests.map((request) => {
                    let daysCount = 0;

                    if (request.startDate && request.endDate) {
                      const start = new Date(`${request.startDate}T00:00:00`);
                      const end = new Date(`${request.endDate}T00:00:00`);

                      daysCount =
                        Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
                    }

                    return (
                      <tr
                        key={request._id}
                        className="border-t border-slate-100"
                      >
                        <td className="px-4 py-3 sm:px-5 sm:py-4">
                          <div className="font-medium text-slate-800">
                            {request.employee?.name || 'Unknown employee'}
                          </div>

                          <div className="text-xs text-slate-500">
                            {request.employee?.email || ''}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {request.startDate
                            ? request.startDate === request.endDate
                              ? new Date(
                                  `${request.startDate}T00:00:00`,
                                ).toLocaleDateString()
                              : `${new Date(`${request.startDate}T00:00:00`).toLocaleDateString()} - ${new Date(`${request.endDate}T00:00:00`).toLocaleDateString()}`
                            : 'No date'}
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {daysCount > 0
                            ? `${daysCount} ${daysCount === 1 ? 'Day' : 'Days'}`
                            : '—'}
                        </td>

                        <td className="max-w-65 wrap-break-word px-4 py-3 text-slate-600 sm:px-5 sm:py-4">
                          <div className="line-clamp-2">
                            {request.reason || 'No reason'}
                          </div>
                        </td>

                        <td className="px-4 py-3 sm:px-5 sm:py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              request.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-700'
                                : request.status === 'REJECTED'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {request.status || 'PENDING'}
                          </span>
                        </td>

                        <td className="px-4 py-3 sm:px-5 sm:py-4">
                          {request.status === 'PENDING' ? (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  processWfhRequest(request._id, 'approve')
                                }
                                className="w-full rounded-lg bg-green-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-600 sm:w-auto"
                              >
                                Approve
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  processWfhRequest(request._id, 'reject')
                                }
                                className="w-full rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-600 sm:w-auto"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">
                              Already processed
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
