import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  LogOut,
  Search,
  User,
  X,
} from 'lucide-react';

//const API_BASE = (
//import.meta.env.VITE_API_URL || 'http://localhost:5005'
//).replace(/\/+$/, '');

const EmployeeNavbar = ({
  user,
  searchValue = '',
  onSearchChange,
  notifications = [],
  onViewAllNotifications,
  onLogout,
  onUpdateDateOfBirth,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);

  const [dateOfBirth, setDateOfBirth] = useState(
    user?.dateOfBirth ? String(user.dateOfBirth).slice(0, 10) : '',
  );

  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  // ============================================================
  // KEEP DOB IN SYNC WITH USER DATA
  // ============================================================

  useEffect(() => {
    setDateOfBirth(
      user?.dateOfBirth ? String(user.dateOfBirth).slice(0, 10) : '',
    );
  }, [user?.dateOfBirth]);

  // ============================================================
  // CLICK OUTSIDE
  // ============================================================

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }

      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // ============================================================
  // ESCAPE KEY
  // ============================================================

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowNotifications(false);
        setShowProfileMenu(false);
        setShowProfilePopup(false);
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // ============================================================
  // NOTIFICATION COUNT
  // ============================================================

  const unreadNotificationCount = notifications.filter(
    (notification) => !notification.read,
  ).length;

  const notificationCount =
    unreadNotificationCount || notifications.length || 0;

  // ============================================================
  // PROFILE
  // ============================================================

  const fullName =
    user?.name ||
    user?.fullName ||
    `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
    'Employee';

  const email = user?.email || 'No email available';

  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  // ============================================================
  // SAVE DATE OF BIRTH
  // ============================================================

  const handleSaveDateOfBirth = async () => {
    if (!dateOfBirth) {
      alert('Please select your date of birth.');
      return;
    }

    try {
      if (typeof onUpdateDateOfBirth === 'function') {
        await onUpdateDateOfBirth(dateOfBirth);
      }

      setShowProfilePopup(false);
    } catch (error) {
      console.error('Failed to update date of birth:', error);

      alert(
        error?.response?.data?.message ||
          error?.message ||
          'Failed to update date of birth.',
      );
    }
  };

  // ============================================================
  // NOTIFICATION ICON
  // ============================================================

  const handleNotificationClick = () => {
    setShowNotifications((previous) => !previous);
    setShowProfileMenu(false);
  };

  // ============================================================
  // PROFILE ICON
  // ============================================================

  const handleProfileClick = () => {
    setShowProfileMenu((previous) => !previous);
    setShowNotifications(false);
  };

  return (
    <>
      {/* =========================================================
          NAVBAR
      ========================================================== */}

      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white">
        <div className="flex min-h-18 w-full items-center gap-3 px-3 sm:px-5 lg:px-7">
          {/* =====================================================
              BRAND
          ====================================================== */}

          <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm sm:h-11 sm:w-11">
              <CheckCircle2 size={23} strokeWidth={2.2} />
            </div>

            <div className="hidden min-w-0 md:block">
              <h1 className="truncate text-base font-bold text-slate-900 sm:text-lg">
                Task Assigned System
              </h1>
            </div>
          </div>

          {/* =====================================================
              SEARCH BAR
          ====================================================== */}

          <div className="mx-auto flex min-w-0 flex-1 justify-center">
            <div className="relative w-full max-w-xl">
              <Search
                size={19}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={searchValue}
                onChange={(event) => {
                  if (typeof onSearchChange === 'function') {
                    onSearchChange(event.target.value);
                  }
                }}
                placeholder="Search tasks..."
                aria-label="Search tasks"
                className="
                  h-11
                  w-full
                  rounded-full
                  border
                  border-slate-200
                  bg-slate-100
                  pl-11
                  pr-4
                  text-sm
                  text-slate-800
                  outline-none
                  transition
                  placeholder:text-slate-400
                  focus:border-blue-300
                  focus:bg-white
                  focus:ring-4
                  focus:ring-blue-100
                  sm:h-12
                  sm:text-base
                "
              />
            </div>
          </div>

          {/* =====================================================
              RIGHT SIDE
          ====================================================== */}

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
            {/* ===================================================
                NOTIFICATIONS
            ==================================================== */}

            <div ref={notificationRef} className="relative">
              <button
                type="button"
                onClick={handleNotificationClick}
                aria-label="Notifications"
                aria-expanded={showNotifications}
                className="
                  relative
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-full
                  text-slate-600
                  transition
                  hover:bg-slate-100
                  hover:text-slate-900
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-200
                  sm:h-11
                  sm:w-11
                "
              >
                <Bell size={21} />

                {notificationCount > 0 && (
                  <span
                    className="
                      absolute
                      right-0
                      top-0
                      flex
                      min-h-4.75
                      min-w-4.75
                      items-center
                      justify-center
                      rounded-full
                      bg-red-500
                      px-1
                      text-[10px]
                      font-bold
                      leading-none
                      text-white
                      ring-2
                      ring-white
                    "
                  >
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </button>

              {/* =================================================
                  NOTIFICATION DROPDOWN
              ================================================== */}

              {showNotifications && (
                <div
                  className="
                    absolute
                    right-0
                    top-[calc(100%+10px)]
                    z-50
                    w-[calc(100vw-24px)]
                    max-w-102.5
                    overflow-hidden
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    shadow-2xl
                  "
                >
                  {/* Header */}

                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
                    <div>
                      <h3 className="text-sm font-bold tracking-wide text-slate-900">
                        NOTIFICATIONS
                        {notificationCount > 0 && ` (${notificationCount})`}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowNotifications(false);

                        if (typeof onViewAllNotifications === 'function') {
                          onViewAllNotifications();
                        }
                      }}
                      className="
                        text-sm
                        font-medium
                        text-blue-600
                        transition
                        hover:text-blue-700
                      "
                    >
                      View All →
                    </button>
                  </div>

                  {/* Notification List */}

                  <div className="max-h-95 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.slice(0, 6).map((notification) => (
                        <div
                          key={
                            notification._id ||
                            notification.id ||
                            `${notification.title}-${notification.createdAt}`
                          }
                          className="
                            border-b
                            border-slate-100
                            px-4
                            py-4
                            transition
                            hover:bg-slate-50
                          "
                        >
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900">
                              {notification.title ||
                                notification.type ||
                                'Notification'}
                            </h4>

                            <span className="shrink-0 text-[11px] text-slate-400">
                              {notification.time || notification.timeAgo || ''}
                            </span>
                          </div>

                          <p className="mt-1 text-sm leading-5 text-slate-600">
                            {notification.message ||
                              notification.description ||
                              notification.body ||
                              ''}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="px-5 py-10 text-center">
                        <Bell size={30} className="mx-auto text-slate-300" />

                        <p className="mt-3 text-sm font-medium text-slate-500">
                          No notifications
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Bottom Button */}

                  <div className="bg-slate-50 p-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowNotifications(false);

                        if (typeof onViewAllNotifications === 'function') {
                          onViewAllNotifications();
                        }
                      }}
                      className="
                        flex
                        w-full
                        items-center
                        justify-center
                        rounded-xl
                        bg-blue-50
                        px-4
                        py-3
                        text-sm
                        font-semibold
                        text-blue-600
                        transition
                        hover:bg-blue-100
                      "
                    >
                      Open Notification Center →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ===================================================
                PROFILE
            ==================================================== */}

            <div ref={profileRef} className="relative">
              <button
                type="button"
                onClick={handleProfileClick}
                aria-label="Profile"
                aria-expanded={showProfileMenu}
                className="
                  flex
                  items-center
                  gap-1
                  rounded-full
                  p-1
                  transition
                  hover:bg-slate-100
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-200
                "
              >
                <div
                  className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-full
                    bg-blue-600
                    text-sm
                    font-bold
                    text-white
                    shadow-sm
                    sm:h-11
                    sm:w-11
                  "
                >
                  {initials || <User size={20} />}
                </div>

                <ChevronDown
                  size={16}
                  className="hidden text-slate-400 sm:block"
                />
              </button>

              {/* =================================================
                  PROFILE MENU
              ================================================== */}

              {showProfileMenu && (
                <div
                  className="
                    absolute
                    right-0
                    top-[calc(100%+10px)]
                    z-50
                    w-64
                    overflow-hidden
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    shadow-2xl
                  "
                >
                  <div className="border-b border-slate-100 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="
                          flex
                          h-11
                          w-11
                          shrink-0
                          items-center
                          justify-center
                          rounded-full
                          bg-blue-600
                          text-sm
                          font-bold
                          text-white
                        "
                      >
                        {initials || <User size={20} />}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {fullName}
                        </p>

                        <p className="truncate text-xs text-slate-500">
                          {email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        setDateOfBirth(
                          user?.dateOfBirth
                            ? String(user.dateOfBirth).slice(0, 10)
                            : '',
                        );
                        setShowProfilePopup(true);
                      }}
                      className="
                        flex
                        w-full
                        items-center
                        gap-3
                        rounded-xl
                        px-3
                        py-3
                        text-left
                        text-sm
                        font-medium
                        text-slate-700
                        transition
                        hover:bg-slate-50
                      "
                    >
                      <User size={18} className="text-slate-500" />

                      <span>My Profile</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);

                        if (typeof onLogout === 'function') {
                          onLogout();
                        }
                      }}
                      className="
                        flex
                        w-full
                        items-center
                        gap-3
                        rounded-xl
                        px-3
                        py-3
                        text-left
                        text-sm
                        font-medium
                        text-red-600
                        transition
                        hover:bg-red-50
                      "
                    >
                      <LogOut size={18} />

                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ===========================================================
          PROFILE POPUP
      =========================================================== */}

      {showProfilePopup && (
        <div
          className="
            fixed
            inset-0
            z-100
            flex
            items-center
            justify-center
            bg-slate-900/50
            p-4
            backdrop-blur-sm
          "
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowProfilePopup(false);
            }
          }}
        >
          <div
            className="
              w-full
              max-w-md
              overflow-hidden
              rounded-2xl
              bg-white
              shadow-2xl
            "
          >
            {/* Popup Header */}

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">My Profile</h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  View your account information
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowProfilePopup(false)}
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-full
                  text-slate-500
                  transition
                  hover:bg-slate-100
                  hover:text-slate-800
                "
                aria-label="Close profile"
              >
                <X size={19} />
              </button>
            </div>

            {/* Profile Content */}

            <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
              {/* Full Name */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Full Name
                </label>

                <input
                  type="text"
                  value={fullName}
                  readOnly
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-slate-50
                    px-4
                    py-3
                    text-sm
                    font-medium
                    text-slate-700
                    outline-none
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
                  value={email}
                  readOnly
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-200
                    bg-slate-50
                    px-4
                    py-3
                    text-sm
                    font-medium
                    text-slate-700
                    outline-none
                  "
                />
              </div>

              {/* Date Of Birth */}

              <div>
                <label
                  htmlFor="employee-date-of-birth"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Date of Birth
                </label>

                <div className="relative">
                  <CalendarDays
                    size={18}
                    className="
                      pointer-events-none
                      absolute
                      left-4
                      top-1/2
                      -translate-y-1/2
                      text-slate-400
                    "
                  />

                  <input
                    id="employee-date-of-birth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(event) => setDateOfBirth(event.target.value)}
                    className="
                      w-full
                      rounded-xl
                      border
                      border-slate-300
                      bg-white
                      px-4
                      py-3
                      pl-11
                      text-sm
                      text-slate-800
                      outline-none
                      transition
                      focus:border-blue-400
                      focus:ring-4
                      focus:ring-blue-100
                    "
                  />
                </div>

                <p className="mt-2 text-xs text-slate-400">
                  You can edit only your date of birth.
                </p>
              </div>
            </div>

            {/* Popup Actions */}

            <div
              className="
                flex
                flex-col-reverse
                gap-3
                border-t
                border-slate-100
                bg-slate-50
                px-5
                py-4
                sm:flex-row
                sm:justify-end
                sm:px-6
              "
            >
              <button
                type="button"
                onClick={() => setShowProfilePopup(false)}
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  px-5
                  py-3
                  text-sm
                  font-semibold
                  text-slate-700
                  transition
                  hover:bg-slate-100
                  sm:w-auto
                "
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveDateOfBirth}
                className="
                  w-full
                  rounded-xl
                  bg-blue-600
                  px-5
                  py-3
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-blue-700
                  focus:outline-none
                  focus:ring-4
                  focus:ring-blue-100
                  sm:w-auto
                "
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EmployeeNavbar;
