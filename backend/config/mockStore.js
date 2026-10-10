// ============================================================
// In-Memory Database Fallback Store
// Ensures the ElderCare backend operates seamlessly even if
// MySQL/XAMPP is not currently started.
// ============================================================

export const mockStore = {
  users: [
    { id: 'USR-ADMIN-01', username: 'admin', password: 'admin', name: 'Meera Krishnan', email: 'admin@eldercare.demo', role: 'admin', initials: 'MK', title: 'System Administrator', caregiverName: null, familyId: null, residentId: null, relation: null },
    { id: 'USR-CG-01', username: 'caregiver', password: 'caregiver', name: 'Priya Nair', email: 'caregiver@eldercare.demo', role: 'caregiver', initials: 'PN', title: 'Senior Caregiver', caregiverName: 'Priya Nair', familyId: null, residentId: null, relation: null },
    { id: 'USR-FAM-01', username: 'family', password: 'family', name: 'Ramesh Devi', email: 'family@eldercare.demo', role: 'family', initials: 'RD', title: 'Family Member', caregiverName: null, familyId: 'FAM-001', residentId: 'EC-001', relation: 'Son' },
    { id: 'USR-PAT-01', username: 'patient', password: 'patient', name: 'Lakshmi Devi', email: 'patient@eldercare.demo', role: 'patient', initials: 'LD', title: 'Resident', caregiverName: null, familyId: null, residentId: 'EC-001', relation: null },
    { id: 'USR-DOC-01', username: 'doctor', password: 'doctor', name: 'Dr. Arun Ramanathan', email: 'dr.arun@eldercare.demo', role: 'doctor', initials: 'AR', title: 'Chief Medical Officer & Cardiologist', caregiverName: null, familyId: null, residentId: null, relation: null }
  ],
  residents: [
    { id: 'EC-001', name: 'Lakshmi Devi', initials: 'LD', age: 78, gender: 'Female', status: 'stable', room: 'Willow Room 4', caregiver: 'Priya Nair', lastAssessment: 'Yesterday, 10:30 AM', condition: 'Hypertension, Mild Arthritis', bloodGroup: 'B+', admitted: '12 Jan 2024', emergencyContact: 'Ramesh Devi · Son · +91 98410 22311', notes: 'Prefers morning walks. Follows a low-sodium diet plan.' },
    { id: 'EC-002', name: 'Meenakshi Raman', initials: 'MR', age: 82, gender: 'Female', status: 'attention', room: 'Sage Room 2', caregiver: 'Anand Raj', lastAssessment: '2 days ago', condition: 'Vitamin D Deficiency, Osteoporosis', bloodGroup: 'O+', admitted: '03 Mar 2023', emergencyContact: 'Kavitha Raman · Daughter · +91 90031 55210', notes: 'Requires assistance with mobility. Uses a walking frame.' },
    { id: 'EC-003', name: 'Raghavan Kumar', initials: 'RK', age: 75, gender: 'Male', status: 'stable', room: 'Willow Room 1', caregiver: 'Deepa Suresh', lastAssessment: 'Today, 09:00 AM', condition: 'Type 2 Diabetes', bloodGroup: 'A+', admitted: '22 Jul 2022', emergencyContact: 'Suresh Kumar · Son · +91 99400 11876', notes: 'Monitors blood sugar twice daily. Enjoys gardening activities.' },
    { id: 'EC-004', name: 'Subramaniam Iyer', initials: 'SI', age: 80, gender: 'Male', status: 'critical', room: 'Sage Room 5', caregiver: 'Anand Raj', lastAssessment: 'Today, 07:15 AM', condition: 'Cardiac Arrhythmia, High Cholesterol', bloodGroup: 'AB+', admitted: '09 Sep 2021', emergencyContact: 'Lakshmi Iyer · Wife · +91 94440 76321', notes: 'Under close cardiac monitoring. On statin therapy.' },
    { id: 'EC-005', name: 'Anitha Sundaram', initials: 'AS', age: 71, gender: 'Female', status: 'stable', room: 'Willow Room 6', caregiver: 'Deepa Suresh', lastAssessment: '3 days ago', condition: 'Mild Cognitive Decline', bloodGroup: 'B-', admitted: '14 Nov 2024', emergencyContact: 'Arjun Sundaram · Son · +91 98940 22011', notes: 'Participates actively in memory-care activities and music therapy.' },
    { id: 'EC-006', name: 'Govind Pillai', initials: 'GP', age: 84, gender: 'Male', status: 'attention', room: 'Sage Room 1', caregiver: 'Priya Nair', lastAssessment: 'Yesterday, 04:00 PM', condition: 'Chronic Kidney Disease Stage 2', bloodGroup: 'O-', admitted: '30 May 2023', emergencyContact: 'Radha Pillai · Daughter · +91 97890 44532', notes: 'Fluid intake closely monitored. Weekly nephrology review.' },
    { id: 'EC-007', name: 'Sangeetha', initials: 'S', age: 69, gender: 'Female', status: 'stable', room: 'Willow Room 3', caregiver: 'Suresh Babu', lastAssessment: 'Today, 02:30 PM', condition: 'General Wellness, Routine Care', bloodGroup: 'A-', admitted: '15 Jan 2025', emergencyContact: 'Karthik Raja · Son · +91 98402 88123', notes: 'Enjoys arts and community activities. Follows balanced diet.' }
  ],
  caregivers: [
    { id: 'CG-01', name: 'Priya Nair', initials: 'PN', role: 'Senior Caregiver', experience: '9 years', assigned: 2, availability: 'On Duty', status: 'active', shift: 'Morning · 7:00 AM – 3:00 PM', phone: '+91 98400 11223' },
    { id: 'CG-02', name: 'Anand Raj', initials: 'AR', role: 'Care Assistant', experience: '4 years', assigned: 2, availability: 'On Duty', status: 'active', shift: 'Morning · 7:00 AM – 3:00 PM', phone: '+91 90441 88732' },
    { id: 'CG-03', name: 'Deepa Suresh', initials: 'DS', role: 'Care Assistant', experience: '6 years', assigned: 2, availability: 'On Duty', status: 'active', shift: 'Afternoon · 3:00 PM – 11:00 PM', phone: '+91 93450 22187' },
    { id: 'CG-04', name: 'Vikram Menon', initials: 'VM', role: 'Registered Nurse', experience: '11 years', assigned: 6, availability: 'On Call', status: 'active', shift: 'Night · 11:00 PM – 7:00 AM', phone: '+91 99870 65410' },
    { id: 'CG-05', name: 'Kavitha Reddy', initials: 'KR', role: 'Physiotherapist', experience: '7 years', assigned: 4, availability: 'Off Duty', status: 'inactive', shift: 'Visits · Tue, Thu, Sat', phone: '+91 91234 55678' },
    { id: 'CG-06', name: 'Suresh Babu', initials: 'SB', role: 'Care Coordinator', experience: '13 years', assigned: 6, availability: 'On Duty', status: 'active', shift: 'Morning · 8:00 AM – 4:00 PM', phone: '+91 96780 34521' }
  ],
  medications: [
    // EC-001 (Lakshmi Devi) - 10 Medications
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

    // EC-002 (Meenakshi Raman) - 10 Medications
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

    // EC-003 (Raghavan Kumar) - 10 Medications
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

    // EC-004 (Subramaniam Iyer) - 10 Medications
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

    // EC-005 (Anitha Sundaram) - 10 Medications
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

    // EC-006 (Govind Pillai) - 10 Medications
    { id: 'MED-GP-01', time: '08:00 AM', slot: 'Morning Medication', patient: 'Govind Pillai', patientId: 'EC-006', initials: 'GP', medicine: 'Sodium Bicarbonate', dosage: '500 mg', frequency: 'Twice Daily', instructions: 'Alkalinizing agent for metabolic acid balance. Take with morning water.', prescribedBy: 'Dr. Arvind Rao', startDate: '2026-02-01', endDate: '2026-12-31', status: 'completed' },
    { id: 'MED-GP-02', time: '08:30 AM', slot: 'Morning Medication', patient: 'Govind Pillai', patientId: 'EC-006', initials: 'GP', medicine: 'Torsemide', dosage: '10 mg', frequency: 'Once Daily', instructions: 'Diuretic for renal fluid management and peripheral edema control.', prescribedBy: 'Dr. Arvind Rao', startDate: '2026-02-01', endDate: '2026-12-31', status: 'completed' },
    { id: 'MED-GP-03', time: '09:00 AM', slot: 'Morning Medication', patient: 'Govind Pillai', patientId: 'EC-006', initials: 'GP', medicine: 'Folic Acid', dosage: '5 mg', frequency: 'Once Daily', instructions: 'Supports erythropoiesis and repairs renal nutritional deficiency.', prescribedBy: 'Dr. Arvind Rao', startDate: '2026-02-01', endDate: '2026-12-31', status: 'completed' },
    { id: 'MED-GP-04', time: '10:00 AM', slot: 'Morning Medication', patient: 'Govind Pillai', patientId: 'EC-006', initials: 'GP', medicine: 'Erythropoietin (EPO)', dosage: '4000 IU', frequency: 'Once Weekly', instructions: 'Subcutaneous injection for CKD normocytic anemia management.', prescribedBy: 'Dr. Arvind Rao', startDate: '2026-01-15', endDate: '2026-12-31', status: 'completed' },
    { id: 'MED-GP-05', time: '01:00 PM', slot: 'Afternoon Medication', patient: 'Govind Pillai', patientId: 'EC-006', initials: 'GP', medicine: 'Sevelamer Carbonate', dosage: '800 mg', frequency: 'Twice Daily', instructions: 'Phosphate binder. Must be swallowed whole with lunch.', prescribedBy: 'Dr. Arvind Rao', startDate: '2026-02-01', endDate: '2026-12-31', status: 'pending' },
    { id: 'MED-GP-06', time: '01:30 PM', slot: 'Afternoon Medication', patient: 'Govind Pillai', patientId: 'EC-006', initials: 'GP', medicine: 'Ketoanalogs of Amino Acids', dosage: '600 mg', frequency: 'Three times daily', instructions: 'Protects residual nephron capacity during low-protein renal diet.', prescribedBy: 'Dr. Arvind Rao', startDate: '2026-02-15', endDate: '2026-12-31', status: 'pending' },
    { id: 'MED-GP-07', time: '02:30 PM', slot: 'Afternoon Medication', patient: 'Govind Pillai', patientId: 'EC-006', initials: 'GP', medicine: 'Iron Supplement (Ferrous Ascorbate)', dosage: '100 mg', frequency: 'Once Daily', instructions: 'Take 2 hours after food with water. Avoid dairy products.', prescribedBy: 'Dr. Arvind Rao', startDate: '2026-02-01', endDate: '2026-12-31', status: 'pending' },
    { id: 'MED-GP-08', time: '08:00 PM', slot: 'Evening Medication', patient: 'Govind Pillai', patientId: 'EC-006', initials: 'GP', medicine: 'Sevelamer Carbonate', dosage: '800 mg', frequency: 'Twice Daily', instructions: 'Second dose. Phosphate binder with evening dinner.', prescribedBy: 'Dr. Arvind Rao', startDate: '2026-02-01', endDate: '2026-12-31', status: 'upcoming' },
    { id: 'MED-GP-09', time: '09:00 PM', slot: 'Night Medication', patient: 'Govind Pillai', patientId: 'EC-006', initials: 'GP', medicine: 'Febuxostat', dosage: '40 mg', frequency: 'Once Daily', instructions: 'Serum uric acid reduction for nephroprotection and gout prevention.', prescribedBy: 'Dr. Arvind Rao', startDate: '2026-02-01', endDate: '2026-12-31', status: 'upcoming' },
    { id: 'MED-GP-10', time: '09:30 PM', slot: 'Night Medication', patient: 'Govind Pillai', patientId: 'EC-006', initials: 'GP', medicine: 'Sodium Bicarbonate', dosage: '500 mg', frequency: 'Twice Daily', instructions: 'Night dose with water for overnight metabolic acid balance.', prescribedBy: 'Dr. Arvind Rao', startDate: '2026-02-01', endDate: '2026-12-31', status: 'upcoming' }
  ],
  specialists: [
    { id: 'DOC-01', name: 'Dr. Suresh Rao', specialty: 'Dermatology', title: 'Consultant Dermatologist', experience: '14 years', availability: 'Available', available_slots: JSON.stringify(['Today · 03:30 PM', 'Today · 05:00 PM', 'Tomorrow · 10:00 AM']), phone: '+91 98401 22334', hospital: 'Apollo City Hospital & Dermatology Clinic' },
    { id: 'DOC-02', name: 'Dr. Kavya Menon', specialty: 'Cardiology', title: 'Chief Interventional Cardiologist', experience: '16 years', availability: 'Available', available_slots: JSON.stringify(['Today · 04:00 PM', 'Tomorrow · 11:30 AM']), phone: '+91 98402 33445', hospital: 'Fortis Heart Center' },
    { id: 'DOC-03', name: 'Dr. Arvind Rao', specialty: 'Pulmonology', title: 'Consultant Pulmonologist', experience: '12 years', availability: 'Available', available_slots: JSON.stringify(['Today · 04:30 PM', 'Tomorrow · 09:00 AM']), phone: '+91 98403 44556', hospital: 'Chest & Lung Specialty Institute' },
    { id: 'DOC-04', name: 'Dr. Sunita Bhatt', specialty: 'Neurology', title: 'Senior Neurologist', experience: '15 years', availability: 'Available', available_slots: JSON.stringify(['Today · 05:00 PM', 'Tomorrow · 02:00 PM']), phone: '+91 98404 55667', hospital: 'Neuro Care Medical Center' },
    { id: 'DOC-05', name: 'Dr. Rajesh Sharma', specialty: 'Orthopedics', title: 'Senior Orthopedic Surgeon', experience: '18 years', availability: 'Available', available_slots: JSON.stringify(['Today · 03:00 PM', 'Tomorrow · 10:30 AM']), phone: '+91 98405 66778', hospital: 'Bone & Joint Clinic' },
    { id: 'DOC-06', name: 'Dr. Meenakshi Iyer', specialty: 'Ophthalmology', title: 'Consultant Eye Surgeon', experience: '10 years', availability: 'Available', available_slots: JSON.stringify(['Today · 04:00 PM', 'Tomorrow · 03:00 PM']), phone: '+91 98406 77889', hospital: 'Aravind Eye Center' },
    { id: 'DOC-07', name: 'Dr. Preeti Deshmukh', specialty: 'Gastroenterology', title: 'Consultant Gastroenterologist', experience: '11 years', availability: 'Available', available_slots: JSON.stringify(['Today · 05:30 PM', 'Tomorrow · 01:00 PM']), phone: '+91 98407 88990', hospital: 'Digestive Health Institute' },
    { id: 'DOC-08', name: 'Dr. Vivek Murthy', specialty: 'General Medicine', title: 'Emergency Physician', experience: '13 years', availability: 'Available', available_slots: JSON.stringify(['Immediate On-Call', 'Today · 02:00 PM', 'Today · 04:00 PM']), phone: '+91 98408 99001', hospital: 'ElderCare Emergency Medical Wing' }
  ],
  issue_specialist_mappings: [
    { id: 1, issue_type: 'Skin disease', specialty: 'Dermatology', specialist_title: 'Dermatologist', default_severity: 'HIGH' },
    { id: 2, issue_type: 'Skin problem / Rash / Allergic reaction', specialty: 'Dermatology', specialist_title: 'Dermatologist', default_severity: 'HIGH' },
    { id: 3, issue_type: 'Chest pain / Heart palpitations', specialty: 'Cardiology', specialist_title: 'Cardiologist', default_severity: 'CRITICAL' },
    { id: 4, issue_type: 'Breathing difficulty / Asthma / Wheezing', specialty: 'Pulmonology', specialist_title: 'Pulmonologist', default_severity: 'CRITICAL' },
    { id: 5, issue_type: 'Fracture / Fall injury / Severe joint pain', specialty: 'Orthopedics', specialist_title: 'Orthopedic Surgeon', default_severity: 'HIGH' },
    { id: 6, issue_type: 'Fall / Suspected fracture', specialty: 'Orthopedics', specialist_title: 'Orthopedic Surgeon', default_severity: 'HIGH' },
    { id: 7, issue_type: 'Sudden confusion / Dizziness / Stroke symptoms', specialty: 'Neurology', specialist_title: 'Neurologist', default_severity: 'CRITICAL' },
    { id: 8, issue_type: 'Severe eye pain / Sudden vision loss', specialty: 'Ophthalmology', specialist_title: 'Ophthalmologist', default_severity: 'HIGH' },
    { id: 9, issue_type: 'Severe abdominal pain / Vomiting', specialty: 'Gastroenterology', specialist_title: 'Gastroenterologist', default_severity: 'HIGH' },
    { id: 10, issue_type: 'High fever / Acute illness / Unresponsive', specialty: 'General Medicine', specialist_title: 'Emergency Physician', default_severity: 'CRITICAL' }
  ],
  appointments: [
    { id: 'AP-01', date: new Date().toISOString().split('T')[0], time: '09:30 AM', patient: 'Lakshmi Devi', patientId: 'EC-001', doctor: 'Dr. Kavya Menon', type: 'Cardiology Review', status: 'confirmed' },
    { id: 'AP-02', date: new Date().toISOString().split('T')[0], time: '11:00 AM', patient: 'Govind Pillai', patientId: 'EC-006', doctor: 'Dr. Arvind Rao', type: 'Nephrology Checkup', status: 'confirmed' },
    { id: 'AP-03', date: new Date().toISOString().split('T')[0], time: '02:30 PM', patient: 'Subramaniam Iyer', patientId: 'EC-004', doctor: 'Dr. Kavya Menon', type: 'Cardiac Monitoring', status: 'pending' },
    { id: 'AP-04', date: new Date().toISOString().split('T')[0], time: '10:00 AM', patient: 'Meenakshi Raman', patientId: 'EC-002', doctor: 'Dr. Sunita Bhatt', type: 'Bone Density Scan', status: 'confirmed' },
    { id: 'AP-05', date: new Date().toISOString().split('T')[0], time: '03:00 PM', patient: 'Raghavan Kumar', patientId: 'EC-003', doctor: 'Dr. Arvind Rao', type: 'Diabetes Follow-up', status: 'confirmed' },
    { id: 'AP-06', date: new Date().toISOString().split('T')[0], time: '09:00 AM', patient: 'Anitha Sundaram', patientId: 'EC-005', doctor: 'Dr. Sunita Bhatt', type: 'Cognitive Assessment', status: 'pending' }
  ],
  care_plans: [
    {
      id: 'CP-01',
      patient: 'Lakshmi Devi',
      residentId: 'EC-001',
      initials: 'LD',
      goal: 'Blood pressure stabilization',
      caregiver: 'Priya Nair',
      reviewDate: 'In 7 days',
      progress: 78,
      tasks: JSON.stringify([
        { label: 'Daily BP monitoring', done: true },
        { label: 'Low-sodium meal plan', done: true },
        { label: 'Morning mobility walk', done: false },
        { label: 'Weekly cardiology review', done: false }
      ])
    },
    {
      id: 'CP-02',
      patient: 'Meenakshi Raman',
      residentId: 'EC-002',
      initials: 'MR',
      goal: 'Improve bone density & mobility',
      caregiver: 'Anand Raj',
      reviewDate: 'In 4 days',
      progress: 54,
      tasks: JSON.stringify([
        { label: 'Vitamin D supplementation', done: true },
        { label: 'Assisted mobility sessions', done: true },
        { label: 'Fall-risk home assessment', done: false }
      ])
    },
    {
      id: 'CP-03',
      patient: 'Raghavan Kumar',
      residentId: 'EC-003',
      initials: 'RK',
      goal: 'Blood sugar management',
      caregiver: 'Deepa Suresh',
      reviewDate: 'In 10 days',
      progress: 88,
      tasks: JSON.stringify([
        { label: 'Twice-daily glucose checks', done: true },
        { label: 'Diet plan adherence', done: true },
        { label: 'Gardening activity (low exertion)', done: true },
        { label: 'Monthly HbA1c test', done: false }
      ])
    },
    {
      id: 'CP-04',
      patient: 'Subramaniam Iyer',
      residentId: 'EC-004',
      initials: 'SI',
      goal: 'Cardiac rhythm stabilization',
      caregiver: 'Anand Raj',
      reviewDate: 'In 2 days',
      progress: 41,
      tasks: JSON.stringify([
        { label: 'Daily manual vitals check', done: true },
        { label: 'Statin therapy compliance', done: false },
        { label: 'Reduced sodium & caffeine intake', done: false },
        { label: 'Weekly cardiologist visit', done: false }
      ])
    }
  ],
  emergency_alerts: [
    {
      id: 'SOS-SEED-01',
      residentId: 'EC-003',
      residentName: 'Raghavan Kumar',
      room: 'Willow Room 1',
      condition: 'Type 2 Diabetes',
      bloodGroup: 'A+',
      caregiver: 'Deepa Suresh',
      emergencyContact: 'Deepak Kumar · Son · +91 94441 88900',
      emergencyType: 'Dizziness & Low Blood Sugar',
      notes: 'Resident experienced sudden dizziness after morning activity. Glucose administered and stabilized.',
      severity: 'HIGH',
      status: 'resolved',
      timestamp: 'Yesterday, 04:15 PM',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      senderRole: 'patient',
      senderName: 'Raghavan Kumar',
      respondedBy: 'Deepa Suresh (Caregiver)',
      respondedAt: '04:18 PM',
      resolutionNotes: 'Vitals stabilized. Blood glucose returned to 110 mg/dL.',
      resolvedAt: '04:35 PM'
    }
  ],
  voicemails: [
    {
      id: 'VM-SEED-01',
      residentId: 'EC-001',
      residentName: 'Lakshmi Devi',
      senderName: 'Lakshmi Devi',
      senderRole: 'patient',
      recipientName: 'Priya Nair',
      recipientRole: 'caregiver',
      category: 'care_instruction',
      subject: 'Morning Knee Mobility Note',
      duration: 22,
      audioUrl: '',
      notes: 'Vanakkam Priya, I am feeling a slight stiffness in my right knee after getting out of bed. Could you bring the knee pain gel before our morning mobility walk? Thank you.',
      emergencyId: null,
      isRead: 0,
      createdAt: new Date().toISOString()
    },
    {
      id: 'VM-SEED-02',
      residentId: 'EC-003',
      residentName: 'Raghavan Kumar',
      senderName: 'Raghavan Kumar',
      senderRole: 'patient',
      recipientName: 'Deepa Suresh',
      recipientRole: 'caregiver',
      category: 'emergency_sos',
      subject: '⚠️ SOS Voice Distress — Dizziness Episode',
      duration: 18,
      audioUrl: '',
      notes: 'Deepa, I felt very dizzy suddenly while standing up. My blood sugar might be dropping. Please come to Willow Room 1 with the glucose drink quickly.',
      emergencyId: 'SOS-SEED-01',
      isRead: 1,
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'VM-SEED-03',
      residentId: 'EC-001',
      residentName: 'Lakshmi Devi',
      senderName: 'Ramesh Devi (Son)',
      senderRole: 'family',
      recipientName: 'Lakshmi Devi',
      recipientRole: 'patient',
      category: 'family_checkin',
      subject: '🌸 Weekend Family Visit Check-in',
      duration: 35,
      audioUrl: '',
      notes: 'Amma, hope you had a good morning! The kids and I will visit this Sunday at 4 PM. Priya said your BP was completely normal today. Take your medicines on time and take care!',
      emergencyId: null,
      isRead: 0,
      createdAt: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: 'VM-SEED-04',
      residentId: 'EC-004',
      residentName: 'Subramaniam Iyer',
      senderName: 'Dr. Kavya Menon',
      senderRole: 'doctor',
      recipientName: 'Anand Raj',
      recipientRole: 'caregiver',
      category: 'care_instruction',
      subject: 'Statin Compliance & Pulse Check Protocol',
      duration: 29,
      audioUrl: '',
      notes: 'Anand, for Subramaniam Iyer, please ensure his pulse is checked prior to administering Digoxin at 2 PM. His ECG shows good stabilization.',
      emergencyId: null,
      isRead: 1,
      createdAt: new Date(Date.now() - 86400000).toISOString()
    }
  ],
  health_vitals: [
    { id: 1, residentId: 'EC-001', heartRate: 72, systolic: 120, diastolic: 80, spO2: 98, glucose: 95, status: 'Normal', recordedAt: new Date().toISOString() },
    { id: 2, residentId: 'EC-002', heartRate: 78, systolic: 125, diastolic: 82, spO2: 97, glucose: 105, status: 'Normal', recordedAt: new Date().toISOString() },
    { id: 3, residentId: 'EC-003', heartRate: 84, systolic: 130, diastolic: 85, spO2: 96, glucose: 142, status: 'Attention', recordedAt: new Date().toISOString() },
    { id: 4, residentId: 'EC-004', heartRate: 92, systolic: 145, diastolic: 92, spO2: 95, glucose: 110, status: 'Critical', recordedAt: new Date().toISOString() },
    { id: 5, residentId: 'EC-005', heartRate: 70, systolic: 118, diastolic: 78, spO2: 99, glucose: 90, status: 'Normal', recordedAt: new Date().toISOString() },
    { id: 6, residentId: 'EC-006', heartRate: 76, systolic: 135, diastolic: 88, spO2: 96, glucose: 115, status: 'Attention', recordedAt: new Date().toISOString() }
  ],
  activities: [
    { id: 'ACT-01', name: 'Morning Mobility', icon: 'PersonStanding', type: 'Physical', schedule: 'Daily · 07:45 AM', duration: '30 min', facilitator: 'Kavitha Reddy', participants: 12, status: 'active' },
    { id: 'ACT-02', name: 'Meditation', icon: 'Flower2', type: 'Wellness', schedule: 'Daily · 06:30 AM', duration: '20 min', facilitator: 'Priya Nair', participants: 9, status: 'active' },
    { id: 'ACT-03', name: 'Music Therapy', icon: 'Music2', type: 'Recreational', schedule: 'Mon, Wed, Fri · 05:00 PM', duration: '45 min', facilitator: 'Anand Raj', participants: 14, status: 'active' },
    { id: 'ACT-04', name: 'Gardening', icon: 'Leaf', type: 'Recreational', schedule: 'Tue, Thu · 04:00 PM', duration: '40 min', facilitator: 'Deepa Suresh', participants: 7, status: 'active' },
    { id: 'ACT-05', name: 'Reading Circle', icon: 'BookOpen', type: 'Cognitive', schedule: 'Daily · 05:30 PM', duration: '30 min', facilitator: 'Suresh Babu', participants: 6, status: 'active' },
    { id: 'ACT-06', name: 'Group Activities', icon: 'Users', type: 'Social', schedule: 'Sat, Sun · 04:30 PM', duration: '60 min', facilitator: 'Vikram Menon', participants: 18, status: 'paused' }
  ],
  documents: [
    { id: 'DOC-01', name: 'Lakshmi Devi — Cardiology Report', type: 'Medical Report', patient: 'Lakshmi Devi', residentId: 'EC-001', date: '3 days ago', status: 'reviewed' },
    { id: 'DOC-02', name: 'Meenakshi Raman — Prescription', type: 'Prescription', patient: 'Meenakshi Raman', residentId: 'EC-002', date: '4 days ago', status: 'active' },
    { id: 'DOC-03', name: 'Raghavan Kumar — Lab Results (HbA1c)', type: 'Lab Result', patient: 'Raghavan Kumar', residentId: 'EC-003', date: '6 days ago', status: 'reviewed' },
    { id: 'DOC-04', name: 'Subramaniam Iyer — Care Plan Update', type: 'Care Plan', patient: 'Subramaniam Iyer', residentId: 'EC-004', date: 'Today', status: 'pending review' },
    { id: 'DOC-05', name: 'Anitha Sundaram — Cognitive Assessment', type: 'Assessment', patient: 'Anitha Sundaram', residentId: 'EC-005', date: '8 days ago', status: 'reviewed' },
    { id: 'DOC-06', name: 'Govind Pillai — Nephrology Report', type: 'Medical Report', patient: 'Govind Pillai', residentId: 'EC-006', date: 'Yesterday', status: 'pending review' },
    { id: 'DOC-07', name: 'Lakshmi Devi — Prescription Renewal', type: 'Prescription', patient: 'Lakshmi Devi', residentId: 'EC-001', date: '14 days ago', status: 'active' }
  ],
  notifications: [
    { id: 'NT-01', type: 'medication', title: 'Medication Reminder', time: '08:00 AM', patient: 'Lakshmi Devi', residentId: 'EC-001', detail: 'Amlodipine · 5 mg', desc: 'It is time to take the scheduled medication.', group_name: 'today', is_read: 0, actionable: 1, senderRole: null, emergencyId: null, created_at: new Date().toISOString() },
    { id: 'NT-02', type: 'appointment', title: 'Upcoming Appointment', time: '09:30 AM', patient: 'Lakshmi Devi', residentId: 'EC-001', detail: 'Cardiology Review · Dr. Kavya Menon', desc: 'Appointment scheduled in 45 minutes.', group_name: 'today', is_read: 0, actionable: 0, senderRole: null, emergencyId: null, created_at: new Date().toISOString() },
    { id: 'NT-03', type: 'health', title: 'Health Alert', time: '07:15 AM', patient: 'Subramaniam Iyer', residentId: 'EC-004', detail: 'Heart rate above normal range', desc: 'Vitals flagged during morning wellness round.', group_name: 'today', is_read: 1, actionable: 0, senderRole: null, emergencyId: null, created_at: new Date().toISOString() },
    { id: 'NT-04', type: 'caregiver', title: 'Shift Update', time: '07:00 AM', patient: 'Deepa Suresh', residentId: null, detail: 'Afternoon shift confirmed', desc: 'Caregiver has checked in for the afternoon shift.', group_name: 'today', is_read: 1, actionable: 0, senderRole: null, emergencyId: null, created_at: new Date().toISOString() },
    { id: 'NT-05', type: 'medication', title: 'Medication Reminder', time: '09:00 PM', patient: 'Subramaniam Iyer', residentId: 'EC-004', detail: 'Atorvastatin · 10 mg', desc: 'Night medication was marked as taken.', group_name: 'yesterday', is_read: 1, actionable: 0, senderRole: null, emergencyId: null, created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: 'NT-06', type: 'emergency', title: 'Emergency Drill Completed', time: '04:20 PM', patient: 'Facility Wide', residentId: null, detail: 'Monthly emergency response drill', desc: 'All caregivers completed the scheduled safety drill.', group_name: 'yesterday', is_read: 1, actionable: 0, senderRole: null, emergencyId: null, created_at: new Date(Date.now() - 86400000).toISOString() }
  ],
  care_records: [
    {
        "record_id": "REC-AS-01",
        "id": "REC-AS-01",
        "resident_id": "EC-005",
        "residentId": "EC-005",
        "date": "19 Sep 2026",
        "time": "04:15 PM",
        "blood_pressure": "121/79",
        "bp": "121/79",
        "temperature": "98.3°F",
        "temp": "98.3°F",
        "weight": "60 kg",
        "observation": "Normal",
        "notes": "Comfortable and responsive during evening cognitive stimulation. Speech clear and oriented to place.",
        "note": "Comfortable and responsive during evening cognitive stimulation. Speech clear and oriented to place.",
        "recorded_by": "Deepa Suresh",
        "recordedBy": "Deepa Suresh",
        "record_type": "Routine Round",
        "recordType": "Routine Round",
        "created_at": "2026-09-19 16:15:00"
    },
    {
        "record_id": "REC-AS-02",
        "id": "REC-AS-02",
        "resident_id": "EC-005",
        "residentId": "EC-005",
        "date": "14 Sep 2026",
        "time": "10:30 AM",
        "blood_pressure": "120/78",
        "bp": "120/78",
        "temperature": "98.2°F",
        "temp": "98.2°F",
        "weight": "60 kg",
        "observation": "Good",
        "notes": "Active participant in classical music therapy. Successfully identified familiar ragas with joy.",
        "note": "Active participant in classical music therapy. Successfully identified familiar ragas with joy.",
        "recorded_by": "Deepa Suresh",
        "recordedBy": "Deepa Suresh",
        "record_type": "Wellness Round",
        "recordType": "Wellness Round",
        "created_at": "2026-09-14 10:30:00"
    },
    {
        "record_id": "REC-AS-03",
        "id": "REC-AS-03",
        "resident_id": "EC-005",
        "residentId": "EC-005",
        "date": "04 Sep 2026",
        "time": "09:30 AM",
        "blood_pressure": "120/78",
        "bp": "120/78",
        "temperature": "98.2°F",
        "temp": "98.2°F",
        "weight": "60 kg",
        "observation": "Normal",
        "notes": "Morning round completed. Vitals stable. Took Donepezil 5mg with breakfast without resistance.",
        "note": "Morning round completed. Vitals stable. Took Donepezil 5mg with breakfast without resistance.",
        "recorded_by": "Deepa Suresh",
        "recordedBy": "Deepa Suresh",
        "record_type": "Morning Vitals",
        "recordType": "Morning Vitals",
        "created_at": "2026-09-04 09:30:00"
    },
    {
        "record_id": "REC-AS-04",
        "id": "REC-AS-04",
        "resident_id": "EC-005",
        "residentId": "EC-005",
        "date": "28 Aug 2026",
        "time": "09:00 AM",
        "blood_pressure": "122/80",
        "bp": "122/80",
        "temperature": "98.4°F",
        "temp": "98.4°F",
        "weight": "60.2 kg",
        "observation": "Normal",
        "notes": "Cheerful and oriented during breakfast round. Completed morning courtyard walk with nurse.",
        "note": "Cheerful and oriented during breakfast round. Completed morning courtyard walk with nurse.",
        "recorded_by": "Deepa Suresh",
        "recordedBy": "Deepa Suresh",
        "record_type": "Routine Round",
        "recordType": "Routine Round",
        "created_at": "2026-08-28 09:00:00"
    },
    {
        "record_id": "REC-AS-05",
        "id": "REC-AS-05",
        "resident_id": "EC-005",
        "residentId": "EC-005",
        "date": "15 Jul 2026",
        "time": "11:00 AM",
        "blood_pressure": "124/80",
        "bp": "124/80",
        "temperature": "98.6°F",
        "temp": "98.6°F",
        "weight": "60.1 kg",
        "observation": "Good",
        "notes": "Quarterly memory assessment conducted. Recall score improved by 2 points following daily puzzles.",
        "note": "Quarterly memory assessment conducted. Recall score improved by 2 points following daily puzzles.",
        "recorded_by": "Dr. Sunita Bhatt",
        "recordedBy": "Dr. Sunita Bhatt",
        "record_type": "Clinical Check",
        "recordType": "Clinical Check",
        "created_at": "2026-07-15 11:00:00"
    },
    {
        "record_id": "REC-AS-06",
        "id": "REC-AS-06",
        "resident_id": "EC-005",
        "residentId": "EC-005",
        "date": "02 May 2026",
        "time": "08:30 AM",
        "blood_pressure": "118/76",
        "bp": "118/76",
        "temperature": "98.1°F",
        "temp": "98.1°F",
        "weight": "59.8 kg",
        "observation": "Normal",
        "notes": "Slept soundly for 7.5 hours. Hydration level good. Breakfast tolerated well.",
        "note": "Slept soundly for 7.5 hours. Hydration level good. Breakfast tolerated well.",
        "recorded_by": "Deepa Suresh",
        "recordedBy": "Deepa Suresh",
        "record_type": "Morning Vitals",
        "recordType": "Morning Vitals",
        "created_at": "2026-05-02 08:30:00"
    },
    {
        "record_id": "REC-AS-07",
        "id": "REC-AS-07",
        "resident_id": "EC-005",
        "residentId": "EC-005",
        "date": "18 Feb 2026",
        "time": "02:45 PM",
        "blood_pressure": "125/82",
        "bp": "125/82",
        "temperature": "98.5°F",
        "temp": "98.5°F",
        "weight": "60.4 kg",
        "observation": "Attention",
        "notes": "Showed mild sundowning restlessness around dusk. Soothing herbal tea and family call calmed her.",
        "note": "Showed mild sundowning restlessness around dusk. Soothing herbal tea and family call calmed her.",
        "recorded_by": "Kavya",
        "recordedBy": "Kavya",
        "record_type": "Routine Round",
        "recordType": "Routine Round",
        "created_at": "2026-02-18 14:45:00"
    },
    {
        "record_id": "REC-AS-08",
        "id": "REC-AS-08",
        "resident_id": "EC-005",
        "residentId": "EC-005",
        "date": "10 Dec 2025",
        "time": "10:15 AM",
        "blood_pressure": "120/78",
        "bp": "120/78",
        "temperature": "98.3°F",
        "temp": "98.3°F",
        "weight": "60.3 kg",
        "observation": "Good",
        "notes": "Winter wellness checkup. Lungs clear to auscultation. Flu vaccination administered with consent.",
        "note": "Winter wellness checkup. Lungs clear to auscultation. Flu vaccination administered with consent.",
        "recorded_by": "Dr. Vivek Murthy",
        "recordedBy": "Dr. Vivek Murthy",
        "record_type": "Clinical Check",
        "recordType": "Clinical Check",
        "created_at": "2025-12-10 10:15:00"
    },
    {
        "record_id": "REC-AS-09",
        "id": "REC-AS-09",
        "resident_id": "EC-005",
        "residentId": "EC-005",
        "date": "24 Aug 2025",
        "time": "04:00 PM",
        "blood_pressure": "122/80",
        "bp": "122/80",
        "temperature": "98.2°F",
        "temp": "98.2°F",
        "weight": "60.5 kg",
        "observation": "Normal",
        "notes": "Gardening session in the courtyard. Good motor dexterity picking hibiscus flowers.",
        "note": "Gardening session in the courtyard. Good motor dexterity picking hibiscus flowers.",
        "recorded_by": "Deepa Suresh",
        "recordedBy": "Deepa Suresh",
        "record_type": "Wellness Round",
        "recordType": "Wellness Round",
        "created_at": "2025-08-24 16:00:00"
    },
    {
        "record_id": "REC-AS-10",
        "id": "REC-AS-10",
        "resident_id": "EC-005",
        "residentId": "EC-005",
        "date": "12 Apr 2025",
        "time": "09:00 AM",
        "blood_pressure": "126/82",
        "bp": "126/82",
        "temperature": "98.4°F",
        "temp": "98.4°F",
        "weight": "60.8 kg",
        "observation": "Stable",
        "notes": "Semi-annual cognitive review. Memantine dosage titrated to 5mg daily. BP well-managed.",
        "note": "Semi-annual cognitive review. Memantine dosage titrated to 5mg daily. BP well-managed.",
        "recorded_by": "Dr. Sunita Bhatt",
        "recordedBy": "Dr. Sunita Bhatt",
        "record_type": "Clinical Check",
        "recordType": "Clinical Check",
        "created_at": "2025-04-12 09:00:00"
    },
    {
        "record_id": "REC-AS-11",
        "id": "REC-AS-11",
        "resident_id": "EC-005",
        "residentId": "EC-005",
        "date": "15 Jan 2025",
        "time": "08:45 AM",
        "blood_pressure": "120/78",
        "bp": "120/78",
        "temperature": "98.1°F",
        "temp": "98.1°F",
        "weight": "60.2 kg",
        "observation": "Normal",
        "notes": "Morning vitals baseline established after first 60 days of residency. Adapting very comfortably.",
        "note": "Morning vitals baseline established after first 60 days of residency. Adapting very comfortably.",
        "recorded_by": "Deepa Suresh",
        "recordedBy": "Deepa Suresh",
        "record_type": "Morning Vitals",
        "recordType": "Morning Vitals",
        "created_at": "2025-01-15 08:45:00"
    },
    {
        "record_id": "REC-AS-12",
        "id": "REC-AS-12",
        "resident_id": "EC-005",
        "residentId": "EC-005",
        "date": "14 Nov 2024",
        "time": "10:00 AM",
        "blood_pressure": "124/80",
        "bp": "124/80",
        "temperature": "98.5°F",
        "temp": "98.5°F",
        "weight": "60.5 kg",
        "observation": "Stable",
        "notes": "Initial admission intake assessment recorded for Anitha Sundaram. Baseline vitals and cognitive evaluation noted.",
        "note": "Initial admission intake assessment recorded for Anitha Sundaram. Baseline vitals and cognitive evaluation noted.",
        "recorded_by": "Deepa Suresh",
        "recordedBy": "Deepa Suresh",
        "record_type": "Intake Assessment",
        "recordType": "Intake Assessment",
        "created_at": "2024-11-14 10:00:00"
    },
    {
        "record_id": "REC-LD-01",
        "id": "REC-LD-01",
        "resident_id": "EC-001",
        "residentId": "EC-001",
        "date": "18 Sep 2026",
        "time": "10:30 AM",
        "blood_pressure": "128/82",
        "bp": "128/82",
        "temperature": "98.4°F",
        "temp": "98.4°F",
        "weight": "58 kg",
        "observation": "Normal",
        "notes": "Comfortable and alert during morning round. Blood pressure within target range on Amlodipine 5mg.",
        "note": "Comfortable and alert during morning round. Blood pressure within target range on Amlodipine 5mg.",
        "recorded_by": "Priya Nair",
        "recordedBy": "Priya Nair",
        "record_type": "Routine Round",
        "recordType": "Routine Round",
        "created_at": "2026-09-18 10:30:00"
    },
    {
        "record_id": "REC-LD-02",
        "id": "REC-LD-02",
        "resident_id": "EC-001",
        "residentId": "EC-001",
        "date": "15 Sep 2026",
        "time": "09:15 AM",
        "blood_pressure": "126/80",
        "bp": "126/80",
        "temperature": "98.6°F",
        "temp": "98.6°F",
        "weight": "58.2 kg",
        "observation": "Stable",
        "notes": "Morning mobility walk completed comfortably. Fluid intake normal. Knee joint stiffness rated 2/10.",
        "note": "Morning mobility walk completed comfortably. Fluid intake normal. Knee joint stiffness rated 2/10.",
        "recorded_by": "Priya Nair",
        "recordedBy": "Priya Nair",
        "record_type": "Morning Vitals",
        "recordType": "Morning Vitals",
        "created_at": "2026-09-15 09:15:00"
    },
    {
        "record_id": "REC-LD-03",
        "id": "REC-LD-03",
        "resident_id": "EC-001",
        "residentId": "EC-001",
        "date": "12 Sep 2026",
        "time": "08:30 AM",
        "blood_pressure": "130/84",
        "bp": "130/84",
        "temperature": "98.3°F",
        "temp": "98.3°F",
        "weight": "58 kg",
        "observation": "Normal",
        "notes": "Appetite good. Complied strictly with low-sodium meal plan. Potassium levels verified normal.",
        "note": "Appetite good. Complied strictly with low-sodium meal plan. Potassium levels verified normal.",
        "recorded_by": "Priya Nair",
        "recordedBy": "Priya Nair",
        "record_type": "Routine Round",
        "recordType": "Routine Round",
        "created_at": "2026-09-12 08:30:00"
    },
    {
        "record_id": "REC-LD-04",
        "id": "REC-LD-04",
        "resident_id": "EC-001",
        "residentId": "EC-001",
        "date": "08 Sep 2026",
        "time": "10:00 AM",
        "blood_pressure": "125/82",
        "bp": "125/82",
        "temperature": "98.5°F",
        "temp": "98.5°F",
        "weight": "57.8 kg",
        "observation": "Good",
        "notes": "Joined morning gentle stretching with physio. Alert and pleasant throughout the session.",
        "note": "Joined morning gentle stretching with physio. Alert and pleasant throughout the session.",
        "recorded_by": "Deepa Suresh",
        "recordedBy": "Deepa Suresh",
        "record_type": "Wellness Round",
        "recordType": "Wellness Round",
        "created_at": "2026-09-08 10:00:00"
    },
    {
        "record_id": "REC-LD-05",
        "id": "REC-LD-05",
        "resident_id": "EC-001",
        "residentId": "EC-001",
        "date": "20 Jul 2026",
        "time": "11:30 AM",
        "blood_pressure": "128/80",
        "bp": "128/80",
        "temperature": "98.2°F",
        "temp": "98.2°F",
        "weight": "58.1 kg",
        "observation": "Normal",
        "notes": "Cardiology routine review with Dr. Kavya Menon. Heart rate regular at 72 bpm. 24-hr ambulatory BP optimal.",
        "note": "Cardiology routine review with Dr. Kavya Menon. Heart rate regular at 72 bpm. 24-hr ambulatory BP optimal.",
        "recorded_by": "Dr. Kavya Menon",
        "recordedBy": "Dr. Kavya Menon",
        "record_type": "Clinical Check",
        "recordType": "Clinical Check",
        "created_at": "2026-07-20 11:30:00"
    },
    {
        "record_id": "REC-LD-06",
        "id": "REC-LD-06",
        "resident_id": "EC-001",
        "residentId": "EC-001",
        "date": "14 Apr 2026",
        "time": "09:00 AM",
        "blood_pressure": "132/85",
        "bp": "132/85",
        "temperature": "98.4°F",
        "temp": "98.4°F",
        "weight": "58.5 kg",
        "observation": "Stable",
        "notes": "Diclofenac gel applied to both knees. Reported reduced morning joint tightness.",
        "note": "Diclofenac gel applied to both knees. Reported reduced morning joint tightness.",
        "recorded_by": "Priya Nair",
        "recordedBy": "Priya Nair",
        "record_type": "Morning Vitals",
        "recordType": "Morning Vitals",
        "created_at": "2026-04-14 09:00:00"
    },
    {
        "record_id": "REC-LD-07",
        "id": "REC-LD-07",
        "resident_id": "EC-001",
        "residentId": "EC-001",
        "date": "05 Nov 2025",
        "time": "02:30 PM",
        "blood_pressure": "126/80",
        "bp": "126/80",
        "temperature": "98.1°F",
        "temp": "98.1°F",
        "weight": "58.3 kg",
        "observation": "Good",
        "notes": "Participated in Diwali celebration tea. Cheerful, engaged in conversation with fellow residents.",
        "note": "Participated in Diwali celebration tea. Cheerful, engaged in conversation with fellow residents.",
        "recorded_by": "Priya Nair",
        "recordedBy": "Priya Nair",
        "record_type": "Wellness Round",
        "recordType": "Wellness Round",
        "created_at": "2025-11-05 14:30:00"
    },
    {
        "record_id": "REC-LD-08",
        "id": "REC-LD-08",
        "resident_id": "EC-001",
        "residentId": "EC-001",
        "date": "18 Jun 2025",
        "time": "10:00 AM",
        "blood_pressure": "134/86",
        "bp": "134/86",
        "temperature": "98.5°F",
        "temp": "98.5°F",
        "weight": "58.8 kg",
        "observation": "Attention",
        "notes": "Slightly higher diastolic pressure after outdoor sun exposure. Resting in cool room normalized reading to 126/82.",
        "note": "Slightly higher diastolic pressure after outdoor sun exposure. Resting in cool room normalized reading to 126/82.",
        "recorded_by": "Priya Nair",
        "recordedBy": "Priya Nair",
        "record_type": "Routine Round",
        "recordType": "Routine Round",
        "created_at": "2025-06-18 10:00:00"
    },
    {
        "record_id": "REC-LD-09",
        "id": "REC-LD-09",
        "resident_id": "EC-001",
        "residentId": "EC-001",
        "date": "10 Feb 2025",
        "time": "08:45 AM",
        "blood_pressure": "128/82",
        "bp": "128/82",
        "temperature": "98.2°F",
        "temp": "98.2°F",
        "weight": "58.6 kg",
        "observation": "Normal",
        "notes": "Annual orthopedic check for knee osteoarthritis. Prescribed Glucosamine and continued gentle walking.",
        "note": "Annual orthopedic check for knee osteoarthritis. Prescribed Glucosamine and continued gentle walking.",
        "recorded_by": "Dr. Rajesh Sharma",
        "recordedBy": "Dr. Rajesh Sharma",
        "record_type": "Clinical Check",
        "recordType": "Clinical Check",
        "created_at": "2025-02-10 08:45:00"
    },
    {
        "record_id": "REC-LD-10",
        "id": "REC-LD-10",
        "resident_id": "EC-001",
        "residentId": "EC-001",
        "date": "12 Jan 2024",
        "time": "11:00 AM",
        "blood_pressure": "132/85",
        "bp": "132/85",
        "temperature": "98.6°F",
        "temp": "98.6°F",
        "weight": "59 kg",
        "observation": "Stable",
        "notes": "Initial admission intake assessment recorded for Lakshmi Devi. Baseline clinical profile documented.",
        "note": "Initial admission intake assessment recorded for Lakshmi Devi. Baseline clinical profile documented.",
        "recorded_by": "Priya Nair",
        "recordedBy": "Priya Nair",
        "record_type": "Intake Assessment",
        "recordType": "Intake Assessment",
        "created_at": "2024-01-12 11:00:00"
    },
    {
        "record_id": "REC-MR-01",
        "id": "REC-MR-01",
        "resident_id": "EC-002",
        "residentId": "EC-002",
        "date": "17 Sep 2026",
        "time": "11:00 AM",
        "blood_pressure": "132/85",
        "bp": "132/85",
        "temperature": "98.1°F",
        "temp": "98.1°F",
        "weight": "54 kg",
        "observation": "Attention",
        "notes": "Requested assistance with morning mobility. Walking frame used for all transfers. Fall risk protocol followed.",
        "note": "Requested assistance with morning mobility. Walking frame used for all transfers. Fall risk protocol followed.",
        "recorded_by": "Anand Raj",
        "recordedBy": "Anand Raj",
        "record_type": "Routine Round",
        "recordType": "Routine Round",
        "created_at": "2026-09-17 11:00:00"
    },
    {
        "record_id": "REC-MR-02",
        "id": "REC-MR-02",
        "resident_id": "EC-002",
        "residentId": "EC-002",
        "date": "14 Sep 2026",
        "time": "09:30 AM",
        "blood_pressure": "128/82",
        "bp": "128/82",
        "temperature": "98.3°F",
        "temp": "98.3°F",
        "weight": "54.2 kg",
        "observation": "Normal",
        "notes": "Vitamin D3 administered after breakfast. Alert during physiotherapy balance review.",
        "note": "Vitamin D3 administered after breakfast. Alert during physiotherapy balance review.",
        "recorded_by": "Anand Raj",
        "recordedBy": "Anand Raj",
        "record_type": "Morning Vitals",
        "recordType": "Morning Vitals",
        "created_at": "2026-09-14 09:30:00"
    },
    {
        "record_id": "REC-MR-03",
        "id": "REC-MR-03",
        "resident_id": "EC-002",
        "residentId": "EC-002",
        "date": "01 Sep 2026",
        "time": "02:15 PM",
        "blood_pressure": "130/84",
        "bp": "130/84",
        "temperature": "98.4°F",
        "temp": "98.4°F",
        "weight": "54.1 kg",
        "observation": "Good",
        "notes": "Dexa scan follow-up reviewed. Bone mineral density stabilized with weekly Alendronate regimen.",
        "note": "Dexa scan follow-up reviewed. Bone mineral density stabilized with weekly Alendronate regimen.",
        "recorded_by": "Dr. Sunita Bhatt",
        "recordedBy": "Dr. Sunita Bhatt",
        "record_type": "Clinical Check",
        "recordType": "Clinical Check",
        "created_at": "2026-09-01 14:15:00"
    },
    {
        "record_id": "REC-MR-04",
        "id": "REC-MR-04",
        "resident_id": "EC-002",
        "residentId": "EC-002",
        "date": "18 Jul 2026",
        "time": "10:00 AM",
        "blood_pressure": "126/80",
        "bp": "126/80",
        "temperature": "98.2°F",
        "temp": "98.2°F",
        "weight": "54.3 kg",
        "observation": "Normal",
        "notes": "Morning sunbathing therapy completed for 20 mins. Cheerful disposition.",
        "note": "Morning sunbathing therapy completed for 20 mins. Cheerful disposition.",
        "recorded_by": "Anand Raj",
        "recordedBy": "Anand Raj",
        "record_type": "Wellness Round",
        "recordType": "Wellness Round",
        "created_at": "2026-07-18 10:00:00"
    },
    {
        "record_id": "REC-MR-05",
        "id": "REC-MR-05",
        "resident_id": "EC-002",
        "residentId": "EC-002",
        "date": "05 May 2026",
        "time": "08:45 AM",
        "blood_pressure": "130/82",
        "bp": "130/82",
        "temperature": "98.5°F",
        "temp": "98.5°F",
        "weight": "54.5 kg",
        "observation": "Normal",
        "notes": "Teriparatide subcutaneous injection administered cleanly without bruising. Tolerance good.",
        "note": "Teriparatide subcutaneous injection administered cleanly without bruising. Tolerance good.",
        "recorded_by": "Anand Raj",
        "recordedBy": "Anand Raj",
        "record_type": "Morning Vitals",
        "recordType": "Morning Vitals",
        "created_at": "2026-05-05 08:45:00"
    },
    {
        "record_id": "REC-MR-06",
        "id": "REC-MR-06",
        "resident_id": "EC-002",
        "residentId": "EC-002",
        "date": "12 Jan 2026",
        "time": "03:30 PM",
        "blood_pressure": "134/86",
        "bp": "134/86",
        "temperature": "98.6°F",
        "temp": "98.6°F",
        "weight": "54.8 kg",
        "observation": "Attention",
        "notes": "Complained of lower back ache after sitting. Warm compression and gentle posture support provided.",
        "note": "Complained of lower back ache after sitting. Warm compression and gentle posture support provided.",
        "recorded_by": "Anand Raj",
        "recordedBy": "Anand Raj",
        "record_type": "Routine Round",
        "recordType": "Routine Round",
        "created_at": "2026-01-12 15:30:00"
    },
    {
        "record_id": "REC-MR-07",
        "id": "REC-MR-07",
        "resident_id": "EC-002",
        "residentId": "EC-002",
        "date": "20 Aug 2025",
        "time": "10:30 AM",
        "blood_pressure": "128/82",
        "bp": "128/82",
        "temperature": "98.2°F",
        "temp": "98.2°F",
        "weight": "55 kg",
        "observation": "Good",
        "notes": "Physiotherapy gait training. Successfully completed 50 steps using four-wheel walker.",
        "note": "Physiotherapy gait training. Successfully completed 50 steps using four-wheel walker.",
        "recorded_by": "Kavitha Reddy",
        "recordedBy": "Kavitha Reddy",
        "record_type": "Wellness Round",
        "recordType": "Wellness Round",
        "created_at": "2025-08-20 10:30:00"
    },
    {
        "record_id": "REC-MR-08",
        "id": "REC-MR-08",
        "resident_id": "EC-002",
        "residentId": "EC-002",
        "date": "14 Feb 2025",
        "time": "09:00 AM",
        "blood_pressure": "132/84",
        "bp": "132/84",
        "temperature": "98.3°F",
        "temp": "98.3°F",
        "weight": "55.2 kg",
        "observation": "Normal",
        "notes": "Serum calcium and 25-hydroxy vitamin D tested. Calcium at 9.4 mg/dL (optimal range).",
        "note": "Serum calcium and 25-hydroxy vitamin D tested. Calcium at 9.4 mg/dL (optimal range).",
        "recorded_by": "Dr. Sunita Bhatt",
        "recordedBy": "Dr. Sunita Bhatt",
        "record_type": "Clinical Check",
        "recordType": "Clinical Check",
        "created_at": "2025-02-14 09:00:00"
    },
    {
        "record_id": "REC-MR-09",
        "id": "REC-MR-09",
        "resident_id": "EC-002",
        "residentId": "EC-002",
        "date": "10 Sep 2024",
        "time": "08:30 AM",
        "blood_pressure": "130/84",
        "bp": "130/84",
        "temperature": "98.4°F",
        "temp": "98.4°F",
        "weight": "55 kg",
        "observation": "Normal",
        "notes": "Morning round complete. Calcium carbonate and magnesium glycinate compliance verified.",
        "note": "Morning round complete. Calcium carbonate and magnesium glycinate compliance verified.",
        "recorded_by": "Anand Raj",
        "recordedBy": "Anand Raj",
        "record_type": "Morning Vitals",
        "recordType": "Morning Vitals",
        "created_at": "2024-09-10 08:30:00"
    },
    {
        "record_id": "REC-MR-10",
        "id": "REC-MR-10",
        "resident_id": "EC-002",
        "residentId": "EC-002",
        "date": "03 Mar 2023",
        "time": "10:00 AM",
        "blood_pressure": "135/88",
        "bp": "135/88",
        "temperature": "98.4°F",
        "temp": "98.4°F",
        "weight": "55 kg",
        "observation": "Stable",
        "notes": "Initial admission intake assessment for Meenakshi Raman. Severe osteoporosis protocol instituted.",
        "note": "Initial admission intake assessment for Meenakshi Raman. Severe osteoporosis protocol instituted.",
        "recorded_by": "Anand Raj",
        "recordedBy": "Anand Raj",
        "record_type": "Intake Assessment",
        "recordType": "Intake Assessment",
        "created_at": "2023-03-03 10:00:00"
    },
    {
        "record_id": "REC-RK-01",
        "id": "REC-RK-01",
        "resident_id": "EC-003",
        "residentId": "EC-003",
        "date": "19 Sep 2026",
        "time": "09:00 AM",
        "blood_pressure": "124/80",
        "bp": "124/80",
        "temperature": "98.6°F",
        "temp": "98.6°F",
        "weight": "71 kg",
        "observation": "Normal",
        "notes": "Fasting glucose 112 mg/dL (within target). Enjoyed gardening activity this morning.",
        "note": "Fasting glucose 112 mg/dL (within target). Enjoyed gardening activity this morning.",
        "recorded_by": "Deepa Suresh",
        "recordedBy": "Deepa Suresh",
        "record_type": "Routine Round",
        "recordType": "Routine Round",
        "created_at": "2026-09-19 09:00:00"
    },
    {
        "record_id": "REC-RK-02",
        "id": "REC-RK-02",
        "resident_id": "EC-003",
        "residentId": "EC-003",
        "date": "16 Sep 2026",
        "time": "08:45 AM",
        "blood_pressure": "130/85",
        "bp": "130/85",
        "temperature": "98.4°F",
        "temp": "98.4°F",
        "weight": "71.2 kg",
        "observation": "Attention",
        "notes": "Post-meal glucose slightly elevated at 168 mg/dL. Dietary counseling provided regarding evening snack.",
        "note": "Post-meal glucose slightly elevated at 168 mg/dL. Dietary counseling provided regarding evening snack.",
        "recorded_by": "Deepa Suresh",
        "recordedBy": "Deepa Suresh",
        "record_type": "Morning Vitals",
        "recordType": "Morning Vitals",
        "created_at": "2026-09-16 08:45:00"
    },
    {
        "record_id": "REC-RK-03",
        "id": "REC-RK-03",
        "resident_id": "EC-003",
        "residentId": "EC-003",
        "date": "03 Sep 2026",
        "time": "10:30 AM",
        "blood_pressure": "122/78",
        "bp": "122/78",
        "temperature": "98.3°F",
        "temp": "98.3°F",
        "weight": "71 kg",
        "observation": "Good",
        "notes": "Quarterly HbA1c test completed: 6.8% (well controlled). Dapagliflozin 10mg tolerated well.",
        "note": "Quarterly HbA1c test completed: 6.8% (well controlled). Dapagliflozin 10mg tolerated well.",
        "recorded_by": "Dr. Arvind Rao",
        "recordedBy": "Dr. Arvind Rao",
        "record_type": "Clinical Check",
        "recordType": "Clinical Check",
        "created_at": "2026-09-03 10:30:00"
    },
    {
        "record_id": "REC-RK-04",
        "id": "REC-RK-04",
        "resident_id": "EC-003",
        "residentId": "EC-003",
        "date": "15 Jul 2026",
        "time": "04:00 PM",
        "blood_pressure": "125/82",
        "bp": "125/82",
        "temperature": "98.5°F",
        "temp": "98.5°F",
        "weight": "71.4 kg",
        "observation": "Normal",
        "notes": "Diabetic foot examination conducted. Skin intact, sensations present, no lesions or calluses detected.",
        "note": "Diabetic foot examination conducted. Skin intact, sensations present, no lesions or calluses detected.",
        "recorded_by": "Deepa Suresh",
        "recordedBy": "Deepa Suresh",
        "record_type": "Wellness Round",
        "recordType": "Wellness Round",
        "created_at": "2026-07-15 16:00:00"
    },
    {
        "record_id": "REC-RK-05",
        "id": "REC-RK-05",
        "resident_id": "EC-003",
        "residentId": "EC-003",
        "date": "20 Apr 2026",
        "time": "08:30 AM",
        "blood_pressure": "126/80",
        "bp": "126/80",
        "temperature": "98.2°F",
        "temp": "98.2°F",
        "weight": "71.5 kg",
        "observation": "Normal",
        "notes": "Metformin SR 500mg morning dose taken with whole-wheat breakfast. Hydration emphasized.",
        "note": "Metformin SR 500mg morning dose taken with whole-wheat breakfast. Hydration emphasized.",
        "recorded_by": "Deepa Suresh",
        "recordedBy": "Deepa Suresh",
        "record_type": "Morning Vitals",
        "recordType": "Morning Vitals",
        "created_at": "2026-04-20 08:30:00"
    },
    {
        "record_id": "REC-RK-06",
        "id": "REC-RK-06",
        "resident_id": "EC-003",
        "residentId": "EC-003",
        "date": "10 Dec 2025",
        "time": "02:00 PM",
        "blood_pressure": "128/82",
        "bp": "128/82",
        "temperature": "98.4°F",
        "temp": "98.4°F",
        "weight": "71.8 kg",
        "observation": "Good",
        "notes": "Ophthalmology dilated fundus examination. No signs of diabetic retinopathy. Clear vision.",
        "note": "Ophthalmology dilated fundus examination. No signs of diabetic retinopathy. Clear vision.",
        "recorded_by": "Dr. Meenakshi Iyer",
        "recordedBy": "Dr. Meenakshi Iyer",
        "record_type": "Clinical Check",
        "recordType": "Clinical Check",
        "created_at": "2025-12-10 14:00:00"
    },
    {
        "record_id": "REC-RK-07",
        "id": "REC-RK-07",
        "resident_id": "EC-003",
        "residentId": "EC-003",
        "date": "18 Aug 2025",
        "time": "09:15 AM",
        "blood_pressure": "124/80",
        "bp": "124/80",
        "temperature": "98.6°F",
        "temp": "98.6°F",
        "weight": "72 kg",
        "observation": "Normal",
        "notes": "Morning round. Fasting sugar 118 mg/dL. In cheerful spirits chatting with room neighbors.",
        "note": "Morning round. Fasting sugar 118 mg/dL. In cheerful spirits chatting with room neighbors.",
        "recorded_by": "Deepa Suresh",
        "recordedBy": "Deepa Suresh",
        "record_type": "Routine Round",
        "recordType": "Routine Round",
        "created_at": "2025-08-18 09:15:00"
    },
    {
        "record_id": "REC-RK-08",
        "id": "REC-RK-08",
        "resident_id": "EC-003",
        "residentId": "EC-003",
        "date": "02 Mar 2025",
        "time": "11:00 AM",
        "blood_pressure": "126/82",
        "bp": "126/82",
        "temperature": "98.3°F",
        "temp": "98.3°F",
        "weight": "72.2 kg",
        "observation": "Good",
        "notes": "Annual renal profile: serum creatinine 1.0 mg/dL, eGFR normal. Urine microalbumin negative.",
        "note": "Annual renal profile: serum creatinine 1.0 mg/dL, eGFR normal. Urine microalbumin negative.",
        "recorded_by": "Dr. Arvind Rao",
        "recordedBy": "Dr. Arvind Rao",
        "record_type": "Clinical Check",
        "recordType": "Clinical Check",
        "created_at": "2025-03-02 11:00:00"
    },
    {
        "record_id": "REC-RK-09",
        "id": "REC-RK-09",
        "resident_id": "EC-003",
        "residentId": "EC-003",
        "date": "14 Oct 2024",
        "time": "08:30 AM",
        "blood_pressure": "127/81",
        "bp": "127/81",
        "temperature": "98.5°F",
        "temp": "98.5°F",
        "weight": "72 kg",
        "observation": "Normal",
        "notes": "Morning vitals logged. Patient adhering consistently to diabetic meal distribution.",
        "note": "Morning vitals logged. Patient adhering consistently to diabetic meal distribution.",
        "recorded_by": "Deepa Suresh",
        "recordedBy": "Deepa Suresh",
        "record_type": "Morning Vitals",
        "recordType": "Morning Vitals",
        "created_at": "2024-10-14 08:30:00"
    },
    {
        "record_id": "REC-RK-10",
        "id": "REC-RK-10",
        "resident_id": "EC-003",
        "residentId": "EC-003",
        "date": "22 Jul 2022",
        "time": "10:30 AM",
        "blood_pressure": "128/82",
        "bp": "128/82",
        "temperature": "98.6°F",
        "temp": "98.6°F",
        "weight": "72 kg",
        "observation": "Stable",
        "notes": "Initial admission intake assessment for Raghavan Kumar. Glycemic management plan initiated.",
        "note": "Initial admission intake assessment for Raghavan Kumar. Glycemic management plan initiated.",
        "recorded_by": "Deepa Suresh",
        "recordedBy": "Deepa Suresh",
        "record_type": "Intake Assessment",
        "recordType": "Intake Assessment",
        "created_at": "2022-07-22 10:30:00"
    },
    {
        "record_id": "REC-SI-01",
        "id": "REC-SI-01",
        "resident_id": "EC-004",
        "residentId": "EC-004",
        "date": "19 Sep 2026",
        "time": "07:15 AM",
        "blood_pressure": "138/88",
        "bp": "138/88",
        "temperature": "98.9°F",
        "temp": "98.9°F",
        "weight": "76 kg",
        "observation": "Attention",
        "notes": "Under close cardiac review. Pulse 78 bpm regular. Statin and Metoprolol therapy continued as prescribed.",
        "note": "Under close cardiac review. Pulse 78 bpm regular. Statin and Metoprolol therapy continued as prescribed.",
        "recorded_by": "Anand Raj",
        "recordedBy": "Anand Raj",
        "record_type": "Routine Round",
        "recordType": "Routine Round",
        "created_at": "2026-09-19 07:15:00"
    },
    {
        "record_id": "REC-SI-02",
        "id": "REC-SI-02",
        "resident_id": "EC-004",
        "residentId": "EC-004",
        "date": "17 Sep 2026",
        "time": "08:00 AM",
        "blood_pressure": "142/90",
        "bp": "142/90",
        "temperature": "98.8°F",
        "temp": "98.8°F",
        "weight": "76.3 kg",
        "observation": "Attention",
        "notes": "Blood pressure slightly elevated after stairs. Resting vitals logged. No chest tightness or palpitations.",
        "note": "Blood pressure slightly elevated after stairs. Resting vitals logged. No chest tightness or palpitations.",
        "recorded_by": "Anand Raj",
        "recordedBy": "Anand Raj",
        "record_type": "Morning Vitals",
        "recordType": "Morning Vitals",
        "created_at": "2026-09-17 08:00:00"
    },
    {
        "record_id": "REC-SI-03",
        "id": "REC-SI-03",
        "resident_id": "EC-004",
        "residentId": "EC-004",
        "date": "02 Sep 2026",
        "time": "11:00 AM",
        "blood_pressure": "134/86",
        "bp": "134/86",
        "temperature": "98.4°F",
        "temp": "98.4°F",
        "weight": "76 kg",
        "observation": "Stable",
        "notes": "12-lead ECG completed by cardiology team. Sinus rhythm maintained. PR and QTc intervals within limits.",
        "note": "12-lead ECG completed by cardiology team. Sinus rhythm maintained. PR and QTc intervals within limits.",
        "recorded_by": "Dr. Kavya Menon",
        "recordedBy": "Dr. Kavya Menon",
        "record_type": "Clinical Check",
        "recordType": "Clinical Check",
        "created_at": "2026-09-02 11:00:00"
    },
    {
        "record_id": "REC-SI-04",
        "id": "REC-SI-04",
        "resident_id": "EC-004",
        "residentId": "EC-004",
        "date": "14 Jul 2026",
        "time": "03:30 PM",
        "blood_pressure": "136/86",
        "bp": "136/86",
        "temperature": "98.5°F",
        "temp": "98.5°F",
        "weight": "76.2 kg",
        "observation": "Normal",
        "notes": "Afternoon round. Completed light deep-breathing relaxation exercises. Pulse calm at 74 bpm.",
        "note": "Afternoon round. Completed light deep-breathing relaxation exercises. Pulse calm at 74 bpm.",
        "recorded_by": "Anand Raj",
        "recordedBy": "Anand Raj",
        "record_type": "Wellness Round",
        "recordType": "Wellness Round",
        "created_at": "2026-07-14 15:30:00"
    },
    {
        "record_id": "REC-SI-05",
        "id": "REC-SI-05",
        "resident_id": "EC-004",
        "residentId": "EC-004",
        "date": "08 Apr 2026",
        "time": "08:30 AM",
        "blood_pressure": "135/85",
        "bp": "135/85",
        "temperature": "98.6°F",
        "temp": "98.6°F",
        "weight": "76.5 kg",
        "observation": "Stable",
        "notes": "Morning round. Clopidogrel and Ecosprin antiplatelet therapy adherence verified. No bruising.",
        "note": "Morning round. Clopidogrel and Ecosprin antiplatelet therapy adherence verified. No bruising.",
        "recorded_by": "Anand Raj",
        "recordedBy": "Anand Raj",
        "record_type": "Morning Vitals",
        "recordType": "Morning Vitals",
        "created_at": "2026-04-08 08:30:00"
    },
    {
        "record_id": "REC-SI-06",
        "id": "REC-SI-06",
        "resident_id": "EC-004",
        "residentId": "EC-004",
        "date": "15 Jan 2026",
        "time": "10:45 AM",
        "blood_pressure": "132/84",
        "bp": "132/84",
        "temperature": "98.2°F",
        "temp": "98.2°F",
        "weight": "76.6 kg",
        "observation": "Good",
        "notes": "Lipid panel follow-up: Total cholesterol reduced to 168 mg/dL, LDL 82 mg/dL. Atorvastatin effective.",
        "note": "Lipid panel follow-up: Total cholesterol reduced to 168 mg/dL, LDL 82 mg/dL. Atorvastatin effective.",
        "recorded_by": "Dr. Kavya Menon",
        "recordedBy": "Dr. Kavya Menon",
        "record_type": "Clinical Check",
        "recordType": "Clinical Check",
        "created_at": "2026-01-15 10:45:00"
    },
    {
        "record_id": "REC-SI-07",
        "id": "REC-SI-07",
        "resident_id": "EC-004",
        "residentId": "EC-004",
        "date": "20 Sep 2025",
        "time": "09:00 AM",
        "blood_pressure": "138/88",
        "bp": "138/88",
        "temperature": "98.5°F",
        "temp": "98.5°F",
        "weight": "76.8 kg",
        "observation": "Attention",
        "notes": "Cardiology consultation. Added Ramipril 2.5mg for vascular wall remodeling and BP regulation.",
        "note": "Cardiology consultation. Added Ramipril 2.5mg for vascular wall remodeling and BP regulation.",
        "recorded_by": "Dr. Kavya Menon",
        "recordedBy": "Dr. Kavya Menon",
        "record_type": "Clinical Check",
        "recordType": "Clinical Check",
        "created_at": "2025-09-20 09:00:00"
    },
    {
        "record_id": "REC-SI-08",
        "id": "REC-SI-08",
        "resident_id": "EC-004",
        "residentId": "EC-004",
        "date": "11 May 2025",
        "time": "04:00 PM",
        "blood_pressure": "134/85",
        "bp": "134/85",
        "temperature": "98.4°F",
        "temp": "98.4°F",
        "weight": "77 kg",
        "observation": "Normal",
        "notes": "Enjoyed reading afternoon newspapers in the lounge. Alert and conversant.",
        "note": "Enjoyed reading afternoon newspapers in the lounge. Alert and conversant.",
        "recorded_by": "Anand Raj",
        "recordedBy": "Anand Raj",
        "record_type": "Wellness Round",
        "recordType": "Wellness Round",
        "created_at": "2025-05-11 16:00:00"
    },
    {
        "record_id": "REC-SI-09",
        "id": "REC-SI-09",
        "resident_id": "EC-004",
        "residentId": "EC-004",
        "date": "02 Dec 2024",
        "time": "08:15 AM",
        "blood_pressure": "136/87",
        "bp": "136/87",
        "temperature": "98.5°F",
        "temp": "98.5°F",
        "weight": "77 kg",
        "observation": "Stable",
        "notes": "Routine morning round. Potassium levels checked and stable following Potklor supplementation.",
        "note": "Routine morning round. Potassium levels checked and stable following Potklor supplementation.",
        "recorded_by": "Anand Raj",
        "recordedBy": "Anand Raj",
        "record_type": "Morning Vitals",
        "recordType": "Morning Vitals",
        "created_at": "2024-12-02 08:15:00"
    },
    {
        "record_id": "REC-SI-10",
        "id": "REC-SI-10",
        "resident_id": "EC-004",
        "residentId": "EC-004",
        "date": "09 Sep 2021",
        "time": "09:00 AM",
        "blood_pressure": "140/90",
        "bp": "140/90",
        "temperature": "98.6°F",
        "temp": "98.6°F",
        "weight": "77 kg",
        "observation": "Attention",
        "notes": "Initial cardiac intake evaluation for Subramaniam Iyer. Comprehensive cardio-protective regimen begun.",
        "note": "Initial cardiac intake evaluation for Subramaniam Iyer. Comprehensive cardio-protective regimen begun.",
        "recorded_by": "Anand Raj",
        "recordedBy": "Anand Raj",
        "record_type": "Intake Assessment",
        "recordType": "Intake Assessment",
        "created_at": "2021-09-09 09:00:00"
    },
    {
        "record_id": "REC-GP-01",
        "id": "REC-GP-01",
        "resident_id": "EC-006",
        "residentId": "EC-006",
        "date": "18 Sep 2026",
        "time": "04:00 PM",
        "blood_pressure": "130/84",
        "bp": "130/84",
        "temperature": "98.5°F",
        "temp": "98.5°F",
        "weight": "68 kg",
        "observation": "Attention",
        "notes": "Fluid intake logged at 1200ml (within recommended daily limit). Mild bilateral pedal edema noted.",
        "note": "Fluid intake logged at 1200ml (within recommended daily limit). Mild bilateral pedal edema noted.",
        "recorded_by": "Priya Nair",
        "recordedBy": "Priya Nair",
        "record_type": "Routine Round",
        "recordType": "Routine Round",
        "created_at": "2026-09-18 16:00:00"
    },
    {
        "record_id": "REC-GP-02",
        "id": "REC-GP-02",
        "resident_id": "EC-006",
        "residentId": "EC-006",
        "date": "15 Sep 2026",
        "time": "09:30 AM",
        "blood_pressure": "135/88",
        "bp": "135/88",
        "temperature": "98.6°F",
        "temp": "98.6°F",
        "weight": "68.4 kg",
        "observation": "Attention",
        "notes": "Weekly nephrology review noted stable electrolyte panel. Serum potassium 4.2 mEq/L (normal).",
        "note": "Weekly nephrology review noted stable electrolyte panel. Serum potassium 4.2 mEq/L (normal).",
        "recorded_by": "Priya Nair",
        "recordedBy": "Priya Nair",
        "record_type": "Morning Vitals",
        "recordType": "Morning Vitals",
        "created_at": "2026-09-15 09:30:00"
    },
    {
        "record_id": "REC-GP-03",
        "id": "REC-GP-03",
        "resident_id": "EC-006",
        "residentId": "EC-006",
        "date": "01 Sep 2026",
        "time": "11:15 AM",
        "blood_pressure": "132/86",
        "bp": "132/86",
        "temperature": "98.4°F",
        "temp": "98.4°F",
        "weight": "68.2 kg",
        "observation": "Stable",
        "notes": "Renal ultrasound confirmed stable kidney architecture without hydronephrosis.",
        "note": "Renal ultrasound confirmed stable kidney architecture without hydronephrosis.",
        "recorded_by": "Dr. Arvind Rao",
        "recordedBy": "Dr. Arvind Rao",
        "record_type": "Clinical Check",
        "recordType": "Clinical Check",
        "created_at": "2026-09-01 11:15:00"
    },
    {
        "record_id": "REC-GP-04",
        "id": "REC-GP-04",
        "resident_id": "EC-006",
        "residentId": "EC-006",
        "date": "12 Jul 2026",
        "time": "02:30 PM",
        "blood_pressure": "128/82",
        "bp": "128/82",
        "temperature": "98.3°F",
        "temp": "98.3°F",
        "weight": "68.1 kg",
        "observation": "Good",
        "notes": "Complied with low-protein, low-sodium renal diet. Energy levels good during afternoon socialization.",
        "note": "Complied with low-protein, low-sodium renal diet. Energy levels good during afternoon socialization.",
        "recorded_by": "Priya Nair",
        "recordedBy": "Priya Nair",
        "record_type": "Wellness Round",
        "recordType": "Wellness Round",
        "created_at": "2026-07-12 14:30:00"
    },
    {
        "record_id": "REC-GP-05",
        "id": "REC-GP-05",
        "resident_id": "EC-006",
        "residentId": "EC-006",
        "date": "28 Apr 2026",
        "time": "08:45 AM",
        "blood_pressure": "134/86",
        "bp": "134/86",
        "temperature": "98.5°F",
        "temp": "98.5°F",
        "weight": "68.5 kg",
        "observation": "Stable",
        "notes": "Morning Torsemide and Sodium Bicarbonate administered. Urine output adequate.",
        "note": "Morning Torsemide and Sodium Bicarbonate administered. Urine output adequate.",
        "recorded_by": "Priya Nair",
        "recordedBy": "Priya Nair",
        "record_type": "Morning Vitals",
        "recordType": "Morning Vitals",
        "created_at": "2026-04-28 08:45:00"
    },
    {
        "record_id": "REC-GP-06",
        "id": "REC-GP-06",
        "resident_id": "EC-006",
        "residentId": "EC-006",
        "date": "10 Jan 2026",
        "time": "10:00 AM",
        "blood_pressure": "130/84",
        "bp": "130/84",
        "temperature": "98.2°F",
        "temp": "98.2°F",
        "weight": "68.7 kg",
        "observation": "Good",
        "notes": "Quarterly nephrology check: eGFR 68 mL/min/1.73m2 (stable CKD stage 2). Anemia well-managed on iron.",
        "note": "Quarterly nephrology check: eGFR 68 mL/min/1.73m2 (stable CKD stage 2). Anemia well-managed on iron.",
        "recorded_by": "Dr. Arvind Rao",
        "recordedBy": "Dr. Arvind Rao",
        "record_type": "Clinical Check",
        "recordType": "Clinical Check",
        "created_at": "2026-01-10 10:00:00"
    },
    {
        "record_id": "REC-GP-07",
        "id": "REC-GP-07",
        "resident_id": "EC-006",
        "residentId": "EC-006",
        "date": "19 Aug 2025",
        "time": "04:15 PM",
        "blood_pressure": "132/85",
        "bp": "132/85",
        "temperature": "98.6°F",
        "temp": "98.6°F",
        "weight": "68.8 kg",
        "observation": "Normal",
        "notes": "Evening tea with family visitors. In high spirits, discussed grandchildren with daughter.",
        "note": "Evening tea with family visitors. In high spirits, discussed grandchildren with daughter.",
        "recorded_by": "Priya Nair",
        "recordedBy": "Priya Nair",
        "record_type": "Wellness Round",
        "recordType": "Wellness Round",
        "created_at": "2025-08-19 16:15:00"
    },
    {
        "record_id": "REC-GP-08",
        "id": "REC-GP-08",
        "resident_id": "EC-006",
        "residentId": "EC-006",
        "date": "22 Mar 2025",
        "time": "09:00 AM",
        "blood_pressure": "136/88",
        "bp": "136/88",
        "temperature": "98.4°F",
        "temp": "98.4°F",
        "weight": "69 kg",
        "observation": "Attention",
        "notes": "Serum uric acid slightly elevated. Prescribed Febuxostat 40mg daily with breakfast.",
        "note": "Serum uric acid slightly elevated. Prescribed Febuxostat 40mg daily with breakfast.",
        "recorded_by": "Dr. Arvind Rao",
        "recordedBy": "Dr. Arvind Rao",
        "record_type": "Clinical Check",
        "recordType": "Clinical Check",
        "created_at": "2025-03-22 09:00:00"
    },
    {
        "record_id": "REC-GP-09",
        "id": "REC-GP-09",
        "resident_id": "EC-006",
        "residentId": "EC-006",
        "date": "15 Oct 2024",
        "time": "08:30 AM",
        "blood_pressure": "130/84",
        "bp": "130/84",
        "temperature": "98.3°F",
        "temp": "98.3°F",
        "weight": "69.1 kg",
        "observation": "Normal",
        "notes": "Morning vitals recorded. Patient compliant with Sevelamer phosphate binder during meals.",
        "note": "Morning vitals recorded. Patient compliant with Sevelamer phosphate binder during meals.",
        "recorded_by": "Priya Nair",
        "recordedBy": "Priya Nair",
        "record_type": "Morning Vitals",
        "recordType": "Morning Vitals",
        "created_at": "2024-10-15 08:30:00"
    },
    {
        "record_id": "REC-GP-10",
        "id": "REC-GP-10",
        "resident_id": "EC-006",
        "residentId": "EC-006",
        "date": "30 May 2023",
        "time": "11:15 AM",
        "blood_pressure": "132/86",
        "bp": "132/86",
        "temperature": "98.4°F",
        "temp": "98.4°F",
        "weight": "69 kg",
        "observation": "Stable",
        "notes": "Initial admission intake assessment for Govind Pillai. Nephrology diet and fluid charts set up.",
        "note": "Initial admission intake assessment for Govind Pillai. Nephrology diet and fluid charts set up.",
        "recorded_by": "Priya Nair",
        "recordedBy": "Priya Nair",
        "record_type": "Intake Assessment",
        "recordType": "Intake Assessment",
        "created_at": "2023-05-30 11:15:00"
    },
    {
        "record_id": "REC-SG-01",
        "id": "REC-SG-01",
        "resident_id": "EC-007",
        "residentId": "EC-007",
        "date": "19 Sep 2026",
        "time": "02:30 PM",
        "blood_pressure": "118/76",
        "bp": "118/76",
        "temperature": "98.2°F",
        "temp": "98.2°F",
        "weight": "56 kg",
        "observation": "Good",
        "notes": "Participated actively in wellness recreation. Cheerful and oriented. Vitals completely normal.",
        "note": "Participated actively in wellness recreation. Cheerful and oriented. Vitals completely normal.",
        "recorded_by": "Suresh Babu",
        "recordedBy": "Suresh Babu",
        "record_type": "Routine Round",
        "recordType": "Routine Round",
        "created_at": "2026-09-19 14:30:00"
    },
    {
        "record_id": "REC-SG-02",
        "id": "REC-SG-02",
        "resident_id": "EC-007",
        "residentId": "EC-007",
        "date": "16 Sep 2026",
        "time": "09:00 AM",
        "blood_pressure": "120/78",
        "bp": "120/78",
        "temperature": "98.1°F",
        "temp": "98.1°F",
        "weight": "56.2 kg",
        "observation": "Normal",
        "notes": "Morning routine round. Slept well overnight. Hydration and nutritional intake optimal.",
        "note": "Morning routine round. Slept well overnight. Hydration and nutritional intake optimal.",
        "recorded_by": "Suresh Babu",
        "recordedBy": "Suresh Babu",
        "record_type": "Morning Vitals",
        "recordType": "Morning Vitals",
        "created_at": "2026-09-16 09:00:00"
    },
    {
        "record_id": "REC-SG-03",
        "id": "REC-SG-03",
        "resident_id": "EC-007",
        "residentId": "EC-007",
        "date": "02 Sep 2026",
        "time": "10:15 AM",
        "blood_pressure": "116/74",
        "bp": "116/74",
        "temperature": "98.3°F",
        "temp": "98.3°F",
        "weight": "56 kg",
        "observation": "Good",
        "notes": "Joined morning meditation and light yoga session. Flexibility and balance praised by therapist.",
        "note": "Joined morning meditation and light yoga session. Flexibility and balance praised by therapist.",
        "recorded_by": "Deepa Suresh",
        "recordedBy": "Deepa Suresh",
        "record_type": "Wellness Round",
        "recordType": "Wellness Round",
        "created_at": "2026-09-02 10:15:00"
    },
    {
        "record_id": "REC-SG-04",
        "id": "REC-SG-04",
        "resident_id": "EC-007",
        "residentId": "EC-007",
        "date": "14 Jul 2026",
        "time": "11:00 AM",
        "blood_pressure": "118/76",
        "bp": "118/76",
        "temperature": "98.4°F",
        "temp": "98.4°F",
        "weight": "55.8 kg",
        "observation": "Normal",
        "notes": "Semi-annual general wellness checkup. Cardiopulmonary auscultation clear. Labs all in normal range.",
        "note": "Semi-annual general wellness checkup. Cardiopulmonary auscultation clear. Labs all in normal range.",
        "recorded_by": "Dr. Vivek Murthy",
        "recordedBy": "Dr. Vivek Murthy",
        "record_type": "Clinical Check",
        "recordType": "Clinical Check",
        "created_at": "2026-07-14 11:00:00"
    },
    {
        "record_id": "REC-SG-05",
        "id": "REC-SG-05",
        "resident_id": "EC-007",
        "residentId": "EC-007",
        "date": "20 Mar 2026",
        "time": "08:45 AM",
        "blood_pressure": "120/78",
        "bp": "120/78",
        "temperature": "98.0°F",
        "temp": "98.0°F",
        "weight": "56.1 kg",
        "observation": "Normal",
        "notes": "Morning vitals recorded. Excellent appetite during breakfast.",
        "note": "Morning vitals recorded. Excellent appetite during breakfast.",
        "recorded_by": "Suresh Babu",
        "recordedBy": "Suresh Babu",
        "record_type": "Morning Vitals",
        "recordType": "Morning Vitals",
        "created_at": "2026-03-20 08:45:00"
    },
    {
        "record_id": "REC-SG-06",
        "id": "REC-SG-06",
        "resident_id": "EC-007",
        "residentId": "EC-007",
        "date": "18 Nov 2025",
        "time": "03:00 PM",
        "blood_pressure": "118/76",
        "bp": "118/76",
        "temperature": "98.2°F",
        "temp": "98.2°F",
        "weight": "56.3 kg",
        "observation": "Good",
        "notes": "Art and crafts workshop. Expressed appreciation for the community activities.",
        "note": "Art and crafts workshop. Expressed appreciation for the community activities.",
        "recorded_by": "Deepa Suresh",
        "recordedBy": "Deepa Suresh",
        "record_type": "Wellness Round",
        "recordType": "Wellness Round",
        "created_at": "2025-11-18 15:00:00"
    },
    {
        "record_id": "REC-SG-07",
        "id": "REC-SG-07",
        "resident_id": "EC-007",
        "residentId": "EC-007",
        "date": "10 Jun 2025",
        "time": "09:30 AM",
        "blood_pressure": "122/80",
        "bp": "122/80",
        "temperature": "98.3°F",
        "temp": "98.3°F",
        "weight": "56.5 kg",
        "observation": "Normal",
        "notes": "Routine seasonal health review. Advised regular hydration during summer heat.",
        "note": "Routine seasonal health review. Advised regular hydration during summer heat.",
        "recorded_by": "Dr. Vivek Murthy",
        "recordedBy": "Dr. Vivek Murthy",
        "record_type": "Clinical Check",
        "recordType": "Clinical Check",
        "created_at": "2025-06-10 09:30:00"
    },
    {
        "record_id": "REC-SG-08",
        "id": "REC-SG-08",
        "resident_id": "EC-007",
        "residentId": "EC-007",
        "date": "15 Jan 2025",
        "time": "10:00 AM",
        "blood_pressure": "118/75",
        "bp": "118/75",
        "temperature": "98.2°F",
        "temp": "98.2°F",
        "weight": "56 kg",
        "observation": "Stable",
        "notes": "Initial admission intake assessment recorded for Sangeetha. Routine baseline health profile established.",
        "note": "Initial admission intake assessment recorded for Sangeetha. Routine baseline health profile established.",
        "recorded_by": "Suresh Babu",
        "recordedBy": "Suresh Babu",
        "record_type": "Intake Assessment",
        "recordType": "Intake Assessment",
        "created_at": "2025-01-15 10:00:00"
    }
],
  user_settings: []
};

