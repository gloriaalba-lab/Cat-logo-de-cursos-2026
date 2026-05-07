
import React, { useState, useEffect } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface LoadingProps {
  message: string;
}

export const Loading: React.FC<LoadingProps> = ({ message }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const loadingSteps = [
    "Analizando contexto organizacional...",
    "Detectando brechas críticas...",
    "Evaluando soluciones compatibles...",
    "Priorizando impacto esperado...",
    "Generando arquitectura de solución...",
    "Finalizando propuesta estratégica..."
  ];
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep(prev => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
    }, 2500);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-10 animate-fade-in text-center max-w-xl mx-auto">
      <div className="relative">
        <div className="absolute inset-0 bg-orange-400 rounded-full opacity-20 animate-ping"></div>
        <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-2xl relative z-10 border border-slate-100 p-6">
          <Loader2 className="w-full h-full text-orange-600 animate-spin" />
        </div>
        <div className="absolute -top-2 -right-2 bg-orange-500 p-2.5 rounded-xl shadow-lg">
          <Sparkles className="w-5 h-5 text-white animate-pulse" />
        </div>
      </div>

      <div className="w-full space-y-8">
        <div className="space-y-4">
          <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
            Correlacionando variables y diseñando arquitectura de solución
          </h3>
          <div className="flex flex-col items-center gap-3">
            <div className="h-2 w-48 bg-slate-100 rounded-full overflow-hidden">
               <motion.div 
                 className="h-full bg-orange-500"
                 animate={{ width: `${((currentStep + 1) / loadingSteps.length) * 100}%` }}
                 transition={{ duration: 1 }}
               />
            </div>
            <p className="text-orange-600 font-bold text-xs tracking-[0.2em] uppercase h-4">
              {loadingSteps[currentStep]}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 py-8 border-y border-slate-100">
           <div className="flex items-center justify-center gap-4 text-slate-300">
              <div className={`w-2 h-2 rounded-full transition-all duration-500 ${currentStep >= 0 ? 'bg-orange-500 scale-125' : 'bg-slate-200'}`} />
              <div className={`w-2 h-2 rounded-full transition-all duration-500 ${currentStep >= 2 ? 'bg-orange-500 scale-125' : 'bg-slate-200'}`} />
              <div className={`w-2 h-2 rounded-full transition-all duration-500 ${currentStep >= 4 ? 'bg-orange-500 scale-125' : 'bg-slate-200'}`} />
           </div>
            <p className="text-slate-400 text-xs italic font-medium leading-relaxed px-12">
              Las recomendaciones consideran industria, tamaño organizacional y prioridades estratégicas. Estamos refinando la arquitectura ideal para tu ecosistema de capacitación...
            </p>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="w-2.5 h-2.5 bg-orange-200 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2.5 h-2.5 bg-orange-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2.5 h-2.5 bg-orange-400 rounded-full animate-bounce"></div>
      </div>
    </div>
  );
};
