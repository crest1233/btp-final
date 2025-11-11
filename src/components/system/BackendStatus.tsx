import { useEffect, useState } from 'react';
import { get } from '../../system/api';

export default function BackendStatus() {
  const [status, setStatus] = useState('checking');
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  async function checkHealth() {
    try {
      const data = await get('/api/health');
      setStatus('online');
      setLastChecked((data as any)?.timestamp || new Date().toISOString());
    } catch (e) {
      setStatus('offline');
      setLastChecked(new Date().toISOString());
    }
  }

  useEffect(() => {
    checkHealth();
    const i = setInterval(checkHealth, 10000);
    return () => clearInterval(i);
  }, []);

  const color = status === 'online' ? '#16a34a' : status === 'offline' ? '#dc2626' : '#525252';
  const label = status === 'online' ? 'Backend: Connected' : status === 'offline' ? 'Backend: Offline' : 'Backend: Checking';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 12,
        left: 12,
        backgroundColor: '#0b1220',
        color: '#e5e7eb',
        border: `1px solid ${color}`,
        borderRadius: 9999,
        padding: '6px 10px',
        fontSize: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
        zIndex: 1000,
      }}
      title={lastChecked ? `Last checked: ${lastChecked}` : undefined}
    >
      <span
        style={{
          width: 8,
          height: 8,
          backgroundColor: color,
          borderRadius: 9999,
          display: 'inline-block',
        }}
      />
      <span>{label}</span>
    </div>
  );
}