import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../css/extrapages.css';

const API_BASE = (
  import.meta.env.VITE_API_URL || 'http://localhost:5005'
).replace(/\/+$/, '');

const CompletedAssignedTasks = () => {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // =====================================================
  // FETCH COMPLETED ASSIGNED TASKS
  // =====================================================

  const fetchTasks = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('accessToken');

      const response = await axios.get(
        `${API_BASE}/api/tasks/completed-assigned`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('COMPLETED ASSIGNED TASKS FROM API:', response.data);

      setTasks(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(
        'Error fetching completed assigned tasks:',
        error.response?.data || error.message,
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FETCH WHEN PAGE LOADS
  // =====================================================

  useEffect(() => {
    fetchTasks();
  }, []);

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="assigned-status-page">
        <p>Loading completed tasks...</p>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-screen w-full bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      {/* =================================================
        HEADER
    ================================================= */}

      <div className="mx-auto mb-8 w-full max-w-7xl">
        {/* Back Button */}
        <button
          type="button"
          onClick={() => navigate('/employee-dashboard')}
          className="
          mb-5 inline-flex items-center gap-2
          rounded-lg border border-slate-200
          bg-white px-4 py-2.5
          text-sm font-semibold text-slate-600
          shadow-sm
          transition-all duration-200
          hover:border-slate-300
          hover:bg-slate-50
          hover:text-slate-900
          hover:shadow
          focus:outline-none
          focus:ring-2 focus:ring-emerald-200
        "
        >
          <span className="text-lg leading-none">←</span>
          <span>Back to Dashboard</span>
        </button>

        {/* Header Content */}
        <div
          className="
        rounded-2xl
        border border-slate-200
        bg-white
        px-5 py-5
        shadow-sm
        sm:px-7 sm:py-6
      "
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {/* Title */}
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <h2
                  className="
                text-2xl font-bold tracking-tight
                text-slate-800
                sm:text-3xl
              "
                >
                  Completed Tasks
                </h2>

                {/* Task Count */}
                <span
                  className="
                inline-flex min-w-8.5 items-center justify-center
                rounded-full
                bg-emerald-100
                px-3 py-1
                text-sm font-bold
                text-emerald-700
              "
                >
                  {tasks.length}
                </span>
              </div>

              <p
                className="
              max-w-2xl
              text-sm leading-6
              text-slate-500
              sm:text-base
            "
              >
                Tasks assigned by you that have been completed by employees.
              </p>
            </div>

            {/* Completed Indicator */}
            <div
              className="
            hidden
            h-12 w-12
            items-center justify-center
            rounded-full
            bg-emerald-50
            text-xl
            text-emerald-600
            sm:flex
          "
            >
              ✓
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
        TASK CARDS
    ================================================= */}

      {tasks.length === 0 ? (
        <div
          className="
        mx-auto
        flex min-h-62.5
        w-full max-w-7xl
        items-center justify-center
        rounded-2xl
        border border-dashed border-slate-300
        bg-white
        px-6
        text-center
        shadow-sm
      "
        >
          <div>
            <div
              className="
            mx-auto mb-3
            flex h-14 w-14
            items-center justify-center
            rounded-full
            bg-emerald-50
            text-2xl
            text-emerald-600
          "
            >
              ✓
            </div>

            <h3 className="text-lg font-semibold text-slate-700">
              No completed tasks
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              There are no completed tasks to display.
            </p>
          </div>
        </div>
      ) : (
        <div
          className="
        mx-auto grid w-full max-w-7xl
        grid-cols-1
        gap-5
        md:grid-cols-2
        xl:grid-cols-3
      "
        >
          {tasks.map((task) => (
            <div
              key={task._id}
              className="
              group
              relative
              flex h-full flex-col
              overflow-hidden
              rounded-2xl
              border border-emerald-100
              bg-white
              shadow-sm
              transition-all duration-300
              hover:-translate-y-1
              hover:border-emerald-200
              hover:shadow-lg
            "
            >
              {/* Green Top Accent */}
              <div className="h-1.5 w-full bg-emerald-400" />

              {/* =================================================
                STATUS
            ================================================= */}

              <div
                className="
              flex items-center justify-between
              border-b border-slate-100
              px-5 py-4
            "
              >
                <span
                  className="
                inline-flex items-center gap-1.5
                rounded-full
                bg-emerald-50
                px-3 py-1.5
                text-xs font-bold
                text-emerald-700
              "
                >
                  <span
                    className="
                  h-2 w-2
                  rounded-full
                  bg-emerald-500
                "
                  />
                  Completed
                </span>

                <span className="text-xs font-medium text-slate-400">Task</span>
              </div>

              {/* =================================================
                TASK INFORMATION
            ================================================= */}

              <div className="flex-1 px-5 py-5">
                <div className="space-y-3.5">
                  {/* Title */}
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className="
                    shrink-0
                    text-sm font-semibold
                    text-slate-500
                  "
                    >
                      Title:
                    </span>

                    <span
                      className="
                    text-right
                    text-sm font-semibold
                    text-slate-800
                    wrap-break-word
                  "
                    >
                      {task.title || 'No title'}
                    </span>
                  </div>

                  {/* Remarks */}
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className="
                    shrink-0
                    text-sm font-semibold
                    text-slate-500
                  "
                    >
                      Remarks:
                    </span>

                    <span
                      className="
                    max-w-[65%]
                    text-right
                    text-sm
                    leading-5
                    text-slate-700
                     wrap-break-word
                  "
                    >
                      {task.remarks || 'No remarks'}
                    </span>
                  </div>

                  {/* Due Date */}
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className="
                    text-sm font-semibold
                    text-slate-500
                  "
                    >
                      Due Date:
                    </span>

                    <span className="text-sm font-medium text-slate-700">
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString()
                        : 'No due date'}
                    </span>
                  </div>

                  {/* Priority */}
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className="
                    text-sm font-semibold
                    text-slate-500
                  "
                    >
                      Priority:
                    </span>

                    <span
                      className={`
                      rounded-full px-3 py-1
                      text-xs font-bold
                      ${
                        task.priority === 'High'
                          ? 'bg-red-50 text-red-600'
                          : task.priority === 'Low'
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-amber-50 text-amber-600'
                      }
                    `}
                    >
                      {task.priority || 'Medium'}
                    </span>
                  </div>

                  {/* Assigned To */}
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className="
                    text-sm font-semibold
                    text-slate-500
                  "
                    >
                      Assigned To:
                    </span>

                    <span
                      className="
                    text-right
                    text-sm font-medium
                    text-slate-700
                  "
                    >
                      {task.assignedTo?.name || 'N/A'}
                    </span>
                  </div>

                  {/* Assigned By */}
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className="
                    text-sm font-semibold
                    text-slate-500
                  "
                    >
                      Assigned By:
                    </span>

                    <span
                      className="
                    text-right
                    text-sm font-medium
                    text-slate-700
                  "
                    >
                      {task.assignedBy?.name || 'Me'}
                    </span>
                  </div>
                </div>

                {/* =================================================
                  COMPLETION TIME
              ================================================= */}

                <div
                  className="
                mt-6
                rounded-xl
                border border-emerald-100
                bg-emerald-50/70
                p-4
              "
                >
                  {/* Time Header */}
                  <div
                    className="
                  mb-4
                  flex items-center justify-between
                "
                  >
                    <span
                      className="
                    text-sm font-bold
                    text-emerald-800
                  "
                    >
                      Time Taken
                    </span>

                    <span className="text-lg">⏱️</span>
                  </div>

                  {/* Time Boxes */}
                  <div
                    className="
                  flex items-center
                  justify-center
                  gap-3
                "
                  >
                    {/* Hours */}
                    <div
                      className="
                    flex min-w-22.5
                    flex-col items-center
                    rounded-xl
                    border border-emerald-100
                    bg-white
                    px-4 py-3
                    shadow-sm
                  "
                    >
                      <span
                        className="
                      text-2xl font-bold
                      text-emerald-700
                    "
                      >
                        {task.totalHours ?? 0}
                      </span>

                      <span
                        className="
                      mt-0.5
                      text-xs font-medium
                      text-slate-500
                    "
                      >
                        Hours
                      </span>
                    </div>

                    {/* Separator */}
                    <span
                      className="
                    text-xl font-bold
                    text-emerald-500
                  "
                    >
                      :
                    </span>

                    {/* Minutes */}
                    <div
                      className="
                    flex min-w-22.5
                    flex-col items-center
                    rounded-xl
                    border border-emerald-100
                    bg-white
                    px-4 py-3
                    shadow-sm
                  "
                    >
                      <span
                        className="
                      text-2xl font-bold
                      text-emerald-700
                    "
                      >
                        {task.totalMinutes ?? 0}
                      </span>

                      <span
                        className="
                      mt-0.5
                      text-xs font-medium
                      text-slate-500
                    "
                      >
                        Minutes
                      </span>
                    </div>
                  </div>

                  {/* Total Time */}
                  <div
                    className="
                  mt-4
                  border-t border-emerald-100
                  pt-3
                  text-center
                  text-xs text-slate-500
                "
                  >
                    Total time:{' '}
                    <strong className="text-emerald-700">
                      {task.totalHours ?? 0} hours {task.totalMinutes ?? 0}{' '}
                      minutes
                    </strong>
                  </div>
                </div>
              </div>

              {/* Bottom Completed Indicator */}
              <div
                className="
              border-t border-emerald-100
              bg-emerald-50/40
              px-5 py-3
              text-center
            "
              >
                <span
                  className="
                text-xs font-semibold
                text-emerald-600
              "
                >
                  ✓ Task completed successfully
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompletedAssignedTasks;
