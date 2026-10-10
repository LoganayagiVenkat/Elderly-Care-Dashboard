import { Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import RoleBasedRoute from './components/RoleBasedRoute.jsx';
import AppLayout from './components/AppLayout.jsx';
import { ROUTE_PERMISSIONS } from './data/roleConfig.js';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Elderly from './pages/Elderly.jsx';
import ElderlyProfile from './pages/ElderlyProfile.jsx';
import CareDependencyMap from './pages/CareDependencyMap.jsx';
import Health from './pages/Health.jsx';
import Medications from './pages/Medications.jsx';
import Appointments from './pages/Appointments.jsx';
import Doctor from './pages/Doctor.jsx';
import Caregivers from './pages/Caregivers.jsx';
import CarePlans from './pages/CarePlans.jsx';
import Schedule from './pages/Schedule.jsx';
import Emergency from './pages/Emergency.jsx';
import Activities from './pages/Activities.jsx';
import Reports from './pages/Reports.jsx';
import Documents from './pages/Documents.jsx';
import Notifications from './pages/Notifications.jsx';
import Chatbot from './pages/Chatbot.jsx';
import Voicemails from './pages/Voicemails.jsx';
import WhatsApp from './pages/WhatsApp.jsx';
import Settings from './pages/Settings.jsx';
import GoogleAccountChooserPage from './pages/GoogleAccountChooserPage.jsx';
import NotFound from './pages/NotFound.jsx';

function guarded(path, element) {
  return <RoleBasedRoute roles={ROUTE_PERMISSIONS[path]}>{element}</RoleBasedRoute>;
}

export default function App() {
  return (
    <AppProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/google-account-chooser" element={<GoogleAccountChooserPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={guarded('/dashboard', <Dashboard />)} />
            <Route path="/elderly" element={guarded('/elderly', <Elderly />)} />
            <Route path="/elderly/:id" element={guarded('/elderly/:id', <ElderlyProfile />)} />
            <Route path="/care-dependency-map" element={guarded('/care-dependency-map', <CareDependencyMap />)} />
            <Route path="/health" element={guarded('/health', <Health />)} />
            <Route path="/medications" element={guarded('/medications', <Medications />)} />
            <Route path="/appointments" element={guarded('/appointments', <Appointments />)} />
            <Route path="/doctor" element={guarded('/doctor', <Doctor />)} />
            <Route path="/caregivers" element={guarded('/caregivers', <Caregivers />)} />
            <Route path="/care-plans" element={guarded('/care-plans', <CarePlans />)} />
            <Route path="/schedule" element={guarded('/schedule', <Schedule />)} />
            <Route path="/emergency" element={guarded('/emergency', <Emergency />)} />
            <Route path="/activities" element={guarded('/activities', <Activities />)} />
            <Route path="/reports" element={guarded('/reports', <Reports />)} />
            <Route path="/documents" element={guarded('/documents', <Documents />)} />
            <Route path="/notifications" element={guarded('/notifications', <Notifications />)} />
            <Route path="/chatbot" element={guarded('/chatbot', <Chatbot />)} />
            <Route path="/voicemails" element={guarded('/voicemails', <Voicemails />)} />
            <Route path="/whatsapp" element={guarded('/whatsapp', <WhatsApp />)} />
            <Route path="/messages" element={guarded('/messages', <WhatsApp />)} />
            <Route path="/settings" element={guarded('/settings', <Settings />)} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppProvider>
  );
}
