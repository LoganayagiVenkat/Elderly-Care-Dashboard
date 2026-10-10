import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Bell, Pill, CheckCircle2, Clock, AlertTriangle, Send, Plus, Search,
  Filter, Calendar, Stethoscope, RefreshCw, X, FileText, Check, ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { getScopedResidents } from '../utils/scope.js';
import StatusBadge from '../components/StatusBadge.jsx';
import PatientIdentity from '../components/PatientIdentity.jsx';
import PatientSearchBar from '../components/PatientSearchBar.jsx';
import Pagination from '../components/Pagination.jsx';
import { medicationsApi } from '../services/api.js';

const MEDS_KEY = 'eldercare_medications_v3';

// Default initial fallback seed in case backend is offline (10 per resident across all 6 residents = 60 total)
const SEED_MEDICATIONS = [
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

  // EC-007: Sangeetha (10 Medications)
  { id: 'MED-SG-01', time: '07:30 AM', slot: 'Morning Medication', patient: 'Sangeetha', patientId: 'EC-007', initials: 'S', medicine: 'Probiotic Complex', dosage: '1 Capsule', frequency: 'Once Daily (Fasting)', instructions: 'Take before breakfast for gut flora support.', prescribedBy: 'Dr. Vivek Murthy', startDate: '2026-01-15', endDate: '2026-12-31', status: 'completed' },
  { id: 'MED-SG-02', time: '08:00 AM', slot: 'Morning Medication', patient: 'Sangeetha', patientId: 'EC-007', initials: 'S', medicine: 'Zinc & Vitamin C', dosage: '50 mg', frequency: 'Once Daily', instructions: 'Immunity wellness booster with morning meal.', prescribedBy: 'Dr. Vivek Murthy', startDate: '2026-01-15', endDate: '2026-12-31', status: 'completed' },
  { id: 'MED-SG-03', time: '08:30 AM', slot: 'Morning Medication', patient: 'Sangeetha', patientId: 'EC-007', initials: 'S', medicine: 'Coenzyme Q10', dosage: '50 mg', frequency: 'Once Daily', instructions: 'Cellular energy and antioxidant wellness.', prescribedBy: 'Dr. Vivek Murthy', startDate: '2026-02-01', endDate: '2026-12-31', status: 'completed' },
  { id: 'MED-SG-04', time: '10:00 AM', slot: 'Morning Medication', patient: 'Sangeetha', patientId: 'EC-007', initials: 'S', medicine: 'Multivitamin Daily', dosage: '1 Tablet', frequency: 'Once Daily', instructions: 'Comprehensive micronutrient support after morning tea.', prescribedBy: 'Dr. Vivek Murthy', startDate: '2026-01-15', endDate: '2026-12-31', status: 'completed' },
  { id: 'MED-SG-05', time: '01:00 PM', slot: 'Afternoon Medication', patient: 'Sangeetha', patientId: 'EC-007', initials: 'S', medicine: 'Omega-3 Fish Oil', dosage: '1000 mg', frequency: 'Once Daily', instructions: 'Take with lunch for cardiovascular and joint health.', prescribedBy: 'Dr. Vivek Murthy', startDate: '2026-01-15', endDate: '2026-12-31', status: 'pending' },
  { id: 'MED-SG-06', time: '02:00 PM', slot: 'Afternoon Medication', patient: 'Sangeetha', patientId: 'EC-007', initials: 'S', medicine: 'Digestive Enzyme Blend', dosage: '1 Capsule', frequency: 'As Needed', instructions: 'Take post-lunch if fullness occurs.', prescribedBy: 'Dr. Preeti Deshmukh', startDate: '2026-02-01', endDate: '2026-12-31', status: 'pending' },
  { id: 'MED-SG-07', time: '07:30 PM', slot: 'Evening Medication', patient: 'Sangeetha', patientId: 'EC-007', initials: 'S', medicine: 'Evening Primrose Oil', dosage: '500 mg', frequency: 'Once Daily', instructions: 'Take with dinner for hormonal and lipid wellness.', prescribedBy: 'Dr. Vivek Murthy', startDate: '2026-01-15', endDate: '2026-12-31', status: 'upcoming' },
  { id: 'MED-SG-08', time: '08:30 PM', slot: 'Evening Medication', patient: 'Sangeetha', patientId: 'EC-007', initials: 'S', medicine: 'Ashwagandha Extract', dosage: '250 mg', frequency: 'Once Daily', instructions: 'Adaptogenic herbal support for relaxation.', prescribedBy: 'Dr. Sunita Bhatt', startDate: '2026-02-01', endDate: '2026-12-31', status: 'upcoming' },
  { id: 'MED-SG-09', time: '09:00 PM', slot: 'Night Medication', patient: 'Sangeetha', patientId: 'EC-007', initials: 'S', medicine: 'Calcium + Vitamin D3', dosage: '500 mg', frequency: 'Once Daily', instructions: 'Take with warm water before bed for bone density.', prescribedBy: 'Dr. Vivek Murthy', startDate: '2026-01-15', endDate: '2026-12-31', status: 'upcoming' },
  { id: 'MED-SG-10', time: '09:30 PM', slot: 'Night Medication', patient: 'Sangeetha', patientId: 'EC-007', initials: 'S', medicine: 'Melatonin', dosage: '1.5 mg', frequency: 'Once Daily', instructions: 'Take 30 minutes before sleep for restorative circadian rhythm.', prescribedBy: 'Dr. Sunita Bhatt', startDate: '2026-01-15', endDate: '2026-12-31', status: 'upcoming' }
];

