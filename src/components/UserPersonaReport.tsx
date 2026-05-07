import React, { useEffect, useState } from 'react';
import { X, User, Target, AlertCircle, BookOpen, Zap, TrendingUp, Download, Loader2 } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { CourseStrategy } from '../types';

interface UserPersonaProps {
  onClose: () => void;
}

interface AggregatedData {
  totalSearches: number;
  topTopics: Record<string, number>;
  depthDistribution: Record<string, number>;
  avgDuration: string;
  commonGoals: string[];
}

export const UserPersonaReport: React.FC<UserPersonaProps> = ({ onClose }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AggregatedData | null>(null);

  useEffect(() => {
    const fetchRealData = async () => {
      try {
        const q = query(collection(db, 'saved_strategies'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const strategies = snapshot.docs.map(d => d.data().strategy) as CourseStrategy[];

        if (strategies.length === 0) {
          setStats(null);
          setLoading(false);
          return;
        }

        // Aggregate Topics
        const topics: Record<string, number> = {};
        const depths: Record<string, number> = {};
        strategies.forEach(s => {
          const title = s.title.split(' ')[0].toLowerCase();
          topics[title] = (topics[title] || 0) + 1;
          depths[s.depth] = (depths[s.depth] || 0) + 1;
        });

        setStats({
          totalSearches: strategies.length,
          topTopics: topics,
          depthDistribution: depths,
          avgDuration: "Variable",
          commonGoals: Array.from(new Set(strategies.flatMap(s => s.syllabus.slice(0, 2).map(m => m.title))))
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'saved_strategies');
      } finally {
        setLoading(false);
      }
    };

    fetchRealData();
  }, []);

  const samplePersona = {
    name: "Perfil Promedio del Buscador",
    role: "Usuario de Cademmy",
    age: "30-45 años (Est.)",
    location: "México / Latam",
    education: "Profesional / Corporativo",
    goals: stats?.commonGoals.slice(0, 4) || [
      "Digitalizar el plan de capacitación anual.",
      "Reducir el tiempo de búsqueda de proveedores.",
      "Asegurar validez oficial (DC3).",
      "Mejorar el ROI de capacitación."
    ],
    painPoints: [
      "Dificultad para encontrar cursos que se adapten a horarios híbridos.",
      "Exceso de propuestas genéricas.",
      "Procesos lentos de diseño instruccional.",
      "Falta de claridad en niveles de profundidad."
    ],
    learningStyles: [
      "Aprendizaje Activo",
      "Micro-learning",
      "Basado en Proyectos"
    ],
    motivations: [
      `Volumen de búsqueda: ${stats?.totalSearches || 0} arquitecturas generadas`,
      `Nivel preferido: ${Object.entries(stats?.depthDistribution || {}).sort((a,b) => b[1]-a[1])[0]?.[0] || 'Intermedio'}`,
      "Eficiencia operativa: Soluciones 'llave en mano'."
    ]
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-fade-in">
      <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl animate-scale-in flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Insights: Reporte de Usuario</h2>
              <p className="text-slate-500 font-medium text-sm">Perfil del Buscador de Cursos Cademmy 2026</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.print()}
              className="p-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest shadow-sm"
            >
              <Download className="w-4 h-4" /> Exportar
            </button>
            <button 
              onClick={onClose}
              className="p-3 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-12 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
              <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Analizando búsquedas reales...</p>
            </div>
          ) : (
            <>
              {/* Persona Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Sidebar: Demographics */}
            <div className="space-y-6">
              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-orange-500/20 transition-all" />
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-4 border border-white/20">
                    <User className="w-12 h-12 text-orange-400" />
                  </div>
                  <h3 className="text-xl font-black mb-1">{samplePersona.name}</h3>
                  <p className="text-orange-400 text-xs font-black uppercase tracking-widest mb-6">{samplePersona.role}</p>
                  
                  <div className="w-full space-y-4 text-left border-t border-white/10 pt-6">
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Edad</p>
                      <p className="text-sm font-bold">{samplePersona.age}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Ubicación</p>
                      <p className="text-sm font-bold">{samplePersona.location}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Educación</p>
                      <p className="text-sm font-bold">{samplePersona.education}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-100 rounded-[2rem] p-8 space-y-4">
                <h4 className="text-xs font-black text-orange-600 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Motivaciones
                </h4>
                <ul className="space-y-3">
                  {samplePersona.motivations.map((m, i) => (
                    <li key={i} className="text-xs font-bold text-slate-700 leading-relaxed flex gap-2">
                      <span className="text-orange-500">•</span> {m}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Main Content: Goals & Pain Points */}
            <div className="md:col-span-2 space-y-8">
              
              {/* Goals */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-500" /> Objetivos de Aprendizaje y Negocio
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {samplePersona.goals.map((goal, i) => (
                    <div key={i} className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all">
                      <p className="text-sm font-bold text-slate-600 leading-relaxed">{goal}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pain Points */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" /> Puntos de Dolor (Frustraciones)
                </h4>
                <div className="bg-red-50/30 border border-red-100 rounded-[2rem] p-8 space-y-4">
                  {samplePersona.painPoints.map((point, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0" />
                      <p className="text-sm font-bold text-slate-700 leading-relaxed">{point}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Learning Styles */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-500" /> Estilos de Aprendizaje Preferidos
                </h4>
                <div className="flex flex-wrap gap-3">
                  {samplePersona.learningStyles.map((style, i) => (
                    <span key={i} className="px-6 py-3 bg-blue-50 text-blue-700 rounded-xl text-xs font-black uppercase tracking-widest border border-blue-100">
                      {style}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Template Section */}
          <div className="pt-12 border-t border-slate-100">
            <div className="bg-slate-50 rounded-[3rem] p-10 border border-slate-200 border-dashed">
              <div className="text-center mb-8">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Plantilla de User Persona</h3>
                <p className="text-slate-500 text-sm">Utiliza este esquema para definir nuevos perfiles de usuario</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60">
                <div className="p-6 bg-white border border-slate-200 rounded-2xl border-dashed">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Demografía</p>
                  <div className="h-4 w-3/4 bg-slate-100 rounded mb-2" />
                  <div className="h-4 w-1/2 bg-slate-100 rounded" />
                </div>
                <div className="p-6 bg-white border border-slate-200 rounded-2xl border-dashed">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Metas</p>
                  <div className="h-4 w-full bg-slate-100 rounded mb-2" />
                  <div className="h-4 w-full bg-slate-100 rounded" />
                </div>
                <div className="p-6 bg-white border border-slate-200 rounded-2xl border-dashed">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Frustraciones</p>
                  <div className="h-4 w-full bg-slate-100 rounded mb-2" />
                  <div className="h-4 w-full bg-slate-100 rounded" />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
            Reporte Generado por Cademmy Mentor • Inteligencia de Usuario 2026
          </p>
        </div>
      </div>
    </div>
  );
};
