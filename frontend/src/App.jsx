import React from 'react';

import { BrowserRouter, Routes, Route } from 'react-router-dom';
//import Signup from './assets/pages/Signup';
import Login from './assets/pages/Login';
import HRDashboard from './assets/pages/HRDashboard';
import EmployeeDashboard from './assets/pages/EmployeeDashboard';
import PendingAssignedTasks from './assets/pages/PendingAssignedTasks';
import InProgressAssignedTasks from './assets/pages/InProgressAssignedTasks';
import CompletedAssignedTasks from './assets/pages/CompletedAssignedTasks';
import AdminDashboard from './assets/pages/AdminDashboard';
import ForgotPassword from './assets/pages/ForgotPassword';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/hr-dashboard" element={<HRDashboard />} />
        <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/assigned-tasks/pending"
          element={<PendingAssignedTasks />}
        />

        <Route
          path="/assigned-tasks/in-progress"
          element={<InProgressAssignedTasks />}
        />

        <Route
          path="/assigned-tasks/completed"
          element={<CompletedAssignedTasks />}
        />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