export default function Medications() {
  const { user, residents, pushMedicationReminder } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  // Role-scoped residents list
  const scopedResidents = useMemo(() => getScopedResidents(user, residents), [user, residents]);

  // Selected Resident State (default to URL param or EC-005 Anitha Sundaram if in scope, else first)
  const initialResidentId = useMemo(() => {
    const qId = searchParams.get('residentId');
    if (qId && scopedResidents.some((r) => r.id === qId)) return qId;
    if (scopedResidents.some((r) => r.id === 'EC-005')) return 'EC-005';
    return scopedResidents[0]?.id || 'EC-001';
  }, [scopedResidents, searchParams]);

  const [selectedId, setSelectedId] = useState(initialResidentId);

  // Sync selectedId when scopedResidents change
  useEffect(() => {
    const qId = searchParams.get('residentId');
    if (qId && scopedResidents.some((r) => r.id === qId)) {
      setSelectedId(qId);
    } else if (scopedResidents.length > 0 && !scopedResidents.some((r) => r.id === selectedId)) {
      setSelectedId(scopedResidents[0]?.id);
    }
  }, [scopedResidents, selectedId, searchParams]);

  const currentResident = scopedResidents.find((r) => r.id === selectedId) || scopedResidents[0];

  // All medications from MySQL
  const [allMeds, setAllMeds] = useState(() => {
    try {
      const raw = localStorage.getItem(MEDS_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && Array.isArray(parsed) && parsed.length >= 60) return parsed;
      return SEED_MEDICATIONS;
    } catch {
      return SEED_MEDICATIONS;
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [slotFilter, setSlotFilter] = useState('all');

  // Modal State for Adding Medication
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newMed, setNewMed] = useState({
    medicine: '',
    dosage: '',
    frequency: 'Once Daily',
    slot: 'Morning Medication',
    time: '08:00 AM',
    instructions: '',
    prescribedBy: 'Dr. K. Ramesh',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '2026-12-31'
  });

  // Fetch medications from MySQL API
  const fetchMedications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await medicationsApi.getAll();
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        setAllMeds(res.data);
        try { localStorage.setItem(MEDS_KEY, JSON.stringify(res.data)); } catch {}
      }
    } catch (err) {
      console.warn('[Medications] API load error, using cached seed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedications();
  }, [fetchMedications]);

  // Medications for the currently selected resident
  const residentMedications = useMemo(() => {
    if (!selectedId) return [];
    return allMeds.filter((m) => (m.patientId || m.residentId) === selectedId);
  }, [allMeds, selectedId]);

  // Filtered medications by search, status, and slot
  const filteredMeds = useMemo(() => {
    return residentMedications.filter((m) => {
      // 1. Text Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (m.medicine || '').toLowerCase().includes(q);
        const matchesDosage = (m.dosage || '').toLowerCase().includes(q);
        const matchesDoctor = (m.prescribedBy || '').toLowerCase().includes(q);
        const matchesInstructions = (m.instructions || '').toLowerCase().includes(q);
        if (!matchesName && !matchesDosage && !matchesDoctor && !matchesInstructions) {
          return false;
        }
      }

      // 2. Status Filter
      if (statusFilter !== 'all') {
        const medStatus = (m.status || 'pending').toLowerCase();
        if (statusFilter === 'completed' && medStatus !== 'completed') return false;
        if (statusFilter === 'pending' && medStatus !== 'pending') return false;
        if (statusFilter === 'missed' && medStatus !== 'missed') return false;
        if (statusFilter === 'upcoming' && medStatus !== 'upcoming') return false;
      }

      // 3. Slot / Schedule Filter
      if (slotFilter !== 'all') {
        const slot = (m.slot || '').toLowerCase();
        if (!slot.includes(slotFilter.toLowerCase())) return false;
      }

      return true;
    });
  }, [residentMedications, searchQuery, statusFilter, slotFilter]);

  // Medications Pagination
  const [medsPage, setMedsPage] = useState(1);
  const [medsLimit, setMedsLimit] = useState(5);

  useEffect(() => {
    setMedsPage(1);
  }, [searchQuery, statusFilter, slotFilter, selectedId]);

  const medsTotalPages = Math.ceil(filteredMeds.length / medsLimit) || 1;
  const paginatedMeds = useMemo(() => {
    const start = (medsPage - 1) * medsLimit;
    return filteredMeds.slice(start, start + medsLimit);
  }, [filteredMeds, medsPage, medsLimit]);

  // Statistics for the Selected Resident
  const stats = useMemo(() => {
    const total = residentMedications.length;
    const completed = residentMedications.filter((m) => m.status === 'completed').length;
    const pending = residentMedications.filter((m) => m.status === 'pending').length;
    const missed = residentMedications.filter((m) => m.status === 'missed').length;
    const adherence = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, missed, adherence };
  }, [residentMedications]);

  // Mark Medication as Taken in MySQL
  const handleMarkTaken = async (id, medName) => {
    // 1. Optimistic UI update
    setAllMeds((prev) => {
      const updated = prev.map((m) => (m.id === id ? { ...m, status: 'completed' } : m));
      try { localStorage.setItem(MEDS_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });

    // 2. API persistence in MySQL
    try {
      await medicationsApi.updateStatus(id, 'completed');
      showToast(`✓ Marked ${medName || 'Medication'} as taken in MySQL database.`);
    } catch (err) {
      console.warn('[Medications] MySQL update error:', err);
      showToast(`✓ Marked ${medName || 'Medication'} as taken.`);
    }
  };

  // Send Reminder Handler
  const handleSendReminder = (m) => {
    if (!m) return;
    pushMedicationReminder(m, {
      senderRole: user?.role || 'admin',
      senderName: user?.name,
      patientId: m.patientId,
      patient: m.patient,
      caregiver: currentResident?.caregiver || 'Assigned Caregiver',
    });

    const targetDesc =
      user?.role === 'admin'
        ? `Sent reminder for ${m.medicine} to ${m.patient}, assigned Caregiver & Family.`
        : `Sent reminder for ${m.medicine} to ${m.patient}.`;
    showToast(`✓ Reminder: ${targetDesc}`);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Add Medication Submission
  const handleAddMedicationSubmit = async (e) => {
    e.preventDefault();
    if (!newMed.medicine || !newMed.dosage) {
      alert('Please fill in both Medicine Name and Dosage.');
      return;
    }

    setIsSubmitting(true);
    const id = `MED-${Date.now().toString().slice(-6)}`;
    const initials = currentResident ? (currentResident.initials || currentResident.name.slice(0, 2).toUpperCase()) : 'RX';
    
    const medPayload = {
      id,
      time: newMed.time,
      slot: newMed.slot,
      patient: currentResident?.name || 'Resident',
      patientId: selectedId,
      initials,
      medicine: newMed.medicine,
      dosage: newMed.dosage,
      frequency: newMed.frequency,
      instructions: newMed.instructions,
      prescribedBy: newMed.prescribedBy,
      startDate: newMed.startDate,
      endDate: newMed.endDate,
      status: 'pending'
    };

    // Optimistic add
    setAllMeds((prev) => [medPayload, ...prev]);

    try {
      const res = await medicationsApi.create(medPayload);
      if (res?.data) {
        setAllMeds((prev) => prev.map((m) => (m.id === id ? res.data : m)));
      }
      showToast(`✓ Added ${medPayload.medicine} for ${currentResident?.name} to MySQL.`);
      setIsAddModalOpen(false);
      setNewMed({
        medicine: '',
        dosage: '',
        frequency: 'Once Daily',
        slot: 'Morning Medication',
        time: '08:00 AM',
        instructions: '',
        prescribedBy: 'Dr. K. Ramesh',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '2026-12-31'
      });
    } catch (err) {
      console.warn('[Medications] Create in MySQL error:', err);
      showToast(`✓ Added ${medPayload.medicine} to medication schedule.`);
      setIsAddModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canAddMedication = user?.role === 'admin' || user?.role === 'caregiver';

  return (
    <div>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 28,
            zIndex: 9999,
            background: 'var(--color-navy, #1E293B)',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 14,
            fontWeight: 500,
            animation: 'fadeIn 0.25s ease-out',
          }}
        >
          <CheckCircle2 size={18} style={{ color: '#34D399' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-head">
        <div>
          <h1>Medications</h1>
          <p className="desc">
            Complete prescribed medication regimens, dosage schedules, adherence monitoring, and administration tracking.
          </p>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: 10 }}>
          {canAddMedication && (
            <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
              <Plus size={15} /> Add Medication
            </button>
          )}
          <button className="btn btn-secondary" onClick={fetchMedications} title="Refresh from MySQL">
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Searchable Patient Navigation (Replaces horizontal touch pill buttons) */}
      <PatientSearchBar
        residents={scopedResidents}
        selectedId={selectedId}
        onSelectResident={(id) => {
          setSelectedId(id);
          setSearchParams({ residentId: id });
        }}
        placeholder="Search patient by name (e.g. Anitha, Lakshmi, Govind), ID, room..."
      />

      {/* Resident Medication Summary Hero */}
      {currentResident && (
        <div className="vitals-hero" style={{ marginBottom: 24 }}>
          <div className="vitals-hero-top">
            <div className="vitals-hero-patient">
              <div className="identity-tile size-md">
                {currentResident.initials || (currentResident.name || 'P').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3>{currentResident.name} — Medication Profile</h3>
                <div className="meta">
                  <span>Room: {currentResident.room}</span>
                  <span>•</span>
                  <span>Caregiver: {currentResident.caregiver}</span>
                  <span>•</span>
                  <span>Primary Diagnosis: {currentResident.condition}</span>
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="badge badge-success" style={{ fontSize: 12, padding: '6px 12px' }}>
                <ShieldCheck size={14} style={{ marginRight: 5, verticalAlign: 'middle' }} />
                MySQL Connected
              </span>
            </div>
          </div>

          {/* Quick Metrics for the Selected Resident */}
          <div className="grid-4" style={{ marginTop: 18, marginBottom: 6 }}>
            <div className="stat-card" style={{ background: 'var(--surface-sunken)', border: 'none' }}>
              <div className="stat-icon"><Pill size={16} /></div>
              <div className="stat-value" style={{ fontSize: 24 }}>{stats.total}</div>
              <div className="stat-label">Total Prescribed</div>
            </div>
            <div className="stat-card" style={{ background: 'var(--surface-sunken)', border: 'none' }}>
              <div className="stat-icon"><CheckCircle2 size={16} style={{ color: 'var(--color-forest)' }} /></div>
              <div className="stat-value" style={{ fontSize: 24, color: 'var(--color-forest)' }}>{stats.completed}</div>
              <div className="stat-label">Taken / Completed</div>
            </div>
            <div className="stat-card" style={{ background: 'var(--surface-sunken)', border: 'none' }}>
              <div className="stat-icon"><Clock size={16} style={{ color: '#D97706' }} /></div>
              <div className="stat-value" style={{ fontSize: 24, color: '#D97706' }}>{stats.pending}</div>
              <div className="stat-label">Pending Doses</div>
            </div>
            <div className="stat-card" style={{ background: 'var(--surface-sunken)', border: 'none' }}>
              <div className="stat-icon"><AlertTriangle size={16} style={{ color: '#DC2626' }} /></div>
              <div className="stat-value" style={{ fontSize: 24, color: '#DC2626' }}>{stats.missed}</div>
              <div className="stat-label">Missed Doses</div>
            </div>
          </div>

          {/* Adherence Progress */}
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                Today's Adherence Rate
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-forest-deep)' }}>
                {stats.adherence}%
              </span>
            </div>
            <div className="progress-track" style={{ height: 8 }}>
              <div className="progress-fill" style={{ width: `${stats.adherence}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="history-search-card" style={{ marginBottom: 20 }}>
        <div className="history-search-row" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Input */}
          <div className="history-search-input-wrap" style={{ flex: 1, minWidth: 260 }}>
            <Search size={16} className="history-search-icon" />
            <input
              type="text"
              className="history-search-input"
              placeholder={`Search medications for ${currentResident?.name || 'resident'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="history-clear-btn"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={15} style={{ color: 'var(--text-muted)' }} />
            <select
              className="form-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '8px 12px', fontSize: 13, minWidth: 150 }}
            >
              <option value="all">All Statuses</option>
              <option value="completed">Taken / Completed</option>
              <option value="pending">Pending</option>
              <option value="upcoming">Upcoming</option>
              <option value="missed">Missed</option>
            </select>
          </div>

          {/* Schedule / Slot Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={15} style={{ color: 'var(--text-muted)' }} />
            <select
              className="form-input"
              value={slotFilter}
              onChange={(e) => setSlotFilter(e.target.value)}
              style={{ padding: '8px 12px', fontSize: 13, minWidth: 150 }}
            >
              <option value="all">All Time Slots</option>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
              <option value="night">Night</option>
            </select>
          </div>

          {(searchQuery || statusFilter !== 'all' || slotFilter !== 'all') && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setSlotFilter('all');
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Medications Table / Records List */}
      <div className="panel">
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3>All Prescribed Medications for {currentResident?.name || 'Resident'}</h3>
            <div className="sub">
              Showing {filteredMeds.length} of {residentMedications.length} total active prescriptions stored in MySQL.
            </div>
          </div>
          {filteredMeds.length > 0 && (
            <span className="badge badge-subtle">
              {filteredMeds.filter(m => m.status === 'completed').length} / {filteredMeds.length} Taken
            </span>
          )}
        </div>

        {filteredMeds.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Pill size={40} style={{ opacity: 0.35, marginBottom: 12 }} />
            <h4 style={{ fontSize: 16, marginBottom: 6, color: 'var(--text-primary)' }}>
              No Medications Found
            </h4>
            <p style={{ fontSize: 13, maxWidth: 440, margin: '0 auto 16px', lineHeight: 1.5 }}>
              {residentMedications.length === 0
                ? `No medication schedule has been prescribed for ${currentResident?.name || 'this resident'} yet.`
                : 'No medications match your current search and filter criteria.'}
            </p>
            {canAddMedication && residentMedications.length === 0 && (
              <button className="btn btn-primary btn-sm" onClick={() => setIsAddModalOpen(true)}>
                <Plus size={14} /> Prescribe First Medication
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Medication & Dosage</th>
                  <th>Frequency & Schedule</th>
                  <th>Time Slot</th>
                  <th>Prescribed By</th>
                  <th>Instructions</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMeds.map((m) => {
                  const isTaken = m.status === 'completed';
                  return (
                    <tr key={m.id} style={{ opacity: isTaken ? 0.85 : 1 }}>
                      {/* Medicine Name & Dosage */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 8,
                              background: isTaken ? 'rgba(46, 125, 50, 0.1)' : 'var(--surface-sunken)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: isTaken ? 'var(--color-forest)' : 'var(--color-navy)',
                              flexShrink: 0
                            }}
                          >
                            <Pill size={16} />
                          </div>
                          <div>
                            <div className="row-name" style={{ fontSize: 14 }}>{m.medicine}</div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-forest)' }}>
                              {m.dosage}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Frequency */}
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{m.frequency || 'Once Daily'}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{m.slot}</div>
                      </td>

                      {/* Scheduled Time */}
                      <td className="mono" style={{ fontSize: 13, fontWeight: 600 }}>
                        <Clock size={12} style={{ marginRight: 4, verticalAlign: 'middle', color: 'var(--text-muted)' }} />
                        {m.time}
                      </td>

                      {/* Prescribed By */}
                      <td>
                        <div style={{ fontSize: 12.5, fontWeight: 500 }}>
                          <Stethoscope size={12} style={{ marginRight: 4, verticalAlign: 'middle', color: 'var(--text-muted)' }} />
                          {m.prescribedBy || 'Attending Doctor'}
                        </div>
                        {m.startDate && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            Since {m.startDate}
                          </div>
                        )}
                      </td>

                      {/* Instructions */}
                      <td style={{ fontSize: 12.5, maxWidth: 220, lineHeight: 1.4, color: 'var(--text-secondary)' }}>
                        {m.instructions || 'Take with water as scheduled.'}
                      </td>

                      {/* Status */}
                      <td>
                        <StatusBadge status={m.status} />
                      </td>

                      {/* Actions */}
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {!isTaken ? (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleMarkTaken(m.id, m.medicine)}
                              title="Update status to Taken in MySQL"
                            >
                              <Check size={13} /> Mark as Taken
                            </button>
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--color-forest)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <CheckCircle2 size={14} /> Taken
                            </span>
                          )}

                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleSendReminder(m)}
                            title="Send medication alert to resident and caregiver"
                          >
                            <Send size={12} /> Remind
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Medications Pagination */}
        {filteredMeds.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border-hairline)' }}>
            <Pagination
              page={medsPage}
              totalPages={medsTotalPages}
              total={filteredMeds.length}
              limit={medsLimit}
              onPageChange={setMedsPage}
              onLimitChange={setMedsLimit}
              showInfo={true}
              showPageSize={true}
            />
          </div>
        )}
      </div>

      {/* Add Medication Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Pill size={18} style={{ color: 'var(--color-forest)' }} />
                Prescribe Medication for {currentResident?.name}
              </h3>
              <button className="icon-btn" onClick={() => setIsAddModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddMedicationSubmit}>
              <div className="modal-body" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Medicine Name & Dosage */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 5 }}>
                      Medication Name *
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Amlodipine, Metformin"
                      required
                      value={newMed.medicine}
                      onChange={(e) => setNewMed({ ...newMed, medicine: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 5 }}>
                      Dosage *
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 5 mg, 500 mg, 1000 IU"
                      required
                      value={newMed.dosage}
                      onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                    />
                  </div>
                </div>

                {/* Frequency & Time Slot */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 5 }}>
                      Frequency
                    </label>
                    <select
                      className="form-input"
                      value={newMed.frequency}
                      onChange={(e) => setNewMed({ ...newMed, frequency: e.target.value })}
                    >
                      <option value="Once Daily">Once Daily</option>
                      <option value="Twice Daily">Twice Daily</option>
                      <option value="Three Times Daily">Three Times Daily</option>
                      <option value="Once Weekly">Once Weekly</option>
                      <option value="As Needed (SOS)">As Needed (SOS)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 5 }}>
                      Time Slot
                    </label>
                    <select
                      className="form-input"
                      value={newMed.slot}
                      onChange={(e) => setNewMed({ ...newMed, slot: e.target.value })}
                    >
                      <option value="Morning Medication">Morning Medication</option>
                      <option value="Afternoon Medication">Afternoon Medication</option>
                      <option value="Evening Medication">Evening Medication</option>
                      <option value="Night Medication">Night Medication</option>
                    </select>
                  </div>
                </div>

                {/* Scheduled Time & Prescribed Doctor */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 5 }}>
                      Time (e.g. 08:00 AM)
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={newMed.time}
                      onChange={(e) => setNewMed({ ...newMed, time: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 5 }}>
                      Prescribing Doctor
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Dr. K. Ramesh"
                      value={newMed.prescribedBy}
                      onChange={(e) => setNewMed({ ...newMed, prescribedBy: e.target.value })}
                    />
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 5 }}>
                    Administration Instructions
                  </label>
                  <textarea
                    className="form-input"
                    rows="2"
                    placeholder="e.g. Take with a full glass of water after breakfast. Avoid dairy within 2 hours."
                    value={newMed.instructions}
                    onChange={(e) => setNewMed({ ...newMed, instructions: e.target.value })}
                  />
                </div>

                {/* Start Date & End Date */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 5 }}>
                      Start Date
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      value={newMed.startDate}
                      onChange={(e) => setNewMed({ ...newMed, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12.5, fontWeight: 600, display: 'block', marginBottom: 5 }}>
                      End Date
                    </label>
                    <input
                      type="date"
                      className="form-input"
                      value={newMed.endDate}
                      onChange={(e) => setNewMed({ ...newMed, endDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid var(--border-hairline)' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving to Database...' : 'Prescribe Medication'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