// Simple Mock SQL Execution Engine
export function executeMockQuery(sql, params = []) {
  const cleanSql = sql.replace(/\s+/g, ' ').trim();
  const lower = cleanSql.toLowerCase();

  // 1. Connection check: SELECT 1 as connected
  if (lower.includes('select 1 as connected')) {
    return [{ connected: 1 }];
  }

  // 2. Determine target table
  const matchTable = cleanSql.match(/(?:from|into|update)\s+`?([a-z_]+)`?/i);
  const tableName = matchTable ? matchTable[1].toLowerCase() : null;
  const table = tableName && mockStore[tableName] ? mockStore[tableName] : null;

  // 3. Health overview custom join
  if (lower.includes('from health_vitals') && lower.includes('join')) {
    const vitals = mockStore.health_vitals || [];
    const residents = mockStore.residents || [];
    // latest per resident
    const latestMap = new Map();
    vitals.forEach((v) => {
      if (!latestMap.has(v.residentId) || latestMap.get(v.residentId).id < v.id) {
        latestMap.set(v.residentId, v);
      }
    });
    const result = Array.from(latestMap.values()).map((v) => {
      const res = residents.find((r) => r.id === v.residentId);
      return {
        ...v,
        residentName: res?.name || 'Resident',
        room: res?.room || 'Room'
      };
    });
    return result;
  }

  // 4. SELECT queries
  if (lower.startsWith('select')) {
    if (!table) return [];

    let results = [...table];

    // Filter by single or multiple conditions
    if (lower.includes('where')) {
      const wherePart = cleanSql.substring(cleanSql.search(/where/i) + 5).split(/order by|limit/i)[0].trim();
      let paramIdx = 0;

      // Handle common WHERE conditions
      const whereLower = wherePart.toLowerCase();
      if (whereLower.includes('lower(username) =') || whereLower.includes('username =')) {
        const val = String(params[paramIdx++] || '').toLowerCase();
        results = results.filter((r) => String(r.username || '').toLowerCase() === val);
      } else if (whereLower.includes('lower(email) =') || whereLower.includes('email =')) {
        const val = String(params[paramIdx++] || '').toLowerCase();
        results = results.filter((r) => String(r.email || '').toLowerCase() === val);
      } else if (whereLower.includes('userid = ?')) {
        const val = params[paramIdx++];
        results = results.filter((r) => r.userId === val);
      } else if (whereLower.includes('residentid = ?') || whereLower.includes('resident_id = ?')) {
        const val = params[paramIdx++];
        results = results.filter((r) => (r.residentId || r.resident_id) === val);
      } else if (whereLower.includes('record_id = ?') || whereLower.includes('recordid = ?')) {
        const val = params[paramIdx++];
        results = results.filter((r) => (r.record_id || r.id) === val);
      } else if (whereLower.includes('patientid = ?')) {
        const val = params[paramIdx++];
        results = results.filter((r) => (r.patientId || r.residentId) === val);
      } else if (whereLower.includes('caregiver = ?')) {
        const val = params[paramIdx++];
        results = results.filter((r) => r.caregiver === val);
      } else if (whereLower.includes('status = ?')) {
        const val = params[paramIdx++];
        results = results.filter((r) => r.status === val);
      } else if (whereLower.includes('id = ?')) {
        const val = params[paramIdx++];
        results = results.filter((r) => String(r.id || r.record_id) === String(val));
      } else if (whereLower.includes('specialty =') || wherePart.includes('specialty = ?')) {
        const val = params[paramIdx++];
        results = results.filter((r) => String(r.specialty || '').toLowerCase() === String(val || '').toLowerCase());
      } else if (whereLower.includes('issue_type') || wherePart.includes('issue_type = ?')) {
        const val = params[paramIdx++];
        results = results.filter((r) => String(r.issue_type || '').toLowerCase() === String(val || '').toLowerCase());
      } else if (wherePart.includes('emergencyid = ?') || wherePart.includes('emergencyId = ?')) {
        const val = params[paramIdx++];
        results = results.filter((r) => r.emergencyId === val);
      } else if (wherePart.includes('category = ?')) {
        const val = params[paramIdx++];
        results = results.filter((r) => r.category === val);
      } else if (wherePart.includes('residentid = ?') || wherePart.includes('residentId = ?')) {
        const val = params[paramIdx++];
        results = results.filter((r) => r.residentId === val);
      } else if (wherePart.includes("id like 'ec-%'")) {
        results = results.filter((r) => String(r.id).startsWith('EC-'));
      }
    }

    // ORDER BY
    if (lower.includes('order by name asc')) {
      results.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    } else if (lower.includes('order by id desc')) {
      results.sort((a, b) => (b.id > a.id ? 1 : -1));
    } else if (lower.includes('order by created_at desc')) {
      results.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }

    // LIMIT
    const limitMatch = cleanSql.match(/limit\s+(\d+)/i);
    if (limitMatch) {
      const limit = parseInt(limitMatch[1], 10);
      results = results.slice(0, limit);
    }

    return results;
  }

  // 5. INSERT queries
  if (lower.startsWith('insert')) {
    if (!table) return { insertId: Date.now() };

    // Parse column names
    const colMatch = cleanSql.match(/\((.*?)\)\s+values/i);
    if (colMatch) {
      const cols = colMatch[1].split(',').map((c) => c.trim().replace(/`/g, ''));
      const newRow = {};
      cols.forEach((col, i) => {
        newRow[col] = params[i] !== undefined ? params[i] : null;
      });

      // Special case: settings upsert
      if (tableName === 'user_settings') {
        const existingIdx = table.findIndex((r) => r.userId === newRow.userId);
        if (existingIdx >= 0) {
          table[existingIdx] = { ...table[existingIdx], ...newRow };
          return { affectedRows: 1 };
        }
      }

      if (!newRow.id && tableName === 'health_vitals') {
        newRow.id = table.length + 1;
      }
      table.push(newRow);
      return { insertId: newRow.id || table.length, affectedRows: 1 };
    }
    return { affectedRows: 1 };
  }

  // 6. UPDATE queries
  if (lower.startsWith('update')) {
    if (!table) return { affectedRows: 0 };

    if (cleanSql.includes('UPDATE notifications SET is_read = 1 WHERE id = ?')) {
      const id = params[0];
      const item = table.find((r) => String(r.id) === String(id));
      if (item) item.is_read = 1;
      return { affectedRows: item ? 1 : 0 };
    }
    if (cleanSql.includes('UPDATE notifications SET is_read = 1')) {
      table.forEach((r) => { r.is_read = 1; });
      return { affectedRows: table.length };
    }
    if (cleanSql.includes('WHERE id = ?')) {
      const id = params[params.length - 1];
      const item = table.find((r) => String(r.id) === String(id));
      if (item) {
        if (tableName === 'medications' && cleanSql.includes('SET status = ?')) {
          item.status = params[0];
        } else if (tableName === 'appointments' && cleanSql.includes('SET status = ?')) {
          item.status = params[0];
        } else if (tableName === 'care_plans' && cleanSql.includes('SET tasks = ?, progress = ?')) {
          item.tasks = params[0];
          item.progress = params[1];
        } else if (tableName === 'emergency_alerts') {
          if (cleanSql.includes("status = 'responded'")) {
            item.status = 'responded';
            item.respondedBy = params[0];
            item.respondedAt = params[1];
          } else if (cleanSql.includes("status = 'resolved'")) {
            item.status = 'resolved';
            item.resolutionNotes = params[0];
            item.resolvedAt = params[1];
          }
        } else if (tableName === 'voicemails') {
          if (cleanSql.includes('isRead = 1') || cleanSql.includes('isread = 1')) {
            item.isRead = 1;
          }
        }
        return { affectedRows: 1 };
      }
    }
    return { affectedRows: 0 };
  }

  // 7. DELETE queries
  if (lower.startsWith('delete')) {
    if (!table) return { affectedRows: 0 };
    const id = params[0];
    const initLen = table.length;
    mockStore[tableName] = table.filter((r) => String(r.id) !== String(id) && String(r.record_id) !== String(id));
    return { affectedRows: initLen - mockStore[tableName].length };
  }

  return [];
}
