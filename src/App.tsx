import React, { useState, useEffect } from 'react';
import { Logo } from './components/Logo';
import { StepInput } from './components/StepInput';
import { StepStrategy } from './components/StepStrategy';
import { StepCourse } from './components/StepCourse';
import { Loading } from './components/Loading';
import { Login } from './components/Login';
import { SavedStrategiesList } from './components/SavedStrategiesList';
import { UserPersonaReport } from './components/UserPersonaReport';
import { AdminPanel } from './components/AdminPanel';
import { trackMetric, MetricType } from './services/metricsService';
import { AppStep, CourseStrategy, Course, CourseContext, ModuleOutline } from './types';
import { generateCourseStrategy, generateFullCourseContent, generateModuleIllustration, generateCatalogStrategy } from './services/geminiService';
import { CatalogCourse } from './data/catalog';
import { auth, googleProvider, microsoftProvider, signInWithPopup, signOut, db, handleFirestoreError, OperationType, checkIsAdmin } from './firebase';
import { onAuthStateChanged, User, AuthProvider } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { LogIn, LogOut, User as UserIcon, Save, CheckCircle, History, Calendar, BarChart3, ShieldCheck, Shield, HelpCircle } from 'lucide-react';
import { BOOKING_URL } from './constants';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="bg-white p-12 rounded-[2.5rem] shadow-2xl border border-red-100 max-w-2xl w-full text-center space-y-8">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              {/* Manual SVG for Lucide X to avoid dependency in ErrorBoundary */}
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">Vaya, algo no salió como esperábamos</h2>
              <p className="text-slate-500 font-medium leading-relaxed">
                El motor de arquitectura ha encontrado un error inesperado al procesar la vista. 
                Por favor, intenta recargar la aplicación o regresar al inicio.
              </p>
              {this.state.error && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-[10px] font-mono text-slate-400 overflow-auto max-h-40 text-left whitespace-pre-wrap">
                  {this.state.error.message}
                </div>
              )}
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl"
            >
              RECARGAR APLICACIÓN
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.INPUT);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  const [context, setContext] = useState<CourseContext | null>(null);
  const [strategy, setStrategy] = useState<CourseStrategy | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);

  const [user, setUser] = useState<User | null>(null);
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showSavedList, setShowSavedList] = useState(false);
  const [showPersonaReport, setShowPersonaReport] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Register global bridge for AdminPanel 'Edit in App' feature
    (window as any).loadStrategyInApp = (loadedStrategy: CourseStrategy) => {
      setStrategy(loadedStrategy);
      setStep(AppStep.STRATEGY);
      setSavedId(null); // It's a copy for editing, but they can save it later
      trackMetric(MetricType.CATALOG_VIEWED, { title: loadedStrategy.title, source: 'admin_panel' });
    };

    return () => {
      delete (window as any).loadStrategyInApp;
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser && currentUser.providerData.some(p => p.providerId === 'password') && !currentUser.emailVerified) {
          // Force reload to check verification status
          await currentUser.reload().catch(e => console.warn("User reload failed", e));
          const updatedUser = auth.currentUser;
          setUser(updatedUser);
        } else {
          setUser(currentUser);
        }
        
        if (currentUser) {
          const adminStatus = await checkIsAdmin(currentUser.email);
          setIsAdmin(adminStatus);
          trackMetric(MetricType.USER_SIGNIN);
          
          if (!isOnboarding) {
            setStep(AppStep.INPUT);
            setStrategy(null);
            setCourse(null);
          }
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Auth state observer error:", error);
      } finally {
        setIsAuthReady(true);
      }
    });
    return () => unsubscribe();
  }, []);

  const syncWithHubSpot = async (userWithContext: any) => {
    try {
      const [firstName, ...lastNameParts] = (userWithContext.displayName || '').split(' ');
      const lastName = lastNameParts.join(' ');
      
      // Calculate strategic tags for CRM
      const tags = ['strategic_diagnostic_2026'];
      if (userWithContext.organizationData) {
        if (userWithContext.organizationData.sector) tags.push(`sector_${userWithContext.organizationData.sector.toLowerCase().replace(/\s+/g, '_')}`);
        if (userWithContext.organizationData.size) tags.push(`size_${userWithContext.organizationData.size}`);
      }
      
      await fetch('/api/crm/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userWithContext.email,
          firstName: firstName || 'Usuario',
          lastName: lastName || 'Cademmy',
          photoUrl: userWithContext.photoURL,
          company: userWithContext.organizationData?.company,
          sector: userWithContext.organizationData?.sector,
          role: userWithContext.organizationData?.role,
          size: userWithContext.organizationData?.size,
          tags: tags,
          intent: 'b2b_training_diagnostic'
        })
      });
    } catch (error) {
      console.error('CRM sync error:', error);
    }
  };

  const handleLogin = async (provider: AuthProvider) => {
    setAuthError(null);
    console.log('Starting login with provider:', provider.providerId);
    try {
      const result = await signInWithPopup(auth, provider);
      console.log('Login successful:', result.user.email);
      if (result.user) {
        await syncWithHubSpot(result.user);
      }
    } catch (error: any) {
      console.error('Detailed login error:', error);
      let message = 'Error al iniciar sesión.';
      
      if (error.code === 'auth/popup-blocked') {
        message = 'El navegador bloqueó la ventana emergente. Por favor, permite las ventanas emergentes para este sitio.';
      } else if (error.code === 'auth/operation-not-allowed') {
        message = 'Este método de inicio de sesión no está habilitado en la consola de Firebase.';
      } else if (error.code === 'auth/unauthorized-domain' || (error.message && error.message.includes('400')) || (error.code === 'auth/internal-error' && error.message.includes('popup'))) {
        const domain = window.location.hostname;
        const origin = window.location.origin;
        message = `Error 400: Dominio no reconocido.
        Para solucionar esto, por favor copia estos datos y pégalos en tu Consola:
        1. En Firebase (Auth > Settings): añade "${domain}" a Dominios Autorizados.
        2. En Google Cloud (Credentials > OAuth 2.0): añade "${origin}" a Orígenes de JavaScript autorizados.`;
      } else if (error.message) {
        message = `${error.message} (Código: ${error.code})`;
      }
      
      setAuthError(message);
    }
  };

  const handleEmailAuth = async (userWithData: any) => {
    setUser(userWithData);
    if (userWithData.organizationData) {
      setOnboardingData(userWithData.organizationData);
      // Here we would also sync to HubSpot with organization data
      await syncWithHubSpot(userWithData);
    }
    setIsOnboarding(false);
    setStep(AppStep.INPUT);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Clear all state on logout
      setContext(null);
      setStrategy(null);
      setCourse(null);
      setSavedId(null);
      setResetKey(prev => prev + 1);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSaveStrategy = async () => {
    if (!user || !strategy) return;
    setSaveStatus('saving');
    try {
      const strategyData = {
        uid: user.uid,
        userName: user.displayName || 'Usuario',
        userEmail: user.email,
        userPhoto: user.photoURL,
        strategy: strategy,
        updatedAt: serverTimestamp()
      };

      if (savedId) {
        // Update existing strategy and add a version
        const strategyRef = doc(db, 'saved_strategies', savedId);
        await updateDoc(strategyRef, strategyData);
        trackMetric(MetricType.STRATEGY_SAVED, { strategyId: savedId, action: 'update' });
        
        // Add to versions subcollection
        await addDoc(collection(strategyRef, 'versions'), {
          ...strategyData,
          createdAt: serverTimestamp()
        });
      } else {
        // Create new strategy
        const docRef = await addDoc(collection(db, 'saved_strategies'), {
          ...strategyData,
          createdAt: serverTimestamp()
        });
        setSavedId(docRef.id);
        trackMetric(MetricType.STRATEGY_SAVED, { strategyId: docRef.id, action: 'create' });
        
        // Add initial version
        await addDoc(collection(docRef, 'versions'), {
          ...strategyData,
          createdAt: serverTimestamp()
        });
      }
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      handleFirestoreError(error, OperationType.CREATE, 'saved_strategies');
    }
  };

  const handleLoadSavedStrategy = (savedStrategy: CourseStrategy, id?: string) => {
    setStrategy(savedStrategy);
    if (id) setSavedId(id);
    setStep(AppStep.STRATEGY);
    setShowSavedList(false);
    setContext(null); 
  };

  const handleSelectCatalogCourse = async (catalog: CatalogCourse & { rephrasedTitle?: string; executiveSummary?: string }) => {
    setLoading(true);
    setLoadingMessage(`Analizando brechas y arquitectando respuesta estratégica`);
    
    const newContext: CourseContext = {
      topic: catalog.rephrasedTitle || catalog.title,
      audience: catalog.targetAudience,
      depth: 'Intermedio',
      targetCompany: 'Empresa Cliente',
      industry: catalog.area || 'Industria General',
      specialFocus: `Arquitectura de solución: ${catalog.id}`,
      preferredDuration: `${catalog.hours} horas`,
      desiredOutcome: catalog.executiveSummary || catalog.objective 
    };

    try {
      trackMetric(MetricType.CATALOG_VIEWED, { 
        title: catalog.title,
        industry: catalog.area,
        category: catalog.category
      });
      const catalogStrategy = await generateCatalogStrategy(catalog, newContext);
      setStrategy(catalogStrategy);
      setContext(newContext);
      setStep(AppStep.STRATEGY);
    } catch (error) {
      console.error("Error generating catalog strategy:", error);
      // Fallback to basic mapping if AI fails
      const moduleTitles = catalog.content.split(/\d+\.\s+/).filter(Boolean).map(t => t.trim());
      const baseHours = Math.floor(catalog.hours / moduleTitles.length);
      const remainder = catalog.hours % moduleTitles.length;
      
      const syllabus: ModuleOutline[] = moduleTitles.map((title, index) => ({
        title: title.split('.')[0] || title,
        hours: index === moduleTitles.length - 1 ? baseHours + remainder : baseHours,
        objective: `Al finalizar el curso, el participante desarrollará competencias en ${title}`,
        topics: [
          {
            title: "Temas principales",
            subtopics: title.split('|').map(s => s.trim())
          }
        ]
      }));

      const formatObjective = (text: string) => {
        if (text.startsWith('Al finalizar')) return text;
        let cleaned = text.replace(/^(proporcionar|brindar|entregar|dar|ofrecer)\s+a\s+los\s+participantes\s+/i, '');
        cleaned = cleaned.replace(/^(proporcionar|brindar|entregar|dar|ofrecer)\s+/i, '');
        cleaned = cleaned.replace(/\s+a\s+los\s+participantes/gi, '');
        return `Al finalizar el curso, el participante obtendrá ${cleaned.charAt(0).toLowerCase() + cleaned.slice(1)}`;
      };

      const fallbackStrategy: CourseStrategy = {
        title: catalog.title,
        targetAudience: {
          directedTo: [catalog.targetAudience],
          participantProfile: catalog.targetAudience
        },
        generalObjective: formatObjective(catalog.objective),
        particularObjectives: moduleTitles.map(t => `Al finalizar el curso, el participante dominará los fundamentos de ${t.split('.')[0] || t}`),
        totalDuration: `${catalog.hours} horas`,
        methodology: catalog.modality,
        prerequisites: ["Conocimientos básicos del área."],
        expectedResults: catalog.benefits.split(',').map(b => b.trim()),
        benefitImplementation: catalog.benefits.split(',').map(b => ({
          benefit: b.trim(),
          howToAchieve: `A través del desarrollo de los módulos técnicos y la práctica dirigida en el tema de ${catalog.title}.`,
          measurement: `Evaluación de desempeño y aplicación práctica de los conocimientos adquiridos.`
        })),
        depth: 'Intermedio',
        syllabus: syllabus,
        category: catalog.category,
        area: catalog.area,
        version: 'CAT-1.0'
      };

      setStrategy(fallbackStrategy);
      setContext(newContext);
      setStep(AppStep.STRATEGY);
    } finally {
      setLoading(false);
    }
  };

  const handleStartConsultancy = async (newContext: CourseContext) => {
    console.log('handleStartConsultancy called with context:', newContext);
    setContext(newContext);
    setSavedId(null); // New consultancy, new strategy
    setLoading(true);
    setLoadingMessage(`Analizando insumos y arquitectando solución`);
    try {
      console.log('Generating course strategy...');
      const data = await generateCourseStrategy(newContext);
      trackMetric(MetricType.STRATEGY_GENERATED, { 
        topic: newContext.topic,
        industry: newContext.industry,
        depth: newContext.depth,
        outcome: newContext.desiredOutcome,
        audience: newContext.audience
      });
      console.log('Strategy generated successfully:', data);
      const strategyWithVersion = { ...data, version: '1.0' };
      setStrategy(strategyWithVersion);
      setStep(AppStep.STRATEGY);
    } catch (e: any) {
      console.error('Architecture Generation Error:', e);
      const errorMsg = e instanceof Error ? e.message : "Error desconocido";
      alert(`Error en la arquitectura: ${errorMsg}\n\nSugerencia: Intenta con un archivo más simple o reduce el número de temas.`);
      setStep(AppStep.INPUT);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmStrategy = async (updatedStrategy: CourseStrategy) => {
    if (!context) return;
    setStrategy(updatedStrategy);
    setLoading(true);
    setLoadingMessage(`Iniciando fabricación profunda del curso...`);
    try {
      const fullCourse = await generateFullCourseContent(
        updatedStrategy, 
        context,
        (msg) => setLoadingMessage(msg)
      );
      
      setLoadingMessage(`Generando Conceptos Visuales`);
      const illustratedModules = await Promise.all(
        fullCourse.modules.map(async (mod) => {
          const imageUrl = await generateModuleIllustration(mod.title);
          return { ...mod, imageUrl };
        })
      );

      setCourse({ ...fullCourse, modules: illustratedModules, version: updatedStrategy.version });
      setStep(AppStep.COURSE);
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Error fabricando el contenido. Intenta con una estructura más simple.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoHome = () => {
    setStep(AppStep.INPUT);
    setStrategy(null);
    setCourse(null);
    setSavedId(null);
    setContext(null);
    setLoading(false);
    trackMetric(MetricType.NAVIGATION, { target: 'home' });
  };

  const handleBackToInput = () => { 
    setStep(AppStep.INPUT); 
    setStrategy(null); 
    setCourse(null);
    setSavedId(null);
    setLoading(false);
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loading message="Cargando entorno seguro..." />
      </div>
    );
  }

  if (!user || isOnboarding || (user.providerData.some(p => p.providerId === 'password') && !user.emailVerified)) {
    return <Login 
      user={user}
      onLogin={(p) => { setIsOnboarding(true); handleLogin(p); }} 
      onEmailAuth={handleEmailAuth} 
      externalError={authError} 
    />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-orange-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-4 py-4 lg:min-h-[6rem] flex flex-col items-center justify-center lg:flex-row lg:justify-between gap-4">
          <button 
            onClick={handleGoHome}
            className="hover:opacity-80 active:scale-95 transition-all cursor-pointer shrink-0"
            id="header-logo-button"
            title="Ir al inicio"
          >
            <Logo size={window.innerWidth < 768 ? 40 : 45} />
          </button>
          
            <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2 md:gap-3 w-full lg:w-auto">
            {strategy?.version && (
              <span className="hidden xs:inline-block text-[9px] font-black text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                V{strategy.version}
              </span>
            )}

            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackMetric(MetricType.BOOKING_CLICKED, { location: 'header' })}
              className="flex items-center gap-2 px-3 md:px-4 py-2 bg-orange-600 text-white rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-orange-700 transition-all shadow-lg shadow-orange-100 whitespace-nowrap"
            >
              <Calendar className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Hablar con un consultor estratégico</span><span className="xs:hidden">Motor Estratégico</span>
            </a>

            {isAuthReady && (
              <div className="flex items-center gap-2">
                {user ? (
                  <div className="flex items-center gap-2">
                    <button
                      id="mis-diagnosticos-button"
                      onClick={() => setShowSavedList(true)}
                      className="flex items-center gap-2 px-3 md:px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm whitespace-nowrap"
                    >
                      <History className="w-3.5 h-3.5 text-orange-500" /> <span className="hidden sm:inline">Mis Diagnósticos</span><span className="sm:hidden">Diagnósticos</span>
                    </button>
                    {strategy && step === AppStep.STRATEGY && (
                      <button
                        id="guardar-resultado-button"
                        onClick={handleSaveStrategy}
                        disabled={saveStatus === 'saving'}
                        className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${
                          saveStatus === 'saved' 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {saveStatus === 'saving' ? (
                          '...'
                        ) : saveStatus === 'saved' ? (
                          <><CheckCircle className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Guardado</span></>
                        ) : (
                          <><Save className="w-3.5 h-3.5 text-orange-500" /> <span className="hidden xs:inline">Guardar Resultado</span><span className="xs:hidden">Guardar</span></>
                        )}
                      </button>
                    )}

                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100 whitespace-nowrap">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName || ''} className="w-5 h-5 rounded-full" referrerPolicy="no-referrer" />
                      ) : (
                        <UserIcon className="w-4 h-4 text-slate-400" />
                      )}
                      <span className="text-[10px] font-black text-slate-600 truncate max-w-[80px]">{user.displayName?.split(' ')[0]}</span>
                    </div>

                    <button id="logout-button" onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Cerrar Sesión">
                      <LogOut className="w-5 h-5" />
                    </button>

                    {isAdmin && (
                      <div className="flex items-center gap-1 md:gap-2 ml-1 md:ml-2 border-l border-slate-100 pl-2 md:pl-4">
                        <button
                          id="admin-panel-button"
                          onClick={() => setShowAdminPanel(true)}
                          className="flex items-center gap-2 px-3 md:px-4 py-2 bg-slate-900 border border-slate-800 text-white rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg whitespace-nowrap"
                        >
                          <Shield className="w-3.5 h-3.5 text-orange-500" /> <span className="hidden sm:inline">Admin</span>
                        </button>
                        <button
                          id="insights-report-button"
                          onClick={() => setShowPersonaReport(true)}
                          className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                          title="Insights Report"
                        >
                          <BarChart3 className="w-3.5 h-3.5 text-orange-500" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}

            <span className="hidden lg:inline-block text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-6 py-2.5 rounded-full border border-slate-100 shadow-sm whitespace-nowrap">
              Arquitectura de Soluciones • Motor Estratégico
            </span>
          </div>
        </div>
      </header>

      <main>
        {loading ? (
          <div className="min-h-[80vh] flex items-center justify-center"><Loading message={loadingMessage} /></div>
        ) : (
          <>
            {step === AppStep.INPUT && (
              <StepInput 
                key={resetKey}
                onStart={handleStartConsultancy} 
                onSelectCatalogCourse={handleSelectCatalogCourse}
                onImport={() => {}} 
                isLoading={loading} 
                initialContext={context}
              />
            )}
            {step === AppStep.STRATEGY && strategy && (
              <StepStrategy 
                strategy={strategy} 
                onBack={handleBackToInput}
                onHome={handleGoHome}
                onConfirm={handleConfirmStrategy}
                isLoading={loading}
              />
            )}
            {step === AppStep.COURSE && course && (
              <StepCourse 
                course={course} 
                onBackToVariations={() => setStep(AppStep.STRATEGY)} 
                onRestart={handleBackToInput} 
                onHome={handleGoHome}
              />
            )}
          </>
        )}
      </main>

      {showSavedList && (
        <SavedStrategiesList 
          onLoad={handleLoadSavedStrategy}
          onClose={() => setShowSavedList(false)}
        />
      )}

      {showPersonaReport && (
        <UserPersonaReport 
          onClose={() => setShowPersonaReport(false)}
        />
      )}

      {showAdminPanel && (
        <AdminPanel 
          onClose={() => setShowAdminPanel(false)}
        />
      )}

      {/* Floating Booking CTA */}
      <a
        href={BOOKING_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackMetric(MetricType.BOOKING_CLICKED, { location: 'floating_cta' })}
        className="fixed bottom-8 right-8 z-[60] hidden md:flex items-center gap-3 px-6 py-4 bg-orange-600 text-white rounded-2xl shadow-2xl hover:bg-orange-700 hover:scale-105 transition-all animate-bounce-subtle no-print group"
      >
        <div className="bg-white/20 p-2 rounded-lg group-hover:rotate-12 transition-transform">
          <Calendar className="w-5 h-5" />
        </div>
        <div className="flex flex-col items-start">
          <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 text-orange-200">¿Prefieres una recomendación ejecutiva directa?</span>
          <span className="text-sm font-black leading-none">Hablar con un consultor estratégico</span>
        </div>
      </a>
    </div>
    </ErrorBoundary>
  );
};

export default App;