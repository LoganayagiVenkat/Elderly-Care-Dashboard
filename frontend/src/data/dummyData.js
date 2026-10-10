// ============================================================
// ElderCare — Demo data with dynamic date anchoring.
// Dates are computed relative to today's real clock so that
// on each day, appointments, schedules, and assessments are
// completely accurate and synchronized.
// ============================================================
import { getRelativeISO, getRelativeFormatted } from '../utils/dateUtils.js';


export const currentUser = {
  name: 'Priya Nair',
  role: 'Senior Caregiver',
  initials: 'PN',
  email: 'priya.nair@eldercare.demo',
};

export const elderlyResidents = [
  {
    id: 'EC-001',
    name: 'Lakshmi Devi',
    initials: 'LD',
    age: 78,
    gender: 'Female',
    status: 'stable',
    room: 'Willow Room 4',
    caregiver: 'Priya Nair',
    lastAssessment: getRelativeFormatted(-1),
    condition: 'Hypertension, Mild Arthritis',
    bloodGroup: 'B+',
    admitted: '12 Jan 2024',
    emergencyContact: 'Ramesh Devi · Son · +91 98410 22311',
    notes: 'Prefers morning walks. Follows a low-sodium diet plan.',
  },
  {
    id: 'EC-002',
    name: 'Meenakshi Raman',
    initials: 'MR',
    age: 82,
    gender: 'Female',
    status: 'attention',
    room: 'Sage Room 2',
    caregiver: 'Anand Raj',
    lastAssessment: getRelativeFormatted(-2),
    condition: 'Vitamin D Deficiency, Osteoporosis',
    bloodGroup: 'O+',
    admitted: '03 Mar 2023',
    emergencyContact: 'Kavitha Raman · Daughter · +91 90031 55210',
    notes: 'Requires assistance with mobility. Uses a walking frame.',
  },
  {
    id: 'EC-003',
    name: 'Raghavan Kumar',
    initials: 'RK',
    age: 75,
    gender: 'Male',
    status: 'stable',
    room: 'Willow Room 1',
    caregiver: 'Deepa Suresh',
    lastAssessment: getRelativeFormatted(0),
    condition: 'Type 2 Diabetes',
    bloodGroup: 'A+',
    admitted: '22 Jul 2022',
    emergencyContact: 'Suresh Kumar · Son · +91 99400 11876',
    notes: 'Monitors blood sugar twice daily. Enjoys gardening activities.',
  },
  {
    id: 'EC-004',
    name: 'Subramaniam Iyer',
    initials: 'SI',
    age: 80,
    gender: 'Male',
    status: 'critical',
    room: 'Sage Room 5',
    caregiver: 'Anand Raj',
    lastAssessment: getRelativeFormatted(0),
    condition: 'Cardiac Arrhythmia, High Cholesterol',
    bloodGroup: 'AB+',
    admitted: '09 Sep 2021',
    emergencyContact: 'Lakshmi Iyer · Wife · +91 94440 76321',
    notes: 'Under close cardiac monitoring. On statin therapy.',
  },
  {
    id: 'EC-005',
    name: 'Anitha Sundaram',
    initials: 'AS',
    age: 71,
    gender: 'Female',
    status: 'stable',
    room: 'Willow Room 6',
    caregiver: 'Deepa Suresh',
    lastAssessment: getRelativeFormatted(-3),
    condition: 'Mild Cognitive Decline',
    bloodGroup: 'B-',
    admitted: '14 Nov 2024',
    emergencyContact: 'Arjun Sundaram · Son · +91 98940 22011',
    notes: 'Participates actively in memory-care activities and music therapy.',
  },
  {
    id: 'EC-006',
    name: 'Govind Pillai',
    initials: 'GP',
    age: 84,
    gender: 'Male',
    status: 'attention',
    room: 'Sage Room 1',
    caregiver: 'Priya Nair',
    lastAssessment: getRelativeFormatted(-1),
    condition: 'Chronic Kidney Disease Stage 2',
    bloodGroup: 'O-',
    admitted: '30 May 2023',
    emergencyContact: 'Radha Pillai · Daughter · +91 97890 44532',
    notes: 'Fluid intake closely monitored. Weekly nephrology review.',
  },
];

export const caregivers = [
  {
    id: 'CG-01',
    name: 'Priya Nair',
    initials: 'PN',
    role: 'Senior Caregiver',
    experience: '9 years',
    assigned: 2,
    availability: 'On Duty',
    status: 'active',
    shift: 'Morning · 7:00 AM – 3:00 PM',
    phone: '+91 98400 11223',
  },
  {
    id: 'CG-02',
    name: 'Anand Raj',
    initials: 'AR',
    role: 'Care Assistant',
    experience: '4 years',
    assigned: 2,
    availability: 'On Duty',
    status: 'active',
    shift: 'Morning · 7:00 AM – 3:00 PM',
    phone: '+91 90441 88732',
  },
  {
    id: 'CG-03',
    name: 'Deepa Suresh',
    initials: 'DS',
    role: 'Care Assistant',
    experience: '6 years',
    assigned: 2,
    availability: 'On Duty',
    status: 'active',
    shift: 'Afternoon · 3:00 PM – 11:00 PM',
    phone: '+91 93450 22187',
  },
  {
    id: 'CG-04',
    name: 'Vikram Menon',
    initials: 'VM',
    role: 'Registered Nurse',
    experience: '11 years',
    assigned: 6,
    availability: 'On Call',
    status: 'active',
    shift: 'Night · 11:00 PM – 7:00 AM',
    phone: '+91 99870 65410',
  },
  {
    id: 'CG-05',
    name: 'Kavitha Reddy',
    initials: 'KR',
    role: 'Physiotherapist',
    experience: '7 years',
    assigned: 4,
    availability: 'Off Duty',
    status: 'inactive',
    shift: 'Visits · Tue, Thu, Sat',
    phone: '+91 91234 55678',
  },
  {
    id: 'CG-06',
    name: 'Suresh Babu',
    initials: 'SB',
    role: 'Care Coordinator',
    experience: '13 years',
    assigned: 6,
    availability: 'On Duty',
    status: 'active',
    shift: 'Morning · 8:00 AM – 4:00 PM',
    phone: '+91 96780 34521',
  },
];

