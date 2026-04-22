import React, { useState, useEffect } from 'react';
import { Logo } from './components/Logo';
import { StepInput } from './components/StepInput';
import { StepStrategy } from './components/StepStrategy';
import { StepCourse } from './components/StepCourse';
import { Loading } from './components/Loading';
import { Login } from './components/Login';
import { SavedStrategiesList } from './components/SavedStrategiesList';
import { UserPersonaReport } from './components/UserPersonaReport';
import { AdminConsole } from './components/AdminConsole';
import { AppStep, CourseStrategy, Course, CourseContext, ModuleOutline } from './types';
import { generateCourseStrategy, generateFullCourseContent, generateModuleIllustration, generateCatalogStrategy } from './services/geminiService';
import { CatalogCourse } from './src/data/catalog';
import { auth, googleProvider, microsoftProvider, signInWithPopup, signOut, db, handleFirestoreError, OperationType, checkIsAdmin } from './firebase';
import { onAuthStateChanged, User, AuthProvider } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { LogIn, LogOut, User as UserIcon, Save, CheckCircle, History, Calendar, BarChart3, ShieldCheck } from 'lucide-react';
import { BOOKING_URL } from './src/constants';

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
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showSavedList, setShowSavedList] = useState(false);
  const [showPersonaReport, setShowPersonaReport] = useState(false);
  const [showAdminConsole, setShowAdminConsole] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && currentUser.providerData.some(p => p.providerId === 'password') && !currentUser.emailVerified) {
        // Force reload to check verification status
        await currentUser.reload();
        const updatedUser = auth.currentUser;
        setUser(updatedUser);
      } else {
        setUser(currentUser);
      }
      
      if (currentUser) {
        const adminStatus = await checkIsAdmin(currentUser.email);
        setIsAdmin(adminStatus);
      } else {
        setIsAdmin(false);
      }
      
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const syncWithHubSpot = async (user: User) => {
    try {
      const [firstName, ...lastNameParts] = (user.displayName || '').split(' ');
      const lastName = lastNameParts.join(' ');
      
      await fetch('/api/crm/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          firstName: firstName || 'Usuario',
          lastName: lastName || 'Cademmy',
          photoUrl: user.photoURL
        })
      });
    } catch (error) {
      console.error('HubSpot sync error:', error);
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
      } else if (error.code === 'auth/unauthorized-domain') {
        message = `Este dominio no está autorizado en la consola de Firebase (Authentication > Settings > Authorized domains). Dominio actual: ${window.location.hostname}`;
      } else if (error.message) {
        message = `${error.message} (Código: ${error.code})`;
      }
      
      setAuthError(message);
    }
  };

  const handleEmailAuth = async (user: User) => {
    setUser(user);
    if (user.emailVerified) {
      await syncWithHubSpot(user);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
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
        strategy: strategy,
        updatedAt: serverTimestamp()
      };

      if (savedId) {
        // Update existing strategy and add a version
        const strategyRef = doc(db, 'saved_strategies', savedId);
        await updateDoc(strategyRef, strategyData);
        
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

  const handleSelectCatalogCourse = async (catalog: CatalogCourse) => {
    setLoading(true);
    setLoadingMessage(`Consultando catálogo y estructurando propuesta`);
    
    const newContext: CourseContext = {
      topic: catalog.title,
      audience: catalog.targetAudience,
      depth: 'Intermedio',
      targetCompany: 'Empresa Cliente',
      specialFocus: `Catálogo: ${catalog.id}`,
      preferredDuration: `${catalog.hours} horas`,
      desiredOutcome: catalog.objective // Default outcome from catalog objective
    };

    try {
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

  const handleBackToInput = () => { 
    console.log('Returning to home...');
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

  if (!user || (user.providerData.some(p => p.providerId === 'password') && !user.emailVerified)) {
    return <Login onLogin={handleLogin} onEmailAuth={handleEmailAuth} externalError={authError} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-orange-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <button 
            onClick={handleBackToInput}
            className="hover:opacity-80 active:scale-95 transition-all cursor-pointer"
            title="Ir al inicio"
          >
            <Logo />
          </button>
          <div className="flex items-center gap-4">
            {strategy?.version && (
              <span className="hidden md:inline-block text-[10px] font-black text-orange-500 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                VERSIÓN {strategy.version}
              </span>
            )}

            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-700 transition-all shadow-lg shadow-orange-100"
            >
              <Calendar className="w-3.5 h-3.5" /> Agendar una cita
            </a>

            {isAuthReady && (
              <div className="flex items-center gap-3">
                {user ? (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowSavedList(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                    >
                      <History className="w-3.5 h-3.5 text-orange-500" /> Cursos de mi interés
                    </button>
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => setShowAdminConsole(true)}
                          className="p-2 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-orange-500 hover:bg-orange-50 transition-all shadow-sm"
                          title="Consola de Gestión de Admins"
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setShowPersonaReport(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                        >
                          <BarChart3 className="w-3.5 h-3.5 text-orange-500" /> Insights Users Report
                        </button>
                      </>
                    )}
                    {strategy && step === AppStep.STRATEGY && (
                      <button
                        onClick={handleSaveStrategy}
                        disabled={saveStatus === 'saving'}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                          saveStatus === 'saved' 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {saveStatus === 'saving' ? (
                          'Guardando...'
                        ) : saveStatus === 'saved' ? (
                          <><CheckCircle className="w-3.5 h-3.5" /> Guardado</>
                        ) : (
                          <><Save className="w-3.5 h-3.5 text-orange-500" /> Guardar Resultado</>
                        )}
                      </button>
                    )}
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName || ''} className="w-5 h-5 rounded-full" referrerPolicy="no-referrer" />
                      ) : (
                        <UserIcon className="w-4 h-4 text-slate-400" />
                      )}
                      <span className="text-[10px] font-black text-slate-600 truncate max-w-[100px]">{user.displayName}</span>
                    </div>
                    <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Cerrar Sesión">
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                ) : null}
              </div>
            )}

            <span className="hidden lg:inline-block text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-6 py-2.5 rounded-full border border-slate-100 shadow-sm">
              Catálogo de cursos 2026
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
                onConfirm={handleConfirmStrategy}
                isLoading={loading}
              />
            )}
            {step === AppStep.COURSE && course && (
              <StepCourse 
                course={course} 
                onBackToVariations={() => setStep(AppStep.STRATEGY)} 
                onRestart={handleBackToInput} 
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

      {showAdminConsole && (
        <AdminConsole 
          onClose={() => setShowAdminConsole(false)}
        />
      )}

      {/* Floating Booking CTA */}
      <a
        href={BOOKING_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 z-[60] hidden md:flex items-center gap-3 px-6 py-4 bg-orange-600 text-white rounded-2xl shadow-2xl hover:bg-orange-700 hover:scale-105 transition-all animate-bounce-subtle no-print group"
      >
        <div className="bg-white/20 p-2 rounded-lg group-hover:rotate-12 transition-transform">
          <Calendar className="w-5 h-5" />
        </div>
        <div className="flex flex-col items-start">
          <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">¿Necesitas ayuda?</span>
          <span className="text-sm font-black leading-none">Agendar una cita</span>
        </div>
      </a>
    </div>
  );
};

export default App;