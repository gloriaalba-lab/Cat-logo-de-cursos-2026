
import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  message: string;
}

export const Loading: React.FC<LoadingProps> = ({ message }) => {
  const [dots, setDots] = React.useState('');
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-6 animate-fade-in text-center">
      <div className="relative">
        <div className="absolute inset-0 bg-orange-400 rounded-full opacity-20 animate-ping"></div>
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl relative z-10 border border-slate-100">
          <Loader2 className="w-10 h-10 text-orange-600 animate-spin" />
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-black text-slate-800 tracking-tight">
          {message}{dots}
        </h3>
        <p className="text-slate-500 text-sm max-w-md font-medium leading-relaxed italic">
          El mentor de Cademmy está procesando la información pedagógica con inteligencia artificial avanzada. Esto puede tomar hasta un minuto dependiendo de la complejidad de los insumos.
        </p>
      </div>
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-orange-200 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-orange-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
      </div>
    </div>
  );
};