export const medications = [
  // EC-001: Lakshmi Devi (10 Medications)
  { id: 'MED-LD-01', time: '07:00 AM', slot: 'Morning Medication', patient: 'Lakshmi Devi', patientId: 'EC-001', initials: 'LD', medicine: 'Pantoprazole', dosage: '40 mg', frequency: 'Once Daily (Fasting)', instructions: 'Take 30 minutes before breakfast to prevent gastric acidity.', prescribedBy: 'Dr. Preeti Deshmukh', startDate: '2026-01-10', endDate: '2026-12-31', status: 'completed' },
  { id: 'MED-LD-02', time: '08:00 AM', slot: 'Morning Medication', patient: 'Lakshmi Devi', patientId: 'EC-001', initials: 'LD', medicine: 'Amlodipine', dosage: '5 mg', frequency: 'Once Daily', instructions: 'Take with water after breakfast to control blood pressure.', prescribedBy: 'Dr. Kavya Menon', startDate: '2026-01-10', endDate: '2026-12-31', status: 'completed' },
  { id: 'MED-LD-03', time: '08:30 AM', slot: 'Morning Medication', patient: 'Lakshmi Devi', patientId: 'EC-001', initials: 'LD', medicine: 'Telmisartan', dosage: '40 mg', frequency: 'Once Daily', instructions: 'Take after breakfast for 24-hour BP stabilization.', prescribedBy: 'Dr. Kavya Menon', startDate: '2026-01-10', endDate: '2026-12-31', status: 'completed' },
  { id: 'MED-LD-04', time: '09:00 AM', slot: 'Morning Medication', patient: 'Lakshmi Devi', patientId: 'EC-001', initials: 'LD', medicine: 'Hydrochlorothiazide', dosage: '12.5 mg', frequency: 'Once Daily', instructions: 'Diuretic for synergistic blood pressure regulation.', prescribedBy: 'Dr. Kavya Menon', startDate: '2026-02-01', endDate: '2026-12-31', status: 'completed' },
  { id: 'MED-LD-05', time: '01:30 PM', slot: 'Afternoon Medication', patient: 'Lakshmi Devi', patientId: 'EC-001', initials: 'LD', medicine: 'Paracetamol', dosage: '650 mg', frequency: 'As Needed', instructions: 'Take after lunch for joint and knee pain relief.', prescribedBy: 'Dr. Sunita Bhatt', startDate: '2026-02-01', endDate: '2026-06-30', status: 'pending' },
  { id: 'MED-LD-06', time: '02:00 PM', slot: 'Afternoon Medication', patient: 'Lakshmi Devi', patientId: 'EC-001', initials: 'LD', medicine: 'Glucosamine Chondroitin', dosage: '500 mg', frequency: 'Once Daily', instructions: 'Joint cartilage support. Take with plenty of water.', prescribedBy: 'Dr. Rajesh Sharma', startDate: '2026-01-15', endDate: '2026-12-31', status: 'pending' },
  { id: 'MED-LD-07', time: '03:30 PM', slot: 'Afternoon Medication', patient: 'Lakshmi Devi', patientId: 'EC-001', initials: 'LD', medicine: 'Diclofenac Gel', dosage: '1% w/w', frequency: 'Twice Daily (Topical)', instructions: 'Apply gently on both knee joints. Do not massage vigorously.', prescribedBy: 'Dr. Rajesh Sharma', startDate: '2026-02-15', endDate: '2026-12-31', status: 'completed' },
  { id: 'MED-LD-08', time: '08:30 PM', slot: 'Evening Medication', patient: 'Lakshmi Devi', patientId: 'EC-001', initials: 'LD', medicine: 'Atorvastatin', dosage: '10 mg', frequency: 'Once Daily', instructions: 'Take after dinner for cholesterol control and vascular protection.', prescribedBy: 'Dr. Kavya Menon', startDate: '2026-01-10', endDate: '2026-12-31', status: 'upcoming' },
  { id: 'MED-LD-09', time: '09:30 PM', slot: 'Night Medication', patient: 'Lakshmi Devi', patientId: 'EC-001', initials: 'LD', medicine: 'Calcium + Vitamin D3', dosage: '500 mg', frequency: 'Once Daily', instructions: 'Take with warm milk before bed for bone strength.', prescribedBy: 'Dr. Sunita Bhatt', startDate: '2026-01-10', endDate: '2026-12-31', status: 'upcoming' },
  { id: 'MED-LD-10', time: '10:00 PM', slot: 'Night Medication', patient: 'Lakshmi Devi', patientId: 'EC-001', initials: 'LD', medicine: 'Methylcobalamin (B12)', dosage: '1500 mcg', frequency: 'Once Daily', instructions: 'Nerve health and peripheral neuropathy support before sleep.', prescribedBy: 'Dr. Sunita Bhatt', startDate: '2026-01-10', endDate: '2026-12-31', status: 'upcoming' },

  // EC-002: Meenakshi Raman (10 Medications)
  { id: 'MED-MR-01', time: '07:30 AM', slot: 'Morning Medication', patient: 'Meenakshi Raman', patientId: 'EC-002', initials: 'MR', medicine: 'Alendronate Sodium', dosage: '70 mg', frequency: 'Once Weekly', instructions: 'Take fasting with full glass of water. Do not lie down for 30 mins.', prescribedBy: 'Dr. Sunita Bhatt', startDate: '2026-01-01', endDate: '2026-12-31', status: 'completed' },
  { id: 'MED-MR-02', time: '08:30 AM', slot: 'Morning Medication', patient: 'Meenakshi Raman', patientId: 'EC-002', initials: 'MR', medicine: 'Calcium Carbonate', dosage: '600 mg', frequency: 'Twice Daily', instructions: 'Take with morning breakfast for bone density recovery.', prescribedBy: 'Dr. Sunita Bhatt', startDate: '2026-01-01', endDate: '2026-12-31', status: 'completed' },
  { id: 'MED-MR-03', time: '09:15 AM', slot: 'Morning Medication', patient: 'Meenakshi Raman', patientId: 'EC-002', initials: 'MR', medicine: 'Teriparatide Subcutaneous', dosage: '20 mcg', frequency: 'Once Daily', instructions: 'Subcutaneous injection for advanced osteoporosis bone building.', prescribedBy: 'Dr. Rajesh Sharma', startDate: '2026-02-01', endDate: '2026-12-31', status: 'completed' },
  { id: 'MED-MR-04', time: '10:00 AM', slot: 'Morning Medication', patient: 'Meenakshi Raman', patientId: 'EC-002', initials: 'MR', medicine: 'Collagen Peptides', dosage: '10 g', frequency: 'Once Daily', instructions: 'Dissolve in water/juice for tendon and joint structural support.', prescribedBy: 'Dr. Rajesh Sharma', startDate: '2026-01-15', endDate: '2026-12-31', status: 'completed' },
  { id: 'MED-MR-05', time: '01:00 PM', slot: 'Afternoon Medication', patient: 'Meenakshi Raman', patientId: 'EC-002', initials: 'MR', medicine: 'Vitamin D3 (Cholecalciferol)', dosage: '60,000 IU', frequency: 'Once Weekly', instructions: 'Take with lunch for severe vitamin D deficiency replenishment.', prescribedBy: 'Dr. Sunita Bhatt', startDate: '2026-01-01', endDate: '2026-12-31', status: 'pending' },
  { id: 'MED-MR-06', time: '02:00 PM', slot: 'Afternoon Medication', patient: 'Meenakshi Raman', patientId: 'EC-002', initials: 'MR', medicine: 'Calcitriol', dosage: '0.25 mcg', frequency: 'Once Daily', instructions: 'Promotes active intestinal calcium absorption and bone mineral uptake.', prescribedBy: 'Dr. Arvind Rao', startDate: '2026-01-15', endDate: '2026-12-31', status: 'pending' },
  { id: 'MED-MR-07', time: '03:00 PM', slot: 'Afternoon Medication', patient: 'Meenakshi Raman', patientId: 'EC-002', initials: 'MR', medicine: 'Paracetamol', dosage: '500 mg', frequency: 'As Needed', instructions: 'Mild analgesic for physiotherapy aches and walking mobility comfort.', prescribedBy: 'Dr. Sunita Bhatt', startDate: '2026-02-01', endDate: '2026-06-30', status: 'pending' },
  { id: 'MED-MR-08', time: '07:30 PM', slot: 'Evening Medication', patient: 'Meenakshi Raman', patientId: 'EC-002', initials: 'MR', medicine: 'Calcium Carbonate', dosage: '600 mg', frequency: 'Twice Daily', instructions: 'Evening dose. Take with dinner for continuous calcium absorption.', prescribedBy: 'Dr. Sunita Bhatt', startDate: '2026-01-01', endDate: '2026-12-31', status: 'upcoming' },
  { id: 'MED-MR-09', time: '09:00 PM', slot: 'Night Medication', patient: 'Meenakshi Raman', patientId: 'EC-002', initials: 'MR', medicine: 'Methylcobalamin (B12)', dosage: '1500 mcg', frequency: 'Once Daily', instructions: 'Take at bedtime for nerve strength, balance, and fall prevention.', prescribedBy: 'Dr. Sunita Bhatt', startDate: '2026-01-01', endDate: '2026-12-31', status: 'upcoming' },
  { id: 'MED-MR-10', time: '09:30 PM', slot: 'Night Medication', patient: 'Meenakshi Raman', patientId: 'EC-002', initials: 'MR', medicine: 'Magnesium Glycinate', dosage: '250 mg', frequency: 'Once Daily', instructions: 'Supports bone matrix mineralization and eases nocturnal muscle cramps.', prescribedBy: 'Dr. Rajesh Sharma', startDate: '2026-01-10', endDate: '2026-12-31', status: 'upcoming' },

  // EC-003: Raghavan Kumar (10 Medications)
  { id: 'MED-RK-01', time: '07:45 AM', slot: 'Morning Medication', patient: 'Raghavan Kumar', patientId: 'EC-003', initials: 'RK', medicine: 'Glimepiride', dosage: '1 mg', frequency: 'Once Daily', instructions: 'Take 15 mins before breakfast for fasting glycemic control.', prescribedBy: 'Dr. Arvind Rao', startDate: '2026-01-01', endDate: '2026-12-31', status: 'completed' },
  { id: 'MED-RK-02', time: '08:00 AM', slot: 'Morning Medication', patient: 'Raghavan Kumar', patientId: 'EC-003', initials: 'RK', medicine: 'Dapagliflozin', dosage: '10 mg', frequency: 'Once Daily', instructions: 'SGLT2 inhibitor for glucose excretion and cardio-renal benefit.', prescribedBy: 'Dr. Arvind Rao', startDate: '2026-01-10', endDate: '2026-12-31', status: 'completed' },
  { id: 'MED-RK-03', time: '08:30 AM', slot: 'Morning Medication', patient: 'Raghavan Kumar', patientId: 'EC-003', initials: 'RK', medicine: 'Metformin (SR)', dosage: '500 mg', frequency: 'Twice Daily', instructions: 'Take with breakfast. Do not chew or crush sustained-release tablet.', prescribedBy: 'Dr. Arvind Rao', startDate: '2026-01-01', endDate: '2026-12-31', status: 'completed' },
  { id: 'MED-RK-04', time: '09:00 AM', slot: 'Morning Medication', patient: 'Raghavan Kumar', patientId: 'EC-003', initials: 'RK', medicine: 'Telmisartan', dosage: '20 mg', frequency: 'Once Daily', instructions: 'Renal-protective BP agent to prevent diabetic microalbuminuria.', prescribedBy: 'Dr. Kavya Menon', startDate: '2026-01-10', endDate: '2026-12-31', status: 'completed' },
  { id: 'MED-RK-05', time: '01:00 PM', slot: 'Afternoon Medication', patient: 'Raghavan Kumar', patientId: 'EC-003', initials: 'RK', medicine: 'Vildagliptin', dosage: '50 mg', frequency: 'Once Daily', instructions: 'Post-lunch glycemic control. Check blood glucose if dizzy.', prescribedBy: 'Dr. Arvind Rao', startDate: '2026-01-01', endDate: '2026-12-31', status: 'pending' },
  { id: 'MED-RK-06', time: '02:30 PM', slot: 'Afternoon Medication', patient: 'Raghavan Kumar', patientId: 'EC-003', initials: 'RK', medicine: 'Carboxymethylcellulose Eye Drops', dosage: '0.5% w/v', frequency: 'Three times daily', instructions: '1 drop in both eyes for diabetic dry eye relief.', prescribedBy: 'Dr. Meenakshi Iyer', startDate: '2026-02-01', endDate: '2026-12-31', status: 'pending' },
  { id: 'MED-RK-07', time: '08:00 PM', slot: 'Evening Medication', patient: 'Raghavan Kumar', patientId: 'EC-003', initials: 'RK', medicine: 'Metformin (SR)', dosage: '500 mg', frequency: 'Twice Daily', instructions: 'Second dose. Take with dinner for nocturnal glucose control.', prescribedBy: 'Dr. Arvind Rao', startDate: '2026-01-01', endDate: '2026-12-31', status: 'upcoming' },
  { id: 'MED-RK-08', time: '09:15 PM', slot: 'Night Medication', patient: 'Raghavan Kumar', patientId: 'EC-003', initials: 'RK', medicine: 'Fenofibrate', dosage: '160 mg', frequency: 'Once Daily', instructions: 'For lipid and triglyceride balance in diabetic profile.', prescribedBy: 'Dr. Kavya Menon', startDate: '2026-01-10', endDate: '2026-12-31', status: 'upcoming' },
  { id: 'MED-RK-09', time: '09:45 PM', slot: 'Night Medication', patient: 'Raghavan Kumar', patientId: 'EC-003', initials: 'RK', medicine: 'Alpha Lipoic Acid', dosage: '100 mg', frequency: 'Once Daily', instructions: 'Diabetic neuropathy support and antioxidant cellular protection.', prescribedBy: 'Dr. Arvind Rao', startDate: '2026-01-10', endDate: '2026-12-31', status: 'upcoming' },
  { id: 'MED-RK-10', time: '10:00 PM', slot: 'Night Medication', patient: 'Raghavan Kumar', patientId: 'EC-003', initials: 'RK', medicine: 'Pregabalin', dosage: '75 mg', frequency: 'Once Daily', instructions: 'Take at bedtime for diabetic neuropathic foot burning/tingling.', prescribedBy: 'Dr. Sunita Bhatt', startDate: '2026-01-15', endDate: '2026-12-31', status: 'upcoming' },

  // EC-004: Subramaniam Iyer (10 Medications)
  { id: 'MED-SI-01', time: '07:30 AM', slot: 'Morning Medication', patient: 'Subramaniam Iyer', patientId: 'EC-004', initials: 'SI', medicine: 'Furosemide', dosage: '20 mg', frequency: 'Once Daily', instructions: 'Take early morning to prevent fluid overload and heart strain.', prescribedBy: 'Dr. Kavya Menon', startDate: '2026-01-01', endDate: '2026-12-31', status: 'completed' },
  { id: 'MED-SI-02', time: '08:00 AM', slot: 'Morning Medication', patient: 'Subramaniam Iyer', patientId: 'EC-004', initials: 'SI', medicine: 'Metoprolol Succinate', dosage: '25 mg', frequency: 'Once Daily', instructions: 'Take with breakfast to control heart rate and prevent arrhythmia.', prescribedBy: 'Dr. Kavya Menon', startDate: '2026-01-01', endDate: '2026-12-31', status: 'completed' },
  { id: 'MED-SI-03', time: '08:30 AM', slot: 'Morning Medication', patient: 'Subramaniam Iyer', patientId: 'EC-004', initials: 'SI', medicine: 'Clopidogrel', dosage: '75 mg', frequency: 'Once Daily', instructions: 'Dual antiplatelet coverage for coronary artery patency.', prescribedBy: 'Dr. Kavya Menon', startDate: '2026-01-01', endDate: '2026-12-31', status: 'completed' },
  { id: 'MED-SI-04', time: '08:45 AM', slot: 'Morning Medication', patient: 'Subramaniam Iyer', patientId: 'EC-004', initials: 'SI', medicine: 'Ecosprin (Aspirin)', dosage: '75 mg', frequency: 'Once Daily', instructions: 'Cardioprotective antiplatelet. Take strictly after meal.', prescribedBy: 'Dr. Kavya Menon', startDate: '2026-01-01', endDate: '2026-12-31', status: 'completed' },
  { id: 'MED-SI-05', time: '01:00 PM', slot: 'Afternoon Medication', patient: 'Subramaniam Iyer', patientId: 'EC-004', initials: 'SI', medicine: 'Potassium Chloride (Potklor)', dosage: '10 ml', frequency: 'Once Daily', instructions: 'Dilute in water after lunch to replenish diuretic potassium loss.', prescribedBy: 'Dr. Kavya Menon', startDate: '2026-01-15', endDate: '2026-12-31', status: 'pending' },
  { id: 'MED-SI-06', time: '02:00 PM', slot: 'Afternoon Medication', patient: 'Subramaniam Iyer', patientId: 'EC-004', initials: 'SI', medicine: 'Digoxin', dosage: '0.125 mg', frequency: 'Once Daily', instructions: 'Cardiac rhythm maintenance. Caregiver must check pulse before administering.', prescribedBy: 'Dr. Kavya Menon', startDate: '2026-01-15', endDate: '2026-12-31', status: 'pending' },
  { id: 'MED-SI-07', time: '04:00 PM', slot: 'Afternoon Medication', patient: 'Subramaniam Iyer', patientId: 'EC-004', initials: 'SI', medicine: 'Sorbitrate (Isosorbide Dinitrate)', dosage: '5 mg', frequency: 'As Needed (Sublingual)', instructions: 'Keep by bedside. Dissolve under tongue if chest tightness occurs.', prescribedBy: 'Dr. Kavya Menon', startDate: '2026-01-01', endDate: '2026-12-31', status: 'pending' },
  { id: 'MED-SI-08', time: '07:30 PM', slot: 'Evening Medication', patient: 'Subramaniam Iyer', patientId: 'EC-004', initials: 'SI', medicine: 'Ramipril', dosage: '2.5 mg', frequency: 'Once Daily', instructions: 'Cardiovascular ACE-inhibitor for ventricular remodeling and BP.', prescribedBy: 'Dr. Kavya Menon', startDate: '2026-01-01', endDate: '2026-12-31', status: 'upcoming' },
  { id: 'MED-SI-09', time: '09:00 PM', slot: 'Night Medication', patient: 'Subramaniam Iyer', patientId: 'EC-004', initials: 'SI', medicine: 'Atorvastatin', dosage: '20 mg', frequency: 'Once Daily', instructions: 'Take at bedtime for plaque stabilization and cholesterol control.', prescribedBy: 'Dr. Kavya Menon', startDate: '2026-01-01', endDate: '2026-12-31', status: 'upcoming' },
  { id: 'MED-SI-10', time: '09:30 PM', slot: 'Night Medication', patient: 'Subramaniam Iyer', patientId: 'EC-004', initials: 'SI', medicine: 'Omega-3 Marine Triglycerides', dosage: '1000 mg', frequency: 'Once Daily', instructions: 'Arterial compliance and anti-inflammatory cardiac lipid support.', prescribedBy: 'Dr. Kavya Menon', startDate: '2026-01-15', endDate: '2026-12-31', status: 'upcoming' },

  // EC-005: Anitha Sundaram (10 Medications)
  { id: 'MED-AS-01', time: '08:00 AM', slot: 'Morning Medication', patient: 'Anitha Sundaram', patientId: 'EC-005', initials: 'AS', medicine: 'Donepezil', dosage: '5 mg', frequency: 'Once Daily', instructions: 'Take with morning breakfast for cognitive support and memory function.', prescribedBy: 'Dr. M. Verma', startDate: '2026-01-15', endDate: '2026-12-31', status: 'completed' },
  { id: 'MED-AS-02', time: '08:30 AM', slot: 'Morning Medication', patient: 'Anitha Sundaram', patientId: 'EC-005', initials: 'AS', medicine: 'Amlodipine', dosage: '5 mg', frequency: 'Once Daily', instructions: 'Take with water after breakfast to control BP.', prescribedBy: 'Dr. K. Ramesh', startDate: '2026-01-01', endDate: '2026-12-31', status: 'completed' },
  { id: 'MED-AS-03', time: '08:45 AM', slot: 'Morning Medication', patient: 'Anitha Sundaram', patientId: 'EC-005', initials: 'AS', medicine: 'Coenzyme Q10 (Ubiquinol)', dosage: '100 mg', frequency: 'Once Daily', instructions: 'Mitochondrial antioxidant booster for neuro-cellular energy.', prescribedBy: 'Dr. K. Ramesh', startDate: '2026-01-15', endDate: '2026-12-31', status: 'completed' },
  { id: 'MED-AS-04', time: '09:00 AM', slot: 'Morning Medication', patient: 'Anitha Sundaram', patientId: 'EC-005', initials: 'AS', medicine: 'Memantine', dosage: '5 mg', frequency: 'Once Daily', instructions: 'NMDA receptor antagonist for memory retention and cognitive focus.', prescribedBy: 'Dr. M. Verma', startDate: '2026-02-01', endDate: '2026-12-31', status: 'completed' },
  { id: 'MED-AS-05', time: '01:00 PM', slot: 'Afternoon Medication', patient: 'Anitha Sundaram', patientId: 'EC-005', initials: 'AS', medicine: 'Metformin', dosage: '500 mg', frequency: 'Twice Daily', instructions: 'Take with lunch for blood glucose stabilization.', prescribedBy: 'Dr. S. Priya', startDate: '2026-01-01', endDate: '2026-12-31', status: 'pending' },
  { id: 'MED-AS-06', time: '02:00 PM', slot: 'Afternoon Medication', patient: 'Anitha Sundaram', patientId: 'EC-005', initials: 'AS', medicine: 'Ginkgo Biloba', dosage: '120 mg', frequency: 'Once Daily', instructions: 'Cerebral microvascular circulation and oxygenation support.', prescribedBy: 'Dr. Sunita Bhatt', startDate: '2026-02-01', endDate: '2026-12-31', status: 'pending' },
  { id: 'MED-AS-07', time: '03:00 PM', slot: 'Afternoon Medication', patient: 'Anitha Sundaram', patientId: 'EC-005', initials: 'AS', medicine: 'Citicoline', dosage: '500 mg', frequency: 'Once Daily', instructions: 'Neuroprotective agent for brain phospholipid synthesis and recall.', prescribedBy: 'Dr. Sunita Bhatt', startDate: '2026-02-15', endDate: '2026-12-31', status: 'pending' },
  { id: 'MED-AS-08', time: '07:30 PM', slot: 'Evening Medication', patient: 'Anitha Sundaram', patientId: 'EC-005', initials: 'AS', medicine: 'Vitamin D', dosage: '1000 IU', frequency: 'Once Daily', instructions: 'Take after dinner for neuro-endocrine wellness.', prescribedBy: 'Dr. K. Ramesh', startDate: '2026-02-01', endDate: '2026-12-31', status: 'upcoming' },
  { id: 'MED-AS-09', time: '08:30 PM', slot: 'Evening Medication', patient: 'Anitha Sundaram', patientId: 'EC-005', initials: 'AS', medicine: 'Ashwagandha Extract', dosage: '300 mg', frequency: 'Once Daily', instructions: 'Natural botanical adaptogen for evening calm and anxiety ease.', prescribedBy: 'Dr. M. Verma', startDate: '2026-02-01', endDate: '2026-12-31', status: 'upcoming' },
  { id: 'MED-AS-10', time: '09:30 PM', slot: 'Night Medication', patient: 'Anitha Sundaram', patientId: 'EC-005', initials: 'AS', medicine: 'Melatonin', dosage: '3 mg', frequency: 'Once Daily', instructions: 'Take 30 mins before bedtime for healthy circadian rhythm.', prescribedBy: 'Dr. M. Verma', startDate: '2026-01-10', endDate: '2026-12-31', status: 'upcoming' },

  // EC-006: Govind Pillai (10 Medications)
  { id: 'MED-GP-01', time: '08:00 AM', slot: 'Morning Medication', patient: 'Govind Pillai', patientId: 'EC-006', initials: 'GP', medicine: 'Sodium Bicarbonate', dosage: '500 mg', frequency: 'Twice Daily', instructions: 'Alkalinizing agent for metabolic acid balance. Take with morning water.', prescribedBy: 'Dr. Arvind Rao', startDate: '2026-02-01', endDate: '2026-12-31', status: 'completed' },
  { id: 'MED-GP-02', time: '08:30 AM', slot: 'Morning Medication', patient: 'Govind Pillai', patientId: 'EC-006', initials: 'GP', medicine: 'Torsemide', dosage: '10 mg', frequency: 'Once Daily', instructions: 'Diuretic for renal fluid management and peripheral edema control.', prescribedBy: 'Dr. Arvind Rao', startDate: '2026-02-01', endDate: '2026-12-31', status: 'completed' },
  { id: 'MED-GP-03', time: '09:00 AM', slot: 'Morning Medication', patient: 'Govind Pillai', patientId: 'EC-006', initials: 'GP', medicine: 'Folic Acid', dosage: '5 mg', frequency: 'Once Daily', instructions: 'Supports erythropoiesis and repairs renal nutritional deficiency.', prescribedBy: 'Dr. Arvind Rao', startDate: '2026-02-01', endDate: '2026-12-31', status: 'completed' },
  { id: 'MED-GP-04', time: '10:00 AM', slot: 'Morning Medication', patient: 'Govind Pillai', patientId: 'EC-006', initials: 'GP', medicine: 'Erythropoietin (EPO)', dosage: '4000 IU', frequency: 'Once Weekly', instructions: 'Subcutaneous injection for CKD normocytic anemia management.', prescribedBy: 'Dr. Arvind Rao', startDate: '2026-01-15', endDate: '2026-12-31', status: 'completed' },
  { id: 'MED-GP-05', time: '01:00 PM', slot: 'Afternoon Medication', patient: 'Govind Pillai', patientId: 'EC-006', initials: 'GP', medicine: 'Sevelamer Carbonate', dosage: '800 mg', frequency: 'Twice Daily', instructions: 'Phosphate binder. Must be swallowed whole with lunch.', prescribedBy: 'Dr. Arvind Rao', startDate: '2026-02-01', endDate: '2026-12-31', status: 'pending' },
  { id: 'MED-GP-06', time: '01:30 PM', slot: 'Afternoon Medication', patient: 'Govind Pillai', patientId: 'EC-006', initials: 'GP', medicine: 'Ketoanalogs of Amino Acids', dosage: '600 mg', frequency: 'Three times daily', instructions: 'Protects residual nephron capacity during low-protein renal diet.', prescribedBy: 'Dr. Arvind Rao', startDate: '2026-02-15', endDate: '2026-12-31', status: 'pending' },
  { id: 'MED-GP-07', time: '02:30 PM', slot: 'Afternoon Medication', patient: 'Govind Pillai', patientId: 'EC-006', initials: 'GP', medicine: 'Iron Supplement (Ferrous Ascorbate)', dosage: '100 mg', frequency: 'Once Daily', instructions: 'Take 2 hours after food with water. Avoid dairy products.', prescribedBy: 'Dr. Arvind Rao', startDate: '2026-02-01', endDate: '2026-12-31', status: 'pending' },
  { id: 'MED-GP-08', time: '08:00 PM', slot: 'Evening Medication', patient: 'Govind Pillai', patientId: 'EC-006', initials: 'GP', medicine: 'Sevelamer Carbonate', dosage: '800 mg', frequency: 'Twice Daily', instructions: 'Second dose. Phosphate binder with evening dinner.', prescribedBy: 'Dr. Arvind Rao', startDate: '2026-02-01', endDate: '2026-12-31', status: 'upcoming' },
  { id: 'MED-GP-09', time: '09:00 PM', slot: 'Night Medication', patient: 'Govind Pillai', patientId: 'EC-006', initials: 'GP', medicine: 'Febuxostat', dosage: '40 mg', frequency: 'Once Daily', instructions: 'Serum uric acid reduction for nephroprotection and gout prevention.', prescribedBy: 'Dr. Arvind Rao', startDate: '2026-02-01', endDate: '2026-12-31', status: 'upcoming' },
  { id: 'MED-GP-10', time: '09:30 PM', slot: 'Night Medication', patient: 'Govind Pillai', patientId: 'EC-006', initials: 'GP', medicine: 'Sodium Bicarbonate', dosage: '500 mg', frequency: 'Twice Daily', instructions: 'Night dose with water for overnight metabolic acid balance.', prescribedBy: 'Dr. Arvind Rao', startDate: '2026-02-01', endDate: '2026-12-31', status: 'upcoming' },
];

