import { useState, useMemo } from 'react';
import { Search, FileText, ClipboardList, FlaskConical, NotebookPen, Download, Check, Eye, Printer, X, ShieldCheck } from 'lucide-react';
import { documents as allDocuments } from '../data/dummyData';
import { useApp } from '../context/AppContext.jsx';
import { scopeByResident } from '../utils/scope.js';
import StatusBadge from '../components/StatusBadge.jsx';
import Pagination from '../components/Pagination.jsx';

const TYPE_ICON = {
  'Medical Report': FileText,
  Prescription: NotebookPen,
  'Lab Result': FlaskConical,
  'Care Plan': ClipboardList,
  Assessment: FileText,
};

function getDocDetails(doc) {
  switch (doc.type) {
    case 'Medical Report':
      return {
        department: 'Cardiology & Geriatric Medicine',
        doctor: 'Dr. Kavya Menon, MD',
        findings: [
          'Vital parameters stable: BP 124/82 mmHg, Pulse 72 bpm, SpO2 98%.',
          'Cardiovascular rhythm normal with active therapeutic management.',
          'No episodes of angina, dyspnea, or syncope reported during evaluation.',
          'Recommendation: Continue current routine with weekly blood pressure monitoring.'
        ]
      };
    case 'Prescription':
      return {
        department: 'Clinical Pharmacology & Geriatric Care',
        doctor: 'Dr. Arvind Swaminathan, MD',
        findings: [
          'Amlodipine 5mg — 1 tablet once daily after morning meal.',
          'Metformin 500mg — 1 tablet twice daily with meals.',
          'Calcium & Vitamin D3 — 1 capsule daily after lunch.',
          'Adherence verified: 96% adherence score over previous 30-day window.'
        ]
      };
    case 'Lab Result':
      return {
        department: 'Pathology & Diagnostic Laboratory',
        doctor: 'Dr. S. Radhakrishnan, Clinical Pathologist',
        findings: [
          'HbA1c: 6.8% (Target: < 7.0% for geriatric cohort — Well controlled).',
          'Fasting Blood Sugar: 112 mg/dL (Normal Range: 70 - 120 mg/dL).',
          'Serum Creatinine: 1.05 mg/dL (Normal: 0.7 - 1.3 mg/dL).',
          'Total Cholesterol: 182 mg/dL (Desirable: < 200 mg/dL).'
        ]
      };
    case 'Care Plan':
      return {
        department: 'Care Coordination & Assisted Living',
        doctor: 'Meera Krishnan, Care Supervisor',
        findings: [
          'Mobility Plan: 30 minutes supervised ambulation daily with walker support.',
          'Dietary Routine: Low-sodium, heart-healthy balanced geriatric meals.',
          'Hydration: Daily fluid intake goal of 1.8 liters monitored by caregiver.',
          'Recreational Therapy: Daily afternoon social activities and memory exercises.'
        ]
      };
    case 'Assessment':
      return {
        department: 'Neuropsychology & Cognitive Wellness',
        doctor: 'Dr. Priya Nambiar, Neuropsychologist',
        findings: [
          'Mini-Mental State Exam (MMSE): Score 27 / 30 (Normal range for age).',
          'Cognitive orientation, short-term recall, and motor dexterity intact.',
          'Patient demonstrated positive engagement during verbal assessment.',
          'Next periodic cognitive screening scheduled in 6 months.'
        ]
      };
    default:
      return {
        department: 'ElderCare Medical Operations',
        doctor: 'Attending Clinical Staff',
        findings: [
          'Routine wellness observation and electronic document verification.',
          'Resident is currently in stable condition under active care management.'
        ]
      };
  }
}

