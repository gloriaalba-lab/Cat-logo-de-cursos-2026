import React, { useState, useRef } from 'react';
import { LogIn, Sparkles, ShieldCheck, Zap, Globe, Mail, UserPlus, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Logo } from './Logo';
import ReCAPTCHA from 'react-google-recaptcha';

import { AuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider, microsoftProvider } from '../firebase';

interface LoginProps {
  user: any;
  onLogin: (provider: AuthProvider) => void;
  onEmailAuth: (user: any) => void;
  externalError?: string | null;
}

export const Login: React.FC<LoginProps> = ({ user, onLogin, onEmailAuth, externalError }) => {
  const [mode, setMode] = useState<'options' | 'email-login' | 'email-signup' | 'onboarding'>('options');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // Onboarding data
  const [onboardingData, setOnboardingData] = useState({
    company: '',
    sector: '',
    role: '',
    size: ''
  });
  
  const [pendingUser, setPendingUser] = useState<any>(null);
  const [pendingProvider, setPendingProvider] = useState<AuthProvider | null>(null);

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
        setPendingUser(result.user);
        setMode('onboarding');
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password);
        if (!result.user.emailVerified) {
          setError('Por favor, verifica tu correo electrónico antes de ingresar.');
          await sendEmailVerification(result.user);
          setLoading(false);
          return;
        }
        setPendingUser(result.user);
        setMode('onboarding');
      }
    } catch (err: any) {
      console.error('Email auth error:', err);
      setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  // Update mode if user arrives
  React.useEffect(() => {
    if (user && mode !== 'onboarding') {
      setPendingUser(user);
      setMode('onboarding');
    }
  }, [user, mode]);

  const handleProviderLogin = (provider: AuthProvider) => {
    setError(null);
    onLogin(provider);
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Sync with HubSpot or any other CRM/Logic here if needed
      // For now, we pass the combined data
      const userWithData = {
        ...pendingUser,
        organizationData: onboardingData
      };
      
      onEmailAuth(userWithData);
    } catch (err) {
      console.error('Onboarding finalization error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-8 md:p-12 relative overflow-y-auto overflow-x-hidden">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-orange-100/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-slate-200/20 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-6 sm:p-10 md:p-12 animate-scale-in relative my-auto shrink-0">
        <button 
          onClick={() => setMode('options')}
          className="flex justify-center mb-6 md:mb-10 w-full hover:opacity-80 transition-opacity cursor-pointer"
          title="Ir al inicio"
        >
          <Logo vertical size={window.innerWidth < 768 ? 60 : 70} />
        </button>

        {mode === 'onboarding' ? (
          <form onSubmit={handleOnboardingSubmit} className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-3">
                Configura tu perfil estratégico
              </h2>
              <p className="text-slate-500 font-medium text-xs leading-relaxed">
                Queremos entregarte propuestas precisas para tu contexto organizacional.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nombre de la Empresa</label>
                <input
                  type="text"
                  required
                  value={onboardingData.company}
                  onChange={(e) => setOnboardingData({...onboardingData, company: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none text-sm font-medium"
                  placeholder="Empresa S.A. de C.V."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Sector</label>
                  <select
                    required
                    value={onboardingData.sector}
                    onChange={(e) => setOnboardingData({...onboardingData, sector: e.target.value})}
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none text-sm font-medium appearance-none"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Tecnología">Tecnología</option>
                    <option value="Servicios Financeiros">Finanzas</option>
                    <option value="Manufactura">Manufactura</option>
                    <option value="Salud">Salud</option>
                    <option value="Educación">Educación</option>
                    <option value="Retail">Retail</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tu Rol</label>
                  <input
                    type="text"
                    required
                    value={onboardingData.role}
                    onChange={(e) => setOnboardingData({...onboardingData, role: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none text-sm font-medium"
                    placeholder="Eje: Gerente RH"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tamaño de la Organización</label>
                <div className="grid grid-cols-2 gap-2">
                  {['1-50', '51-200', '201-500', '500+'].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setOnboardingData({...onboardingData, size})}
                      className={`py-3 rounded-xl text-[10px] font-black transition-all border ${
                        onboardingData.size === size 
                          ? 'bg-orange-500 border-orange-600 text-white shadow-lg shadow-orange-200' 
                          : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {size} colaboradores
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !onboardingData.size}
              className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 mt-6"
            >
              Comenzar Diagnóstico Estratégico
              <Zap className="w-4 h-4 text-orange-400" />
            </button>
            <p className="text-[9px] text-center text-slate-400 font-medium">
              Al continuar, aceptas que Cademmy procese la información para tu diagnóstico.
            </p>
          </form>
        ) : mode === 'options' ? (
          <>
            <div className="text-center mb-10">
              <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-4">
                Descubre qué capacitación <span className="text-orange-500">necesita realmente</span> tu organización
              </h1>
              <p className="text-slate-500 font-bold text-sm leading-relaxed mb-4">
                Visualiza en minutos cómo debería estructurarse la capacitación ideal para tu equipo, basada en necesidades reales y enfocada en resultados.
              </p>
              <p className="text-slate-400 font-medium text-xs leading-relaxed mb-4">
                Ingresa para identificar brechas, priorizar necesidades y obtener una propuesta estructurada lista para presentar internamente.
              </p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mt-2 leading-relaxed opacity-90 decoration-orange-500/20 underline underline-offset-4 px-4">
                Utilizado por equipos de RH para detectar brechas de capacitación y tomar decisiones más informadas en minutos.
              </p>
              <p className="text-[9px] font-bold text-orange-500 uppercase tracking-[0.2em] mt-4">
                🚀 Obtén tu primera propuesta en menos de 60 segundos
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 mb-4">
                Sin costo inicial • Sin instalación • Acceso inmediato
              </p>
              <div className="flex items-center justify-center gap-4 mt-6 opacity-40">
                <span className="text-[8px] font-black uppercase tracking-widest">+300 PROGRAMAS DISEÑADOS</span>
                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                <span className="text-[8px] font-black uppercase tracking-widest">ALINEACIÓN CONOCER</span>
                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                <span className="text-[8px] font-black uppercase tracking-widest">ESTRATEGIA B2B</span>
              </div>
            </div>

            {externalError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl animate-shake">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-1.5 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5" /> Error de Configuración
                </p>
                <div className="text-[10px] font-bold leading-snug space-y-2 opacity-90">
                  <p>{externalError.split('\n')[0]}</p>
                  {externalError.includes('\n') && (
                    <div className="mt-2 pt-2 border-t border-red-100 text-[9px] font-medium italic">
                      {externalError.split('\n').slice(1).join(' ')}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-4 mb-10">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:border-orange-200 group">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800 uppercase tracking-widest">DIAGNÓSTICO ESTRATÉGICO</p>
                  <p className="text-[10px] text-slate-500 font-medium text-balance">Identifica rápidamente opciones de capacitación existentes o detecta áreas donde tu organización requiere soluciones específicas. <span className="text-orange-500 font-bold">👉 Si no existe, diseñamos el impacto en resultados de negocio.</span></p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:border-orange-200 group">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800 uppercase tracking-widest">VALIDEZ Y RESPALDO PROFESIONAL</p>
                  <p className="text-[10px] text-slate-500 font-medium text-balance">Programas alineados a estándares de competencia CONOCER, diseñados para generar resultados medibles, evidencia auditable y decisiones estratégicas mejor fundamentadas.</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-center mb-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                  Para analizar tus necesidades de capacitación, entra con:
                </p>
              </div>
              <button
                onClick={() => handleProviderLogin(googleProvider)}
                className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-xl flex items-center justify-center gap-3 group active:scale-95"
              >
                <LogIn className="w-4 h-4 text-orange-400 group-hover:translate-x-1 transition-transform" />
                Continuar con Google
              </button>

              <button
                onClick={() => handleProviderLogin(microsoftProvider)}
                className="w-full py-4 bg-white border-2 border-slate-100 hover:border-orange-500 text-slate-900 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-lg flex items-center justify-center gap-3 group active:scale-95"
              >
                <LogIn className="w-4 h-4 text-orange-500 group-hover:translate-x-1 transition-transform" />
                Continuar con Microsoft
              </button>

              <div className="text-center mt-4">
                <p className="text-[9px] font-medium text-slate-400 italic">
                  * Tus datos se utilizan únicamente para generar propuestas personalizadas y seguimiento profesional.
                </p>
              </div>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                  <span className="bg-white px-4 text-slate-400">O ingresa con tu correo corporativo</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setMode('email-login')}
                  className="py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 px-2 text-center"
                >
                  <Mail className="w-4 h-4 shrink-0" /> Ver mis diagnósticos
                </button>
                <button
                  onClick={() => setMode('email-signup')}
                  className="py-4 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 px-2 text-center"
                >
                  <UserPlus className="w-4 h-4 shrink-0" /> Iniciar diagnóstico estratégico
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
                {mode === 'email-signup' ? 'Iniciar diagnóstico de capacitación' : 'Analizar capacitación con correo'}
              </h2>
              <p className="text-slate-500 font-medium text-xs">
                {mode === 'email-signup' ? 'Únete para identificar brechas y estructurar soluciones' : 'Bienvenido de nuevo a tu plataforma de diagnóstico'}
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
            <span>Modelo de capacitación basado en resultados</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-orange-400" />
            <span>Arquitectura de Capacitación Inteligente</span>
          </div>
        </div>
      </div>

      <p className="mt-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
        © cademmy learning SAS
      </p>
    </div>
  );
};