export const appointments = [
  { id: 'AP-01', date: getRelativeISO(0), time: '09:30 AM', patient: 'Lakshmi Devi', patientId: 'EC-001', doctor: 'Dr. Kavya Menon', type: 'Cardiology Review', status: 'confirmed' },
  { id: 'AP-02', date: getRelativeISO(0), time: '11:00 AM', patient: 'Govind Pillai', patientId: 'EC-006', doctor: 'Dr. Arvind Rao', type: 'Nephrology Checkup', status: 'confirmed' },
  { id: 'AP-03', date: getRelativeISO(0), time: '02:30 PM', patient: 'Subramaniam Iyer', patientId: 'EC-004', doctor: 'Dr. Kavya Menon', type: 'Cardiac Monitoring', status: 'pending' },
  { id: 'AP-04', date: getRelativeISO(1), time: '10:00 AM', patient: 'Meenakshi Raman', patientId: 'EC-002', doctor: 'Dr. Sunita Bhatt', type: 'Bone Density Scan', status: 'confirmed' },
  { id: 'AP-05', date: getRelativeISO(1), time: '03:00 PM', patient: 'Raghavan Kumar', patientId: 'EC-003', doctor: 'Dr. Arvind Rao', type: 'Diabetes Follow-up', status: 'confirmed' },
  { id: 'AP-06', date: getRelativeISO(2), time: '09:00 AM', patient: 'Anitha Sundaram', patientId: 'EC-005', doctor: 'Dr. Sunita Bhatt', type: 'Cognitive Assessment', status: 'pending' },
  { id: 'AP-07', date: getRelativeISO(3), time: '11:30 AM', patient: 'Lakshmi Devi', patientId: 'EC-001', doctor: 'Dr. Kavya Menon', type: 'General Physiotherapy', status: 'confirmed' },
  { id: 'AP-08', date: getRelativeISO(-5), time: '10:30 AM', patient: 'Raghavan Kumar', patientId: 'EC-003', doctor: 'Dr. Arvind Rao', type: 'Diabetes Review', status: 'confirmed' },
  { id: 'AP-09', date: getRelativeISO(-2), time: '09:00 AM', patient: 'Govind Pillai', patientId: 'EC-006', doctor: 'Dr. Arvind Rao', type: 'Nephrology Follow-up', status: 'confirmed' },
  { id: 'AP-10', date: getRelativeISO(7), time: '01:30 PM', patient: 'Meenakshi Raman', patientId: 'EC-002', doctor: 'Dr. Sunita Bhatt', type: 'Physiotherapy Session', status: 'pending' },
  { id: 'AP-11', date: getRelativeISO(10), time: '10:00 AM', patient: 'Subramaniam Iyer', patientId: 'EC-004', doctor: 'Dr. Kavya Menon', type: 'Cardiac Monitoring', status: 'confirmed' },
];

