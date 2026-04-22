
import React, { useState, useEffect } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface LoadingProps {
  message: string;
}

export const Loading: React.FC<LoadingProps> = ({ message }) => {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    // Simulate progress
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev; // Stay at 95 until finished
        const increment = Math.random() * 5;
        return Math.min(prev + increment, 95);
      });
    }, 1500);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-10 animate-fade-in text-center max-w-lg mx-auto">
      <div className="relative">
        <div className="absolute inset-0 bg-orange-400 rounded-full opacity-20 animate-ping"></div>
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl relative z-10 border border-slate-100">
          <Loader2 className="w-12 h-12 text-orange-600 animate-spin" />
        </div>
        <div className="absolute -top-2 -right-2 bg-orange-500 p-2 rounded-lg shadow-lg">
          <Sparkles className="w-4 h-4 text-white animate-pulse" />
        </div>
      </div>

      <div className="w-full space-y-6">
        <div className="space-y-3">
          <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">
            {message}
          </h3>
          <p className="text-orange-600 font-bold text-sm tracking-widest">
            {Math.floor(progress)}% COMPLETADO
          </p>
        </div>

        <div className="relative h-4 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
          <motion.div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-400 to-orange-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
          Sincronizando modelos pedagógicos y estructurando contenido
        </p>
      </div>

      <div className="flex gap-2">
        <div className="w-2.5 h-2.5 bg-orange-200 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2.5 h-2.5 bg-orange-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2.5 h-2.5 bg-orange-400 rounded-full animate-bounce"></div>
      </div>
    </div>
  );
};