function generatePDFBlob(doc, details) {
  const sanitize = (str) => String(str).replace(/[()\\\r\n]/g, ' ');
  const lines = [
    'ELDERCARE SENIOR HEALTH SERVICES - OFFICIAL MEDICAL RECORD',
    '========================================================================',
    `Document ID    : ${doc.id}`,
    `Document Title : ${doc.name}`,
    `Document Type  : ${doc.type}`,
    `Resident Name  : ${doc.patient}`,
    `Record Date    : ${doc.date}`,
    `Current Status : ${(doc.status || 'Reviewed').toUpperCase()}`,
    `Department     : ${details.department}`,
    `Attending Staff: ${details.doctor}`,
    '------------------------------------------------------------------------',
    'CLINICAL FINDINGS & EVALUATION NOTES:',
    ...details.findings.map((f) => `* ${f}`),
    '------------------------------------------------------------------------',
    'CARE ADHERENCE & VERIFICATION:',
    '- Clinical parameters checked against electronic healthcare records.',
    '- Electronic sign-off registered in ElderCare Health Database.',
    '========================================================================',
    'Confidential Healthcare Record - For Authorized Healthcare Personnel Only'
  ];

  let y = 735;
  const streamCommands = [];
  lines.forEach((line) => {
    const isHeader = line.startsWith('ELDERCARE') || line.startsWith('CLINICAL') || line.startsWith('CARE');
    const isDivider = line.startsWith('===') || line.startsWith('---');
    const fontSize = isHeader ? 11 : 9;
    const font = isHeader ? '/F2' : '/F1';
    streamCommands.push(`BT ${font} ${fontSize} Tf 45 ${y} Td (${sanitize(line)}) Tj ET`);
    y -= (isHeader ? 22 : (isDivider ? 13 : 16));
  });

  const stream = streamCommands.join('\n');
  const encoder = new TextEncoder();
  const streamBytes = encoder.encode(stream);
  const streamLen = streamBytes.length;

  const body1 = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n4 0 obj\n<< /Length ${streamLen} >>\nstream\n`;
  const body2 = `\nendstream\nendobj\n5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold >>\nendobj\n`;

  const o1 = 9;
  const o2 = o1 + encoder.encode("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n").length;
  const o3 = o2 + encoder.encode("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n").length;
  const o4 = o3 + encoder.encode("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n").length;
  const o5 = o4 + encoder.encode(`4 0 obj\n<< /Length ${streamLen} >>\nstream\n`).length + streamLen + encoder.encode("\nendstream\nendobj\n").length;
  const o6 = o5 + encoder.encode("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n").length;

  const pad = (n) => String(n).padStart(10, '0');
  const xrefOffset = o6 + encoder.encode("6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold >>\nendobj\n").length;

  const xref = `xref\n0 7\n0000000000 65535 f \n${pad(o1)} 00000 n \n${pad(o2)} 00000 n \n${pad(o3)} 00000 n \n${pad(o4)} 00000 n \n${pad(o5)} 00000 n \n${pad(o6)} 00000 n \ntrailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return new Blob([body1, stream, body2, xref], { type: 'application/pdf' });
}

function generateTXTBlob(doc, details) {
  const content = `================================================================================
                    ELDERCARE SENIOR HEALTH SERVICES
                   Official Medical & Clinical Record
================================================================================

DOCUMENT METADATA:
--------------------------------------------------------------------------------
Document ID     : ${doc.id}
Document Title  : ${doc.name}
Document Type   : ${doc.type}
Resident Name   : ${doc.patient}
Record Date     : ${doc.date}
Status          : ${(doc.status || 'Reviewed').toUpperCase()}
Department      : ${details.department}
Attending Staff : ${details.doctor}

CLINICAL FINDINGS & EVALUATION NOTES:
--------------------------------------------------------------------------------
${details.findings.map((f, i) => `${i + 1}. ${f}`).join('\n')}

CARE ADHERENCE & OBSERVATIONS:
--------------------------------------------------------------------------------
- Clinical parameters checked against electronic health records.
- Patient vitals, prescription schedule, and wellness routine verified.
- No critical adverse interactions recorded during the evaluation window.
- Electronically signed and validated by ElderCare Medical Services.

================================================================================
        ElderCare Senior Healthcare Residency · Confidential Document
================================================================================`;

  return new Blob([content], { type: 'text/plain;charset=utf-8' });
}