export const carePlans = [
  {
    id: 'CP-01',
    patient: 'Lakshmi Devi',
    initials: 'LD',
    goal: 'Blood pressure stabilization',
    caregiver: 'Priya Nair',
    reviewDate: getRelativeFormatted(7),
    progress: 78,
    tasks: [
      { label: 'Daily BP monitoring', done: true },
      { label: 'Low-sodium meal plan', done: true },
      { label: 'Morning mobility walk', done: false },
      { label: 'Weekly cardiology review', done: false },
    ],
  },
  {
    id: 'CP-02',
    patient: 'Meenakshi Raman',
    initials: 'MR',
    goal: 'Improve bone density & mobility',
    caregiver: 'Anand Raj',
    reviewDate: getRelativeFormatted(4),
    progress: 54,
    tasks: [
      { label: 'Vitamin D supplementation', done: true },
      { label: 'Assisted mobility sessions', done: true },
      { label: 'Fall-risk home assessment', done: false },
    ],
  },
  {
    id: 'CP-03',
    patient: 'Raghavan Kumar',
    initials: 'RK',
    goal: 'Blood sugar management',
    caregiver: 'Deepa Suresh',
    reviewDate: getRelativeFormatted(10),
    progress: 88,
    tasks: [
      { label: 'Twice-daily glucose checks', done: true },
      { label: 'Diet plan adherence', done: true },
      { label: 'Gardening activity (low exertion)', done: true },
      { label: 'Monthly HbA1c test', done: false },
    ],
  },
  {
    id: 'CP-04',
    patient: 'Subramaniam Iyer',
    initials: 'SI',
    goal: 'Cardiac rhythm stabilization',
    caregiver: 'Anand Raj',
    reviewDate: getRelativeFormatted(2),
    progress: 41,
    tasks: [
      { label: 'Daily manual vitals check', done: true },
      { label: 'Statin therapy compliance', done: false },
      { label: 'Reduced sodium & caffeine intake', done: false },
      { label: 'Weekly cardiologist visit', done: false },
    ],
  },
];

