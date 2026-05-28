import { useState, useCallback } from 'react';
import { API_BASE_URL, apiFetch } from '../../../../utils/api';

export function useEmrVoice({ patientId, userName, onHistoryRefresh, showToast }) {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  const uploadVoiceNote = useCallback(
    async (blob) => {
      if (!patientId) return;
      const form = new FormData();
      form.append('file', blob, `voice-${Date.now()}.webm`);
      form.append('patientId', patientId);
      form.append('title', `Consultation — ${new Date().toLocaleDateString()}`);
      form.append('doctor', userName || 'Doctor');
      form.append('hospital', 'Bharat Health Bridge');
      try {
        const res = await apiFetch('/history/voicenote/upload', {
          method: 'POST',
          body: form,
          json: false,
        });
        if (res.ok) {
          await onHistoryRefresh?.();
          showToast?.('Voice note saved to patient record.', 'success');
        } else {
          const err = await res.json().catch(() => ({}));
          showToast?.(err.message || 'Voice upload failed', 'error');
        }
      } catch (err) {
        console.error('Voice upload failed', err);
        showToast?.('Voice upload failed', 'error');
      }
    },
    [patientId, userName, onHistoryRefresh, showToast]
  );

  const toggleRecording = useCallback(async () => {
    if (isRecording && mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        await uploadVoiceNote(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      showToast?.('Recording… click again to stop and save.', 'info');
    } catch (err) {
      console.error(err);
      showToast?.('Microphone access denied or unavailable.', 'error');
    }
  }, [isRecording, mediaRecorder, uploadVoiceNote, showToast]);

  return { isRecording, toggleRecording };
}