export default function Documents() {
  const { user, t } = useApp();
  const documents = useMemo(() => scopeByResident(user, allDocuments, 'residentId'), [user]);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const types = useMemo(() => ['all', ...new Set(documents.map((d) => d.type))], [documents]);

  const filtered = documents.filter((d) => {
    const matchQuery =
      d.name.toLowerCase().includes(query.toLowerCase()) ||
      d.patient.toLowerCase().includes(query.toLowerCase());
    const matchType = typeFilter === 'all' || d.type === typeFilter;
    return matchQuery && matchType;
  });

  // Documents Pagination
  const [docPage, setDocPage] = useState(1);
  const [docLimit, setDocLimit] = useState(6);

  useEffect(() => {
    setDocPage(1);
  }, [query, typeFilter]);

  const docTotalPages = Math.ceil(filtered.length / docLimit) || 1;
  const paginatedDocs = useMemo(() => {
    const start = (docPage - 1) * docLimit;
    return filtered.slice(start, start + docLimit);
  }, [filtered, docPage, docLimit]);

  const handleDownload = (doc, format = 'pdf', e) => {
    if (e) e.stopPropagation();

    const details = getDocDetails(doc);
    const blob = format === 'pdf' ? generatePDFBlob(doc, details) : generateTXTBlob(doc, details);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeTitle = doc.name.replace(/[^a-zA-Z0-9\s_-]/g, '').trim().replace(/\s+/g, '_');
    link.download = `${safeTitle}_${doc.id}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadingId(doc.id);
    setToastMessage(`✓ Downloaded: ${doc.name} (${format.toUpperCase()})`);

    setTimeout(() => {
      setDownloadingId(null);
    }, 2500);

    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handlePrint = (doc) => {
    window.print();
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>{t('Documents')}</h1>
          <p className="desc">Medical reports, prescriptions, lab results and assessments in one library.</p>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={15} />
          <input
            placeholder="Search documents or resident"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          {types.map((tp) => (
            <option key={tp} value={tp}>
              {tp === 'all' ? 'All Types' : tp}
            </option>
          ))}
        </select>
      </div>

      <div className="panel">
        <div>
          {paginatedDocs.map((d) => {
            const Icon = TYPE_ICON[d.type] || FileText;
            const isDownloaded = downloadingId === d.id;

            return (
              <div
                className="doc-row"
                key={d.id}
                onClick={() => setSelectedDoc(d)}
                title="Click to preview document"
              >
                <div className="d-icon">
                  <Icon size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="d-name">{d.name}</div>
                  <div className="d-meta">
                    {d.type} · {d.patient} · {d.date}
                  </div>
                </div>
                <StatusBadge status={d.status} label={d.status === 'active' ? 'Active' : undefined} />
                
                <button
                  type="button"
                  className={`doc-download-btn ${isDownloaded ? 'downloaded' : ''}`}
                  onClick={(e) => handleDownload(d, 'pdf', e)}
                  title={isDownloaded ? 'Downloaded!' : 'Download document (PDF)'}
                  aria-label="Download Document"
                >
                  {isDownloaded ? <Check size={16} /> : <Download size={16} />}
                </button>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              No documents match your search or filter.
            </div>
          )}

          {filtered.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border-hairline)' }}>
              <Pagination
                page={docPage}
                totalPages={docTotalPages}
                total={filtered.length}
                limit={docLimit}
                onPageChange={setDocPage}
                onLimitChange={setDocLimit}
                showInfo={true}
                showPageSize={true}
              />
            </div>
          )}
        </div>
      </div>

      {/* Document Preview Modal */}
      {selectedDoc && (
        <div className="doc-modal-overlay" onClick={() => setSelectedDoc(null)}>
          <div className="doc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="doc-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#E0F2FE', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {selectedDoc.name}
                  </h3>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {selectedDoc.id} · {selectedDoc.date}
                  </div>
                </div>
              </div>
              <button
                className="icon-btn"
                onClick={() => setSelectedDoc(null)}
                aria-label="Close Preview"
              >
                <X size={18} />
              </button>
            </div>

            <div className="doc-modal-body">
              {(() => {
                const details = getDocDetails(selectedDoc);
                return (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: 14, background: 'var(--surface-sunken)', borderRadius: 10, marginBottom: 18 }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resident</div>
                        <div style={{ fontWeight: 600, fontSize: 13.5, marginTop: 2 }}>{selectedDoc.patient}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</div>
                        <div style={{ fontWeight: 600, fontSize: 13.5, marginTop: 2 }}>{selectedDoc.type}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Department</div>
                        <div style={{ fontWeight: 600, fontSize: 13.5, marginTop: 2 }}>{details.department}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Attending Physician</div>
                        <div style={{ fontWeight: 600, fontSize: 13.5, marginTop: 2 }}>{details.doctor}</div>
                      </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ShieldCheck size={16} style={{ color: '#10B981' }} />
                        Clinical Observations & Results
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {details.findings.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ borderTop: '1px dashed var(--border-hairline)', paddingTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Status:</span>
                      <StatusBadge status={selectedDoc.status} label={selectedDoc.status === 'active' ? 'Active' : undefined} />
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="doc-modal-footer">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => handlePrint(selectedDoc)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Printer size={15} />
                Print / Save PDF
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={(e) => handleDownload(selectedDoc, 'txt', e)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Download size={15} />
                Download TXT
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={(e) => handleDownload(selectedDoc, 'pdf', e)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Download size={15} />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Download Toast */}
      {toastMessage && (
        <div className="doc-toast">
          <Check size={16} style={{ color: '#38BDF8' }} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