export const dailySchedule = [
  { time: '07:30 AM', title: 'Morning Check', desc: 'Vitals check and wellness round for all residents.' },
  { time: '08:00 AM', title: 'Morning Medication', desc: 'Scheduled medication dispensed as per care plan.' },
  { time: '09:00 AM', title: 'Breakfast', desc: 'Nutrition-plan breakfast served in the dining hall.' },
  { time: '10:30 AM', title: 'Health Assessment', desc: 'Routine health assessment with assigned nurse.' },
  { time: '12:30 PM', title: 'Lunch', desc: 'Balanced lunch served according to dietary needs.' },
  { time: '03:00 PM', title: 'Physiotherapy', desc: 'Guided mobility and physiotherapy session.' },
  { time: '05:00 PM', title: 'Recreation', desc: 'Group activities — music, reading or gardening.' },
  { time: '08:00 PM', title: 'Evening Medication', desc: 'Scheduled evening medication dispensed.' },
];

export const activities = [
  { id: 'ACT-01', name: 'Morning Mobility', icon: 'PersonStanding', type: 'Physical', schedule: 'Daily · 07:45 AM', duration: '30 min', facilitator: 'Kavitha Reddy', participants: 12, status: 'active' },
  { id: 'ACT-02', name: 'Meditation', icon: 'Flower2', type: 'Wellness', schedule: 'Daily · 06:30 AM', duration: '20 min', facilitator: 'Priya Nair', participants: 9, status: 'active' },
  { id: 'ACT-03', name: 'Music Therapy', icon: 'Music2', type: 'Recreational', schedule: 'Mon, Wed, Fri · 05:00 PM', duration: '45 min', facilitator: 'Anand Raj', participants: 14, status: 'active' },
  { id: 'ACT-04', name: 'Gardening', icon: 'Leaf', type: 'Recreational', schedule: 'Tue, Thu · 04:00 PM', duration: '40 min', facilitator: 'Deepa Suresh', participants: 7, status: 'active' },
  { id: 'ACT-05', name: 'Reading Circle', icon: 'BookOpen', type: 'Cognitive', schedule: 'Daily · 05:30 PM', duration: '30 min', facilitator: 'Suresh Babu', participants: 6, status: 'active' },
  { id: 'ACT-06', name: 'Group Activities', icon: 'Users', type: 'Social', schedule: 'Sat, Sun · 04:30 PM', duration: '60 min', facilitator: 'Vikram Menon', participants: 18, status: 'paused' },
];

