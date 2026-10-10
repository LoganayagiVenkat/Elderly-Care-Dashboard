// ============================================================
// Per-role navigation + route permissions.
// One place to define what each of the five roles can see and do,
// instead of scattering role checks across every component.
// ============================================================
import {
  LayoutDashboard, Users, ClipboardPlus, Pill, CalendarClock, UserCog,
  ClipboardList, Sparkles, Clock3, Siren, BarChart3, FolderOpen, Bell,
  Bot, Settings, NotebookPen, GitFork, Stethoscope, Mic, MessageSquare,
} from 'lucide-react';

export const ROLE_LABELS = {
  admin: 'Administrator',
  doctor: 'Medical Doctor',
  caregiver: 'Caregiver',
  family: 'Family Member',
  patient: 'Patient',
};

// Every path in the app, tagged with the roles allowed to open it.
// Used by RoleBasedRoute to block direct URL access, not just to
// hide sidebar links.
export const ROUTE_PERMISSIONS = {
  '/dashboard': ['admin', 'doctor', 'caregiver', 'family', 'patient'],
  '/doctor': ['admin', 'doctor'],
  '/elderly': ['admin', 'doctor', 'caregiver'],
  '/elderly/:id': ['admin', 'doctor', 'caregiver', 'family', 'patient'],
  '/care-dependency-map': ['admin', 'doctor', 'caregiver', 'family', 'patient'],
  '/health': ['admin', 'doctor', 'caregiver', 'family', 'patient'],
  '/medications': ['admin', 'doctor', 'caregiver', 'family', 'patient'],
  '/appointments': ['admin', 'doctor', 'caregiver', 'family', 'patient'],
  '/caregivers': ['admin', 'caregiver'],
  '/care-plans': ['admin', 'doctor', 'caregiver', 'family', 'patient'],
  '/schedule': ['admin', 'doctor', 'caregiver', 'family', 'patient'],
  '/emergency': ['admin', 'doctor', 'caregiver', 'family', 'patient'],
  '/activities': ['admin', 'doctor', 'caregiver', 'family', 'patient'],
  '/reports': ['admin', 'doctor'],
  '/documents': ['admin', 'doctor', 'caregiver', 'family', 'patient'],
  '/notifications': ['admin', 'doctor', 'caregiver', 'family', 'patient'],
  '/chatbot': ['admin', 'doctor', 'caregiver', 'family', 'patient'],
  '/voicemails': ['admin', 'doctor', 'caregiver', 'family', 'patient'],
  '/whatsapp': ['admin', 'doctor', 'caregiver', 'family', 'patient'],
  '/messages': ['admin', 'doctor', 'caregiver', 'family', 'patient'],
  '/settings': ['admin', 'doctor', 'caregiver', 'family', 'patient'],
};

// Sidebar navigation, grouped by section, per role.
export function getNavSections(role) {
  const dashboard = { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard };
  const doctorNav = { to: '/doctor', label: 'Doctor', icon: Stethoscope };
  const caregiversNav = { to: '/caregivers', label: 'Care Team', icon: UserCog };
  const careDependencyMap = { to: '/care-dependency-map', label: 'Care Dependency Map', icon: GitFork };
  const medications = { to: '/medications', label: 'Medications', icon: Pill };
  const appointments = { to: '/appointments', label: 'Appointments', icon: CalendarClock };
  const activities = { to: '/activities', label: 'Activities', icon: Sparkles };
  const schedule = { to: '/schedule', label: 'Daily Schedule', icon: Clock3 };
  const emergency = { to: '/emergency', label: 'Emergency', icon: Siren };
  const notifications = { to: '/notifications', label: 'Notifications', icon: Bell, badgeKey: 'unread' };
  const chatbot = { to: '/chatbot', label: 'Care Assistant', icon: Bot };
  const voicemails = { to: '/voicemails', label: 'Voice Mails', icon: Mic, badgeKey: 'voicemails' };
  const whatsapp = { to: '/whatsapp', label: 'Messages', icon: MessageSquare };
  const settings = { to: '/settings', label: 'Settings', icon: Settings };
  const careRecords = { to: '/health', label: 'Care Records', icon: ClipboardPlus };
  const documents = { to: '/documents', label: 'Documents', icon: FolderOpen };
  const carePlans = { to: '/care-plans', label: 'Care Plans', icon: ClipboardList };

  if (role === 'admin') {
    return [
      { label: 'Main', items: [dashboard, { to: '/elderly', label: 'Elderly Profiles', icon: Users }, careDependencyMap, careRecords, medications, appointments] },
      { label: 'Care & Staff', items: [caregiversNav, doctorNav, carePlans, activities, schedule] },
      { label: 'Management', items: [emergency, { to: '/reports', label: 'Reports', icon: BarChart3 }, documents, notifications, voicemails, whatsapp, chatbot] },
      { label: 'System', items: [settings] },
    ];
  }

  if (role === 'doctor') {
    return [
      { label: 'Main', items: [dashboard, { to: '/elderly', label: 'Assigned Residents', icon: Users }, careDependencyMap, careRecords, medications, appointments] },
      { label: 'Clinical', items: [carePlans, activities, schedule, { to: '/documents', label: 'Clinical Notes', icon: FolderOpen }] },
      { label: 'Management', items: [emergency, notifications, voicemails, whatsapp, chatbot] },
      { label: 'System', items: [settings] },
    ];
  }

  if (role === 'caregiver') {
    return [
      { label: 'Main', items: [dashboard, { to: '/elderly', label: 'Assigned Elderly', icon: Users }, careDependencyMap, careRecords, medications, appointments] },
      { label: 'Care', items: [carePlans, activities, schedule, { to: '/documents', label: 'Care & Handover Notes', icon: NotebookPen }] },
      { label: 'Management', items: [emergency, notifications, voicemails, whatsapp, chatbot] },
      { label: 'System', items: [settings] },
    ];
  }

  if (role === 'family') {
    return [
      { label: 'Main', items: [dashboard, { to: '/elderly/:me', label: 'My Elderly Member', icon: Users }, careDependencyMap, careRecords, medications, appointments] },
      { label: 'Care', items: [carePlans, activities, documents] },
      { label: 'Management', items: [emergency, notifications, voicemails, whatsapp, chatbot] },
      { label: 'System', items: [settings] },
    ];
  }

  // patient
  return [
    { label: 'Main', items: [dashboard, careDependencyMap, medications, appointments, activities] },
    { label: 'Care', items: [schedule, careRecords, { to: '/care-plans', label: 'Care Instructions', icon: ClipboardList }] },
    { label: 'Management', items: [emergency, notifications, voicemails, whatsapp, chatbot] },
    { label: 'System', items: [settings] },
  ];
}

