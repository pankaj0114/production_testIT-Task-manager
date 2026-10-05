import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../css/extrapages.css';

const InProgressAssignedTasks = () => {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [remarkTimers, setRemarkTimers] = useState({});

  // =====================================================
  // FETCH IN-PROGRESS ASSIGNED TASKS
  // =====================================================

  const fetchTasks = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('accessToken');

      const response = await axios.get(
        '${API_BASE}/api/tasks/in-progress-assigned',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('IN-PROGRESS ASSIGNED TASKS FROM API:', response.data);

      setTasks(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(
        'Error fetching in-progress tasks:',
        error.response?.data || error.message,
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FETCH ON PAGE LOAD
  // =====================================================

  useEffect(() => {
    fetchTasks();

    // Cleanup timers when component unmounts
    return () => {
      Object.values(remarkTimers).forEach((timer) => {
        clearTimeout(timer);
      });
    };
  }, []);

  // =====================================================
  // HANDLE REMARK CHANGE
  // =====================================================

  const handleRemarkChange = (taskId, value) => {
    if (!taskId) {
      console.error('Task ID missing while editing remark');
      return;
    }

    // -----------------------------------------------------
    // UPDATE UI IMMEDIATELY
    // -----------------------------------------------------

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

    // -----------------------------------------------------
    // CLEAR PREVIOUS TIMER
    // -----------------------------------------------------

    if (remarkTimers[taskId]) {
      clearTimeout(remarkTimers[taskId]);
    }

    // -----------------------------------------------------
    // AUTO SAVE AFTER USER STOPS TYPING
    // -----------------------------------------------------

    const timer = setTimeout(async () => {
      try {
        const token = localStorage.getItem('accessToken');

        console.log('Automatically saving in-progress remark:', {
          taskId,
          remarks: value,
        });

        const response = await axios.put(
          `${API_BASE}/api/tasks/${taskId}`,
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

        console.log('In-progress remark saved:', response.data);
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

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="assigned-status-page">
        <p>Loading in-progress tasks...</p>
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
        focus:ring-2 focus:ring-blue-200
      "
        >
          <span className="text-lg leading-none">←</span>
          <span>Back to Dashboard</span>
        </button>

        {/* Header */}
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
          <div
            className="
          flex flex-col gap-4
          sm:flex-row sm:items-center sm:justify-between
        "
          >
            <div>
              {/* Title + Count */}
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <h2
                  className="
                text-2xl font-bold tracking-tight
                text-slate-800
                sm:text-3xl
              "
                >
                  In Progress Tasks
                </h2>

                <span
                  className="
                inline-flex min-w-8.5
                items-center justify-center
                rounded-full
                bg-blue-100
                px-3 py-1
                text-sm font-bold
                text-blue-700
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
                Tasks assigned by you that are currently being worked on.
              </p>
            </div>

            {/* Progress Icon */}
            <div
              className="
            hidden
            h-12 w-12
            items-center justify-center
            rounded-full
            bg-blue-50
            text-xl
            text-blue-600
            sm:flex
          "
            >
              ↻
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
            bg-blue-50
            text-2xl
            text-blue-600
          "
            >
              ↻
            </div>

            <h3 className="text-lg font-semibold text-slate-700">
              No in-progress tasks
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              There are no in-progress tasks to display.
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
            border border-blue-100
            bg-white
            shadow-sm
            transition-all duration-300
            hover:-translate-y-1
            hover:border-blue-200
            hover:shadow-lg
          "
            >
              {/* Blue Top Accent */}
              <div className="h-1.5 w-full bg-blue-400" />

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
                bg-blue-50
                px-3 py-1.5
                text-xs font-bold
                text-blue-700
              "
                >
                  <span
                    className="
                  h-2 w-2
                  rounded-full
                  bg-blue-500
                "
                  />
                  In Progress
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
                    max-w-[65%]
                    text-right
                    text-sm font-semibold
                    text-slate-800
                    wrap-break-word
                  "
                    >
                      {task.title || 'No title'}
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
                    rounded-full
                    px-3 py-1
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
                    max-w-[60%]
                    text-right
                    text-sm font-medium
                    text-slate-700
                    wrap-break-word
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
                    max-w-[60%]
                    text-right
                    text-sm font-medium
                    text-slate-700
                    wrap-break-word
                  "
                    >
                      {task.assignedBy?.name || 'Me'}
                    </span>
                  </div>
                </div>

                {/* =================================================
                ONLY REMARKS IS EDITABLE
            ================================================= */}

                <div
                  className="
                mt-6
                rounded-xl
                border border-blue-100
                bg-blue-50/60
                p-4
              "
                >
                  <label
                    className="
                  mb-2 block
                  text-sm font-bold
                  text-blue-800
                "
                  >
                    Remarks
                  </label>

                  <textarea
                    value={task.remarks || ''}
                    onChange={(e) =>
                      handleRemarkChange(task._id, e.target.value)
                    }
                    placeholder="Add remarks..."
                    rows={3}
                    className="
                  w-full
                  resize-y
                  rounded-lg
                  border border-blue-200
                  bg-white
                  px-3 py-2.5
                  text-sm
                  text-slate-700
                  placeholder:text-slate-400
                  outline-none
                  transition-all
                  focus:border-blue-400
                  focus:ring-2
                  focus:ring-blue-100
                "
                  />

                  <p className="mt-2 text-xs text-slate-400">
                    Your remarks are saved automatically.
                  </p>
                </div>
              </div>

              {/* Bottom Progress Indicator */}
              <div
                className="
              border-t border-blue-100
              bg-blue-50/40
              px-5 py-3
              text-center
            "
              >
                <span
                  className="
                text-xs font-semibold
                text-blue-600
              "
                >
                  ↻ Task currently in progress
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InProgressAssignedTasks;
