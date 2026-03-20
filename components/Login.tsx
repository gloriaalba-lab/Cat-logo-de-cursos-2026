import React from 'react';
import { LogIn, Sparkles, ShieldCheck, Zap, Globe } from 'lucide-react';
import { Logo } from './Logo';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-orange-100/50 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-slate-200/50 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-8 md:p-12 animate-scale-in relative">
        <div className="flex justify-center mb-10">
          <Logo vertical size={80} />
        </div>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-4">
            Arquitectura <span className="text-orange-500">Académica</span> de Alto Impacto
          </h1>
          <p className="text-slate-500 font-medium text-sm leading-relaxed">
            Ingresa a la plataforma líder en diseño instruccional y certificación de competencias.
          </p>
        </div>

        <div className="space-y-4 mb-10">
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:border-orange-200 group">
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Diseño Ágil</p>
              <p className="text-[10px] text-slate-500 font-medium">Crea estrategias en minutos, no semanas.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:border-orange-200 group">
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Validez Oficial</p>
              <p className="text-[10px] text-slate-500 font-medium">Alineado a estándares internacionales y CONOCER.</p>
            </div>
          </div>
        </div>

        <button
          onClick={onLogin}
          className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-xl flex items-center justify-center gap-3 group active:scale-95"
        >
          <LogIn className="w-4 h-4 text-orange-400 group-hover:translate-x-1 transition-transform" />
          Iniciar Sesión con Google
        </button>

        <div className="mt-10 pt-8 border-t border-slate-100 flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <Globe className="w-3 h-3" />
            <span>México 2026</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-orange-400" />
            <span>AI Powered</span>
          </div>
        </div>
      </div>

      <p className="mt-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
        © cademmy learning SAS
      </p>
    </div>
  );
};
