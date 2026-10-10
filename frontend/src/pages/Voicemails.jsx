import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Mic, MicOff, Play, Pause, Volume2, Send, Clock, CheckCircle,
  AlertTriangle, ShieldAlert, Trash2, RotateCcw, Radio, Check,
  Sparkles, X, Plus, Headphones, Inbox, MessageCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { formatAudioDuration, generateDemoAudioDataUrl, blobToBase64 } from '../utils/audioUtils.js';
import Pagination from '../components/Pagination.jsx';

// Category color styling and badges
const CATEGORY_MAP = {
  emergency_sos: { label: 'Emergency SOS', color: '#DC2626', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)' },
  family_checkin: { label: 'Family Check-in', color: '#0284C7', bg: 'rgba(2, 132, 199, 0.12)', border: 'rgba(2, 132, 199, 0.3)' },
  care_instruction: { label: 'Caregiver Note', color: '#059669', bg: 'rgba(5, 150, 105, 0.12)', border: 'rgba(5, 150, 105, 0.3)' },
  general: { label: 'General Message', color: '#6366F1', bg: 'rgba(99, 102, 241, 0.12)', border: 'rgba(99, 102, 241, 0.3)' },
};

export default function Voicemails() {
  const {
    user,
    residents = [],
    caregivers = [],
    voicemails = [],
    unreadVoicemailCount,
    addVoicemail,
    markVoicemailAsRead,
    deleteVoicemail
  } = useApp();

  const [activeTab, setActiveTab] = useState('all'); // 'all', 'emergency_sos', 'family_checkin', 'care_instruction', 'unread'
  const [playingId, setPlayingId] = useState(null);
  const [playbackProgress, setPlaybackProgress] = useState(0); // 0 to 1
  const [playbackTime, setPlaybackTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const audioRef = useRef(new Audio());
  const progressTimerRef = useRef(null);

  // Success / Alert notification state
  const [statusNotice, setStatusNotice] = useState(null);

  // New Voicemail Modal State
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedResidentId, setSelectedResidentId] = useState(residents[0]?.id || 'EC-001');
  const [selectedRecipient, setSelectedRecipient] = useState('All Caregivers');
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [messageSubject, setMessageSubject] = useState('');
  const [messageNotes, setMessageNotes] = useState('');

  // Reply with Voice Modal State
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [replyTargetVm, setReplyTargetVm] = useState(null);
  const [replyNotes, setReplyNotes] = useState('');

  // Live Microphone Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordIntervalRef = useRef(null);

  // Audio Playback Handler
  const handlePlayToggle = (vm) => {
    if (playingId === vm.id) {
      audioRef.current.pause();
      setPlayingId(null);
      clearInterval(progressTimerRef.current);
      return;
    }

    // Stop existing audio
    audioRef.current.pause();
    clearInterval(progressTimerRef.current);

    // If audio is empty, generate soothing synthesized tone sequence
    let audioSrc = vm.audioUrl;
    if (!audioSrc) {
      const freq = vm.category === 'emergency_sos' ? [587, 880, 587, 880] : [440, 554, 659, 880];
      audioSrc = generateDemoAudioDataUrl(freq, Math.min(vm.duration || 6, 8));
    }

    audioRef.current.src = audioSrc;
    audioRef.current.playbackRate = playbackSpeed;
    audioRef.current.play().then(() => {
      setPlayingId(vm.id);
      markVoicemailAsRead(vm.id);

      // Progress interval
      progressTimerRef.current = setInterval(() => {
        if (audioRef.current.duration) {
          const cur = audioRef.current.currentTime;
          const dur = audioRef.current.duration || vm.duration || 1;
          setPlaybackTime(cur);
          setPlaybackProgress(cur / dur);
          if (cur >= dur) {
            setPlayingId(null);
            setPlaybackProgress(0);
            setPlaybackTime(0);
            clearInterval(progressTimerRef.current);
          }
        }
      }, 100);
    }).catch((err) => {
      console.warn('[Voicemails] Playback notice:', err.message);
    });
  };

  const togglePlaybackSpeed = () => {
    const nextSpeed = playbackSpeed === 1 ? 1.5 : playbackSpeed === 1.5 ? 2 : 1;
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  // Recording Functions
  const startRecording = async () => {
    audioChunksRef.current = [];
    setRecordedAudioUrl(null);
    setRecordedBlob(null);
    setRecordingSeconds(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedBlob(audioBlob);
        setRecordedAudioUrl(audioUrl);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(200);
      setIsRecording(true);

      recordIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('[Voicemails] Microphone access unavailable or simulated:', err.message);
      // Simulated audio generation fallback
      setIsRecording(true);
      recordIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 6) {
            stopRecordingSimulation();
            return 6;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        stopRecordingSimulation();
      }
    } else {
      stopRecordingSimulation();
    }
  };

  const stopRecordingSimulation = () => {
    if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    setIsRecording(false);
    const demoUrl = generateDemoAudioDataUrl([523, 659, 783, 1046], Math.max(recordingSeconds, 4));
    setRecordedAudioUrl(demoUrl);
  };

  // Save New Voicemail
  const handleSaveVoicemail = async () => {
    let finalAudioUrl = recordedAudioUrl || '';
    if (recordedBlob) {
      try {
        finalAudioUrl = await blobToBase64(recordedBlob);
      } catch {}
    }

    if (!finalAudioUrl) {
      finalAudioUrl = generateDemoAudioDataUrl([440, 554, 659, 880], Math.max(recordingSeconds, 6));
    }

    const currentResident = residents.find((r) => r.id === selectedResidentId) || residents[0] || {
      id: 'EC-001',
      name: 'Resident'
    };

    const created = await addVoicemail({
      residentId: currentResident.id,
      residentName: currentResident.name,
      senderName: user?.name || (user?.role === 'patient' ? currentResident.name : 'Care Team'),
      senderRole: user?.role || 'caregiver',
      recipientName: selectedRecipient,
      recipientRole: selectedRecipient.includes('Caregiver') ? 'caregiver' : selectedRecipient.includes('Doctor') ? 'doctor' : 'family',
      category: selectedCategory,
      subject: messageSubject.trim() || `${CATEGORY_MAP[selectedCategory]?.label || 'Voice Note'} from ${user?.name || 'User'}`,
      duration: Math.max(recordingSeconds, 8),
      audioUrl: finalAudioUrl,
      notes: messageNotes.trim() || 'Recorded voice message transmitted.',
    });

    setIsRecordModalOpen(false);
    setMessageSubject('');
    setMessageNotes('');
    setRecordedAudioUrl(null);
    setRecordedBlob(null);
    setRecordingSeconds(0);

    setStatusNotice(`✓ Voice message for "${selectedRecipient}" saved and sent successfully!`);
    setTimeout(() => setStatusNotice(null), 5000);
  };

  // Open Reply with Voice Modal
  const handleOpenReplyVoice = (vm) => {
    setReplyTargetVm(vm);
    setReplyNotes('');
    setRecordedAudioUrl(null);
    setRecordedBlob(null);
    setRecordingSeconds(0);
    setIsRecording(false);
    setIsReplyModalOpen(true);
  };

  // Send Reply with Voice
  const handleSendReplyVoice = async () => {
    if (!replyTargetVm) return;

    let finalAudioUrl = recordedAudioUrl || '';
    if (recordedBlob) {
      try {
        finalAudioUrl = await blobToBase64(recordedBlob);
      } catch {}
    }

    if (!finalAudioUrl) {
      finalAudioUrl = generateDemoAudioDataUrl([523, 659, 783, 1046], Math.max(recordingSeconds, 6));
    }

    const replySubject = replyTargetVm.subject.startsWith('Re: ')
      ? replyTargetVm.subject
      : `Re: ${replyTargetVm.subject || 'Voice Note'}`;

    await addVoicemail({
      residentId: replyTargetVm.residentId || 'EC-001',
      residentName: replyTargetVm.residentName || 'Resident',
      senderName: user?.name || 'Care Team',
      senderRole: user?.role || 'caregiver',
      recipientName: replyTargetVm.senderName || 'Sender',
      recipientRole: replyTargetVm.senderRole || 'patient',
      category: replyTargetVm.category || 'care_instruction',
      subject: replySubject,
      duration: Math.max(recordingSeconds, 6),
      audioUrl: finalAudioUrl,
      notes: replyNotes.trim() || `Voice reply to ${replyTargetVm.senderName} regarding "${replyTargetVm.subject}".`,
    });

    // Mark original voicemail as read
    markVoicemailAsRead(replyTargetVm.id);

    setIsReplyModalOpen(false);
    setReplyTargetVm(null);
    setReplyNotes('');
    setRecordedAudioUrl(null);
    setRecordedBlob(null);
    setRecordingSeconds(0);

    setStatusNotice(`✓ Voice reply sent to ${replyTargetVm.senderName} successfully!`);
    setTimeout(() => setStatusNotice(null), 5000);
  };

  // Filtered Voicemails
  const filteredVoicemails = useMemo(() => {
    return (voicemails || []).filter((vm) => {
      if (activeTab === 'all') return true;
      if (activeTab === 'unread') return !vm.isRead;
      return vm.category === activeTab;
    });
  }, [voicemails, activeTab]);

  // Voicemails Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);

  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  const paginatedVoicemails = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredVoicemails.slice(start, start + limit);
  }, [filteredVoicemails, page, limit]);

  const emergencyCount = useMemo(
    () => (voicemails || []).filter((v) => v.category === 'emergency_sos').length,
    [voicemails]
  );

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 40 }}>
      {/* Page Header */}
      <div className="page-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Voice Mails</h1>
            {unreadVoicemailCount > 0 && (
              <span className="badge badge-success" style={{ fontSize: 12 }}>
                {unreadVoicemailCount} New Audio Notes
              </span>
            )}
            {emergencyCount > 0 && (
              <span className="badge badge-critical" style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Radio size={12} /> {emergencyCount} SOS Voice Alerts
              </span>
            )}
          </div>
          <p className="desc" style={{ margin: 0, marginTop: 4 }}>
            Direct audio messaging, voice distress memos, and resident communication.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setRecordedAudioUrl(null);
              setRecordedBlob(null);
              setRecordingSeconds(0);
              setIsRecording(false);
              setMessageSubject('');
              setMessageNotes('');
              setIsRecordModalOpen(true);
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600 }}
          >
            <Mic size={16} />
            <span>Record Voice Message</span>
          </button>
        </div>
      </div>

      {/* Status Notice Banner */}
      {statusNotice && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          background: 'rgba(16, 185, 129, 0.12)',
          color: '#065F46',
          border: '1px solid #A7F3D0',
          borderRadius: 10,
          margin: '16px 0',
          fontSize: 13.5,
          fontWeight: 600,
          boxShadow: '0 2px 6px rgba(16, 185, 129, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircle size={18} color="#059669" />
            <span>{statusNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusNotice(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065F46' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="metrics-grid" style={{ margin: '18px 0 24px' }}>
        <div className="metric-card">
          <div className="m-label">Total Voicemails</div>
          <div className="m-value">{voicemails.length}</div>
          <div className="m-trend positive">
            <Headphones size={13} style={{ marginRight: 4 }} /> User recorded voice memos
          </div>
        </div>

        <div className="metric-card">
          <div className="m-label">Unplayed Messages</div>
          <div className="m-value" style={{ color: unreadVoicemailCount > 0 ? 'var(--color-primary)' : 'inherit' }}>
            {unreadVoicemailCount}
          </div>
          <div className="m-trend">
            <span>Awaiting listening</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="m-label">Emergency SOS Audio</div>
          <div className="m-value" style={{ color: emergencyCount > 0 ? '#DC2626' : 'inherit' }}>
            {emergencyCount}
          </div>
          <div className="m-trend critical">
            <Radio size={13} style={{ marginRight: 4 }} /> Urgent distress recordings
          </div>
        </div>

        <div className="metric-card">
          <div className="m-label">Audio Inbox Status</div>
          <div className="m-value" style={{ color: '#059669' }}>
            Live & Active
          </div>
          <div className="m-trend positive">
            <span>Real-time voice feed</span>
          </div>
        </div>
      </div>

      {/* Main Voicemail Section */}
      <div className="panel" style={{ padding: 24, borderRadius: 12 }}>
        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'all' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('all')}
            >
              All Messages ({voicemails.length})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'emergency_sos' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('emergency_sos')}
            >
              🚨 Emergency SOS ({emergencyCount})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'family_checkin' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('family_checkin')}
            >
              🌸 Family Check-in
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'care_instruction' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('care_instruction')}
            >
              👩‍⚕️ Caregiver Notes
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'unread' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('unread')}
            >
              Unread Only ({unreadVoicemailCount})
            </button>
          </div>

          {/* Playback speed selector */}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={togglePlaybackSpeed}
            style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
            title="Adjust audio playback speed"
          >
            <Clock size={13} />
            <span>Speed: <strong>{playbackSpeed}x</strong></span>
          </button>
        </div>

        {/* Voicemail Feed List */}
        {filteredVoicemails.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'var(--surface-sunken)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: 'var(--color-primary)'
            }}>
              <Inbox size={32} />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 6px', color: 'var(--text-primary)' }}>
              No Voice Messages Yet
            </h3>
            <p style={{ fontSize: 13.5, maxWidth: 440, margin: '0 auto 20px', lineHeight: 1.5 }}>
              Only voice messages you record or receive will appear here. No default mock audio notes are active.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setRecordedAudioUrl(null);
                setRecordedBlob(null);
                setRecordingSeconds(0);
                setIsRecording(false);
                setMessageSubject('');
                setMessageNotes('');
                setIsRecordModalOpen(true);
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <Mic size={16} />
              <span>Record Your First Voice Message</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {paginatedVoicemails.map((vm) => {
              const isPlaying = playingId === vm.id;
              const isEmergency = vm.category === 'emergency_sos';
              const catConfig = CATEGORY_MAP[vm.category] || CATEGORY_MAP.general;

              return (
                <div
                  key={vm.id}
                  style={{
                    borderRadius: 12,
                    border: isEmergency ? '2px solid rgba(220, 38, 38, 0.4)' : !vm.isRead ? '1.5px solid var(--color-primary)' : '1px solid var(--border-hairline)',
                    background: isEmergency ? 'rgba(254, 242, 242, 0.5)' : !vm.isRead ? 'var(--surface-sunken)' : 'var(--surface-card)',
                    padding: '16px 20px',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                >
                  {/* Top Row: Sender Info & Category Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: '50%',
                          background: isEmergency ? '#DC2626' : 'var(--color-primary)',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: 14,
                        }}
                      >
                        {(vm.senderName || 'U').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                            {vm.senderName}
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              padding: '2px 8px',
                              borderRadius: 12,
                              fontWeight: 600,
                              background: catConfig.bg,
                              color: catConfig.color,
                              border: `1px solid ${catConfig.border}`,
                            }}
                          >
                            {catConfig.label}
                          </span>
                          {!vm.isRead && (
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: 'var(--color-primary)',
                                display: 'inline-block'
                              }}
                              title="Unread"
                            />
                          )}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                          To: <strong>{vm.recipientName}</strong> · Resident: <strong>{vm.residentName}</strong> · {vm.createdAt ? new Date(vm.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Today'}
                        </div>
                      </div>
                    </div>

                    {/* Delete action */}
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => deleteVoicemail(vm.id)}
                      title="Delete voice message"
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* Subject and Notes */}
                  <div style={{ marginBottom: 12 }}>
                    <h4 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: isEmergency ? '#DC2626' : 'var(--text-primary)' }}>
                      {vm.subject || 'Voice Message'}
                    </h4>
                    {vm.notes && (
                      <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.4 }}>
                        &ldquo;{vm.notes}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Custom Audio Player Strip */}
                  <div
                    style={{
                      background: 'var(--surface-sunken)',
                      borderRadius: 10,
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handlePlayToggle(vm)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: isEmergency ? '#DC2626' : 'var(--color-primary)',
                        color: '#FFFFFF',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                      title={isPlaying ? 'Pause' : 'Play voice memo'}
                    >
                      {isPlaying ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: 2 }} />}
                    </button>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                        <span>{isPlaying ? formatAudioDuration(playbackTime) : '0:00'}</span>
                        <span>Total: {formatAudioDuration(vm.duration || 15)}</span>
                      </div>
                      <div
                        style={{
                          height: 5,
                          background: 'rgba(0,0,0,0.08)',
                          borderRadius: 3,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${isPlaying ? Math.min(playbackProgress * 100, 100) : 0}%`,
                            background: isEmergency ? '#DC2626' : 'var(--color-primary)',
                            borderRadius: 3,
                            transition: 'width 0.1s linear',
                          }}
                        />
                      </div>
                    </div>

                    <Volume2 size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  </div>

                  {/* Card Bottom Actions: Reply with Voice & Mark Read */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-hairline)' }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleOpenReplyVoice(vm)}
                      style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--color-primary)', fontWeight: 600 }}
                    >
                      <Mic size={14} />
                      <span>Reply with Voice</span>
                    </button>

                    <div>
                      {!vm.isRead ? (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => markVoicemailAsRead(vm.id)}
                          style={{ fontSize: 11.5, color: 'var(--text-muted)' }}
                        >
                          <Check size={12} style={{ marginRight: 3 }} /> Mark Read
                        </button>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--color-forest)', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <CheckCircle size={12} /> Listened
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            <div style={{ marginTop: 14 }}>
              <Pagination
                currentPage={page}
                totalRecords={filteredVoicemails.length}
                recordsPerPage={limit}
                onPageChange={setPage}
                onPageSizeChange={(newSize) => {
                  setLimit(newSize);
                  setPage(1);
                }}
                itemLabel="voice messages"
              />
            </div>
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* RECORD VOICE MESSAGE MODAL (NEW AUDIO NOTE)          */}
      {/* ==================================================== */}
      {isRecordModalOpen && (
        <div className="modal-backdrop" onClick={() => !isRecording && setIsRecordModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, fontSize: 16 }}>
                <Mic size={18} style={{ color: 'var(--color-primary)' }} /> Record Voice Message
              </h3>
              {!isRecording && (
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setIsRecordModalOpen(false)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="modal-body" style={{ padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Resident:
                  </label>
                  <select
                    className="form-input"
                    value={selectedResidentId}
                    onChange={(e) => setSelectedResidentId(e.target.value)}
                    disabled={isRecording}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8 }}
                  >
                    {residents.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.room})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Recipient:
                  </label>
                  <select
                    className="form-input"
                    value={selectedRecipient}
                    onChange={(e) => setSelectedRecipient(e.target.value)}
                    disabled={isRecording}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8 }}
                  >
                    <option value="All On-Duty Caregivers">All On-Duty Caregivers</option>
                    {caregivers.map((cg) => (
                      <option key={cg.id || cg.name} value={cg.name}>
                        {cg.name} (Caregiver)
                      </option>
                    ))}
                    <option value="Dr. Kavya Menon">Dr. Kavya Menon (Cardiologist)</option>
                    <option value="Dr. Arvind Swaminathan">Dr. Arvind Swaminathan (Physician)</option>
                    <option value="Family Member">Family Member</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Category:
                  </label>
                  <select
                    className="form-input"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    disabled={isRecording}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8 }}
                  >
                    <option value="general">General Voice Note</option>
                    <option value="family_checkin">Family Wellness Check-in</option>
                    <option value="care_instruction">Caregiver Instruction</option>
                    <option value="emergency_sos">🚨 Urgent Medical Assistance</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Subject / Topic:
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Afternoon mobility update..."
                    value={messageSubject}
                    onChange={(e) => setMessageSubject(e.target.value)}
                    disabled={isRecording}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 8 }}
                  />
                </div>
              </div>

              {/* Live Microphone Recording Box */}
              <div
                style={{
                  background: isRecording ? 'rgba(239, 68, 68, 0.08)' : 'var(--surface-sunken)',
                  border: isRecording ? '2px dashed #DC2626' : '1px solid var(--border-hairline)',
                  borderRadius: 12,
                  padding: '24px 20px',
                  textAlign: 'center',
                  marginBottom: 16,
                  transition: 'all 0.2s ease',
                }}
              >
                {isRecording ? (
                  <div>
                    <div
                      style={{
                        width: 58,
                        height: 58,
                        borderRadius: '50%',
                        background: '#DC2626',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 12px',
                        boxShadow: '0 0 16px rgba(220, 38, 38, 0.4)'
                      }}
                    >
                      <Mic size={26} />
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#DC2626' }}>
                      Recording: {formatAudioDuration(recordingSeconds)}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                      Speak clearly into your microphone...
                    </p>
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{ marginTop: 14, background: '#DC2626', color: '#FFFFFF', border: 'none', padding: '8px 16px', fontWeight: 600 }}
                      onClick={stopRecording}
                    >
                      <MicOff size={14} style={{ marginRight: 6 }} /> Stop Recording
                    </button>
                  </div>
                ) : recordedAudioUrl ? (
                  <div>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: 'rgba(5, 150, 105, 0.15)',
                        color: '#059669',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 8px',
                      }}
                    >
                      <CheckCircle size={22} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#059669' }}>
                      Voice Audio Ready ({formatAudioDuration(recordingSeconds || 8)})
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 12 }}>
                      <audio controls src={recordedAudioUrl} style={{ height: 36, maxWidth: 260 }} />
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={startRecording}
                        title="Re-record audio"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <RotateCcw size={13} /> Re-record
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: '50%',
                        background: 'var(--surface-card)',
                        color: 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 10px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      }}
                    >
                      <Mic size={24} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>Click to Start Recording</div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, maxWidth: 320, margin: '4px auto 14px' }}>
                      Record a live voice note using your microphone.
                    </p>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={startRecording}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
                    >
                      <Mic size={14} /> Start Live Recording
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Optional Transcription or Notes:
                </label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Summary of what is said in this voice recording..."
                  value={messageNotes}
                  onChange={(e) => setMessageNotes(e.target.value)}
                  disabled={isRecording}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsRecordModalOpen(false)}
                  disabled={isRecording}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveVoicemail}
                  disabled={isRecording}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
                >
                  <Send size={15} /> Send Voice Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* REPLY WITH VOICE MODAL (DEDICATED QUICK VOICE REPLY) */}
      {/* ==================================================== */}
      {isReplyModalOpen && replyTargetVm && (
        <div className="modal-backdrop" onClick={() => !isRecording && setIsReplyModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, fontSize: 16 }}>
                  <Mic size={18} style={{ color: 'var(--color-primary)' }} /> Reply with Voice
                </h3>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, display: 'block' }}>
                  Replying to <strong>{replyTargetVm.senderName}</strong> regarding &ldquo;{replyTargetVm.subject}&rdquo;
                </span>
              </div>
              {!isRecording && (
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setIsReplyModalOpen(false)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="modal-body" style={{ padding: 20 }}>
              {/* Target info pill */}
              <div style={{
                background: 'var(--surface-sunken)',
                padding: '10px 14px',
                borderRadius: 8,
                marginBottom: 16,
                border: '1px solid var(--border-hairline)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    Recipient: {replyTargetVm.senderName}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                    Resident: {replyTargetVm.residentName} · Category: {CATEGORY_MAP[replyTargetVm.category]?.label || 'Voice Note'}
                  </div>
                </div>
                <span className="badge badge-neutral" style={{ fontSize: 11 }}>
                  Voice Reply
                </span>
              </div>

              {/* Live Microphone Recording Box */}
              <div
                style={{
                  background: isRecording ? 'rgba(239, 68, 68, 0.08)' : 'var(--surface-sunken)',
                  border: isRecording ? '2px dashed #DC2626' : '1px solid var(--border-hairline)',
                  borderRadius: 12,
                  padding: '24px 20px',
                  textAlign: 'center',
                  marginBottom: 16,
                  transition: 'all 0.2s ease',
                }}
              >
                {isRecording ? (
                  <div>
                    <div
                      style={{
                        width: 58,
                        height: 58,
                        borderRadius: '50%',
                        background: '#DC2626',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 12px',
                        boxShadow: '0 0 16px rgba(220, 38, 38, 0.4)'
                      }}
                    >
                      <Mic size={26} />
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#DC2626' }}>
                      Recording: {formatAudioDuration(recordingSeconds)}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                      Speak your voice reply now...
                    </p>
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{ marginTop: 14, background: '#DC2626', color: '#FFFFFF', border: 'none', padding: '8px 16px', fontWeight: 600 }}
                      onClick={stopRecording}
                    >
                      <MicOff size={14} style={{ marginRight: 6 }} /> Stop Recording
                    </button>
                  </div>
                ) : recordedAudioUrl ? (
                  <div>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: 'rgba(5, 150, 105, 0.15)',
                        color: '#059669',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 8px',
                      }}
                    >
                      <CheckCircle size={22} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#059669' }}>
                      Voice Reply Audio Ready ({formatAudioDuration(recordingSeconds || 6)})
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 12 }}>
                      <audio controls src={recordedAudioUrl} style={{ height: 36, maxWidth: 260 }} />
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={startRecording}
                        title="Re-record voice reply"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <RotateCcw size={13} /> Re-record
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: '50%',
                        background: 'var(--surface-card)',
                        color: 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 10px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      }}
                    >
                      <Mic size={24} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>Record Voice Reply</div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, maxWidth: 300, margin: '4px auto 14px' }}>
                      Click below to speak your response to {replyTargetVm.senderName}.
                    </p>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={startRecording}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
                    >
                      <Mic size={14} /> Start Voice Reply Recording
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  Optional Note / Summary:
                </label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder={`e.g. Acknowledged note from ${replyTargetVm.senderName}, will assist promptly.`}
                  value={replyNotes}
                  onChange={(e) => setReplyNotes(e.target.value)}
                  disabled={isRecording}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsReplyModalOpen(false)}
                  disabled={isRecording}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSendReplyVoice}
                  disabled={isRecording}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
                >
                  <Send size={15} /> Send Voice Reply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
