
import React, { useState } from 'react';
import { Logo } from './Logo';
import { Course, CourseModule } from '../types';
import ReactMarkdown from 'react-markdown';
import { 
  CheckCircle2, BookOpen, Clock, Users, Target, Layers, Play, Info, Award, 
  Home, Image as ImageIcon, Book, BrainCircuit, ListChecks, HelpCircle, 
  Lightbulb, ChevronRight, AlertCircle, FileText, Mail, Send, Sparkles, ArrowRight,
  Cloud
} from 'lucide-react';
import { CloudConnect } from './CloudConnect';

interface StepCourseProps {
  course: Course;
  onBackToVariations: () => void;
  onRestart: () => void;
}

type TabType = 'LECTURA' | 'ACTIVIDADES' | 'CASOS' | 'PROPUESTA';

export const StepCourse: React.FC<StepCourseProps> = ({ course, onBackToVariations, onRestart }) => {
  const [activeModuleIndex, setActiveModuleIndex] = useState(-1);
  const [activeTab, setActiveTab] = useState<TabType>('LECTURA');
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);

  const cleanModuleTitle = (title: string) => {
    return title.replace(/^Módulo\s+\d+[:\s-]*/i, '').trim();
  };

  const isOverview = activeModuleIndex === -1;
  const activeModule = !isOverview ? course.modules[activeModuleIndex] : null;

  const PRICE_PER_HOUR = 1990;
  const totalHours = course.modules.reduce((acc, m) => acc + m.hours, 0);
  const totalInvestment = totalHours * PRICE_PER_HOUR;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleSendProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSent(true);
      setTimeout(() => {
        alert(`Propuesta enviada a: ${email}. El Director recibirá el PDF formal con la inversión de ${formatCurrency(totalInvestment)} MXN en breve.`);
      }, 500);
    }
  };

  const handleSaveToCloud = async (provider: 'google' | 'onedrive') => {
    try {
      const res = await fetch('/api/save-to-cloud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, courseData: course })
      });
      const data = await res.json();
      if (data.success) {
        alert(`¡Éxito! El curso "${course.title}" se ha guardado en tu ${provider === 'google' ? 'Google Drive' : 'OneDrive'}.`);
      }
    } catch (e) {
      alert("Error al guardar en la nube");
    }
  };

  const renderActivities = (module: CourseModule) => (
    <div className="space-y-16 animate-fade-in">
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-orange-100 rounded-lg text-orange-600"><ListChecks className="w-6 h-6" /></div>
          <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Actividad: Relacionar Columnas</h3>
        </div>
        <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-8 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Columna A: Términos</p>
              <ul className="space-y-3">
                {module.matchingActivity.map((m, i) => (
                  <li key={i} className="p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 shadow-sm flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">{i+1}</span>
                    {m.term}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-8">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Columna B: Definiciones</p>
              <ul className="space-y-3">
                {[...module.matchingActivity].sort(() => Math.random() - 0.5).map((m, i) => (
                  <li key={i} className="p-3 bg-orange-50/30 border border-orange-100 rounded-xl text-sm font-medium text-slate-600 flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full border border-orange-200 text-orange-400 flex items-center justify-center text-[10px] uppercase font-black">{String.fromCharCode(65 + i)}</span>
                    {m.definition}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="bg-slate-900 p-4 text-center">
            <p className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em]">Instrucción: Identifica el concepto que corresponde a cada definición para validar tu comprensión técnica.</p>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><HelpCircle className="w-6 h-6" /></div>
          <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Cademmy Mastery Quiz</h3>
        </div>
        <div className="space-y-6">
          {module.quiz.map((q, i) => (
            <div key={i} className="p-8 bg-white border border-slate-200 rounded-[2rem] shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start gap-4 mb-6">
                <span className="text-4xl font-black text-slate-100">{i+1}</span>
                <p className="text-lg font-bold text-slate-800 leading-tight pt-2">{q.question}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-12">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="p-4 border border-slate-100 rounded-xl text-sm font-medium text-slate-500 hover:border-orange-500 hover:text-orange-600 transition-colors cursor-pointer bg-slate-50/50">
                    <span className="font-black mr-2 opacity-50">{String.fromCharCode(97 + oi)})</span> {opt}
                  </div>
                ))}
              </div>
              <details className="mt-8 group">
                <summary className="list-none flex items-center gap-2 text-xs font-black text-emerald-600 cursor-pointer uppercase tracking-widest hover:underline">
                  <CheckCircle2 className="w-4 h-4" /> Revelar Respuesta y Feedback
                </summary>
                <div className="mt-4 p-6 bg-emerald-50 rounded-2xl border border-emerald-100 animate-scale-in">
                  <p className="text-sm font-black text-emerald-800 mb-2">Respuesta Correcta: {q.options[q.correctAnswer]}</p>
                  <p className="text-sm text-emerald-700 leading-relaxed font-medium">{q.explanation}</p>
                </div>
              </details>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  const renderCases = (module: CourseModule) => (
    <div className="space-y-12 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><BrainCircuit className="w-6 h-6" /></div>
        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Casos de Razonamiento Crítico</h3>
      </div>
      {module.cases.map((c, i) => (
        <div key={i} className="bg-white border-2 border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
          <div className="p-8 bg-slate-900 text-white">
            <span className="inline-block px-3 py-1 bg-orange-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4">Caso de Estudio {i+1}</span>
            <div className="prose prose-invert max-w-none">
              <p className="text-lg font-bold leading-relaxed">{c.scenario}</p>
            </div>
          </div>
          <div className="p-10">
            <h4 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
              <Lightbulb className="w-6 h-6 text-orange-500" /> El Dilema Estratégico
            </h4>
            <p className="text-base font-bold text-slate-700 mb-8">{c.question}</p>
            <div className="grid grid-cols-1 gap-4 mb-10">
              {c.options.map((opt, oi) => (
                <button key={oi} className="w-full text-left p-5 border-2 border-slate-50 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group">
                  <div className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-black text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">{String.fromCharCode(65 + oi)}</span>
                    <span className="text-sm font-bold text-slate-600 group-hover:text-indigo-900">{opt}</span>
                  </div>
                </button>
              ))}
            </div>
            <details className="group">
              <summary className="list-none flex items-center justify-center gap-2 py-4 bg-slate-50 rounded-xl text-xs font-black text-slate-400 cursor-pointer uppercase tracking-widest hover:bg-slate-100 transition-all">
                Ver Análisis del Consultor <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
              </summary>
              <div className="mt-6 p-8 bg-orange-50 rounded-3xl border border-orange-100 animate-scale-in">
                <p className="text-lg font-black text-orange-900 mb-3">{c.options[c.correctAnswer]}</p>
                <p className="text-sm text-orange-800 leading-relaxed font-medium">{c.explanation}</p>
              </div>
            </details>
          </div>
        </div>
      ))}
    </div>
  );

  const renderProposalClose = () => (
    <div className="max-w-3xl mx-auto space-y-12 py-12 animate-fade-in text-center">
      <div className="w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-orange-200">
        <Send className="w-12 h-12 text-white" />
      </div>
      
      <div className="space-y-6">
        <h2 className="text-4xl font-black text-slate-900 leading-tight">Excelente. Ya tengo la estructura técnica.</h2>
        <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
          Voy a generar la <span className="text-orange-600 font-bold">Propuesta Técnica</span> y el <span className="text-orange-600 font-bold">Cronograma de Desarrollo</span> en un PDF formal.
        </p>
        <div className="inline-block px-8 py-4 bg-orange-50 border-2 border-orange-100 rounded-2xl">
          <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Inversión Total Estimada</p>
          <p className="text-3xl font-black text-orange-600">{formatCurrency(totalInvestment)}</p>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl space-y-8">
        <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">¿A qué correo lo envío para su aprobación?</h3>
        
        {!isSent ? (
          <form onSubmit={handleSendProposal} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@empresa.com"
                className="w-full pl-16 pr-6 py-6 rounded-2xl border-2 border-slate-100 focus:border-orange-500 outline-none transition-all font-bold text-xl text-slate-700 shadow-sm"
              />
            </div>
            <button 
              type="submit"
              className="w-full py-6 bg-slate-900 text-white text-xl font-black rounded-2xl hover:bg-black transition-all shadow-xl flex items-center justify-center gap-4 hover:scale-[1.02]"
            >
              SOLICITAR PROPUESTA FORMAL
              <Sparkles className="w-6 h-6 text-orange-400" />
            </button>
          </form>
        ) : (
          <div className="p-10 bg-emerald-50 border border-emerald-100 rounded-3xl animate-scale-in">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <p className="text-2xl font-black text-emerald-900 mb-2">¡Todo Listo!</p>
            <p className="text-emerald-700 font-bold">Hemos agendado el envío de la propuesta comercial a <strong>{email}</strong>.</p>
            <button onClick={() => setIsSent(false)} className="mt-6 text-emerald-600 font-black text-xs uppercase underline tracking-widest">Cambiar correo</button>
          </div>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-100"></span>
          </div>
          <div className="relative flex justify-center text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
            <span className="bg-white px-8">O guarda en tu nube</span>
          </div>
        </div>

        <CloudConnect onSave={handleSaveToCloud} />
      </div>

      <div className="pt-10">
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em]">Cademmy Learning SAS • Fábrica de Contenidos a Medida (72h)</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 h-auto md:h-[calc(100vh-5rem)] flex flex-col md:flex-row gap-6 animate-fade-in no-print font-['Montserrat']">
      
      <div className="w-full md:w-1/4 flex-shrink-0 flex flex-col h-full overflow-hidden">
        <div className="flex flex-col bg-white rounded-[2rem] shadow-sm border border-slate-200 h-full overflow-hidden">
            <div className="p-6 border-b border-slate-100">
                <button 
                  onClick={onBackToVariations}
                  className="group flex items-center gap-2 text-[10px] font-black text-orange-600 uppercase tracking-widest hover:translate-x-[-4px] transition-all"
                >
                  <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                  Regresar a la arquitectura
                </button>
            </div>
            <div className="p-8 pb-4 border-b border-slate-100">
                <h1 className="text-xl font-black text-slate-900 leading-tight mb-3">
                {course.title}
                </h1>
                <div className="flex items-center gap-2">
                    <span className="bg-orange-50 text-orange-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-orange-100">
                        Arquitectura de Solución
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
                <nav className="space-y-3">
                    <button
                        onClick={() => setActiveModuleIndex(-1)}
                        className={`w-full text-left p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${
                            isOverview && activeTab !== 'PROPUESTA' ? 'bg-orange-500 text-white shadow-lg shadow-orange-100' : 'text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                        <Info className="w-5 h-5" /> Información General
                    </button>

                    {course.modules.map((mod, idx) => (
                        <button
                            key={idx}
                            onClick={() => { setActiveModuleIndex(idx); setActiveTab('LECTURA'); }}
                            className={`w-full text-left p-4 rounded-2xl text-sm font-bold transition-all flex items-start gap-3 ${
                                activeModuleIndex === idx ? 'bg-orange-500 text-white shadow-lg shadow-orange-100' : 'text-slate-500 hover:bg-slate-50'
                            }`}
                        >
                            <span className={`flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full text-[10px] border ${activeModuleIndex === idx ? 'border-white/40' : 'border-slate-300'}`}>
                                {idx + 1}
                            </span>
                            <span className="line-clamp-2">{cleanModuleTitle(mod.title)}</span>
                        </button>
                    ))}

                    <div className="pt-4 border-t border-slate-50">
                        <button
                            onClick={() => { setActiveModuleIndex(-1); setActiveTab('PROPUESTA'); }}
                            className={`w-full text-left p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${
                                activeTab === 'PROPUESTA' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                            }`}
                        >
                            <Award className="w-5 h-5" /> Finalizar y Solicitar Propuesta
                        </button>
                    </div>
                </nav>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-3">
              <button 
                onClick={onRestart} 
                className="w-full py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm"
              >
                <ArrowRight className="w-4 h-4 rotate-180 text-orange-500" /> Regresar y Editar Datos
              </button>
            </div>
          </div>
      </div>

      <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden">
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 h-full flex flex-col overflow-hidden relative">
          
          {!isOverview && (
            <div className="flex items-center gap-2 p-2 bg-slate-50/80 border-b border-slate-100">
              {(['LECTURA', 'ACTIVIDADES', 'CASOS'] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                    activeTab === tab 
                    ? 'bg-white text-orange-600 shadow-sm border border-orange-100' 
                    : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab === 'LECTURA' && <FileText className="w-4 h-4" />}
                  {tab === 'ACTIVIDADES' && <ListChecks className="w-4 h-4" />}
                  {tab === 'CASOS' && <BrainCircuit className="w-4 h-4" />}
                  {tab}
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12">
             
             {isOverview ? (
                activeTab === 'PROPUESTA' ? renderProposalClose() : (
                    <div className="max-w-4xl mx-auto space-y-12 pb-20 animate-fade-in">
                        <div className="text-center">
                            <button 
                                onClick={onRestart}
                                className="hover:opacity-80 transition-opacity cursor-pointer"
                                title="Ir al inicio"
                            >
                                <Logo className="mb-12" size={120} vertical />
                            </button>
                            <span className="text-[10px] font-black text-orange-600 uppercase tracking-[0.3em] mb-4 block">Catálogo de cursos 2026</span>
                            <h1 className="text-5xl font-black text-slate-900 mb-8 leading-tight tracking-tighter">{course.title}</h1>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 text-center shadow-xl">
                                <Award className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                                <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Garantía</span>
                                <span className="text-xl font-black text-white">72 Horas</span>
                            </div>
                            <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100 text-center">
                                <BookOpen className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                                <span className="block text-[10px] font-black text-emerald-400 uppercase tracking-widest">Nivel</span>
                                <span className="text-sm font-black text-emerald-700">Magistral Cademmy</span>
                            </div>
                        </div>

                        <div className="space-y-10">
                            <section>
                                <h3 className="flex items-center gap-3 text-2xl font-black text-slate-800 mb-4 uppercase tracking-tight">
                                    <Target className="w-7 h-7 text-red-500" /> Propuesta de Valor
                                </h3>
                                <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] text-white leading-relaxed text-lg font-bold shadow-xl text-center italic">
                                    "{course.generalObjective}"
                                </div>
                            </section>

                            {course.particularObjectives && course.particularObjectives.length > 0 && (
                                <section>
                                    <h3 className="flex items-center gap-3 text-2xl font-black text-slate-800 mb-4 uppercase tracking-tight">
                                        <Layers className="w-7 h-7 text-orange-500" /> Objetivos Particulares
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        {course.particularObjectives.map((obj, i) => (
                                            <div key={i} className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-start gap-4">
                                                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0 text-orange-600 font-black text-xs">
                                                    {i + 1}
                                                </div>
                                                <p className="text-slate-700 font-bold leading-relaxed">{obj}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>

                        <div className="pt-10 flex flex-col md:flex-row justify-center gap-4">
                            <button onClick={onRestart} className="px-12 py-5 bg-white border-2 border-slate-200 text-slate-600 text-xl font-black rounded-3xl shadow-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-4">
                                <ArrowRight className="w-6 h-6 rotate-180 text-orange-500" /> REGRESAR Y EDITAR
                            </button>
                            <button onClick={() => { setActiveModuleIndex(0); setActiveTab('LECTURA'); }} className="px-12 py-5 bg-orange-600 text-white text-xl font-black rounded-3xl shadow-2xl shadow-orange-100 hover:scale-105 transition-all flex items-center justify-center gap-4">
                                REVISAR TEMARIO <Play className="w-6 h-6 fill-current" />
                            </button>
                            <button onClick={() => setActiveTab('PROPUESTA')} className="px-12 py-5 bg-slate-900 text-white text-xl font-black rounded-3xl shadow-2xl shadow-slate-100 hover:scale-105 transition-all flex items-center justify-center gap-4 text-center">
                                <div>
                                   <span className="block text-[10px] text-orange-400 uppercase tracking-widest mb-1">Inversión: {formatCurrency(totalInvestment)}</span>
                                   ESTÁ PERFECTO <CheckCircle2 className="w-6 h-6 text-orange-500 inline-block ml-2" />
                                </div>
                            </button>
                        </div>
                    </div>
                )
             ) : (
                <div className="animate-fade-in max-w-4xl mx-auto pb-20">
                    
                    {activeTab === 'LECTURA' && (
                      <>
                        <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-100 pb-8 gap-4">
                            <div>
                                <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em] block mb-2">Unidad de Diseño {activeModuleIndex + 1}</span>
                                <h2 className="text-4xl font-black text-slate-900 leading-tight tracking-tight">{cleanModuleTitle(activeModule!.title)}</h2>
                            </div>
                            <div className="text-right whitespace-nowrap">
                                <span className="text-lg font-black text-slate-400">{activeModule!.hours} Horas Lectivas</span>
                            </div>
                        </div>

                        {activeModule!.imageUrl && (
                          <div className="mb-12 rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white">
                            <img src={activeModule!.imageUrl} alt={activeModule!.title} className="w-full h-auto object-cover max-h-[400px]" />
                            <div className="bg-slate-900 p-4 text-center">
                              <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest flex items-center justify-center gap-2">
                                Conceptualización Visual Cademmy Solutions
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="prose prose-slate max-w-none 
                            prose-h1:text-3xl prose-h1:font-black prose-p:text-slate-600 prose-p:leading-relaxed prose-p:text-lg">
                            <ReactMarkdown>{activeModule!.content}</ReactMarkdown>
                        </div>
                        
                        <div className="mt-12 p-8 bg-orange-600 text-white rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-orange-100">
                           <div className="flex items-center gap-4">
                              <div className="p-3 bg-white/20 rounded-2xl"><ListChecks className="w-8 h-8" /></div>
                              <div>
                                 <p className="text-xl font-black leading-none">Validación Técnica</p>
                                 <p className="text-xs font-bold text-orange-100 uppercase tracking-widest mt-2">Relación de conceptos y Quizzes del módulo</p>
                              </div>
                           </div>
                           <button onClick={() => setActiveTab('ACTIVIDADES')} className="px-8 py-4 bg-white text-orange-600 font-black rounded-xl hover:bg-orange-50 transition-all uppercase text-xs tracking-widest">
                              VER ACTIVIDADES
                           </button>
                        </div>
                      </>
                    )}

                    {activeTab === 'ACTIVIDADES' && renderActivities(activeModule!)}
                    {activeTab === 'CASOS' && renderCases(activeModule!)}

                    <div className="mt-12 flex flex-col items-center gap-6 border-t border-slate-100 pt-10">
                      <div className="flex justify-between items-center w-full">
                        {activeModuleIndex > 0 && (
                          <button 
                            onClick={() => { setActiveModuleIndex(activeModuleIndex - 1); setActiveTab('LECTURA'); }}
                            className="px-6 py-3 border border-slate-200 rounded-xl font-black text-xs text-slate-500 hover:bg-slate-50 transition-all uppercase tracking-widest"
                          >
                            ← Módulo Anterior
                          </button>
                        )}
                        {activeModuleIndex < course.modules.length - 1 ? (
                          <button 
                            onClick={() => { setActiveModuleIndex(activeModuleIndex + 1); setActiveTab('LECTURA'); }}
                            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-xs hover:bg-black transition-all uppercase tracking-widest ml-auto"
                          >
                            Siguiente Módulo →
                          </button>
                        ) : (
                          <button 
                            onClick={() => { setActiveModuleIndex(-1); setActiveTab('PROPUESTA'); }}
                            className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs hover:bg-emerald-700 transition-all uppercase tracking-widest ml-auto flex items-center gap-2"
                          >
                            Finalizar Revisión <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <button
                        onClick={onBackToVariations}
                        className="group flex items-center gap-2 text-xs font-black text-slate-400 hover:text-orange-600 uppercase tracking-widest transition-all"
                      >
                        <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                        Regresar a la arquitectura
                      </button>
                    </div>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
