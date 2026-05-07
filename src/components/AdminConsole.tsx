import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType, auth } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { X, Shield, UserPlus, Trash2, Mail, CheckCircle, AlertCircle } from 'lucide-react';

interface AdminEmail {
  id: string;
  email: string;
  addedAt: any;
}

interface AdminConsoleProps {
  onClose: () => void;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({ onClose }) => {
  const [admins, setAdmins] = useState<AdminEmail[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'admin_emails'), orderBy('addedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({
        id: d.id,
        email: d.id,
        ...d.data()
      })) as AdminEmail[];
      setAdmins(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error loading admins:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes('@')) return;

    setStatus('loading');
    try {
      const emailId = newEmail.toLowerCase().trim();
      await setDoc(doc(db, 'admin_emails', emailId), {
        addedAt: serverTimestamp(),
        addedBy: auth.currentUser?.uid
      });
      setNewEmail('');
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      setStatus('error');
      setErrorMessage("No tienes permisos para agregar administradores.");
      console.error(error);
    }
  };

  const handleDeleteAdmin = async (emailId: string) => {
    if (emailId === "gloria@cademmy.com" || emailId === "gloriaalbamx@google.com") {
      alert("No puedes eliminar al administrador principal.");
      return;
    }
    
    if (!confirm(`¿Estás seguro de eliminar a ${emailId} como administrador?`)) return;

    try {
      await deleteDoc(doc(db, 'admin_emails', emailId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `admin_emails/${emailId}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Gestión de <span className="text-orange-500">Admins</span></h2>
              <p className="text-slate-500 font-bold text-[9px] uppercase tracking-widest mt-0.5">Control de acceso administrativo</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Add Form */}
          <form onSubmit={handleAddAdmin} className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nuevo Administrador</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={status === 'loading'}
                className="p-3 bg-orange-600 text-white rounded-2xl hover:bg-orange-700 transition-all shadow-lg shadow-orange-100 disabled:opacity-50"
              >
                <UserPlus className="w-5 h-5" />
              </button>
            </div>
            {status === 'success' && (
              <div className="flex items-center gap-2 text-emerald-600 text-[10px] font-bold ml-1 animate-fade-in">
                <CheckCircle className="w-3 h-3" /> Administrador agregado con éxito
              </div>
            )}
            {status === 'error' && (
              <div className="flex items-center gap-2 text-red-600 text-[10px] font-bold ml-1 animate-fade-in">
                <AlertCircle className="w-3 h-3" /> {errorMessage}
              </div>
            )}
          </form>

          {/* List */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Administradores Actuales</label>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                {/* Bootstrap Admins (Fixed) */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between p-4 bg-orange-50/50 border border-orange-100 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <Shield className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">gloria@cademmy.com</p>
                        <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest">Admin Principal</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-orange-50/50 border border-orange-100 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <Shield className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">gloriaalbamx@google.com</p>
                        <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest">Admin Principal</p>
                      </div>
                    </div>
                  </div>
                </div>

                {admins.filter(a => a.email !== "gloria@cademmy.com" && a.email !== "gloriaalbamx@google.com").map((admin) => (
                  <div key={admin.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl group hover:border-orange-200 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-orange-50 transition-colors">
                        <Mail className="w-4 h-4 text-slate-400 group-hover:text-orange-500" />
                      </div>
                      <p className="text-sm font-bold text-slate-700">{admin.email}</p>
                    </div>
                    <button 
                      onClick={() => handleDeleteAdmin(admin.id)}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Cademmy Admin Console • 2026</p>
        </div>
      </div>
    </div>
  );
};