export const documents = [
  { id: 'DOC-01', name: 'Lakshmi Devi — Cardiology Report', type: 'Medical Report', patient: 'Lakshmi Devi', date: getRelativeFormatted(-3), status: 'reviewed' },
  { id: 'DOC-02', name: 'Meenakshi Raman — Prescription', type: 'Prescription', patient: 'Meenakshi Raman', date: getRelativeFormatted(-4), status: 'active' },
  { id: 'DOC-03', name: 'Raghavan Kumar — Lab Results (HbA1c)', type: 'Lab Result', patient: 'Raghavan Kumar', date: getRelativeFormatted(-6), status: 'reviewed' },
  { id: 'DOC-04', name: 'Subramaniam Iyer — Care Plan Update', type: 'Care Plan', patient: 'Subramaniam Iyer', date: getRelativeFormatted(0), status: 'pending review' },
  { id: 'DOC-05', name: 'Anitha Sundaram — Cognitive Assessment', type: 'Assessment', patient: 'Anitha Sundaram', date: getRelativeFormatted(-8), status: 'reviewed' },
  { id: 'DOC-06', name: 'Govind Pillai — Nephrology Report', type: 'Medical Report', patient: 'Govind Pillai', date: getRelativeFormatted(-1), status: 'pending review' },
  { id: 'DOC-07', name: 'Lakshmi Devi — Prescription Renewal', type: 'Prescription', patient: 'Lakshmi Devi', date: getRelativeFormatted(-14), status: 'active' },
];

