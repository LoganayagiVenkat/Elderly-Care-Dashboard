import { useApp } from '../context/AppContext.jsx';
import AdminDashboard from './dashboards/AdminDashboard.jsx';
import DoctorDashboard from './dashboards/DoctorDashboard.jsx';
import CaregiverDashboard from './dashboards/CaregiverDashboard.jsx';
import FamilyDashboard from './dashboards/FamilyDashboard.jsx';
import PatientDashboard from './dashboards/PatientDashboard.jsx';

// Role-based Dashboards:
// Each role gets a genuinely specialized clinical and operational dashboard:
// - Admin: facility-wide management, caregiver workloads, reports
// - Doctor: doctor station, assigned residents, clinical appointments, follow-ups, emergencies, availability
// - Caregiver: daily care operations, care tasks, medications, schedule, staff directory
// - Family: loved one vitals, medication adherence, documents
// - Patient: personal daily schedule, medications, care instructions
export default function Dashboard() {
  const { user } = useApp();

  if (!user) return null;

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'doctor':
      return <DoctorDashboard />;
    case 'caregiver':
      return <CaregiverDashboard />;
    case 'family':
      return <FamilyDashboard />;
    case 'patient':
      return <PatientDashboard />;
    default:
      return <DoctorDashboard />;
  }
}
