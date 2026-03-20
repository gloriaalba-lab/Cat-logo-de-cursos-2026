
import React, { useEffect, useState } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { CourseStrategy } from '../types';
import { Trash2, ExternalLink, Clock, BookOpen, ChevronRight, X, History as HistoryIcon, RotateCcw } from 'lucide-react';

interface SavedStrategyDoc {
  id: string;
  strategy: CourseStrategy;
  createdAt: any;
}

interface SavedStrategiesListProps {
  onLoad: (strategy: CourseStrategy, id?: string) => void;
  onClose: () => void;
}

interface StrategyVersion {
  id: string;
  strategy: CourseStrategy;
  createdAt: any;
}

export const SavedStrategiesList: React.FC<SavedStrategiesListProps> = ({ onLoad, onClose }) => {
  const [strategies, setStrategies] = useState<SavedStrategyDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [versions, setVersions] = useState<Record<string, StrategyVersion[]>>({});
  const [loadingVersions, setLoadingVersions] = useState<string | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'saved_strategies'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as SavedStrategyDoc[];
      setStrategies(docs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'saved_strategies');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
  };

  const confirmDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'saved_strategies', id));
      setDeletingId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `saved_strategies/${id}`);
    }
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(null);
  };

  const toggleVersions = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(id);
    if (!versions[id]) {
      setLoadingVersions(id);
      try {
        const q = query(
          collection(db, 'saved_strategies', id, 'versions'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const versionDocs = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        })) as StrategyVersion[];
        setVersions(prev => ({ ...prev, [id]: versionDocs }));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, `saved_strategies/${id}/versions`);
      } finally {
        setLoadingVersions(null);
      }
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Reciente';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight italic">Cursos de mi <span className="text-orange-500 not-italic">interés</span></h2>
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-1">Historial de cursos y arquitecturas guardadas</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Cargando historial...</p>
            </div>
          ) : strategies.length === 0 ? (
            <div className="text-center py-20 px-10">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <BookOpen className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-800 font-black text-lg mb-2">No tienes cursos de tu interés guardados</p>
              <p className="text-slate-500 text-sm font-medium">Las arquitecturas que guardes aparecerán aquí para que puedas retomarlas en cualquier momento.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {strategies.map((item) => (
                <div 
                  key={item.id}
                  className="group bg-white border border-slate-100 rounded-3xl hover:border-orange-200 hover:shadow-md transition-all relative overflow-hidden"
                >
                  <div 
                    onClick={() => onLoad(item.strategy, item.id)}
                    className="p-6 cursor-pointer relative"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-slate-100 group-hover:bg-orange-500 transition-colors" />
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-black text-slate-800 group-hover:text-orange-600 transition-colors line-clamp-1">{item.strategy.title}</h3>
                        <div className="flex flex-wrap gap-3 mt-3">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                            <Clock className="w-3.5 h-3.5" /> {item.strategy.totalDuration}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                            <BookOpen className="w-3.5 h-3.5" /> {item.strategy.syllabus.length} Módulos
                          </div>
                          <div className="text-[10px] font-black text-orange-500 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">
                            NIVEL {item.strategy.depth.toUpperCase()}
                          </div>
                          <div className="text-[10px] font-bold text-slate-300 italic">
                            {formatDate(item.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={(e) => toggleVersions(item.id, e)}
                          className={`p-2 rounded-xl transition-all ${expandedId === item.id ? 'bg-orange-50 text-orange-500' : 'text-slate-300 hover:text-orange-500 hover:bg-orange-50'}`}
                          title="Ver historial de versiones"
                        >
                          <HistoryIcon className="w-4 h-4" />
                        </button>
                        {deletingId === item.id ? (
                          <div className="flex items-center gap-2 animate-scale-in">
                            <button 
                              onClick={(e) => confirmDelete(item.id, e)}
                              className="px-3 py-1.5 bg-red-500 text-white text-[9px] font-black uppercase rounded-lg hover:bg-red-600 transition-colors"
                            >
                              Sí
                            </button>
                            <button 
                              onClick={cancelDelete}
                              className="px-3 py-1.5 bg-slate-100 text-slate-500 text-[9px] font-black uppercase rounded-lg hover:bg-slate-200 transition-colors"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <>
                            <button 
                              onClick={(e) => handleDelete(item.id, e)}
                              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="p-2 text-slate-300 group-hover:text-orange-500 transition-colors">
                              <ChevronRight className="w-5 h-5" />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {expandedId === item.id && (
                    <div className="px-6 pb-6 pt-2 border-t border-slate-50 bg-slate-50/30 animate-fade-in">
                      <div className="space-y-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Historial de Versiones</p>
                        {loadingVersions === item.id ? (
                          <div className="flex items-center gap-2 py-2">
                            <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-[10px] font-bold text-slate-400">Cargando versiones...</span>
                          </div>
                        ) : versions[item.id]?.length === 0 ? (
                          <p className="text-[10px] font-medium text-slate-400 italic">No hay versiones anteriores.</p>
                        ) : (
                          versions[item.id]?.map((v, idx) => (
                            <div 
                              key={v.id}
                              className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-2xl hover:border-orange-200 transition-all group/version"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[9px] font-black text-slate-400">
                                  {versions[item.id].length - idx}
                                </div>
                                <div>
                                  <p className="text-[11px] font-bold text-slate-700">{formatDate(v.createdAt)}</p>
                                  <p className="text-[9px] text-slate-400 font-medium">{v.strategy.syllabus.length} Módulos • {v.strategy.totalDuration}</p>
                                </div>
                              </div>
                              <button 
                                onClick={() => onLoad(v.strategy, item.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all opacity-0 group-hover/version:opacity-100"
                              >
                                <RotateCcw className="w-3 h-3" /> Revertir
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col items-center gap-4">
          <button
            onClick={onClose}
            className="group flex items-center gap-2 text-xs font-black text-slate-400 hover:text-orange-600 uppercase tracking-widest transition-all"
          >
            <RotateCcw className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
            Regresar al inicio
          </button>
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">cademmy learning SAS • Propiedad Intelectual Protegida</p>
        </div>
      </div>
    </div>
  );
};
