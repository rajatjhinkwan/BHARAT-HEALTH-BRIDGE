import { useState, useCallback, useEffect } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config';
import { departmentsMatch } from '../utils/departments';

const SOCKET_URL = API_BASE_URL.replace('/api', '');
let sharedSocket;

function getSocket() {
  if (!sharedSocket) {
    sharedSocket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
  }
  return sharedSocket;
}

/**
 * Live OPD queue for a department with socket + polling fallback.
 */
export function useLiveQueue(department, { pollMs = 5000, date } = {}) {
  const [queueData, setQueueData] = useState({ waiting: [], inConsultation: [], completed: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLiveQueue = useCallback(async () => {
    if (!department) return;
    try {
      const token = localStorage.getItem('hospflow_auth_token');
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      let url = `${API_BASE_URL}/workflow/queue/live?department=${encodeURIComponent(department)}`;
      if (date) {
        url += `&date=${encodeURIComponent(date)}`;
      }

      const response = await fetch(url, { headers });
      if (response.ok) {
        const data = await response.json();
        setQueueData({
          waiting: data.waiting || [],
          inConsultation: data.inConsultation || [],
          completed: data.completed || [],
        });
        setError(null);
      } else {
        const err = await response.json().catch(() => ({}));
        setError(err.message || 'Failed to load queue');
      }
    } catch (err) {
      console.error('Queue Fetch Error:', err);
      setError('Network error loading queue');
    } finally {
      setLoading(false);
    }
  }, [department, date]);

  useEffect(() => {
    if (!department) return undefined;

    setLoading(true);
    fetchLiveQueue();

    const socket = getSocket();
    const onQueueUpdated = (payload) => {
      if (!payload?.department || departmentsMatch(payload.department, department)) {
        fetchLiveQueue();
      }
    };

    socket.on('queueUpdated', onQueueUpdated);
    const interval = setInterval(fetchLiveQueue, pollMs);

    return () => {
      socket.off('queueUpdated', onQueueUpdated);
      clearInterval(interval);
    };
  }, [department, date, fetchLiveQueue, pollMs]);

  return { queueData, loading, error, refresh: fetchLiveQueue };
}
