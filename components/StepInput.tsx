import React, { useState, useRef, useEffect } from 'react';
import { Logo } from './Logo';
import { Sparkles, Upload, ShieldCheck, Zap, GraduationCap, Users, FileText, X, FileUp, Building2, MessageSquare, HelpCircle, Clock, Search, ArrowRight, CheckCircle2, BookOpen, Calendar } from 'lucide-react';
import { Course, CourseContext } from '../types';
import { courseCatalog, CatalogCourse } from '../src/data/catalog';
import { generateTitleSuggestions, searchCatalogWithAI } from '../services/geminiService';

interface StepInputProps {
  onStart: (context: CourseContext) => void;
  onSelectCatalogCourse?: (course: CatalogCourse) => void;
  onImport: (course: Course) => void;
  isLoading: boolean;
  initialContext?: CourseContext | null;
}

export const StepInput: React.FC<StepInputProps> = ({ 
  onStart, 
  onSelectCatalogCourse,
  onImport, 
  isLoading, 
  initialContext 
}) => {
  const [topic, setTopic] = useState(initialContext?.topic || '');
  const [customTitle, setCustomTitle] = useState(initialContext?.customTitle || '');
  const [audience, setAudience] = useState(initialContext?.audience || '');
  const [depth, setDepth] = useState<CourseContext['depth']>(initialContext?.depth || 'Intermedio');
  const [targetCompany, setTargetCompany] = useState(initialContext?.targetCompany || '');
  const [specialFocus, setSpecialFocus] = useState(initialContext?.specialFocus || '');
  const [preferredDuration, setPreferredDuration] = useState(initialContext?.preferredDuration || '');
  const [proposalFile, setProposalFile] = useState<CourseContext['proposalFile'] | null>(initialContext?.proposalFile || null);
  const [activeHelp, setActiveHelp] = useState<string | null>(null);
  const [showUploadChoice, setShowUploadChoice] = useState(false);
  const [formStep, setFormStep] = useState(initialContext ? 2 : 1);
  const [catalogResults, setCatalogResults] = useState<(CatalogCourse & { reasoning?: string })[]>([]);
  const [isSearchingCatalog, setIsSearchingCatalog] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<CourseContext['depth'] | null>(null);
  const [proposalData, setProposalData] = useState<any>(null);
  const [loadingMessage, setLoadingMessage] = useState('ANALIZANDO PARÁMETROS...');

  useEffect(() => {
    const isLoadingAny = isLoading || isLoadingSuggestions || isSearchingCatalog;
    
    if (!isLoadingAny) {
      setLoadingMessage('ANALIZANDO PARÁMETROS...');
      return;
    }

    let messages = [
      'ANALIZANDO PARÁMETROS...',
      'CONSULTANDO CATÁLOGO DE CURSOS...',
      'ESTRUCTURANDO PROPUESTA PRELIMINAR...',
      'OPTIMIZANDO OBJETIVOS DE APRENDIZAJE...',
      'PERSONALIZANDO CONTENIDO PARA TU EMPRESA...',
      'DISEÑANDO RUTA DE CAPACITACIÓN...',
      'CASI LISTO, DANDO ÚLTIMOS TOQUES...',
    ];

    if (isLoadingSuggestions) {
      messages = [
        'BUSCANDO EN EL REPOSITORIO...',
        'ANALIZANDO TENDENCIAS...',
        'GENERANDO OPCIONES RELEVANTES...',
        'REFINANDO TÍTULOS SUGERIDOS...',
        'PREPARANDO PROPUESTAS...',
      ];
    } else if (isSearchingCatalog) {
      messages = [
        'BUSCANDO EN EL CATÁLOGO...',
        'FILTRANDO POR RELEVANCIA...',
        'IDENTIFICANDO COINCIDENCIAS SEMÁNTICAS...',
        'PREPARANDO RESULTADOS...',
      ];
    }

    let currentIndex = 0;
    setLoadingMessage(messages[0]);
    
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % messages.length;
      setLoadingMessage(messages[currentIndex]);
    }, 2500);

    return () => clearInterval(interval);
  }, [isLoading, isLoadingSuggestions, isSearchingCatalog]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleHelp = (id: string) => {
    setActiveHelp(activeHelp === id ? null : id);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const supportedTypes = ['application/pdf', 'text/plain', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!supportedTypes.includes(file.type) && !file.name.endsWith('.txt')) {
      alert("Formato no soportado. Por favor sube un PDF, archivo de texto o imagen (PNG/JPG).");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      const data = base64Data.split(',')[1];
      const newFile = {
        data,
        mimeType: file.type || 'application/octet-stream',
        name: file.name
      };
      
      setProposalFile(newFile);
      setShowUploadChoice(true);
      
      // Auto-fill suggestions if they are empty
      if (!topic.trim()) {
        setTopic(file.name.replace(/\.[^/.]+$/, "").split('_').join(' ').split('-').join(' '));
      }
      if (!audience.trim()) {
        setAudience('Público extraído de la propuesta');
      }
    };
    reader.readAsDataURL(file);
  };

  const removeFile = () => {
    setProposalFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const goToStart = () => {
    setFormStep(1);
    setSelectedLevel(null);
    setProposalData(null);
  };

  const resetForm = () => {
    setTopic('');
    setCustomTitle('');
    setAudience('');
    setDepth('Intermedio');
    setTargetCompany('');
    setSpecialFocus('');
    setPreferredDuration('');
    setProposalFile(null);
    setFormStep(1);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isFormValid = 
    targetCompany.trim().length > 0 &&
    specialFocus.trim().length > 0 &&
    topic.trim().length > 0 &&
    audience.trim().length > 0 &&
    preferredDuration.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    console.log('Form submitted. isFormValid:', isFormValid);
    if (isFormValid) {
      console.log('Calling onStart with params:', {
        topic: topic.trim(),
        audience: audience.trim(),
        depth,
        targetCompany: targetCompany.trim(),
        specialFocus: specialFocus.trim(),
        preferredDuration: preferredDuration.trim(),
        customTitle: customTitle.trim() || undefined,
        proposalFile: proposalFile || undefined
      });
      onStart({
        topic: topic.trim(),
        audience: audience.trim(),
        depth,
        targetCompany: targetCompany.trim(),
        specialFocus: specialFocus.trim(),
        preferredDuration: preferredDuration.trim(),
        customTitle: customTitle.trim() || undefined,
        proposalFile: proposalFile || undefined
      });
    } else {
      // If form is not valid, try to show which fields are missing
      const missing = [];
      if (!targetCompany.trim()) missing.push('Empresa');
      if (!specialFocus.trim()) missing.push('Foco');
      if (!topic.trim()) missing.push('Tema');
      if (!audience.trim()) missing.push('Público');
      if (!preferredDuration.trim()) missing.push('Duración');
      
      if (missing.length > 0) {
        setFormError(`Por favor completa los siguientes campos: ${missing.join(', ')}`);
        console.warn('Formulario incompleto:', missing.join(', '));
      }
    }
  };

  const handleCatalogSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsSearchingCatalog(true);
    setShowCatalogModal(true); // Open modal immediately to show searching state
    
    // First, do a basic keyword filter as a baseline
    const keywordResults = courseCatalog.filter(course => 
      course.title.toLowerCase().includes(topic.toLowerCase()) ||
      course.category.toLowerCase().includes(topic.toLowerCase()) ||
      course.area.toLowerCase().includes(topic.toLowerCase()) ||
      course.objective.toLowerCase().includes(topic.toLowerCase()) ||
      course.content.toLowerCase().includes(topic.toLowerCase()) ||
      course.benefits.toLowerCase().includes(topic.toLowerCase()) ||
      course.targetAudience.toLowerCase().includes(topic.toLowerCase())
    );

    if (keywordResults.length > 0) {
      setCatalogResults(keywordResults.map(r => ({ ...r, reasoning: 'Coincidencia directa por palabras clave.' })));
    } else {
      setCatalogResults([]); // Clear previous results while searching
    }

    try {
      // Then, use AI to find semantic relationships and reasoning in the background
      const aiResults = await searchCatalogWithAI(topic, courseCatalog);
      
      // Merge results: prioritize keyword matches but include AI reasoned ones
      const mergedResults = courseCatalog
        .map(course => {
          const aiMatch = aiResults.find(r => r.id === course.id);
          const isKeywordMatch = keywordResults.some(r => r.id === course.id);
          
          if (aiMatch || isKeywordMatch) {
            const result: CatalogCourse & { reasoning?: string } = {
              ...course,
              reasoning: aiMatch?.reasoning || (isKeywordMatch ? 'Coincidencia directa por palabras clave.' : undefined)
            };
            return result;
          }
          return null;
        })
        .filter((c): c is (CatalogCourse & { reasoning?: string }) => c !== null);

      setCatalogResults(mergedResults);
      // Always show the modal after AI search completes if it's not already open
      // This ensures the user sees a "No results" message instead of "nothing happening"
      if (!showCatalogModal) {
        setShowCatalogModal(true);
      }
    } catch (error) {
      console.error("Error searching catalog:", error);
      // If AI fails and we haven't shown results yet, show the modal (it will show keyword results or empty state)
      if (!showCatalogModal) {
        setShowCatalogModal(true);
      }
    } finally {
      setIsSearchingCatalog(false);
    }
  };

  const handleGoToSuggestions = async () => {
    if (!topic.trim()) return;
    setIsLoadingSuggestions(true);
    try {
      const suggestions = await generateTitleSuggestions(topic);
      setTitleSuggestions(suggestions);
      setFormStep(1.5);
    } catch (error) {
      console.error("Error generating suggestions:", error);
      setFormStep(2); // Fallback to step 2 if suggestions fail
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const selectCatalogCourse = (course: CatalogCourse) => {
    if (onSelectCatalogCourse) {
      onSelectCatalogCourse(course);
    } else {
      setTopic(course.title);
      setAudience(course.targetAudience);
      setPreferredDuration(`${course.hours} horas`);
      setSpecialFocus(`Basado en el curso del catálogo: ${course.id}. ${course.category}`);
      setTargetCompany('Empresa Cliente'); // Set a default to ensure form validity
      setShowCatalogModal(false);
      setFormStep(2);
    }
  };

  const handleGoToLevelSelection = (selectedTopic?: string) => {
    if (selectedTopic) setTopic(selectedTopic);
    setFormStep(1.6);
  };

  const handleSelectLevel = (level: CourseContext['depth']) => {
    setSelectedLevel(level);
    const proposal = {
      topic,
      level,
      hours: level === 'Básico' ? '8 horas' : level === 'Intermedio' ? '16 horas' : '24 horas',
      price: level === 'Básico' ? '$450.000 COP' : level === 'Intermedio' ? '$850.000 COP' : '$1.250.000 COP',
      leaderMessage: `Este programa de ${topic} en nivel ${level} ha sido diseñado por nuestros expertos para garantizar una curva de aprendizaje óptima, enfocada en resultados tangibles para su organización.`,
      characteristics: [
        'Metodología de aprendizaje acelerado',
        'Casos prácticos reales de la industria',
        'Material didáctico premium incluido',
        'Certificación con validez curricular'
      ]
    };
    setProposalData(proposal);
    setFormStep(1.7);
  };

  const handleModifyProposal = () => {
    if (proposalData) {
      setDepth(proposalData.level);
      setPreferredDuration(proposalData.hours);
      setAudience(`Personal nivel ${proposalData.level}`);
      setTargetCompany('Empresa Cliente');
      setSpecialFocus(`Enfoque en ${topic} - Nivel ${proposalData.level}`);
    }
    setFormStep(2);
  };

  const handleAcceptProposal = () => {
    console.log('handleAcceptProposal called');
    if (proposalData) {
      console.log('Accepting proposal with data:', proposalData);
      onStart({
        topic: topic.trim(),
        audience: `Personal nivel ${proposalData.level}`,
        depth: proposalData.level,
        targetCompany: 'Empresa Cliente',
        specialFocus: `Enfoque en ${topic} - Nivel ${proposalData.level}`,
        preferredDuration: proposalData.hours,
      });
    }
  };

  const renderHelpText = (id: string, text: string) => {
    if (activeHelp !== id) return null;
    return (
      <div className="mt-2 p-3 bg-orange-50 border border-orange-100 rounded-xl animate-scale-in">
        <p className="text-[11px] font-medium text-orange-800 leading-relaxed italic">
          {text}
        </p>
      </div>
    );
  };

  const renderHelpTrigger = (id: string) => (
    <button 
      type="button" 
      onClick={() => toggleHelp(id)}
      className="inline-flex items-center gap-1 text-[9px] font-black text-slate-300 hover:text-orange-500 transition-colors uppercase tracking-widest ml-2 group"
    >
      <HelpCircle className="w-3 h-3 group-hover:scale-110 transition-transform" /> ayuda
    </button>
  );

  const mandatoryBadge = <span className="ml-2 text-[8px] text-orange-400 font-bold border border-orange-100 px-2 py-0.5 rounded-md">OBLIGATORIO</span>;
  const optionalBadge = <span className="ml-2 text-[8px] text-slate-300 font-bold border border-slate-100 px-2 py-0.5 rounded-md">OPCIONAL</span>;

  const handleDirectGeneration = () => {
    const finalContext: CourseContext = {
      topic: topic.trim() || 'Extraído del documento',
      audience: audience.trim() || 'Público extraído del documento',
      depth,
      targetCompany: targetCompany.trim() || 'Empresa extraída del documento',
      specialFocus: specialFocus.trim() || 'Foco extraído del documento',
      preferredDuration: preferredDuration.trim() || 'Duración recomendada',
      customTitle: customTitle.trim() || undefined,
      proposalFile: proposalFile || undefined
    };
    onStart(finalContext);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in font-['Montserrat']">
      {/* Catalog Search Results Modal */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-3xl rounded-[3rem] p-10 shadow-2xl animate-scale-in flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                  <Search className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Resultados en Catálogo</h2>
                  <p className="text-slate-500 font-medium">Encontramos {catalogResults.length} coincidencias para "{topic}"</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCatalogModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-4 space-y-4 custom-scrollbar">
              {isSearchingCatalog && catalogResults.length === 0 ? (
                <div className="text-center py-20 space-y-6">
                  <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-xl font-black text-slate-800 uppercase tracking-tight">Buscando en el catálogo...</p>
                  <p className="text-slate-500 font-medium italic">{loadingMessage}</p>
                </div>
              ) : catalogResults.length > 0 ? (
                catalogResults.map((course) => (
                  <div 
                    key={course.id}
                    onClick={() => selectCatalogCourse(course)}
                    className="p-6 border-2 border-slate-50 bg-slate-50/50 rounded-3xl hover:border-orange-500 hover:bg-white transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-orange-100 text-orange-700 text-[10px] font-black rounded-lg uppercase tracking-wider">
                            {course.id}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {course.area} • {course.hours} HORAS
                          </span>
                        </div>
                        <h3 className="text-xl font-black text-slate-800 group-hover:text-orange-600 transition-colors">
                          {course.title}
                        </h3>
                        {course.reasoning && (
                          <div className="flex items-start gap-2 p-3 bg-orange-50/50 border border-orange-100 rounded-xl">
                            <Sparkles className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-orange-800 font-medium italic">
                              {course.reasoning}
                            </p>
                          </div>
                        )}
                        <p className="text-sm text-slate-500 line-clamp-2 font-medium">
                          {course.objective}
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all">
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 space-y-8">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                    <Search className="w-10 h-10 text-slate-300" />
                  </div>
                  <div className="space-y-4">
                    <p className="text-2xl font-black text-slate-800">No hay coincidencias exactas</p>
                    <p className="text-xl font-black text-orange-600 uppercase tracking-tight max-w-md mx-auto">
                      ¿No es lo que buscabas? Cierra esta ventana y usa el buscador del repositorio
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowCatalogModal(false);
                      handleGoToSuggestions();
                    }}
                    className="px-8 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-3 mx-auto group"
                  >
                    BUSCAR CURSOS EN EL REPOSITORIO ESPECIALIZADO
                    <Sparkles className="w-5 h-5 text-orange-400 group-hover:rotate-12 transition-transform" />
                  </button>
                </div>
              )}
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col items-center gap-6">
              <button
                onClick={() => setShowCatalogModal(false)}
                className="group flex items-center gap-2 text-xs font-black text-slate-400 hover:text-orange-600 uppercase tracking-widest transition-all"
              >
                <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                Regresar a la búsqueda
              </button>
              {catalogResults.length > 0 && (
                <p className="text-lg font-black text-orange-600 uppercase tracking-tight text-center">
                  ¿No es lo que buscabas? Cierra esta ventana y usa el buscador del repositorio
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Document Upload Choice Modal */}
      {showUploadChoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl animate-scale-in text-center space-y-8">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
              <FileUp className="w-10 h-10 text-orange-600" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-black text-slate-900">Documento Cargado</h2>
              <p className="text-slate-500 font-medium">¿Cómo deseas proceder con el análisis de <span className="text-orange-600 font-bold">{proposalFile?.name}</span>?</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={handleDirectGeneration}
                className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-3 group"
              >
                <Sparkles className="w-5 h-5 text-orange-400 group-hover:rotate-12 transition-transform" />
                GENERAR PROPUESTA PRELIMINAR DIRECTAMENTE
              </button>
              <button
                onClick={() => setShowUploadChoice(false)}
                className="w-full py-5 bg-white border-2 border-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
              >
                <Building2 className="w-5 h-5 text-orange-500" />
                AJUSTAR PARÁMETROS MANUALMENTE
              </button>
            </div>
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Podrás editar la propuesta preliminar después de generarla</p>
          </div>
        </div>
      )}

      <div className="text-center mb-10">
        <button 
          onClick={goToStart}
          className="hover:opacity-80 transition-opacity cursor-pointer mb-10 active:scale-95"
          title="Ir al inicio"
        >
          <Logo size={150} vertical />
        </button>
        {formStep === 1 ? (
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 px-6 py-2 bg-white text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-10 border border-orange-100 shadow-xl shadow-orange-100/50">
               <ShieldCheck className="w-4 h-4" /> CADEMMY LEARNING SAS • MENTOR VIRTUAL
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-800 mb-6 leading-none tracking-tight px-4">
              Catálogo de cursos <span className="text-orange-500 block md:inline">2026</span>
            </h1>
            <div className="space-y-4 max-w-3xl mx-auto">
              <p className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                Tu Aliado en Capacitación Cademmy
              </p>
              <p className="text-lg text-slate-500 font-medium leading-relaxed mb-8">
                "¡Bienvenido al Catálogo de Cursos Cademmy 2026! Estoy aquí para ayudarte a localizar la formación exacta que tu empresa necesita. Si no encuentras el tema específico en nuestra lista principal, no te preocupes: nuestro buscador especializado lo localizará en nuestro repositorio y te presentará la opción que tenemos del curso al instante.
                <br /><br />
                <span className="text-slate-600 font-bold italic">Nota importante:</span> Si deseas realizar ajustes a la propuesta presentada, puedes adelantarlos directamente en el sistema antes de nuestra cita. De esta manera, cuando te reúnas con uno de nuestros asesores ejecutivos, ya tendremos una base sólida sobre tus necesidades específicas para discutirlas a detalle."
              </p>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in py-8">
            <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tight">
              Detalles de la <span className="text-orange-500">Capacitación</span>
            </h2>
            <p className="text-slate-500 font-medium mt-4 text-lg">
              Nombre del curso: <span className="text-slate-900 font-bold italic">"{topic}"</span>
            </p>
          </div>
        )}
      </div>

      <form 
        onSubmit={(e) => {
          e.preventDefault();
          if (formStep === 1) {
            if (topic.trim()) handleGoToSuggestions();
          } else if (formStep === 2) {
            handleSubmit(e);
          }
        }} 
        className="bg-white p-8 md:p-12 rounded-[3rem] border border-slate-200 shadow-2xl shadow-slate-200/50 space-y-12"
      >
        
        {formStep === 1 ? (
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-3">
                <div className="flex items-center flex-wrap gap-y-1">
                    <label className="flex items-center gap-2 text-[11px] font-black text-slate-800 uppercase tracking-[0.15em]">
                        <GraduationCap className="w-4 h-4 text-orange-500" /> NOMBRE DEL CURSO:
                    </label>
                    {mandatoryBadge}
                    {renderHelpTrigger('topic')}
                </div>
                {renderHelpText('topic', 'Escribe el nombre del curso que deseas buscar o diseñar.')}
                <input
                    type="text"
                    required
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Ej: Liderazgo Híbrido..."
                    className="w-full px-8 py-5 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-orange-500 outline-none transition-all font-bold text-slate-700 shadow-sm"
                />
            </div>
            <div className="grid grid-cols-1 gap-4">
              <button
                type="button"
                onClick={handleCatalogSearch}
                disabled={!topic.trim() || isSearchingCatalog || isLoadingSuggestions}
                className="w-full py-7 bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 font-black text-2xl rounded-2xl shadow-xl transition-all flex items-center justify-center gap-4 disabled:opacity-30 disabled:cursor-not-allowed group hover:scale-[1.01]"
              >
                {isSearchingCatalog ? loadingMessage : 'BUSCAR CURSOS EN EL CATÁLOGO'}
                <Search className="w-7 h-7 text-orange-500 group-hover:scale-110 transition-transform" />
              </button>
              
              <div className="flex items-center gap-4 py-2">
                <div className="flex-1 h-px bg-slate-100"></div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] whitespace-nowrap">
                  Si no encontraste lo que buscabas búscalo en el repositorio
                </p>
                <div className="flex-1 h-px bg-slate-100"></div>
              </div>

              <button
                type="button"
                onClick={handleGoToSuggestions}
                disabled={!topic.trim() || isLoadingSuggestions}
                className="w-full py-7 bg-slate-900 hover:bg-black text-white font-black text-2xl rounded-2xl shadow-2xl shadow-slate-200 transition-all flex items-center justify-center gap-4 disabled:opacity-30 disabled:cursor-not-allowed group hover:scale-[1.01]"
              >
                {isLoadingSuggestions ? loadingMessage : 'BUSCAR CURSOS EN EL REPOSITORIO ESPECIALIZADO'}
                <Sparkles className="w-7 h-7 text-orange-400 group-hover:rotate-12 transition-transform" />
              </button>
            </div>
          </div>
        ) : formStep === 1.5 ? (
          <div className="space-y-10 animate-fade-in text-center">
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Confirma el enfoque del curso</h3>
              <p className="text-slate-500 font-medium">Hemos analizado tu solicitud. ¿Cuál de estos títulos se ajusta mejor a lo que buscas?</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* Original Choice */}
              <button
                type="button"
                onClick={() => {
                  handleGoToLevelSelection();
                }}
                className="p-8 bg-orange-50 border-2 border-orange-200 text-orange-900 rounded-[2rem] hover:border-orange-500 hover:bg-white transition-all text-left group relative overflow-hidden"
              >
                <div className="relative z-10">
                  <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest block mb-2">Tu búsqueda original</span>
                  <span className="text-2xl font-black block">{topic}</span>
                </div>
                <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-100 transition-opacity">
                  <CheckCircle2 className="w-10 h-10 text-orange-500" />
                </div>
              </button>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-100"></span>
                </div>
                <span className="relative bg-white px-6 text-[10px] font-black text-slate-300 uppercase tracking-widest">Otras sugerencias profesionales</span>
              </div>

              {/* Suggestions */}
              {titleSuggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    handleGoToLevelSelection(suggestion);
                  }}
                  className="p-8 bg-white border-2 border-slate-100 text-slate-700 rounded-[2rem] hover:border-orange-500 hover:shadow-xl transition-all text-left group flex items-center justify-between"
                >
                  <span className="text-xl font-black group-hover:text-orange-600 transition-colors">{suggestion}</span>
                  <ArrowRight className="w-6 h-6 text-slate-200 group-hover:text-orange-500 group-hover:translate-x-2 transition-all" />
                </button>
              ))}

              {/* Manual Entry Option */}
              <button
                type="button"
                onClick={() => setFormStep(2)}
                className="p-8 bg-slate-50 border-2 border-dashed border-slate-200 text-slate-500 rounded-[2rem] hover:border-orange-500 hover:bg-white hover:text-orange-600 transition-all text-left group flex items-center justify-between mt-4"
              >
                <div className="space-y-1">
                  <span className="text-lg font-black block">¿Ninguno de estos?</span>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Definir parámetros manualmente (Sector, Título, etc.)</span>
                </div>
                <ArrowRight className="w-6 h-6 text-slate-200 group-hover:text-orange-500 group-hover:translate-x-2 transition-all" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setFormStep(1)}
              className="group flex items-center gap-2 text-xs font-black text-slate-400 hover:text-orange-600 uppercase tracking-widest transition-all mx-auto"
            >
              <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
              Regresar al inicio
            </button>
          </div>
        ) : formStep === 1.6 ? (
          <div className="space-y-10 animate-fade-in text-center">
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Selecciona el nivel de profundidad</h3>
              <p className="text-slate-500 font-medium">¿Para qué nivel de experiencia debemos diseñar el curso de <span className="text-slate-900 font-bold">"{topic}"</span>?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { id: 'Básico', icon: GraduationCap, color: 'emerald', desc: 'Fundamentos y conceptos base', 
                  bg: 'bg-emerald-50', border: 'border-emerald-500', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
                { id: 'Intermedio', icon: Zap, color: 'blue', desc: 'Aplicación práctica y técnica',
                  bg: 'bg-blue-50', border: 'border-blue-500', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
                { id: 'Avanzado', icon: Sparkles, color: 'orange', desc: 'Estrategia y maestría experta',
                  bg: 'bg-orange-50', border: 'border-orange-500', iconBg: 'bg-orange-100', iconColor: 'text-orange-600' }
              ].map((level) => (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => handleSelectLevel(level.id as any)}
                  className={`p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-4 group hover:scale-105 ${
                    selectedLevel === level.id 
                      ? `${level.bg} ${level.border}` 
                      : 'bg-white border-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${level.iconBg} ${level.iconColor} group-hover:scale-110 transition-transform`}>
                    <level.icon className="w-8 h-8" />
                  </div>
                  <div>
                    <span className={`block text-lg font-black ${level.iconColor} uppercase tracking-widest`}>{level.id}</span>
                    <span className="text-xs font-medium text-slate-400 mt-1 block">{level.desc}</span>
                  </div>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setFormStep(1.5)}
              className="group flex items-center gap-2 text-xs font-black text-slate-400 hover:text-orange-600 uppercase tracking-widest transition-all mx-auto"
            >
              <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
              Regresar a las sugerencias
            </button>
          </div>
        ) : formStep === 1.7 && proposalData ? (
          <div className="space-y-10 animate-fade-in">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-100 mb-4">
                <Sparkles className="w-3 h-3" /> Propuesta de Diseño Inicial
              </div>
              <h3 className="text-4xl font-black text-slate-900 tracking-tight leading-none">{proposalData.topic}</h3>
              <p className="text-slate-500 font-medium">Nivel {proposalData.level} • Diseño sugerido por Mentor Virtual</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-slate-50 p-8 rounded-[2.5rem] space-y-6 border border-slate-100">
                <div className="flex items-center gap-3 text-slate-900">
                  <Clock className="w-5 h-5 text-orange-500" />
                  <span className="text-sm font-black uppercase tracking-widest">Duración Estimada</span>
                </div>
                <p className="text-3xl font-black text-slate-800">{proposalData.hours}</p>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border-2 border-orange-100 space-y-6 shadow-xl shadow-orange-100/20">
                <div className="flex items-center gap-3 text-slate-900">
                  <MessageSquare className="w-5 h-5 text-orange-500" />
                  <span className="text-sm font-black uppercase tracking-widest">Mensaje del Líder Pedagógico</span>
                </div>
                <p className="text-slate-600 font-medium italic leading-relaxed">
                  "{proposalData.leaderMessage}"
                </p>
                <div className="flex items-center gap-3 pt-4">
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-black">C</div>
                  <div>
                    <p className="text-xs font-black text-slate-900 uppercase">Cademmy Mentor</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Learning Expert</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-10 rounded-[3rem] text-white space-y-6">
              <h4 className="text-sm font-black uppercase tracking-[0.3em] text-orange-400">Características del Curso</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {proposalData.characteristics.map((char: string, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span className="text-sm font-bold text-slate-200">{char}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={handleAcceptProposal}
                className="py-6 bg-orange-500 hover:bg-orange-600 text-white font-black text-xl rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-orange-200 px-8"
              >
                MOSTRAR FORMULARIO PARA PRESENTAR UNA PROPUESTA PRELIMINAR
                <ArrowRight className="w-6 h-6" />
              </button>
              <a
                href="https://calendar.app.google/z6m5yZ6m5yZ6m5yZ6"
                target="_blank"
                rel="noopener noreferrer"
                className="py-6 bg-white border-2 border-slate-200 text-slate-700 hover:border-orange-500 font-black text-xl rounded-2xl transition-all flex items-center justify-center gap-3"
              >
                AGENDAR UNA CITA
                <Calendar className="w-6 h-6 text-orange-500" />
              </a>
            </div>

            <button
              type="button"
              onClick={() => setFormStep(1.6)}
              className="group flex items-center gap-2 text-xs font-black text-slate-400 hover:text-orange-600 uppercase tracking-widest transition-all mx-auto"
            >
              <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
              Regresar al nivel de profundidad
            </button>
          </div>
        ) : (
          <div className="space-y-12 animate-fade-in">
            <button 
              type="button"
              onClick={() => setFormStep(1)}
              className="group flex items-center gap-2 text-xs font-black text-orange-600 uppercase tracking-widest hover:translate-x-[-4px] transition-all"
            >
              <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
              Regresar al inicio
            </button>

            {/* PARÁMETROS INICIALES: Empresa y Foco */}
            <div className="space-y-8">
                <div className="space-y-3">
                    <div className="flex items-center flex-wrap gap-y-1">
                        <label className="flex items-center gap-2 text-[11px] font-black text-slate-800 uppercase tracking-[0.15em]">
                            <BookOpen className="w-4 h-4 text-orange-500" /> TEMA O NOMBRE DEL CURSO
                        </label>
                        {mandatoryBadge}
                    </div>
                    <input
                        type="text"
                        required
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Ej: Liderazgo Transformacional / Ventas Consultivas"
                        className="w-full px-8 py-5 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-orange-500 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 shadow-sm"
                    />
                </div>

                <div className="space-y-3">
                    <div className="flex items-center flex-wrap gap-y-1">
                        <label className="flex items-center gap-2 text-[11px] font-black text-slate-800 uppercase tracking-[0.15em]">
                            <Building2 className="w-4 h-4 text-orange-500" /> 1. EMPRESA O INDUSTRIA
                        </label>
                        {mandatoryBadge}
                        {renderHelpTrigger('company')}
                    </div>
                    {renderHelpText('company', 'Indica el nombre de tu empresa o el sector industrial.')}
                    <input
                        type="text"
                        required
                        value={targetCompany}
                        onChange={(e) => setTargetCompany(e.target.value)}
                        placeholder="Ej: Sector Bancario / No sé..."
                        className="w-full px-8 py-5 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-orange-500 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 shadow-sm"
                    />
                </div>

                <div className="space-y-3">
                    <div className="flex items-center flex-wrap gap-y-1">
                        <label className="flex items-center gap-2 text-[11px] font-black text-slate-800 uppercase tracking-[0.15em]">
                            <MessageSquare className="w-4 h-4 text-orange-500" /> 2. FOCO ESPECIAL / PETICIÓN
                        </label>
                        {mandatoryBadge}
                        {renderHelpTrigger('focus')}
                    </div>
                    {renderHelpText('focus', 'Especifica requerimientos como normas ISO o enfoques especiales.')}
                    <textarea
                        required
                        value={specialFocus}
                        onChange={(e) => setSpecialFocus(e.target.value)}
                        placeholder="Ej: Incluir normas ISO / Recomiéndame..."
                        rows={4}
                        className="w-full px-8 py-5 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-orange-500 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 shadow-sm resize-none"
                    />
                </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-100"></span>
              </div>
              <div className="relative flex justify-center text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
                <span className="bg-white px-8">Definición de Competencias</span>
              </div>
            </div>

            {/* Tema y Público */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                    <div className="flex items-center flex-wrap gap-y-1">
                        <label className="flex items-center gap-2 text-[11px] font-black text-slate-800 uppercase tracking-[0.15em]">
                            <FileText className="w-4 h-4 text-orange-500" /> TÍTULO PERSONALIZADO (OPCIONAL)
                        </label>
                        {optionalBadge}
                        {renderHelpTrigger('customTitle')}
                    </div>
                    {renderHelpText('customTitle', 'Si ya tienes un nombre definitivo para el curso, escríbelo aquí.')}
                    <input
                        type="text"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        placeholder="Ej: Programa de Alto Desempeño 2024"
                        className="w-full px-8 py-5 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-orange-500 outline-none transition-all font-bold text-slate-700 shadow-sm"
                    />
                </div>

                <div className="space-y-3">
                    <div className="flex items-center flex-wrap gap-y-1">
                        <label className="flex items-center gap-2 text-[11px] font-black text-slate-800 uppercase tracking-[0.15em]">
                            <Users className="w-4 h-4 text-orange-500" /> 4. PÚBLICO OBJETIVO
                        </label>
                        {mandatoryBadge}
                        {renderHelpTrigger('audience')}
                    </div>
                    {renderHelpText('audience', 'Define quién tomará el curso.')}
                    <input
                        type="text"
                        required
                        value={audience}
                        onChange={(e) => setAudience(e.target.value)}
                        placeholder="Ej: Gerentes / Recomiéndame..."
                        className="w-full px-8 py-5 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-orange-500 outline-none transition-all font-bold text-slate-700 shadow-sm"
                    />
                </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center flex-wrap gap-y-1">
                <label className="flex items-center gap-2 text-[11px] font-black text-slate-800 uppercase tracking-[0.15em]">
                  <Zap className="w-4 h-4 text-orange-500" /> 5. NIVEL DE PROFUNDIDAD
                </label>
                {mandatoryBadge}
                {renderHelpTrigger('depth')}
              </div>
              {renderHelpText('depth', "Selecciona el rigor técnico.")}
              <div className="grid grid-cols-3 gap-4">
                {(['Básico', 'Intermedio', 'Avanzado'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDepth(level)}
                    className={`py-5 rounded-2xl border-2 text-[11px] font-black transition-all uppercase tracking-widest ${
                      depth === level 
                      ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm' 
                      : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* CAMPO 6: HORAS DEL CURSO */}
            <div className="space-y-3">
                <div className="flex items-center flex-wrap gap-y-1">
                    <label className="flex items-center gap-2 text-[11px] font-black text-slate-800 uppercase tracking-[0.15em]">
                        <Clock className="w-4 h-4 text-orange-500" /> 6. PREFERENCIA DE HORAS / DURACIÓN
                    </label>
                    {mandatoryBadge}
                    {renderHelpTrigger('hours')}
                </div>
                {renderHelpText('hours', 'El número de horas es PROPORCIONAL a la profundidad.')}
                <input
                    type="text"
                    required
                    value={preferredDuration}
                    onChange={(e) => setPreferredDuration(e.target.value)}
                    placeholder="Ej: 20 horas / Recomiéndame..."
                    className="w-full px-8 py-5 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-orange-500 outline-none transition-all font-bold text-slate-700 shadow-sm"
                />
            </div>

            {/* CAMPO 7: INSUMO BASE */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-wrap gap-y-1">
                    <label className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">
                        <FileUp className="w-4 h-4 text-orange-500" /> 7. CARGAR DOCUMENTO PARA ANÁLISIS
                    </label>
                    {optionalBadge}
                    {renderHelpTrigger('file')}
                </div>
              </div>
              {renderHelpText('file', 'Carga manuales o briefs para personalizar el contenido.')}
              
              {!proposalFile ? (
                <div 
                  onClick={() => !isLoading && fileInputRef.current?.click()}
                  className={`border-2 border-dashed border-slate-100 rounded-[2rem] p-16 flex flex-col items-center justify-center gap-6 transition-all cursor-pointer group ${isLoading ? 'opacity-50 cursor-not-allowed' : 'bg-slate-50/20 hover:bg-orange-50 hover:border-orange-400'}`}
                >
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <Upload className="w-10 h-10 text-orange-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-black text-slate-800 uppercase tracking-tight">Sube Insumos o Cursos a Actualizar</p>
                    <p className="text-xs font-bold text-slate-400 mt-2 italic px-8">Analizaremos el contenido para proponer mejoras y personalización total</p>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept=".pdf,.txt,.png,.jpg,.jpeg,.webp"
                    disabled={isLoading}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between p-8 bg-slate-900 text-white rounded-[2rem] shadow-xl animate-scale-in">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
                      <FileText className="w-8 h-8 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-lg font-black leading-none">{proposalFile.name}</p>
                      <p className="text-[10px] font-black text-orange-400 uppercase mt-2 tracking-widest">Insumo Cargado Correctamente</p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); removeFile(); }}
                    className="p-3 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                  >
                    <X className="w-7 h-7" />
                  </button>
                </div>
              )}
            </div>

            <div className="pt-4">
              {formError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 animate-shake">
                  <X className="w-5 h-5 text-red-500" />
                  <p className="text-xs font-bold text-red-600 uppercase tracking-tight">{formError}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-7 bg-slate-900 hover:bg-black text-white font-black text-2xl rounded-2xl shadow-2xl shadow-slate-200 transition-all flex items-center justify-center gap-4 disabled:opacity-30 disabled:cursor-not-allowed group hover:scale-[1.01]"
              >
                {isLoading ? loadingMessage : 'GENERAR PROPUESTA PRELIMINAR'}
                <Sparkles className="w-7 h-7 text-orange-400 group-hover:rotate-12 transition-transform" />
              </button>
              {!isFormValid && !isLoading && (
                <p className="text-center mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                  Completa los campos obligatorios para continuar
                </p>
              )}
              
              <button
                type="button"
                onClick={resetForm}
                className="w-full mt-6 py-4 bg-white border-2 border-slate-100 text-slate-400 hover:text-slate-600 hover:border-slate-200 font-black text-xs rounded-2xl transition-all uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Limpiar formulario y empezar de nuevo
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};