export const notifications = [
  {
    id: 'NT-01',
    type: 'medication',
    title: 'Medication Reminder',
    time: '08:00 AM',
    patient: 'Lakshmi Devi',
    detail: 'Amlodipine · 5 mg',
    desc: 'It is time to take the scheduled medication.',
    group: 'today',
    read: false,
    actionable: true,
  },
  {
    id: 'NT-02',
    type: 'appointment',
    title: 'Upcoming Appointment',
    time: '09:30 AM',
    patient: 'Lakshmi Devi',
    detail: 'Cardiology Review · Dr. Kavya Menon',
    desc: 'Appointment scheduled in 45 minutes.',
    group: 'today',
    read: false,
    actionable: false,
  },
  {
    id: 'NT-03',
    type: 'health',
    title: 'Health Alert',
    time: '07:15 AM',
    patient: 'Subramaniam Iyer',
    detail: 'Heart rate above normal range',
    desc: 'Vitals flagged during morning wellness round.',
    group: 'today',
    read: true,
    actionable: false,
  },
  {
    id: 'NT-04',
    type: 'caregiver',
    title: 'Shift Update',
    time: '07:00 AM',
    patient: 'Deepa Suresh',
    detail: 'Afternoon shift confirmed',
    desc: 'Caregiver has checked in for the afternoon shift.',
    group: 'today',
    read: true,
    actionable: false,
  },
  {
    id: 'NT-05',
    type: 'medication',
    title: 'Medication Reminder',
    time: '09:00 PM',
    patient: 'Subramaniam Iyer',
    detail: 'Atorvastatin · 10 mg',
    desc: 'Night medication was marked as taken.',
    group: 'yesterday',
    read: true,
    actionable: false,
  },
  {
    id: 'NT-06',
    type: 'emergency',
    title: 'Emergency Drill Completed',
    time: '04:20 PM',
    patient: 'Facility Wide',
    detail: 'Monthly emergency response drill',
    desc: 'All caregivers completed the scheduled safety drill.',
    group: 'yesterday',
    read: true,
    actionable: false,
  },
  {
    id: 'NT-07',
    type: 'appointment',
    title: 'Appointment Completed',
    time: '11:00 AM',
    patient: 'Govind Pillai',
    detail: 'Nephrology Checkup · Dr. Arvind Rao',
    desc: 'Consultation notes uploaded to documents.',
    group: 'earlier',
    read: true,
    actionable: false,
  },
  {
    id: 'NT-08',
    type: 'caregiver',
    title: 'New Care Plan Assigned',
    time: '02:10 PM',
    patient: 'Anitha Sundaram',
    detail: 'Assigned to Deepa Suresh',
    desc: 'Cognitive care plan reviewed and reassigned.',
    group: 'earlier',
    read: true,
    actionable: false,
  },
];

