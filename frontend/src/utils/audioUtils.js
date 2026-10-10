// ============================================================
// ElderCare — Audio & Voice Messaging Utility
// Provides Web Audio recording, playback utilities, and
// synthesized audio generators for instant offline demo playback.
// ============================================================

/**
 * Format duration in seconds to "mm:ss"
 */
export function formatAudioDuration(seconds = 0) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Generate a synthetic audible WAV Data URL using Web Audio API / PCM encoder.
 * Used for demo voicemails so that clicking "Play" produces an audible, warm audio tone sequence.
 */
export function generateDemoAudioDataUrl(frequencyArray = [440, 554, 659, 880], durationSeconds = 3.5) {
  try {
    const sampleRate = 22050;
    const numSamples = Math.floor(sampleRate * durationSeconds);
    const numChannels = 1;
    const bytesPerSample = 2;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = numSamples * blockAlign;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // RIFF chunk descriptor
    function writeString(offset, str) {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    }

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
    view.setUint16(22, numChannels, true); // NumChannels
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, byteRate, true); // ByteRate
    view.setUint16(32, blockAlign, true); // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    // Generate warm harmonic tones with soft envelope
    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const noteIndex = Math.floor((t / durationSeconds) * frequencyArray.length) % frequencyArray.length;
      const freq = frequencyArray[noteIndex];

      // Soft envelope (fade in and out)
      const noteDuration = durationSeconds / frequencyArray.length;
      const noteTime = t % noteDuration;
      const env = Math.sin((noteTime / noteDuration) * Math.PI);

      // Primary tone + gentle overtone
      const sample = (Math.sin(2 * Math.PI * freq * t) * 0.7 + Math.sin(2 * Math.PI * freq * 1.5 * t) * 0.3) * env * 0.45;
      const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
      view.setInt16(offset, intSample, true);
      offset += 2;
    }

    const blob = new Blob([buffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  } catch (err) {
    console.warn('[AudioUtils] Failed to synthesize demo audio:', err);
    return null;
  }
}

/**
 * Converts a Blob to a Base64 Data URL string
 */
export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
