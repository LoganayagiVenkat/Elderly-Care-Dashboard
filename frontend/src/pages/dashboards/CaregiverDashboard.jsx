import Caregivers from '../Caregivers.jsx';

/**
 * Unified Caregiver Dashboard
 * Re-exports the unified Caregivers implementation with isDashboard=true
 * so no duplicate caregiver component or logic exists in the codebase.
 */
export default function CaregiverDashboard() {
  return <Caregivers isDashboard={true} />;
}