export const emergencyContacts = {
  facility: {
    name: 'ElderCare Residency — Front Desk',
    phone: '+91 44 2345 6789',
  },
  doctor: {
    name: 'Dr. Kavya Menon',
    role: 'Attending Physician',
    phone: '+91 98400 12345',
  },
  hospital: {
    name: 'Apollo Speciality Hospital',
    role: 'Partner Hospital · 4.2 km away',
    phone: '+91 44 2829 3333',
  },
  ambulance: {
    name: 'ElderCare Emergency Response',
    role: 'On-site ambulance service',
    phone: '108',
  },
};

export const reportData = {
  '7': {
    adherence: [88, 91, 85, 94, 90, 96, 92],
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    appointmentCompletion: 93,
    activityParticipation: 81,
    caregiverWorkload: 76,
  },
  '30': {
    adherence: [82, 85, 88, 90, 87, 91, 89],
    labels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6', 'Wk 7'],
    appointmentCompletion: 89,
    activityParticipation: 77,
    caregiverWorkload: 82,
  },
  '90': {
    adherence: [79, 83, 85, 88, 86, 90, 91],
    labels: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7'],
    appointmentCompletion: 85,
    activityParticipation: 74,
    caregiverWorkload: 88,
  },
};

// ============================================================
// Cross-reference resident IDs onto records that were only ever
// keyed by patient name (documents, care plans, notifications).
// This keeps a single source of truth (elderlyResidents) instead
// of duplicating IDs by hand across every dataset — one lookup
// map built with reduce(), then applied with a simple loop.
// ============================================================
export const residentIdByName = elderlyResidents.reduce((map, r) => {
  map[r.name] = r.id;
  return map;
}, {});

[...documents, ...carePlans, ...notifications].forEach((record) => {
  if (!record.residentId) {
    record.residentId = residentIdByName[record.patient] || null;
  }
});

// ============================================================
// Demo accounts — frontend-only authentication.
// Four mandatory roles: admin, caregiver, family, patient.
// Every account uses the same demo password for easy grading/demo:
//   Care@123
// Family and Patient accounts are scoped to exactly one resident
// via `residentId`. Caregiver accounts are scoped via `caregiverName`,
// matched against the `caregiver` field on each resident record.
// ============================================================
export const DEMO_PASSWORD = 'Care@123';

// Simple demo accounts — exactly one per mandatory role, using the
// plain username/password pairs requested for the classroom demo.
// Family and Patient are both tied to the same resident (EC-001)
// so the privacy contrast between "my loved one" and "myself" is
// easy to demonstrate side by side.
export const demoUsers = [
  {
    id: 'USR-ADMIN-01',
    username: 'admin',
    password: 'admin',
    name: 'Meera Krishnan',
    role: 'admin',
    initials: 'MK',
    title: 'System Administrator',
  },
  {
    id: 'USR-CG-01',
    username: 'caregiver',
    password: 'caregiver',
    name: 'Priya Nair',
    role: 'caregiver',
    initials: 'PN',
    title: 'Senior Caregiver',
    caregiverName: 'Priya Nair',
  },
  {
    id: 'USR-FAM-01',
    username: 'family',
    password: 'family',
    name: 'Ramesh Devi',
    role: 'family',
    initials: 'RD',
    title: 'Family Member',
    familyId: 'FAM-001',
    residentId: 'EC-001',
    relation: 'Son',
  },
  {
    id: 'USR-PAT-01',
    username: 'patient',
    password: 'patient',
    name: 'Lakshmi Devi',
    role: 'patient',
    initials: 'LD',
    title: 'Resident',
    residentId: 'EC-001',
  },
  {
    id: 'USR-DOC-01',
    username: 'doctor',
    password: 'doctor',
    name: 'Dr. Arun Ramanathan',
    role: 'doctor',
    initials: 'AR',
    title: 'Chief Medical Officer & Cardiologist',
  },
  {
    id: 'USR-CG-02',
    username: 'anand',
    password: 'anand',
    name: 'Anand Raj',
    role: 'caregiver',
    initials: 'AR',
    title: 'Physiotherapy & Mobility Caregiver',
    caregiverName: 'Anand Raj',
  },
];
