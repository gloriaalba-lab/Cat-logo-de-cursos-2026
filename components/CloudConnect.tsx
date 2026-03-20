
import React, { useState, useEffect } from 'react';
import { Cloud, Check, Loader2, Database, HardDrive } from 'lucide-react';

interface CloudStatus {
  google: boolean;
  onedrive: boolean;
}

export const CloudConnect: React.FC<{ onSave?: (provider: 'google' | 'onedrive') => void }> = ({ onSave }) => {
  const [status, setStatus] = useState<CloudStatus>({ google: false, onedrive: false });
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/auth/status');
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error("Failed to fetch auth status");
    }
  };

  useEffect(() => {
    fetchStatus();
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_SUCCESS') {
        fetchStatus();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnect = async (provider: 'google' | 'onedrive') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${provider}/url`);
      const { url } = await res.json();
      window.open(url, 'oauth_popup', 'width=600,height=700');
    } catch (e) {
      alert("Error al conectar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-200">
      <div className="flex items-center gap-2 mb-2">
        <Cloud className="w-5 h-5 text-orange-500" />
        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Almacenamiento en la Nube</h4>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          onClick={() => status.google ? onSave?.('google') : handleConnect('google')}
          disabled={loading}
          className={`flex items-center justify-between px-6 py-4 rounded-2xl transition-all font-bold text-sm ${
            status.google 
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
            : 'bg-white text-slate-600 border border-slate-200 hover:border-orange-400 hover:text-orange-600'
          }`}
        >
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5" />
            <span>{status.google ? 'Guardar en Google Drive' : 'Conectar Google Drive'}</span>
          </div>
          {status.google && <Check className="w-4 h-4" />}
        </button>

        <button
          onClick={() => status.onedrive ? onSave?.('onedrive') : handleConnect('onedrive')}
          disabled={loading}
          className={`flex items-center justify-between px-6 py-4 rounded-2xl transition-all font-bold text-sm ${
            status.onedrive 
            ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100' 
            : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-400 hover:text-blue-600'
          }`}
        >
          <div className="flex items-center gap-3">
            <HardDrive className="w-5 h-5" />
            <span>{status.onedrive ? 'Guardar en OneDrive' : 'Conectar OneDrive'}</span>
          </div>
          {status.onedrive && <Check className="w-4 h-4" />}
        </button>
      </div>
      
      {loading && (
        <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">
          <Loader2 className="w-3 h-3 animate-spin" /> Procesando conexión...
        </div>
      )}
    </div>
  );
};
