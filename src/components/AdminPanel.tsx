import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BarChart3, 
  Shield, 
  Trash2, 
  UserPlus, 
  CheckCircle2, 
  XCircle,
  Activity,
  Calendar,
  FileText,
  Search as SearchIcon,
  Download,
  AlertCircle,
  Share2,
  ThumbsUp,
  TrendingUp
} from 'lucide-react';
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  orderBy, 
  serverTimestamp,
  limit 
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { getAppMetrics } from '../services/metricsService';
import { StepStrategy } from './StepStrategy';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface AdminUser {
  emailId: string;
  email: string;
  addedAt: any;
  addedBy?: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-2xl ${color} bg-opacity-10`}>
        <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
      </div>
    </div>
    <div>
      <p className="text-sm font-black text-slate-400 uppercase tracking-widest">{title}</p>
      <h3 className="text-3xl font-black text-slate-900 mt-1">{value}</h3>
    </div>
  </div>
);

export const AdminPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'bi' | 'proposals' | 'admins'>('stats');
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [strategiesCount, setStrategiesCount] = useState(0);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [selectedProposal, setSelectedProposal] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch Admins
      const adminSnap = await getDocs(collection(db, 'admin_emails'));
      const adminList = adminSnap.docs.map(doc => ({
        emailId: doc.id,
        ...doc.data()
      })) as AdminUser[];
      setAdmins(adminList);

      // Fetch Metrics
      const metricsData = await getAppMetrics(500);
      setMetrics(metricsData);

      // Fetch Proposals
      const strategiesSnap = await getDocs(query(collection(db, 'saved_strategies'), orderBy('createdAt', 'desc')));
      const strategiesData = strategiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProposals(strategiesData);
      setStrategiesCount(strategiesData.length);

    } catch (err) {
      console.error("Error fetching admin data:", err);
      setError("No se pudieron cargar los datos del panel.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim() || !newAdminEmail.includes('@')) return;
    
    setIsActionLoading(true);
    try {
      const email = newAdminEmail.toLowerCase().trim();
      await setDoc(doc(db, 'admin_emails', email), {
        email,
        addedAt: serverTimestamp(),
        addedBy: auth.currentUser?.uid
      });
      setNewAdminEmail('');
      await fetchData();
    } catch (err) {
      setError("Error al agregar administrador.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRemoveAdmin = async (emailId: string) => {
    if (!confirm(`¿Estás seguro de eliminar a ${emailId} como administrador?`)) return;
    
    setIsActionLoading(true);
    try {
      await deleteDoc(doc(db, 'admin_emails', emailId));
      await fetchData();
    } catch (err) {
      setError("Error al eliminar administrador.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Prepare chart data
  const metricTypeStats = metrics.reduce((acc: any, curr) => {
    acc[curr.type] = (acc[curr.type] || 0) + 1;
    return acc;
  }, {});

  const chartData = [
    { name: 'Generados', value: (metricTypeStats['strategy_generated'] || 0), color: '#f97316' },
    { name: 'Citas', value: metricTypeStats['booking_clicked'] || 0, color: '#10b981' },
    { name: 'Descargas', value: metricTypeStats['download_docx'] || 0, color: '#0ea5e9' },
    { name: 'Compartidos', value: metricTypeStats['strategy_shared'] || 0, color: '#6366f1' },
  ];

  const totalGenerated = metricTypeStats['strategy_generated'] || 0;
  const totalBookings = metricTypeStats['booking_clicked'] || 0;
  const conversionRate = totalGenerated > 0 ? (totalBookings / totalGenerated) * 100 : 0;
  const abandons = Math.max(0, totalGenerated - totalBookings);
  const totalDownloads = metricTypeStats['download_docx'] || 0;
  const totalShared = metricTypeStats['strategy_shared'] || 0;

  // Group proposals by user
  const groupedProposals = proposals.reduce((acc: any, p) => {
    const key = p.userEmail || p.uid || 'Desconocido';
    if (!acc[key]) {
      acc[key] = {
        email: key,
        name: p.userName || 'Usuario',
        photo: p.userPhoto,
        proposals: []
      };
    }
    acc[key].proposals.push(p);
    return acc;
  }, {});

  const userProposals = selectedUser ? groupedProposals[selectedUser]?.proposals || [] : [];

  const handleDeleteProposal = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta propuesta permanentemente?")) return;
    setIsActionLoading(true);
    try {
      await deleteDoc(doc(db, 'saved_strategies', id));
      await fetchData();
    } catch (err) {
      setError("Error al eliminar propuesta.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteAllForUser = async (userEmail: string) => {
    const count = groupedProposals[userEmail].proposals.length;
    if (!confirm(`¿Estás seguro de eliminar TODAS las propuestas (${count}) de este usuario?`)) return;
    
    setIsActionLoading(true);
    try {
      const deletePromises = groupedProposals[userEmail].proposals.map((p: any) => deleteDoc(doc(db, 'saved_strategies', p.id)));
      await Promise.all(deletePromises);
      setSelectedUser(null);
      await fetchData();
    } catch (err) {
      setError("Error al eliminar propuestas del usuario.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleResetMetrics = async () => {
    const confirmText = prompt("🔒 AUTENTICACIÓN DE SEGURIDAD REQUERIDA\n\nPor seguridad, confirme su identidad de administrador.\n\nEscriba la palabra: CONFIRMAR_REINICIO\n\n(Esto borrará permanentemente los datos locales de las últimas 500 métricas):");
    
    if (confirmText !== 'CONFIRMAR_REINICIO') {
      if (confirmText !== null) alert("Error de autenticación. Palabra incorrecta.");
      return;
    }

    const secondConfirm = confirm("⚠️ ¡ADVERTENCIA FINAL! ⚠️\n\n¿Estás absolutamente seguro? Esta acción no se puede deshacer.");
    if (!secondConfirm) return;

    setIsActionLoading(true);
    try {
      // In a real high-scale app, we'd use a Cloud Function. 
      // For now, we delete what we have fetched (up to 500).
      const batchDocs = await getDocs(query(collection(db, 'app_metrics'), limit(500)));
      const deletePromises = batchDocs.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      alert("Estadísticas reiniciadas correctamente.");
      await fetchData();
    } catch (err) {
      console.error("Error resetting metrics:", err);
      setError("Error al reiniciar estadísticas.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const COLORS = ['#f97316', '#0ea5e9', '#10b981', '#6366f1', '#a855f7'];

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl flex flex-col items-center gap-6">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-black text-slate-800 uppercase tracking-widest">Cargando Panel de Control...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
      <div className="bg-white w-full max-w-7xl h-full md:h-[95vh] md:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-scale-in">
        
        {/* Header Section */}
        <div className="bg-slate-900 text-white p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 relative">
          <div className="absolute top-4 left-6 block md:hidden">
            <button 
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
            >
              <Users className="w-5 h-5 text-white" />
            </button>
          </div>
          <div className="flex items-center gap-4 md:gap-6 pt-6 md:pt-0">
            <div className="w-14 h-14 md:w-20 md:h-20 bg-orange-500 rounded-[1.5rem] md:rounded-[2.5rem] flex items-center justify-center shadow-xl shadow-orange-500/20 rotate-3 shrink-0">
              <Shield className="w-8 h-8 md:w-10 md:h-10 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-black tracking-tight flex items-center gap-3">
                PANEL <span className="text-orange-500 italic">ADMIN</span>
              </h1>
              <p className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
                Estrategias • Métricas • Consultoría 2026
              </p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 w-full md:w-auto">
            <button 
              onClick={onClose}
              className="px-6 py-3 bg-white/10 border border-white/10 hover:bg-white text-white hover:text-slate-900 transition-all uppercase text-[10px] md:text-xs font-black tracking-widest rounded-2xl flex items-center gap-2"
            >
               Regresar a la App
            </button>
            <button 
              onClick={fetchData}
              disabled={isActionLoading}
              className="px-6 py-3 bg-white/10 border border-white/10 hover:bg-white text-white hover:text-slate-900 transition-all uppercase text-[10px] md:text-xs font-black tracking-widest rounded-2xl flex items-center gap-2"
            >
              {isActionLoading ? 'Cargando...' : 'Actualizar'}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-50 border-b border-slate-200 p-2 md:p-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 min-w-max md:justify-center">
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-6 py-3 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${
                activeTab === 'stats' ? 'bg-white text-orange-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Métricas
            </button>
            <button
              onClick={() => setActiveTab('bi')}
              className={`px-6 py-3 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${
                activeTab === 'bi' ? 'bg-white text-orange-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Activity className="w-4 h-4" /> Inteligencia
            </button>
            <button
              onClick={() => setActiveTab('proposals')}
              className={`px-6 py-3 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${
                activeTab === 'proposals' ? 'bg-white text-orange-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" /> Propuestas
            </button>
            <button
              onClick={() => setActiveTab('admins')}
              className={`px-6 py-3 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${
                activeTab === 'admins' ? 'bg-white text-orange-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-4 h-4" /> Equipo
            </button>
          </div>
        </div>

          {activeTab === 'stats' ? (
            <div className="space-y-8 animate-fade-in">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard 
                  title="Propuestas" 
                  value={totalGenerated} 
                  icon={FileText} 
                  color="bg-orange-500" 
                />
                <StatCard 
                  title="Agendó Cita" 
                  value={totalBookings} 
                  icon={Calendar} 
                  color="bg-emerald-500" 
                />
                <StatCard 
                  title="Abandonó" 
                  value={abandons} 
                  icon={XCircle} 
                  color="bg-red-500" 
                />
                <StatCard 
                  title="Conversión" 
                  value={`${conversionRate.toFixed(1)}%`} 
                  icon={TrendingUp} 
                  color="bg-blue-500" 
                />
              </div>

              {/* Conversion and Sharing Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                <StatCard 
                  title="Descargas Word" 
                  value={totalDownloads} 
                  icon={Download} 
                  color="bg-indigo-500" 
                />
                <StatCard 
                  title="Compartidos" 
                  value={totalShared} 
                  icon={Share2} 
                  color="bg-purple-500" 
                />
                <StatCard 
                  title="Búsquedas" 
                  value={metricTypeStats['search_performed'] || 0} 
                  icon={SearchIcon} 
                  color="bg-slate-500" 
                />
                <StatCard 
                  title="Equipo Admins" 
                  value={admins.length + 2}
                  icon={Shield} 
                  color="bg-slate-900" 
                />
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col h-[400px]">
                  <h3 className="text-xl font-black text-slate-900 mb-8 uppercase tracking-tight">Distribución de Actividad</h3>
                  <div className="flex-1 w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Tooltip 
                          contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="value" radius={[8, 8, 8, 8]}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 space-y-6">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Últimos Eventos</h3>
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {metrics.slice(0, 10).map((metric) => (
                      <div key={metric.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-xl bg-white shadow-sm`}>
                            {metric.type === 'strategy_generated' && <FileText className="w-4 h-4 text-orange-500" />}
                            {metric.type === 'search_performed' && <SearchIcon className="w-4 h-4 text-blue-500" />}
                            {metric.type === 'user_signin' && <Users className="w-4 h-4 text-indigo-500" />}
                            {metric.type === 'booking_clicked' && <Calendar className="w-4 h-4 text-emerald-500" />}
                            {metric.type === 'strategy_shared' && <Share2 className="w-4 h-4 text-purple-500" />}
                            {metric.type.includes('download') && <Download className="w-4 h-4 text-indigo-500" />}
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-900 uppercase">{metric.type.replace('_', ' ')}</p>
                            <p className="text-[10px] font-bold text-slate-400">{metric.email}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-slate-300">
                          {metric.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'bi' ? (
            <div className="space-y-8 md:space-y-12 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Industry Trends */}
                <div className="bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] shadow-xl border border-slate-100 h-[400px] md:h-[450px] flex flex-col">
                  <div className="flex items-center gap-4 mb-6 md:mb-8">
                    <div className="p-3 bg-blue-50 rounded-2xl">
                      <BarChart3 className="w-5 md:w-6 h-5 md:h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight">Ventas x Industria</h3>
                      <p className="text-[10px] md:text-xs font-bold text-slate-400">Marketing Target</p>
                    </div>
                  </div>
                  <div className="flex-1 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={Object.entries(metrics.reduce((acc: any, m) => {
                        if ((m.type === 'strategy_generated' || m.type === 'catalog_viewed') && m.details?.industry) {
                          acc[m.details.industry] = (acc[m.details.industry] || 0) + 1;
                        }
                        return acc;
                      }, {})).map(([name, value]) => ({ name, value })).sort((a: any, b: any) => (b.value as any) - (a.value as any)).slice(0, 5)}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={80} fontSize={9} fontWeight="bold" axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#0ea5e9" radius={[0, 8, 8, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Maturity Levels */}
                <div className="bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] shadow-xl border border-slate-100 h-[400px] md:h-[450px] flex flex-col">
                  <div className="flex items-center gap-4 mb-6 md:mb-8">
                    <div className="p-3 bg-indigo-50 rounded-2xl">
                      <Activity className="w-5 md:w-6 h-5 md:h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight">Madurez</h3>
                      <p className="text-[10px] md:text-xs font-bold text-slate-400">Development Strategy</p>
                    </div>
                  </div>
                  <div className="flex-1 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={Object.entries(metrics.reduce((acc: any, m) => {
                            if (m.type === 'strategy_generated' && m.details?.depth) {
                              acc[m.details.depth] = (acc[m.details.depth] || 0) + 1;
                            }
                            return acc;
                          }, {})).map(([name, value]) => ({ name, value }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name.charAt(0)} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={window.innerWidth < 768 ? 60 : 80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {COLORS.map((color, index) => (
                            <Cell key={`cell-${index}`} fill={color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Urgent Topics / Pain Points */}
                <div className="bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] shadow-xl border border-slate-100 h-[400px] md:h-[450px] flex flex-col">
                  <div className="flex items-center gap-4 mb-6 md:mb-8">
                    <div className="p-3 bg-red-50 rounded-2xl">
                      <AlertCircle className="w-5 md:w-6 h-5 md:h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight">Dolores</h3>
                      <p className="text-[10px] md:text-xs font-bold text-slate-400">Temas Urgentes</p>
                    </div>
                  </div>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                      {/* Combine Topics and Outcomes as pain points */}
                      {Object.entries(metrics.reduce((acc: any, m) => {
                        if (m.type === 'strategy_generated' || m.type === 'catalog_viewed' || m.type === 'search_performed') {
                          const key = m.details?.topic || m.details?.title || m.details?.query;
                          if (key) acc[key] = (acc[key] || 0) + 1;
                          
                          // Also track specific outcomes if available
                          if (m.details?.outcome) {
                            const outcomeKey = `🎯 ${m.details.outcome}`;
                            // Truncate long outcomes for display
                            const shortOutcome = outcomeKey.length > 50 ? outcomeKey.substring(0, 47) + "..." : outcomeKey;
                            acc[shortOutcome] = (acc[shortOutcome] || 0) + 1;
                          }
                        }
                        return acc;
                      }, {})).map(([name, value]: any) => ({ name, value })).sort((a: any, b: any) => (b.value as any) - (a.value as any)).slice(0, 15).map((point: any, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 hover:bg-orange-50 rounded-2xl transition-colors border border-transparent hover:border-orange-100 group">
                          <span className="text-[10px] md:text-xs font-black text-slate-700 truncate mr-3 group-hover:text-orange-700">{point.name}</span>
                          <span className="text-[9px] md:text-sm font-black bg-white px-3 py-1 rounded-full border border-slate-200 text-slate-500 whitespace-nowrap">{point.value}</span>
                        </div>
                      ))}
                    </div>
                </div>
              </div>

              {/* Feed to Marketing/Sales/Dev */}
              <div className="bg-slate-900 p-8 md:p-12 rounded-[2.5rem] md:rounded-[4rem] text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-orange-500/10 blur-[60px] md:blur-[100px] rounded-full -mr-10 md:-mr-20 -mt-10 md:-mt-20"></div>
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-orange-500 rounded-lg md:rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-orange-500/20 text-xs md:text-base">M</div>
                      <h4 className="text-base md:text-lg font-black uppercase tracking-widest text-orange-500">Marketing</h4>
                    </div>
                    <p className="text-slate-400 text-[11px] md:text-sm leading-relaxed">Usa las <b>industrias predominantes</b> para segmentar campañas y crear casos de éxito específicos.</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-500 rounded-lg md:rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/20 text-xs md:text-base">S</div>
                      <h4 className="text-base md:text-lg font-black uppercase tracking-widest text-blue-500">Ventas</h4>
                    </div>
                    <p className="text-slate-400 text-[11px] md:text-sm leading-relaxed">Los <b>temas urgentes</b> son tus hooks de preventa. Enfócate en soluciones que resuelven dolores inmediatos.</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-500 rounded-lg md:rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-indigo-500/20 text-xs md:text-base">D</div>
                      <h4 className="text-base md:text-lg font-black uppercase tracking-widest text-indigo-500">Desarrollo</h4>
                    </div>
                    <p className="text-slate-400 text-[11px] md:text-sm leading-relaxed">El <b>nivel de madurez</b> dicta la complejidad técnica. Ajusta el roadmap según la demanda técnica real.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'proposals' ? (
            <div className="space-y-8 animate-fade-in">
              {!selectedUser ? (
                /* User List View */
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-4">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Usuarios Registrados</h3>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{Object.keys(groupedProposals).length} Clientes activos</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.values(groupedProposals).length === 0 ? (
                      <div className="col-span-full bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-slate-100">
                        <p className="text-slate-400 font-bold">No hay propuestas guardadas aún.</p>
                      </div>
                    ) : (
                      Object.values(groupedProposals).map((u: any) => (
                        <div 
                          key={u.email} 
                          onClick={() => setSelectedUser(u.email)}
                          className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 hover:border-orange-500 transition-all cursor-pointer group flex flex-col items-center text-center"
                        >
                          <div className="w-20 h-20 rounded-3xl overflow-hidden bg-slate-100 mb-6 border-4 border-white shadow-lg group-hover:scale-105 transition-transform">
                            {u.photo ? (
                              <img src={u.photo} alt={u.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-orange-100 text-orange-600 text-2xl font-black">
                                {u.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <h4 className="font-black text-slate-900 truncate w-full">{u.name}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 mb-4 truncate w-full px-4">{u.email}</p>
                          <div className="mt-auto px-6 py-2 bg-slate-50 rounded-full text-[10px] font-black text-orange-600 uppercase tracking-widest group-hover:bg-orange-500 group-hover:text-white transition-colors">
                            {u.proposals.length} Propuestas
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                /* Specific User Proposals View */
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 p-8 rounded-[3rem] text-white">
                    <div className="flex items-center gap-6">
                      <button 
                        onClick={() => setSelectedUser(null)}
                        className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"
                      >
                        <Shield className="w-6 h-6 rotate-180 text-orange-400" />
                      </button>
                      <div>
                        <h3 className="text-2xl font-black tracking-tight">{groupedProposals[selectedUser].name}</h3>
                        <p className="text-orange-400 font-bold text-[10px] uppercase tracking-widest">{selectedUser}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteAllForUser(selectedUser)}
                      className="flex items-center justify-center gap-3 px-8 py-4 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white font-black rounded-2xl transition-all uppercase tracking-widest text-[10px] border border-red-500/20"
                    >
                      <Trash2 className="w-4 h-4" />
                      Borrar Todo el Historial
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {userProposals.map((proposal: any) => (
                      <div key={proposal.id} className="bg-white p-6 md:p-8 rounded-[2rem] shadow-xl border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-orange-200 transition-colors group">
                        <div className="flex items-center gap-6 flex-1 min-w-0">
                          <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center shrink-0 border border-orange-100">
                             <FileText className="w-6 h-6 text-orange-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-lg font-black text-slate-900 truncate mb-1 pr-4">{proposal.strategy.title}</h3>
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="text-[10px] font-bold text-slate-400 italic">
                                  {proposal.createdAt?.toDate ? proposal.createdAt.toDate().toLocaleString() : 'Reciente'}
                              </span>
                              <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tight ${
                                proposal.strategy.depth === 'Avanzado' ? 'bg-indigo-50 text-indigo-600' :
                                proposal.strategy.depth === 'Intermedio' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                              }`}>
                                Nivel {proposal.strategy.depth}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                          <button 
                            onClick={() => setSelectedProposal(proposal.strategy)}
                            className="flex-1 md:flex-none px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all flex items-center justify-center gap-2"
                          >
                            <FileText className="w-4 h-4 text-orange-500" />
                            Ver Historial
                          </button>
                          <button 
                            onClick={() => handleDeleteProposal(proposal.id)}
                            className="p-3 text-slate-300 hover:text-red-500 transition-all bg-slate-50 rounded-xl border border-transparent hover:border-red-100"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Proposal Preview Modal */}
              {selectedProposal && (
                <div className="fixed inset-0 z-[120] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-4 md:p-12 animate-fade-in overflow-y-auto">
                    <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl flex flex-col max-h-full">
                        <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center shrink-0 bg-white sticky top-0 z-10">
                            <div>
                                <h2 className="text-lg md:text-2xl font-black text-slate-900 uppercase tracking-tight">Propuesta del Cliente</h2>
                                <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Revisión de Arquitectura Académica</p>
                            </div>
                            <div className="flex items-center gap-2 md:gap-4">
                                <button 
                                  onClick={() => {
                                    if (confirm("¿Quieres cargar esta propuesta en el editor para trabajar en ella? (Se cerrará el panel)")) {
                                      (window as any).loadStrategyInApp?.(selectedProposal);
                                      onClose();
                                    }
                                  }}
                                  className="px-4 py-2 bg-orange-600 text-white rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-orange-700 transition-all flex items-center gap-2 shadow-lg shadow-orange-200"
                                >
                                  <Activity className="w-3 md:w-4 h-3 md:h-4" /> Editar en App
                                </button>
                                <button 
                                    onClick={() => setSelectedProposal(null)}
                                    className="p-2 md:p-3 hover:bg-slate-50 rounded-xl md:rounded-2xl transition-all border border-slate-100"
                                >
                                    <XCircle className="w-5 h-5 md:w-6 md:h-6 text-slate-400" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 md:p-12 custom-scrollbar">
                           <StepStrategy 
                             strategy={selectedProposal} 
                             onBack={() => setSelectedProposal(null)} 
                             onConfirm={() => {}} // Not needed for admin view
                             isLoading={false}
                           />
                        </div>
                    </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8 animate-fade-in">
              {/* Admin Management */}
              <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col md:flex-row gap-12">
                <div className="md:w-1/3 space-y-6">
                  <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center">
                    <UserPlus className="w-8 h-8 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Agregar Administrador</h3>
                    <p className="text-slate-500 font-medium text-sm mt-2">Los administradores pueden gestionar otros usuarios y ver las métricas del sistema.</p>
                  </div>
                  <form onSubmit={handleAddAdmin} className="space-y-4">
                    <input
                      type="email"
                      placeholder="correo@cademmy.com"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-orange-500 focus:bg-white transition-all outline-none font-bold"
                    />
                    <button
                      type="submit"
                      disabled={isActionLoading || !newAdminEmail.trim()}
                      className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all disabled:opacity-30 uppercase tracking-widest text-xs"
                    >
                      {isActionLoading ? 'Agregando...' : 'Dar de alta'}
                    </button>
                  </form>
                </div>

                <div className="flex-1 space-y-6">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight px-4">Administradores Delegados</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {admins.length === 0 ? (
                      <div className="p-12 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                        <p className="text-slate-400 font-bold italic">No hay administradores adicionales registrados.</p>
                      </div>
                    ) : (
                      admins.map((admin) => (
                        <div key={admin.emailId} className="bg-slate-50 p-6 rounded-[2rem] flex items-center justify-between border border-transparent hover:border-slate-200 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                              <Shield className="w-6 h-6 text-orange-500" />
                            </div>
                            <div>
                                <p className="font-black text-slate-800">{admin.email}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                  Registrado el {admin.addedAt?.toDate().toLocaleDateString()}
                                </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveAdmin(admin.emailId)}
                            className="p-3 text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      ))
                    )}
                    
                    {/* Hardcoded Bootstrap Info */}
                    <div className="p-8 border-2 border-slate-100 rounded-[2rem] bg-slate-900/5 mt-6 border-dashed">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Administradores Maestro (Bootstrap)</p>
                      <div className="flex flex-col gap-3">
                        {["gloria@cademmy.com", "gloriaalbamx@gmail.com"].map(mail => (
                          <div key={mail} className="flex items-center gap-3">
                            <CheckCircle2 className="w-4 h-4 text-orange-500" />
                            <span className="text-sm font-black text-slate-700">{mail}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-3 px-8 py-4 bg-red-50 text-red-600 rounded-2xl shadow-xl border border-red-100 animate-slide-up">
              <AlertCircle className="w-5 h-5" />
              <p className="font-black text-xs uppercase tracking-widest">{error}</p>
              <button onClick={() => setError(null)} className="ml-4 hover:scale-110 transition-transform">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          )}

      </div>
    </div>
  );
};
