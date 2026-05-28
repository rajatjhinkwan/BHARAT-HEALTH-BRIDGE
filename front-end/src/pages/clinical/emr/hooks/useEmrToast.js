import { useState, useCallback } from 'react';

export function useEmrToast() {
  const [toast, setToast] = useState({ message: '', type: '' });

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 4000);
  }, []);

  return { toast, showToast };
}
