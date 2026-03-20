
import React, { useState } from 'react';
import { Pillar } from '../types';
import { ArrowRight, Layers, Edit3, X, Sparkles, PlusCircle, Clock, Target } from 'lucide-react';

interface StepPillarsProps {
  topic: string;
  pillars: Pillar[];
  onSelectPillar: (pillar: Pillar, customNotes?: string) => void;
  onBack: () => void;
}

export const StepPillars: React.FC<StepPillarsProps> = ({ topic, pillars, onSelectPillar, onBack }) => {
  const [editingPillar, setEditingPillar] = useState<Pillar | null>(null);
  const [customNotes, setCustomNotes] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedHours, setEditedHours] = useState(0);

  const totalHours = pillars.reduce((sum, p) => sum + p.hours, 0);

  const handleOpenEdit = (pillar: Pillar) => {
    setEditingPillar(pillar);
    setEditedTitle(pillar.title);
    setEditedDescription(pillar.description);
    setEditedHours(pillar.hours);
    setCustomNotes('');
  };

  const handleConfirmCustom = () => {
    if (editingPillar) {
      const updatedPillar = {
        ...editingPillar,
        title: editedTitle,
        description: editedDescription,
        hours: editedHours
      };
      onSelectPillar(updatedPillar, customNotes);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in-up">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <button onClick={onBack} className="text-slate-400 hover:text-slate-600 text-sm mb-4 transition-colors">
            ← Reajustar Parámetros de Consultoría
          </button>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800">
            Estructura del <span className="text-blue-600">Syllabus Maestro</span>
          </h2>
          <p className="text-slate-500 mt-2 text-lg">
            Temario propuesto para <span className="font-bold text-slate-700 italic">"{topic}"</span>. 
            Carga total estimada: <span className="text-indigo-600 font-bold underline">{totalHours} Horas</span>.
          </p>
        </div>
        <button 
          onClick={() => handleOpenEdit({ id: 'new', title: 'Nuevo Módulo', description: '', hours: 2, moduleObjective: '' })}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-sm border border-indigo-100 hover:bg-indigo-100 transition-all shadow-sm"
        >
          <PlusCircle className="w-5 h-5" /> Añadir Módulo Extra
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pillars.map((pillar, idx) => (
          <div
            key={pillar.id}
            className="group bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-2xl transition-all duration-300 relative overflow-hidden flex flex-col"
          >
            <div className="p-7 flex-1">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                        Módulo {idx + 1}
                    </div>
                    <div className="flex items-center gap-1.5 text-indigo-600 font-bold text-sm bg-indigo-50 px-3 py-1 rounded-full">
                        <Clock className="w-4 h-4" /> {pillar.hours}h
                    </div>
                </div>
                
                <h3 className="text-xl font-bold text-slate-800 mb-3 leading-snug group-hover:text-blue-700">
                    {pillar.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-3">
                    {pillar.description}
                </p>
                
                <div className="flex items-center justify-between mt-auto">
                    <button 
                        onClick={() => handleOpenEdit(pillar)}
                        className="text-indigo-600 text-xs font-bold hover:underline flex items-center gap-1"
                    >
                        <Edit3 className="w-3.5 h-3.5" /> Personalizar Módulo
                    </button>
                </div>
            </div>

            <button 
                onClick={() => onSelectPillar(pillar)}
                className="w-full py-5 px-6 bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-700 text-xs font-extrabold border-t border-slate-100 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
            >
                Validar y Ver Ángulos <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {editingPillar && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-2xl font-black text-slate-800">Ajuste de Módulo</h3>
              <button onClick={() => setEditingPillar(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-8 h-8" />
              </button>
            </div>

            <div className="p-10 space-y-8">
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase">Nombre del Módulo</label>
                    <input type="text" value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none font-bold" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase">Horas</label>
                    <input type="number" value={editedHours} onChange={(e) => setEditedHours(Number(e.target.value))} className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none font-bold text-center" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase">Temas a Cubrir</label>
                <textarea value={editedDescription} onChange={(e) => setEditedDescription(e.target.value)} className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none h-24 resize-none" />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-indigo-400 uppercase flex items-center gap-1">
                   <Sparkles className="w-3.5 h-3.5" /> Instrucciones para el Mentor
                </label>
                <textarea value={customNotes} onChange={(e) => setCustomNotes(e.target.value)} placeholder="Ej: 'Añade un caso práctico de la empresa X', 'Enfócate en gobernanza'..." className="w-full px-5 py-4 rounded-2xl border-2 border-indigo-50 bg-indigo-50/20 focus:bg-white focus:border-indigo-500 outline-none h-28 resize-none" />
              </div>

              <button onClick={handleConfirmCustom} className="w-full py-5 bg-indigo-600 text-white font-black text-lg rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all">
                GUARDAR Y GENERAR VARIACIONES
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
