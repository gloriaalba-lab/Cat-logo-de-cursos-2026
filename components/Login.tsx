import React, { useState, useRef } from 'react';
import { LogIn, Sparkles, ShieldCheck, Zap, Globe, Mail, UserPlus, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Logo } from './Logo';
import ReCAPTCHA from 'react-google-recaptcha';

import { AuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth, googleProvider, microsoftProvider } from '../firebase';

interface LoginProps {
  onLogin: (provider: AuthProvider) => void;
  onEmailAuth: (user: any) => void;
  externalError?: string | null;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onEmailAuth, externalError }) => {
  const [mode, setMode] = useState<'options' | 'email-login' | 'email-signup'>('options');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaValue, setCaptchaValue] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaValue) {
      setError('Por favor, verifica que eres humano.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (mode === 'email-signup') {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(result.user);
        alert('Se ha enviado un correo de verificación. Por favor revisa tu bandeja de entrada.');
        onEmailAuth(result.user);
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password);
        if (!result.user.emailVerified) {
          setError('Por favor, verifica tu correo electrónico antes de ingresar.');
          await sendEmailVerification(result.user);
          setLoading(false);
          return;
        }
        onEmailAuth(result.user);
      }
    } catch (err: any) {
      console.error('Email auth error:', err);
      setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

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

        {mode === 'options' ? (
          <>
            <div className="text-center mb-10">
              <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-4">
                Catálogo de cursos <span className="text-orange-500">búsqueda de última generación</span>
              </h1>
              <p className="text-slate-500 font-medium text-sm leading-relaxed">
                Ingresa al catálogo de cursos y contacta con un asesor
              </p>
            </div>

            {externalError && (
              <div className="mb-6 p-6 bg-red-50 border-2 border-red-200 text-red-700 rounded-2xl animate-shake">
                <p className="text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Error de Autenticación
                </p>
                <p className="text-[10px] font-bold leading-relaxed">
                  {externalError}
                </p>
              </div>
            )}

            <div className="space-y-4 mb-10">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:border-orange-200 group">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Catálogo Inteligente</p>
                  <p className="text-[10px] text-slate-500 font-medium">Busca en nuestro amplio catálogo y si no encuentras lo que buscas nuestros ejecutivos te diseñan el curso apegándose a tus necesidades.</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:border-orange-200 group">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Validez Oficial</p>
                  <p className="text-[10px] text-slate-500 font-medium">Programas alineados a los estándares EC0217.01 y EC0301 de CONOCER con validez oficial DC3. Contamos con facilitadores expertos registrados y autorizados por la STPS.</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => onLogin(googleProvider)}
                className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-xl flex items-center justify-center gap-3 group active:scale-95"
              >
                <LogIn className="w-4 h-4 text-orange-400 group-hover:translate-x-1 transition-transform" />
                Iniciar Sesión con Google
              </button>

              <button
                onClick={() => onLogin(microsoftProvider)}
                className="w-full py-4 bg-white border-2 border-slate-100 hover:border-orange-500 text-slate-900 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-lg flex items-center justify-center gap-3 group active:scale-95"
              >
                <LogIn className="w-4 h-4 text-orange-500 group-hover:translate-x-1 transition-transform" />
                Iniciar Sesión con Microsoft
              </button>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                  <span className="bg-white px-4 text-slate-400">O con tu correo</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setMode('email-login')}
                  className="py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4" /> Ya tengo cuenta
                </button>
                <button
                  onClick={() => setMode('email-signup')}
                  className="py-4 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" /> Soy nuevo
                </button>
              </div>
            </div>
          </>
        ) : (
          <form onSubmit={handleEmailAuth} className="space-y-6">
            <button 
              type="button"
              onClick={() => setMode('options')}
              className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" /> <span className="text-[10px] font-black uppercase tracking-widest">Volver</span>
            </button>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">
                {mode === 'email-signup' ? 'Crear mi cuenta' : 'Ingresar con correo'}
              </h2>
              <p className="text-slate-500 font-medium text-xs">
                {mode === 'email-signup' ? 'Únete a la red de expertos de Cademmy' : 'Bienvenido de nuevo a tu catálogo'}
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-xl animate-shake">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {mode === 'email-signup' && (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none text-sm font-medium"
                    placeholder="Tu nombre"
                  />
                </div>
              )}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none text-sm font-medium"
                  placeholder="ejemplo@correo.com"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none text-sm font-medium"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-center py-2">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" // Test key, user should replace with their own
                onChange={(val) => setCaptchaValue(val)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Procesando...' : mode === 'email-signup' ? 'Crear Cuenta' : 'Ingresar'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode(mode === 'email-signup' ? 'email-login' : 'email-signup')}
                className="text-[10px] font-black text-slate-400 hover:text-orange-500 uppercase tracking-widest transition-colors"
              >
                {mode === 'email-signup' ? '¿Ya tienes cuenta? Ingresa aquí' : '¿Eres nuevo? Regístrate aquí'}
              </button>
            </div>
          </form>
        )}

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
