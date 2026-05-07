import React, { useState, useRef, useEffect } from 'react';
import { Logo } from './Logo';
import { Sparkles, Upload, ShieldCheck, Zap, GraduationCap, Users, FileText, X, FileUp, Building2, MessageSquare, HelpCircle, Clock, Search, ArrowRight, CheckCircle2, BookOpen, Calendar, Target, Plus, Trash2, Edit2, ArrowUp, ArrowDown } from 'lucide-react';
import { Course, CourseContext } from '../types';
import { courseCatalog, CatalogCourse } from '../data/catalog';
import { generateTitleSuggestions, searchCatalogWithAI, generateThemesForCourse } from '../services/geminiService';
import { trackMetric, MetricType } from '../services/metricsService';
import { BOOKING_URL } from '../constants';

interface StepInputProps {
  onStart: (context: CourseContext) => void;
  onSelectCatalogCourse?: (course: CatalogCourse & { rephrasedTitle?: string; executiveSummary?: string }) => void;
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
  const [industry, setIndustry] = useState(initialContext?.industry || '');
  const [companySize, setCompanySize] = useState(initialContext?.companySize || '');
  const [userRole, setUserRole] = useState(initialContext?.userRole || '');
  const [specialFocus, setSpecialFocus] = useState(initialContext?.specialFocus || '');
  const [preferredDuration, setPreferredDuration] = useState(initialContext?.preferredDuration || '');
  const [desiredOutcome, setDesiredOutcome] = useState(initialContext?.desiredOutcome || '');
  const [confirmedThemes, setConfirmedThemes] = useState<string[]>(initialContext?.confirmedThemes || []);
  const [isGeneratingThemes, setIsGeneratingThemes] = useState(false);
  const [editingThemeIndex, setEditingThemeIndex] = useState<number | null>(null);
  const [newThemeValue, setNewThemeValue] = useState('');
  const [proposalFile, setProposalFile] = useState<CourseContext['proposalFile'] | null>(initialContext?.proposalFile || null);
  const [activeHelp, setActiveHelp] = useState<string | null>(null);
  const [showUploadChoice, setShowUploadChoice] = useState(false);
  const [formStep, setFormStep] = useState(initialContext ? 2 : 1);
  const [catalogResults, setCatalogResults] = useState<(CatalogCourse & { 
    reasoning?: string; 
    rephrasedTitle?: string; 
    businessImpact?: string[]; 
    alignmentScore?: number;
    executiveSummary?: string;
  })[]>([]);
  const [isSearchingCatalog, setIsSearchingCatalog] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isTransitioningToCustom, setIsTransitioningToCustom] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<CourseContext['depth'] | null>(null);
  const [proposalData, setProposalData] = useState<any>(null);
  const [loadingMessage, setLoadingMessage] = useState('ANALIZANDO PARÁMETROS...');
  const [microStage, setMicroStage] = useState('');

  const PRICE_PER_HOUR = 1990;
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  useEffect(() => {
    const isLoadingAny = isLoading || isLoadingSuggestions || isSearchingCatalog || isGeneratingThemes;
    
    if (!isLoadingAny) {
      setLoadingMessage('ANALIZANDO PARÁMETROS...');
      return;
    }

    let messages = [
      'ANALIZANDO PARÁMETROS...',
      'EVALUANDO REPOSITORIO DE SOLUCIONES...',
      'ESTRUCTURANDO SOLUCIÓN ESTRATÉGICA...',
      'OPTIMIZANDO IMPACTO ORGANIZACIONAL...',
      'PERSONALIZANDO PARA TU CONTEXTO EMPRESARIAL...',
      'DISEÑANDO ARQUITECTURA DE CAPACITACIÓN...',
      'PREPARANDO PROPUESTA EJECUTIVA...',
    ];

    if (isGeneratingThemes) {
      messages = [
        'MAPEO DE TEMAS ESTRATÉGICOS...',
        'ANALIZANDO COMPETENCIAS REQUERIDAS...',
        'ESTRUCTURANDO RUTA DE APRENDIZAJE...',
        'DEFINIENDO EJES DE LA INTERVENCIÓN...',
        'CONSULTANDO MEJORES PRÁCTICAS...',
      ];
    } else if (isLoadingSuggestions) {
      messages = [
        'CONSULTANDO MODELOS DE DESEMPEÑO...',
        'ANALIZANDO TENDENCIAS EMPRESARIALES...',
        'GENERANDO RUTAS DE SOLUCIÓN...',
        'REFINANDO PROPUESTAS ESTRATÉGICAS...',
        'PREPARANDO ESCENARIOS...',
      ];
    } else if (isSearchingCatalog) {
      messages = [
        'ANALIZANDO BRECHAS ORGANIZACIONALES...',
        'ARQUITECTANDO PROPUESTA DE CAPACITACIÓN...',
        'EVALUANDO IMPACTO ESPERADO Y CONTEXTO OPERATIVO...',
        'PREPARANDO DESPLIEGUE ESTRATÉGICO...',
      ];
    }

    let currentIndex = 0;
    setLoadingMessage(messages[0]);
    
    // Strategic micro-stages rotate faster to increase perception of depth
    const microStages = [
      'Correlacionando brechas de desempeño...',
      'Analizando impacto organizacional...',
      'Priorizando soluciones de capacitación...',
      'Estructurando arquitectura formativa...',
      'Evaluando ROI proyectado...',
      'Sincronizando con objetivos de negocio...'
    ];
    let microIndex = 0;
    setMicroStage(microStages[0]);
    
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % messages.length;
      setLoadingMessage(messages[currentIndex]);
    }, 2500);

    const microInterval = setInterval(() => {
      microIndex = (microIndex + 1) % microStages.length;
      setMicroStage(microStages[microIndex]);
    }, 1500);

    return () => {
      clearInterval(interval);
      clearInterval(microInterval);
    };
  }, [isLoading, isLoadingSuggestions, isSearchingCatalog, isGeneratingThemes]);
  
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
    setIndustry('');
    setSpecialFocus('');
    setPreferredDuration('');
    setProposalFile(null);
    setFormStep(1);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isFormValid = 
    targetCompany.trim().length > 0 &&
    industry.trim().length > 0 &&
    topic.trim().length > 0 &&
    audience.trim().length > 0 &&
    preferredDuration.trim().length > 0 &&
    desiredOutcome.trim().length > 0;

  const isContextValid = 
    targetCompany.trim().length > 0 &&
    industry.trim().length > 0 &&
    companySize.trim().length > 0 &&
    userRole.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (isFormValid) {
      setIsGeneratingThemes(true);
      try {
        const themeSuggestions = await generateThemesForCourse({
          topic,
          audience,
          depth,
          targetCompany,
          industry,
          specialFocus,
          preferredDuration,
          desiredOutcome,
          customTitle: customTitle || undefined,
          proposalFile: proposalFile || undefined
        });
        setConfirmedThemes(themeSuggestions);
        setFormStep(1.9); // Step for editing themes
      } catch (error) {
        console.error("Error generating themes:", error);
        setFormError("Error al generar temas iniciales. Reintentando...");
      } finally {
        setIsGeneratingThemes(false);
      }
    } else {
      // If form is not valid, try to show which fields are missing
      const missing = [];
      if (!targetCompany.trim()) missing.push('Empresa');
      if (!industry.trim()) missing.push('Industria');
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

  const handleUnifiedSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    trackMetric(MetricType.SEARCH_PERFORMED, { query: topic.trim() });
    
    // 1. Initial State: Show modal with loader immediately for feedback
    setCatalogResults([]);
    setTitleSuggestions([]);
    setIsSearchingCatalog(true);
    setShowCatalogModal(true);
    setLoadingMessage('IDENTIFICANDO LA MEJOR SOLUCIÓN...');

    try {
      // 2. Parallelize: AI Catalog Search AND Title Suggestions
      const [aiCatalogResults, suggestions] = await Promise.all([
        searchCatalogWithAI(topic, courseCatalog, {
          industry,
          company: targetCompany,
          role: userRole,
          problem: topic
        }).catch(err => {
          console.error("Catalog search error:", err);
          return [] as any[];
        }),
        generateTitleSuggestions(topic).catch(err => {
          console.error("Suggestions error:", err);
          return [] as string[];
        })
      ]);
      
      setTitleSuggestions(suggestions);
      
      // 3. Robust Keyword Match Fallback (Split terms for better coverage)
      const searchTerms = topic.toLowerCase().split(/\s+/).filter(t => t.length > 2);
      const keywordResults = courseCatalog.filter(course => {
        const fullText = `${course.title} ${course.area} ${course.objective} ${course.category}`.toLowerCase();
        // Match if any significant term is present
        return searchTerms.some(term => fullText.includes(term)) || fullText.includes(topic.toLowerCase());
      });

      // 4. Merge results (prefer AI reasoning if available)
      const mergedResults = courseCatalog
        .map(course => {
          const aiMatch = aiCatalogResults.find(r => r.id === course.id);
          const isKeywordMatch = keywordResults.some(r => r.id === course.id);
          
          if (aiMatch || isKeywordMatch) {
            return {
              ...course,
              reasoning: aiMatch?.reasoning || (isKeywordMatch ? 'Identificado por relevancia temática.' : undefined),
              rephrasedTitle: aiMatch?.rephrasedTitle,
              businessImpact: aiMatch?.businessImpact,
              alignmentScore: aiMatch?.alignmentScore || (isKeywordMatch ? 85 : undefined),
              executiveSummary: aiMatch?.executiveSummary
            };
          }
          return null;
        })
        .filter((c): c is any => c !== null)
        .sort((a, b) => (b.alignmentScore || 0) - (a.alignmentScore || 0));

      // 5. Handling outcome
      if (mergedResults.length > 0) {
        // Hits found -> Show them in the modal
        setCatalogResults(mergedResults);
        setIsSearchingCatalog(false);
      } else {
        // NO catalog hits -> Close modal and AUTOMATE transition to Step 1.5 or 2
        setCatalogResults([]);
        setIsSearchingCatalog(false);
        setShowCatalogModal(false);
        
        if (suggestions.length > 0) {
          setFormStep(1.5);
        } else {
          setFormStep(2);
        }
      }
    } catch (error) {
      console.error("Unified search critical error:", error);
      setIsSearchingCatalog(false);
      setShowCatalogModal(false);
      setFormStep(2);
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

  const selectCatalogCourse = (course: CatalogCourse & { rephrasedTitle?: string; executiveSummary?: string }) => {
    // We handle the selection locally to allow axis confirmation before generation
    setTopic(course.rephrasedTitle || course.title);
    setDesiredOutcome(course.executiveSummary || course.objective);
    setAudience(course.targetAudience);
    setPreferredDuration(`${course.hours} horas`);
    setSpecialFocus(`Arquitectura de solución estratégica: ${course.id}. ${course.category}`);
    setTargetCompany(targetCompany || 'Empresa Cliente'); 
    setShowCatalogModal(false);
    
    // Extract themes/axes from catalog content for review
    const themes = course.content
      .split(/\d+\.\s+/)
      .filter(t => t.trim().length > 0)
      .map(t => t.trim());
    
    if (themes.length > 0) {
      setConfirmedThemes(themes);
      setFormStep(1.9); // Go to Strategic Axes Review step
    } else {
      setFormStep(2); // Fallback to details form if no structure found
    }
    
    // Explicitly track the selection
    trackMetric(MetricType.CATALOG_VIEWED, { 
      title: course.title,
      industry: course.area,
      category: course.category,
      source: 'catalog_modal'
    });
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
      setIndustry('Industria General');
      setSpecialFocus(`Enfoque en ${topic} - Nivel ${proposalData.level}`);
    }
    setFormStep(2);
  };

  const handleFinalizeProposal = () => {
    onStart({
      topic: topic.trim(),
      audience: audience.trim(),
      depth,
      targetCompany: targetCompany.trim(),
      industry: industry.trim(),
      companySize,
      userRole,
      specialFocus: specialFocus.trim(),
      preferredDuration: preferredDuration.trim(),
      desiredOutcome: desiredOutcome.trim(),
      confirmedThemes: confirmedThemes,
      customTitle: customTitle.trim() || undefined,
      proposalFile: proposalFile || undefined
    });
  };

  const handleAddTheme = () => {
    setConfirmedThemes([...confirmedThemes, 'Nuevo Tema']);
    setEditingThemeIndex(confirmedThemes.length);
    setNewThemeValue('Nuevo Tema');
  };

  const handleRemoveTheme = (index: number) => {
    setConfirmedThemes(confirmedThemes.filter((_, i) => i !== index));
  };

  const handleUpdateTheme = (index: number, value: string) => {
    const updated = [...confirmedThemes];
    updated[index] = value;
    setConfirmedThemes(updated);
    setEditingThemeIndex(null);
  };

  const handleMoveTheme = (index: number, direction: 'up' | 'down') => {
    const newThemes = [...confirmedThemes];
    if (direction === 'up' && index > 0) {
      [newThemes[index], newThemes[index - 1]] = [newThemes[index - 1], newThemes[index]];
    } else if (direction === 'down' && index < confirmedThemes.length - 1) {
      [newThemes[index], newThemes[index + 1]] = [newThemes[index + 1], newThemes[index]];
    }
    setConfirmedThemes(newThemes);
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
      industry: industry.trim() || 'Industria extraída del documento',
      companySize,
      userRole,
      specialFocus: specialFocus.trim() || 'Foco extraído del documento',
      preferredDuration: preferredDuration.trim() || 'Duración recomendada',
      desiredOutcome: desiredOutcome.trim() || 'Objetivo extraído del documento',
      customTitle: customTitle.trim() || undefined,
      proposalFile: proposalFile || undefined
    };
    onStart(finalContext);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 md:px-12 py-8 md:py-20 animate-fade-in font-['Montserrat']">
      {/* Catalog Search Results Modal */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/90 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-3xl rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-10 shadow-2xl animate-scale-in flex flex-col max-h-[95vh] sm:max-h-[90vh]">
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                  <Search className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-lg md:text-2xl font-black text-slate-900 leading-tight">
                    {catalogResults.length > 0 && !isTransitioningToCustom ? 'Arquitecturas de solución recomendadas' : 'Exploración estratégica de soluciones'}
                  </h2>
                  <p className="text-[10px] md:text-base text-slate-500 font-medium">
                    {catalogResults.length > 0 && !isTransitioningToCustom
                      ? 'Basándonos en tu diagnóstico, hemos identificado las siguientes intervenciones estratégicas para impactar el desempeño organizacional'
                      : 'Tu necesidad requiere una correlación estratégica más profunda.'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowCatalogModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors shrink-0"
              >
                <X className="w-5 h-5 md:w-6 md:h-6 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 sm:pr-4 space-y-4 custom-scrollbar min-h-[300px] flex flex-col">
              {isSearchingCatalog ? (
                <div className="flex-1 flex items-center justify-center py-20">
                  <div className="text-center space-y-8 animate-fade-in relative overflow-hidden">
                    <div className="relative z-10 space-y-6">
                      <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto">
                        <Sparkles className="w-10 h-10 text-orange-400 animate-pulse" />
                      </div>
                      <div className="space-y-3">
                        <p className="text-2xl font-black text-slate-800 tracking-tight">Analizando brechas organizacionales...</p>
                        <p className="text-slate-600 font-bold max-w-sm mx-auto px-6 italic">
                          Nuestro motor está estructurando una solución alineada a tu contexto organizacional.
                        </p>
                        <div className="h-6 flex items-center justify-center">
                          <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] animate-pulse">
                            {microStage}
                          </p>
                        </div>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest pt-2">
                          Considerando industria, tamaño organizacional, rol y prioridad estratégica.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : catalogResults.length > 0 ? (
                <div className="space-y-4 pb-4 animate-fade-in">
                  {catalogResults.map((course, index) => (
                    <div 
                      key={course.id}
                      onClick={() => selectCatalogCourse(course)}
                      className="p-4 sm:p-6 border-2 border-slate-50 bg-slate-50/50 rounded-3xl hover:border-orange-500 hover:bg-white transition-all cursor-pointer group shadow-sm hover:shadow-orange-100/50 relative overflow-hidden"
                    >
                      {course.alignmentScore && (
                        <div className="absolute top-0 right-0 px-4 py-2 bg-slate-900 text-white text-[10px] font-black rounded-bl-2xl flex items-center gap-2">
                           <Zap className="w-3 h-3 text-orange-400" />
                           {course.alignmentScore}% ALINEACIÓN ESTRATÉGICA
                        </div>
                      )}

                      {index === 0 && (
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                          <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Recomendación prioritaria</span>
                        </div>
                      )}
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-4 w-full">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-3 py-1 bg-orange-100 text-orange-700 text-[10px] font-black rounded-lg uppercase tracking-wider">
                              {course.id}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              {course.area} • {course.hours} HORAS
                            </span>
                          </div>
                          
                          <div className="space-y-1">
                            <h3 className="text-lg sm:text-2xl font-black text-slate-800 group-hover:text-orange-600 transition-colors leading-tight">
                              {course.rephrasedTitle || course.title}
                            </h3>
                            {course.rephrasedTitle && (
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Basado en: {course.title}
                              </p>
                            )}
                          </div>
                          
                          <p className="text-sm text-slate-500 font-medium leading-relaxed">
                            {course.executiveSummary || course.objective}
                          </p>

                          {course.businessImpact && course.businessImpact.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                              {course.businessImpact.map((impact, i) => (
                                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-orange-50/50 border border-orange-100 rounded-xl">
                                  <CheckCircle2 className="w-3 h-3 text-orange-500 shrink-0" />
                                  <span className="text-[9px] font-black text-orange-800 uppercase tracking-tight">{impact}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {course.reasoning && (
                            <div className="flex items-start gap-2 p-3 bg-white border border-slate-100 rounded-xl">
                              <Target className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                              <p className="text-xs text-slate-600 font-medium italic">
                                {course.reasoning}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 group-hover:bg-orange-500 group-hover:text-white transition-all">
                          <ArrowRight className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center py-20">
                  <div className="text-center space-y-6 animate-fade-in bg-white rounded-[3rem] border border-slate-100 shadow-sm p-12">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                      <Search className="w-10 h-10 text-slate-200" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-2xl font-black text-slate-800 uppercase tracking-tight">Estructurando arquitectura de solución</p>
                      <p className="text-slate-500 font-medium max-w-sm mx-auto">
                        Tu necesidad requiere una correlación estratégica más profunda. Nuestro motor está estructurando una solución alineada a tu contexto organizacional.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col items-center gap-6">
              <button
                onClick={() => setShowCatalogModal(false)}
                className="group flex items-center gap-2 text-xs font-black text-slate-400 hover:text-orange-600 uppercase tracking-widest transition-all"
              >
                <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
                Volver
              </button>
              
              {catalogResults.length > 0 && !isLoadingSuggestions && (
                <div className="w-full space-y-8 animate-fade-in-up">
                  <div className="p-10 bg-slate-50 border border-slate-100 rounded-[2.5rem] text-center space-y-4">
                    <p className="text-xl font-black text-slate-800 tracking-tight">¿Deseas validar esta arquitectura con un experto?</p>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-lg mx-auto">
                      Un asesor ejecutivo puede ayudarte a correlacionar estas soluciones con tus prioridades de negocio y KPIs.
                    </p>
                    <a 
                      href={BOOKING_URL} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-3 px-8 py-4 bg-orange-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-700 transition-all shadow-lg shadow-orange-100"
                    >
                      <Calendar className="w-4 h-4" /> SOLICITAR ASESORÍA EJECUTIVA
                    </a>
                  </div>

                  <div className="w-full space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="h-px flex-1 bg-slate-100"></div>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">¿Necesitas algo más específico?</p>
                      <div className="h-px flex-1 bg-slate-100"></div>
                    </div>
                    
                    <button
                      onClick={() => {
                        setShowCatalogModal(false);
                        setFormStep(2);
                      }}
                      className="w-full py-4 bg-orange-500 text-white font-black text-xs rounded-2xl hover:bg-orange-600 transition-all flex items-center justify-center gap-2 uppercase tracking-widest shadow-lg shadow-orange-100"
                    >
                      <Target className="w-4 h-4" />
                      Solicitar arquitectura personalizada
                    </button>
                  </div>
                </div>
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

      <div className="text-center mb-8 md:mb-16">
        {formStep === 1 ? (
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 px-6 py-2 bg-white text-orange-600 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-8 md:mb-12 border border-orange-100 shadow-xl shadow-orange-100/50">
               <ShieldCheck className="w-4 h-4" /> MOTOR ESTRATÉGICO 2026
            </div>
            
            <div className="space-y-4 md:space-y-6 mb-8 md:mb-12">
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-slate-800 leading-none tracking-tight px-2">
                Diagnóstico de <span className="text-orange-500 block md:inline">necesidades de capacitación</span>
              </h1>
                  <p className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight">
                    Analiza brechas y estructura una solución estratégica personalizada
                  </p>
                </div>
    
                <div className="max-w-3xl mx-auto space-y-6 md:space-y-8">
                  <div className="space-y-4">
                    <p className="text-base md:text-lg text-slate-500 font-medium leading-relaxed px-4">
                      Nuestro motor de arquitectura analizará tu contexto organizacional para generar una propuesta alineada a tus objetivos de desempeño.
                    </p>
                <div className="flex flex-wrap justify-center gap-4 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-orange-400" /> Sin costo inicial</span>
                  <span className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-orange-400" /> Sin instalación</span>
                  <span className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-orange-400" /> Acceso inmediato</span>
                </div>
              </div>

              <div className="bg-orange-50/50 border border-orange-100 rounded-[2rem] p-6 md:p-8 text-left shadow-sm mx-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center shrink-0 mt-1">
                    <Target className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="text-[10px] md:text-xs font-black text-orange-800 uppercase tracking-widest mb-2">PRECISIÓN ORGANIZACIONAL:</h4>
                    <p className="text-xs md:text-sm text-orange-900/70 font-medium leading-relaxed italic">
                      Las recomendaciones industriales consideran contexto operativo, dimensión organizacional y objetivos estratégicos de desempeño.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in py-4 md:py-8">
            <h2 className="text-3xl md:text-4xl font-black text-slate-800 uppercase tracking-tight">
              Validación de la <span className="text-orange-500">arquitectura de solución</span>
            </h2>
            <div className="h-1 w-20 bg-orange-500 mx-auto mt-6 rounded-full"></div>
            <p className="text-slate-500 font-medium mt-6 text-base md:text-lg px-4">
              Basados en tu diagnóstico organizacional, hemos estructurado la intervención más prospectiva para tu ecosistema empresarial.
            </p>
          </div>
        )}
      </div>

      <form 
        onSubmit={(e) => {
          e.preventDefault();
          if (formStep === 1) {
            if (topic.trim()) handleUnifiedSearch(e);
          } else if (formStep === 2) {
            handleSubmit(e);
          }
        }} 
        className="bg-white p-6 sm:p-8 md:p-12 rounded-[2.5rem] md:rounded-[3rem] border border-slate-200 shadow-2xl shadow-slate-200/50 space-y-8 md:space-y-12"
      >
        
        {formStep === 1 ? (
          <div className="space-y-10 animate-fade-in">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-10 h-10 text-orange-600" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Contexto Organizacional</h2>
              <p className="text-slate-500 font-medium max-w-xl mx-auto">
                Para entregarte una arquitectura de capacitación precisa, necesitamos entender el entorno donde se aplicará.
              </p>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="block text-[11px] font-black text-slate-800 uppercase tracking-widest">Empresa o Cliente</label>
                  <input
                    type="text"
                    required
                    value={targetCompany}
                    onChange={(e) => setTargetCompany(e.target.value)}
                    placeholder="Eje: Banco Nacional / Empresa X"
                    className="w-full px-8 py-5 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-orange-500 outline-none transition-all font-bold text-slate-700"
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-[11px] font-black text-slate-800 uppercase tracking-widest">Sector o Industria</label>
                  <input
                    type="text"
                    required
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="Eje: Fintech / Retail / Salud"
                    className="w-full px-8 py-5 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-orange-500 outline-none transition-all font-bold text-slate-700"
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-[11px] font-black text-slate-800 uppercase tracking-widest">Tamaño de la Organización</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['1-50', '51-200', '201-500', '500+'].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setCompanySize(size)}
                        className={`py-4 rounded-xl text-[10px] font-black transition-all border-2 uppercase tracking-widest ${
                          companySize === size 
                            ? 'bg-orange-500 border-orange-600 text-white shadow-lg shadow-orange-100' 
                            : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        {size} Colaboradores
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="block text-[11px] font-black text-slate-800 uppercase tracking-widest">Tu Rol</label>
                  <input
                    type="text"
                    required
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value)}
                    placeholder="Eje: Gerente RH / Director de Área"
                    className="w-full px-8 py-5 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-orange-500 outline-none transition-all font-bold text-slate-700"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={!isContextValid}
              onClick={() => setFormStep(1.1)}
              className="w-full py-6 bg-slate-900 hover:bg-black text-white font-black text-xl rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-30 group"
            >
              CONTINUAR AL DIAGNÓSTICO
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        ) : formStep === 1.1 ? (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center space-y-4 mb-8">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-10 h-10 text-orange-600" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Diagnóstico de Desafío Estratégico</h2>
              <p className="text-slate-500 font-medium max-w-xl mx-auto">
                Define el desafío central o la brecha de desempeño que has identificado en tu equipo.
              </p>
            </div>

            <div className="space-y-3">
                <div className="flex items-center flex-wrap gap-y-1">
                    <label className="flex items-center gap-2 text-[11px] font-black text-slate-800 uppercase tracking-[0.15em]">
                        <GraduationCap className="w-4 h-4 text-orange-500" /> DESAFÍO ORGANIZACIONAL A RESOLVER:
                    </label>
                    {mandatoryBadge}
                    {renderHelpTrigger('topic')}
                </div>
                {renderHelpText('topic', 'Escribe el nombre de la solución o eje estratégico que deseas buscar o diseñar.')}
                <input
                    type="text"
                    required
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Eje: Bajo desempeño de mandos medios / Alta rotación en supervisores / Falta de liderazgo híbrido"
                    className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-bold text-slate-800 text-lg md:text-xl placeholder:text-slate-300 shadow-inner"
                    />
                <p className="text-[10px] font-bold text-slate-400 mt-2 ml-1 italic">
                  El sistema priorizará soluciones considerando impacto operativo, liderazgo, productividad y desempeño.
                </p>
                <p className="text-[10px] font-bold text-orange-500 mt-2 ml-1 italic">
                  👉 Entre más específico sea el desafío, más precisa y accionable será la arquitectura de capacitación.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormStep(1)}
                className="py-6 bg-white border-2 border-slate-100 text-slate-400 font-black text-xl rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
              >
                <ArrowRight className="w-5 h-5 rotate-180" />
                MODIFICAR CONTEXTO
              </button>
              <button
                onClick={(e) => handleUnifiedSearch(e)}
                disabled={!topic.trim() || isSearchingCatalog}
                className="py-6 bg-slate-900 border-2 border-slate-900 text-white hover:bg-black font-black text-xl rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-30 group"
              >
                {isSearchingCatalog ? 'CONSULTANDO...' : 'GENERAR ARQUITECTURA'}
                <Sparkles className="w-6 h-6 text-orange-500 group-hover:rotate-12 transition-transform" />
              </button>
            </div>
          </div>
        ) : formStep === 1.9 ? (
          <div className="space-y-10 animate-fade-in">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-10 h-10 text-orange-600" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Confirma los Ejes Estratégicos</h2>
              <p className="text-slate-500 font-medium max-w-xl mx-auto">
                Hemos estructurado esta propuesta inicial de temas basándonos en tus necesidades. Puedes agregar, quitar o modificar cualquier tema antes de generar la propuesta completa.
              </p>
            </div>

            <div className="space-y-4">
              {confirmedThemes.map((theme, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-4 p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl group hover:border-orange-200 hover:bg-white transition-all shadow-sm"
                >
                  <div className="w-8 h-8 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center text-xs font-black text-slate-400 shrink-0">
                    {index + 1}
                  </div>

                  <div className="flex flex-col gap-0.5 ml-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveTheme(index, 'up')}
                      className="p-1 text-slate-300 hover:text-orange-500 disabled:opacity-0 transition-all"
                      title="Subir tema"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={index === confirmedThemes.length - 1}
                      onClick={() => handleMoveTheme(index, 'down')}
                      className="p-1 text-slate-300 hover:text-orange-500 disabled:opacity-0 transition-all"
                      title="Bajar tema"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                  
                  {editingThemeIndex === index ? (
                    <div className="flex-1 flex gap-2">
                       <input
                        autoFocus
                        type="text"
                        value={newThemeValue}
                        onChange={(e) => setNewThemeValue(e.target.value)}
                        onBlur={() => handleUpdateTheme(index, newThemeValue)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdateTheme(index, newThemeValue);
                          if (e.key === 'Escape') setEditingThemeIndex(null);
                        }}
                        className="flex-1 px-4 py-2 bg-white border-2 border-orange-500 rounded-xl outline-none font-bold text-slate-700"
                      />
                      <button 
                        onClick={() => handleUpdateTheme(index, newThemeValue)}
                        className="p-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-between">
                      <span className="font-bold text-slate-700">{theme}</span>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingThemeIndex(index);
                            setNewThemeValue(theme);
                          }}
                          className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all"
                          title="Editar tema"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveTheme(index)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Eliminar tema"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddTheme}
                className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-2 text-slate-400 font-bold hover:border-orange-400 hover:text-orange-500 hover:bg-orange-50/50 transition-all group"
              >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                Agregar Nuevo Tema
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
              <button
                type="button"
                onClick={() => setFormStep(2)}
                className="py-6 bg-white border-2 border-slate-200 text-slate-500 font-black text-xl rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
              >
                <ArrowRight className="w-5 h-5 rotate-180" />
                REGRESAR AL FORMULARIO
              </button>
              <button
                type="button"
                onClick={handleFinalizeProposal}
                disabled={confirmedThemes.length === 0}
                className="py-6 bg-slate-900 border-2 border-slate-900 text-white hover:bg-black font-black text-xl rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-30 group"
              >
                CONFIRMAR TEMARIO Y GENERAR ESTRATEGIA
                <Zap className="w-5 h-5 text-orange-400 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        ) : formStep === 1.5 ? (
          <div className="space-y-10 animate-fade-in text-center">
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] leading-tight">Selecciona la línea de solución que mejor se alinea con tu necesidad</h3>
              <p className="text-slate-500 font-medium">Estas opciones representan diferentes enfoques para resolver el problema identificado. Selecciona el que mejor se ajusta a tu contexto.</p>
              <p className="text-[10px] font-bold text-orange-500 italic mt-2">
                👉 Este paso nos permite afinar la propuesta antes de presentarte una solución completa.
              </p>
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
                  <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest block mb-2">Necesidad identificada en tu organización</span>
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
                className="p-8 bg-orange-50/30 border-2 border-dashed border-orange-200 text-orange-900 rounded-[2rem] hover:border-orange-500 hover:bg-white hover:text-orange-600 transition-all text-left group flex items-center justify-between mt-4"
              >
                <div className="space-y-1">
                  <span className="text-lg font-black block">¿Quieres validar un enfoque más específico?</span>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Diseñar propuesta a medida para validación estratégica</span>
                </div>
                <Sparkles className="w-6 h-6 text-orange-300 group-hover:text-orange-500 transition-all" />
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
              <p className="text-slate-500 font-medium">¿Para qué nivel de experiencia debemos diseñar la arquitectura de <span className="text-slate-900 font-bold">"{topic}"</span>?</p>
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
                <ShieldCheck className="w-3 h-3" /> Propuesta Estratégica
              </div>
              <h3 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Propuesta de capacitación para tu organización</h3>
              <p className="text-slate-500 font-medium">Con base en tu necesidad, identificamos la siguiente solución para mejorar el desempeño en tu organización:</p>
              <div className="py-10 px-12 bg-white border-2 border-slate-100 rounded-[3rem] inline-block mt-4 transition-all hover:border-orange-500 group shadow-2xl shadow-slate-100 max-w-4xl mx-auto">
                 <span className="text-[10px] md:text-xs font-black text-orange-500 uppercase tracking-widest block mb-4 opacity-70">Título Recomendado para tu organización</span>
                 <span className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight leading-tight block">{proposalData.topic}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-slate-50 p-8 rounded-[2.5rem] space-y-6 border border-slate-100">
                <div className="flex items-center gap-3 text-slate-900">
                  <Clock className="w-5 h-5 text-orange-500" />
                  <span className="text-sm font-black uppercase tracking-widest">Duración Estimada</span>
                </div>
                <p className="text-3xl font-black text-slate-800">{proposalData.hours}</p>
              </div>

              <div className="bg-orange-600 p-8 rounded-[2.5rem] space-y-6 text-white shadow-xl shadow-orange-100/50">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-orange-200" />
                  <span className="text-sm font-black uppercase tracking-widest">Inversión Estimada</span>
                </div>
                <p className="text-3xl font-black">{formatCurrency(parseInt(proposalData.hours) * PRICE_PER_HOUR)}</p>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border-2 border-orange-100 space-y-6 shadow-xl shadow-orange-100/20 md:col-span-2">
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
              <h4 className="text-sm font-black uppercase tracking-[0.3em] text-orange-400">Atributos de la Solución</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(proposalData?.characteristics || []).map((char: string, i: number) => (
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
                onClick={handleFinalizeProposal}
                className="py-6 bg-orange-500 hover:bg-orange-600 text-white font-black text-xl rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-orange-200 px-8"
              >
                Personalizar solución
                <ArrowRight className="w-6 h-6" />
              </button>
              <a
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="py-6 bg-white border-2 border-slate-200 text-slate-700 hover:border-orange-500 font-black text-xl rounded-2xl transition-all flex items-center justify-center gap-3"
              >
                Hablar con un consultor estratégico
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
                            <BookOpen className="w-4 h-4 text-orange-500" /> TEMA O EJE ESTRATÉGICO
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                      <div className="flex items-center flex-wrap gap-y-1">
                          <label className="flex items-center gap-2 text-[11px] font-black text-slate-800 uppercase tracking-[0.15em]">
                              <Building2 className="w-4 h-4 text-orange-500" /> 1. EMPRESA O CLIENTE
                          </label>
                          {mandatoryBadge}
                          {renderHelpTrigger('company')}
                      </div>
                      {renderHelpText('company', 'Indica el nombre de tu empresa.')}
                      <input
                          type="text"
                          required
                          value={targetCompany}
                          onChange={(e) => setTargetCompany(e.target.value)}
                          placeholder="Ej: Banco Nacional / Empresa X"
                          className="w-full px-8 py-5 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-orange-500 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 shadow-sm"
                      />
                  </div>

                  <div className="space-y-3">
                      <div className="flex items-center flex-wrap gap-y-1">
                          <label className="flex items-center gap-2 text-[11px] font-black text-slate-800 uppercase tracking-[0.15em]">
                              <Target className="w-4 h-4 text-orange-500" /> 2. SECTOR O INDUSTRIA
                          </label>
                          {mandatoryBadge}
                          {renderHelpTrigger('industry')}
                      </div>
                      {renderHelpText('industry', 'Indica el sector industrial o giro de negocio.')}
                      <input
                          type="text"
                          required
                          value={industry}
                          onChange={(e) => setIndustry(e.target.value)}
                          placeholder="Ej: Fintech / Retail / Salud"
                          className="w-full px-8 py-5 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-orange-500 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 shadow-sm"
                      />
                  </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center flex-wrap gap-y-1">
                        <label className="flex items-center gap-2 text-[11px] font-black text-slate-800 uppercase tracking-[0.15em]">
                            <MessageSquare className="w-4 h-4 text-orange-500" /> 3. FOCO ESPECIAL / PETICIÓN
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
                            <FileText className="w-4 h-4 text-orange-500" /> 4. TÍTULO PERSONALIZADO (OPCIONAL)
                        </label>
                        {optionalBadge}
                        {renderHelpTrigger('customTitle')}
                    </div>
                    {renderHelpText('customTitle', 'Si ya tienes un nombre definitivo para la solución, escríbelo aquí.')}
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
                            <Users className="w-4 h-4 text-orange-500" /> 5. PÚBLICO OBJETIVO
                        </label>
                        {mandatoryBadge}
                        {renderHelpTrigger('audience')}
                    </div>
                    {renderHelpText('audience', 'Define el perfil de impacto organizacional.')}
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

            <div className="space-y-3">
                <div className="flex items-center flex-wrap gap-y-1">
                    <label className="flex items-center gap-2 text-[11px] font-black text-slate-800 uppercase tracking-[0.15em]">
                        <Target className="w-4 h-4 text-orange-500" /> 6. ¿QUÉ QUIERES LOGRAR CON ESTA SOLUCIÓN?
                    </label>
                    {mandatoryBadge}
                    {renderHelpTrigger('outcome')}
                </div>
                {renderHelpText('outcome', 'Describe los resultados esperados o el cambio que buscas en los participantes para definir el objetivo central.')}
                <textarea
                    required
                    value={desiredOutcome}
                    onChange={(e) => setDesiredOutcome(e.target.value)}
                    placeholder="Ej: Que los gerentes sean capaces de dar feedback constructivo sin generar conflicto y mejoren el clima laboral en un 20%..."
                    rows={3}
                    className="w-full px-8 py-5 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-orange-500 outline-none transition-all font-bold text-slate-700 shadow-sm resize-none"
                />
            </div>

            <div className="space-y-4">
               <div className="flex items-center flex-wrap gap-y-1">
                 <label className="flex items-center gap-2 text-[11px] font-black text-slate-800 uppercase tracking-[0.15em]">
                   <Zap className="w-4 h-4 text-orange-500" /> 7. NIVEL DE PROFUNDIDAD
                 </label>
                {mandatoryBadge}
                {renderHelpTrigger('depth')}
              </div>
              {renderHelpText('depth', "Selecciona el rigor técnico.")}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
                {(['Básico', 'Intermedio', 'Avanzado'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDepth(level)}
                    className={`py-4 md:py-5 rounded-2xl border-2 text-[10px] md:text-[11px] font-black transition-all uppercase tracking-widest ${
                      depth === level 
                      ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm' 
                      : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200'
                    } ${level === 'Avanzado' ? 'col-span-2 sm:col-span-1' : ''}`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* CAMPO 8: HORAS DEL CURSO */}
            <div className="space-y-4">
                <div className="flex items-center flex-wrap gap-y-1">
                    <label className="flex items-center gap-2 text-[11px] font-black text-slate-800 uppercase tracking-[0.15em]">
                        <Clock className="w-4 h-4 text-orange-500" /> 8. PREFERENCIA DE HORAS / DURACIÓN
                    </label>
                    {mandatoryBadge}
                    {renderHelpTrigger('hours')}
                </div>
                {renderHelpText('hours', 'El número de horas es PROPORCIONAL a la profundidad.')}
                
                <div className="flex flex-col sm:flex-row gap-4">
                    <input
                        type="text"
                        required
                        value={preferredDuration}
                        onChange={(e) => setPreferredDuration(e.target.value)}
                        placeholder="Ej: 20 horas / 3 días"
                        className="flex-1 px-6 md:px-8 py-4 md:py-5 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-orange-500 outline-none transition-all font-bold text-slate-700 shadow-sm"
                    />
                    <button
                        type="button"
                        onClick={() => setPreferredDuration('Recomiéndame')}
                        className={`px-6 md:px-8 py-4 md:py-5 rounded-2xl border-2 font-black text-[10px] md:text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 whitespace-nowrap min-h-[56px] ${
                            preferredDuration === 'Recomiéndame'
                            ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-100'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-orange-500 hover:text-orange-600'
                        }`}
                    >
                        <Sparkles className={`w-4 h-4 ${preferredDuration === 'Recomiéndame' ? 'text-white' : 'text-orange-500'}`} />
                        <span className="sm:hidden lg:inline">RECOMIÉNDAME</span>
                        <span className="hidden sm:inline lg:hidden">REC.</span>
                    </button>
                </div>
            </div>

            {/* CAMPO 7: INSUMO BASE */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-wrap gap-y-1">
                    <label className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">
                        <FileUp className="w-4 h-4 text-orange-500" /> 9. CARGAR DOCUMENTO PARA ANÁLISIS
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
                    <p className="text-xl font-black text-slate-800 uppercase tracking-tight">Sube Insumos o Programas a Diagnosticar</p>
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
                disabled={isLoading || isGeneratingThemes}
                className="w-full py-6 md:py-7 bg-slate-900 hover:bg-black text-white font-black text-lg md:text-2xl rounded-2xl shadow-2xl shadow-slate-200 transition-all flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 disabled:opacity-30 disabled:cursor-not-allowed group hover:scale-[1.01]"
              >
                <span className="text-center">{(isLoading || isGeneratingThemes) ? 'DIAGNOSTICANDO...' : 'CONSTRUIR ARQUITECTURA DE SOLUCIÓN'}</span>
                <Sparkles className="w-6 md:w-7 h-6 md:h-7 text-orange-400 group-hover:rotate-12 transition-transform" />
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