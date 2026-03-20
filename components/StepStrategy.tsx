
import React, { useState } from 'react';
import { Logo } from './Logo';
import { CourseStrategy, ModuleOutline } from '../types';
import { CheckCircle, Clock, Users, Target, BookOpen, Edit3, Save, X, Sparkles, ArrowRight, Layers, GraduationCap, ChevronDown, ChevronUp, Search, FileText, Share2, MessageCircle, MapPin, Mail, Phone, Zap, BrainCircuit, Briefcase, UserCircle, Globe, Calendar } from 'lucide-react';
import { asBlob } from 'html-docx-js-typescript';
import { BOOKING_URL } from '../src/constants';

interface StepStrategyProps {
  strategy: CourseStrategy;
  onBack: () => void;
  onConfirm: (strategy: CourseStrategy) => void;
  isLoading: boolean;
}

export const StepStrategy: React.FC<StepStrategyProps> = ({ strategy, onBack, onConfirm, isLoading }) => {
  const [editedStrategy, setEditedStrategy] = useState<CourseStrategy>(strategy);

  const PRICE_PER_HOUR = 1990;
  const totalHours = editedStrategy.syllabus.reduce((acc, m) => acc + m.hours, 0);
  const totalInvestment = totalHours * PRICE_PER_HOUR;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const cleanModuleTitle = (title: string) => {
    return title.replace(/^Módulo\s+\d+[:\s-]*/i, '').trim();
  };

  const cleanObjective = (obj: string) => {
    return obj.replace(/^Al finalizar el curso,?\s+(el participante|el asistente|el alumno)\s+/i, '')
              .replace(/^Al finalizar el curso,?\s+/i, '')
              .replace(/^(el participante|el asistente|el alumno)\s+/i, '');
  };

  const isConocerCertification = editedStrategy.title.toLowerCase().includes('certificación') || 
                                 editedStrategy.title.toLowerCase().includes('conocer') ||
                                 editedStrategy.category?.toLowerCase().includes('certificación') ||
                                 editedStrategy.category?.toLowerCase().includes('conocer');

  const leaderQuote = isConocerCertification 
    ? "En 2026, Cademmy impulsa una nueva forma de capacitación: aprendizaje activo, evidencia defendible y tecnología aplicada, con una ruta clara hacia certificaciones CONOCER."
    : "En 2026, Cademmy impulsa una nueva forma de capacitación: aprendizaje activo, evidencia defendible y tecnología aplicada, con programas diseñados bajo los estándares de competencia de CONOCER.";

  const getBloomLevel = (objective: string) => {
    const text = objective.toLowerCase();
    // Look for keywords anywhere in the text, but prioritize the first verb found after the prefix
    if (text.match(/(crear|diseñar|ensamblar|construir|formular|investigar|desarrollar|generar|producir)/)) return { level: 'Crear', color: 'bg-purple-100 text-purple-700 border-purple-200' };
    if (text.match(/(evaluar|argumentar|defender|juzgar|seleccionar|apoyar|valorar|criticar|justificar)/)) return { level: 'Evaluar', color: 'bg-red-100 text-red-700 border-red-200' };
    if (text.match(/(analizar|calcular|categorizar|comparar|contrastar|diferenciar|discriminar|distinguir|examinar|experimentar|cuestionar)/)) return { level: 'Analizar', color: 'bg-orange-100 text-orange-700 border-orange-200' };
    if (text.match(/(aplicar|calcular|demostrar|dramatizar|emplear|ilustrar|interpretar|operar|programar|usar|ejecutar|implementar)/)) return { level: 'Aplicar', color: 'bg-blue-100 text-blue-700 border-blue-200' };
    if (text.match(/(clasificar|describir|discutir|explicar|identificar|informar|revisar|resumir|parafrasear)/)) return { level: 'Comprender', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    if (text.match(/(definir|enlistar|identificar|nombrar|reconocer|memorizar|relatar)/)) return { level: 'Recordar', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    return null;
  };

  const handleDownloadWord = async () => {
    const title = editedStrategy.title.toUpperCase();
    const author = "cademmy learning SAS";
    
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${editedStrategy.title}</title>
        <meta name="author" content="${author}">
        <meta name="company" content="${author}">
        <style>
          @page { size: 8.5in 11in; margin: 0.5in; }
          body { font-family: 'Montserrat', 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1e293b; }
          .header { border-bottom: 2px solid #f97316; padding-bottom: 20px; margin-bottom: 40px; }
          .logo-area { display: flex; align-items: center; }
          .logo-text { font-size: 28pt; font-weight: 900; color: #0f172a; margin: 0; line-height: 1; }
          .logo-sub { font-size: 8pt; font-weight: bold; color: #94a3b8; letter-spacing: 2px; margin: 0; text-transform: uppercase; }
          .page-break { page-break-before: always; }
          .about-box { background-color: #0f172a; color: #ffffff; padding: 40px; border-radius: 30px; margin-bottom: 30px; }
          .about-title { font-size: 24pt; font-weight: 900; color: #ffffff; margin-bottom: 20px; }
          .about-accent { color: #f97316; }
          .purpose-box { background-color: #fff7ed; padding: 30px; border-radius: 25px; border: 1px solid #ffedd5; }
          
          h1 { color: #0f172a; font-size: 24pt; font-weight: 900; margin-bottom: 10px; text-align: center; }
          .subtitle { color: #f97316; font-size: 12pt; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; text-align: center; margin-bottom: 40px; }
          
          h2 { color: #0f172a; font-size: 16pt; font-weight: 900; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-top: 30px; text-transform: uppercase; }
          .content-box { background-color: #f8fafc; border: 1px solid #f1f5f9; padding: 20px; border-radius: 15px; margin-bottom: 20px; }
          .objective-box { background-color: #0f172a; color: white; padding: 25px; border-radius: 20px; font-weight: bold; font-size: 12pt; text-align: center; margin: 20px 0; }
          
          .module-item { border-left: 6px solid #f97316; padding: 15px; margin-bottom: 15px; background-color: #ffffff; border-top: 1px solid #f1f5f9; border-right: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; border-radius: 0 10px 10px 0; }
          .module-header { display: flex; justify-content: space-between; font-weight: 900; color: #0f172a; }
          .module-hours { color: #f97316; font-size: 9pt; }
          
          .footer { margin-top: 60px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          .contact-info { font-size: 9pt; color: #64748b; }
          .footer-wave { height: 10px; background: #f97316; margin-top: 20px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class='header'>
          <table width='100%'>
            <tr>
              <td width="60">
                <img src="https://lh3.googleusercontent.com/d/1REG3yzrXN0qzyerzmveZ_Jo9o0ax2FV2" width="50" height="50" style="display:block;" />
              </td>
              <td>
                <p class='logo-text'>cademmy</p>
                <p class='logo-sub'>LEARN • IMPROVE • ACHIEVE</p>
              </td>
              <td align="right">
                <p style="font-size: 8pt; color: #94a3b8; font-weight: bold;">PROPUESTA ESTRATÉGICA</p>
                <p style="font-size: 8pt; color: #64748b; font-weight: bold; margin-top: 2px;">NIVEL: ${editedStrategy.depth.toUpperCase()}</p>
                ${editedStrategy.category ? `<p style="font-size: 8pt; color: #64748b; font-weight: bold; margin-top: 2px;">CATEGORÍA: ${editedStrategy.category.toUpperCase()}</p>` : ''}
                ${editedStrategy.area ? `<p style="font-size: 8pt; color: #64748b; font-weight: bold; margin-top: 2px;">ÁREA: ${editedStrategy.area.toUpperCase()}</p>` : ''}
                <p style="font-size: 7pt; color: #94a3b8; margin-top: 2px;">PROPUESTA CLIENTE</p>
                <p style="font-size: 10pt; color: #f97316; font-weight: 900; margin-top: 5px;">INVERSIÓN: ${formatCurrency(totalInvestment)}</p>
              </td>
            </tr>
          </table>
        </div>

        <h1>${title}</h1>
        <p class='subtitle'>Solución de Arquitectura Académica</p>

        <h2>1. Perfil del Participante</h2>
        <div class='content-box'>
          <p><strong>Dirigido a:</strong> ${editedStrategy.targetAudience.directedTo.join(', ')}</p>
          <p style='font-style: italic; color: #475569; margin-top: 10px;'>${editedStrategy.targetAudience.participantProfile}</p>
        </div>

        <h2>2. Objetivo General</h2>
        <div class='objective-box' style='background-color: #0f172a; color: #ffffff;'>
          ${getBloomLevel(editedStrategy.generalObjective) ? `<p style='font-size: 8pt; color: #f97316; margin-bottom: 5px; text-transform: uppercase;'>Nivel Bloom: ${getBloomLevel(editedStrategy.generalObjective)?.level}</p>` : ''}
          "${editedStrategy.generalObjective}"
        </div>

        ${editedStrategy.particularObjectives && editedStrategy.particularObjectives.length > 0 ? `
          <h2 style='color: #64748b; font-size: 14pt;'>Objetivos Particulares</h2>
          <div class='content-box'>
            <p style='font-size: 10pt; font-weight: bold; margin-bottom: 10px; color: #334155;'>Al finalizar el curso, el asistente:</p>
            <ul style='margin: 0; padding-left: 20px;'>
              ${editedStrategy.particularObjectives.map(obj => {
                const cleanedObj = cleanObjective(obj);
                const bloom = getBloomLevel(cleanedObj);
                return `<li style='margin-bottom: 8px; font-size: 10pt; color: #475569;'>
                  ${bloom ? `<span style='font-size: 7pt; color: #f97316; font-weight: bold;'>[${bloom.level.toUpperCase()}] </span>` : ''}
                  ${cleanedObj}
                </li>`;
              }).join('')}
            </ul>
          </div>
        ` : ''}

        <h2>3. Estructura Curricular</h2>
        ${editedStrategy.syllabus.map((m, i) => `
          <div class='module-item'>
            <div class='module-header'>
              <span>Módulo ${i+1}: ${cleanModuleTitle(m.title)}</span>
              <span class='module-hours'>${m.hours} HORAS</span>
            </div>
            ${getBloomLevel(m.objective) ? `<p style='font-size: 7pt; color: #f97316; font-weight: bold; margin: 2px 0;'>NIVEL BLOOM: ${getBloomLevel(m.objective)?.level.toUpperCase()}</p>` : ''}
            <p style='font-size: 9pt; color: #64748b; margin: 5px 0;'>${m.objective}</p>
            <div style='margin-top: 10px; margin-left: 10px;'>
              ${m.topics.map(t => `
                <div style='margin-bottom: 8px;'>
                  <p style='font-size: 11pt; font-weight: bold; color: #1e293b; margin: 0;'>• ${t.title}</p>
                  <p style='font-size: 10pt; color: #64748b; margin: 4px 0 0 15px;'>${t.subtopics.join(' | ')}</p>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}

        <div class='section'>
          <h2>4. Beneficios Esperados</h2>
          <table width='100%' cellpadding='10'>
            ${editedStrategy.expectedResults.map(r => `
              <tr>
                <td width='20' valign='top' style='color: #f97316; font-weight: bold;'>✓</td>
                <td style='font-size: 10pt; color: #475569;'>${r}</td>
              </tr>
            `).join('')}
          </table>
        </div>

        <div class='section'>
          <h2>5. ¿Cómo logramos estos beneficios?</h2>
          <table width='100%' cellpadding='10' style='border-collapse: collapse;'>
            <tr style='background-color: #f1f5f9;'>
              <th align='left' style='font-size: 9pt; padding: 10px; border: 1px solid #e2e8f0;'>BENEFICIO</th>
              <th align='left' style='font-size: 9pt; padding: 10px; border: 1px solid #e2e8f0;'>¿CÓMO SE LOGRA? (PASO A PASO)</th>
              <th align='left' style='font-size: 9pt; padding: 10px; border: 1px solid #e2e8f0;'>MEDICIÓN Y COMPROBACIÓN</th>
            </tr>
            ${(editedStrategy.benefitImplementation || []).map(bi => `
              <tr>
                <td valign='top' style='font-size: 9pt; padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;'>${bi.benefit}</td>
                <td valign='top' style='font-size: 9pt; padding: 10px; border: 1px solid #e2e8f0;'>${bi.howToAchieve}</td>
                <td valign='top' style='font-size: 9pt; padding: 10px; border: 1px solid #e2e8f0; color: #f97316; font-weight: bold;'>${bi.measurement}</td>
              </tr>
            `).join('')}
          </table>
        </div>

        <div class='section'>
          <h2>6. Metodología y Técnicas de Enseñanza</h2>
          <div class='content-box'>
            <p style='font-size: 10pt; color: #475569;'>${editedStrategy.methodology}</p>
          </div>
        </div>

        <div class='page-break'></div>
        <div class='section'>
          <table width='100%'>
            <tr>
              <td width='200' valign='top'>
                <div style='background-color: #f8fafc; padding: 20px; border-radius: 15px; border: 1px solid #e2e8f0;'>
                  <div style='text-align: center; margin-bottom: 15px;'>
                    <img src="https://lh3.googleusercontent.com/d/1-ZbUpPUTH8g2iVFNae3uZpSNtRccWldG" width="120" height="160" style="border-radius: 15px; display: block; margin: 0 auto;" />
                  </div>
                  <p style='text-align: center; font-weight: bold; color: #0f172a; margin-bottom: 5px;'>Gloria Alba</p>
                  <p style='text-align: center; font-size: 8pt; color: #f97316; font-weight: bold; text-transform: uppercase; margin: 0;'>Chief Executive Officer</p>
                  <p style='font-size: 9pt; color: #64748b; font-style: italic; margin-top: 15px; line-height: 1.4;'>
                    "${leaderQuote}"
                  </p>
                </div>
              </td>
              <td width='30'></td>
              <td valign='top'>
                <h2 style='color: #0f172a; font-size: 18pt; margin-top: 0; border: none; padding: 0;'>PRONUNCIAMIENTO DEL LÍDER</h2>
                <h3 style='color: #f97316; font-size: 12pt; margin-bottom: 15px;'>¿QUÉ QUEREMOS?</h3>
                <ul style='font-size: 10pt; color: #475569; line-height: 1.5;'>
                  <li style='margin-bottom: 10px;'><strong>Empoderar a individuos y organizaciones:</strong> a través de educación práctica y de calidad, brindamos herramientas para lograr metas medibles y un impacto positivo en el trabajo.</li>
                  <li style='margin-bottom: 10px;'><strong>Nuestro enfoque:</strong> crear experiencias de aprendizaje aplicables, apoyadas por tecnología, con evidencia clara y una ruta de validez. Así, cada intervención se traduce en resultados medibles y trazabilidad.</li>
                  <li style='margin-bottom: 10px;'><strong>Crear oportunidades de desarrollo:</strong> facilitamos acceso a rutas formativas modernas (Instructor 4.0) y a certificaciones de competencias laborales con reconocimiento oficial (CONOCER).</li>
                  <li style='margin-bottom: 10px;'><strong>Ser un agente de cambio positivo:</strong> impulsamos inclusión, diversidad y responsabilidad social en nuestros programas, con una visión de bienestar y desarrollo sostenible.</li>
                  <li style='margin-bottom: 10px;'><strong>Construir una comunidad colaborativa:</strong> promovemos aprendizaje entre pares, redes profesionales y conexiones valiosas que aceleran crecimiento y transferencia al puesto.</li>
                </ul>
              </td>
            </tr>
          </table>
        </div>

        <div class='section'>
          <h2>Acerca de Nosotros</h2>
          <div class='content-box'>
            <p style='font-size: 10pt; color: #475569;'>Cademmy es un ecosistema mexicano de aprendizaje y certificación que impulsa competencias laborales con un enfoque moderno: aprendizaje activo, evidencia verificable y tecnología aplicada.</p>
            <p style='font-size: 10pt; color: #475569; margin-top: 10px;'><strong>Nuestro Propósito:</strong> Impulsar el desarrollo profesional y organizacional creando experiencias de aprendizaje aplicables, medibles y con evidencia.</p>
            <p style='font-size: 9pt; color: #f97316; font-weight: bold; margin-top: 15px;'>PRÁCTICA REAL + RETROALIMENTACIÓN + EVIDENCIA + RUTA DE VALIDEZ</p>
          </div>
        </div>

        <div class='footer'>
          <table width='100%'>
            <tr>
              <td>
                <p class='contact-info'><strong>Tel:</strong> +52 55 8009 9901</p>
                <p class='contact-info'><strong>Email:</strong> contacto@cademmy.com</p>
                <p class='contact-info'><strong>Web:</strong> www.cademmy.com</p>
              </td>
              <td align="right">
                <p class='contact-info'>Av. Santa Fe 505 Mezanine Oficina 2B,</p>
                <p class='contact-info'>Santa Fe, Cuajimalpa, México, CDMX</p>
              </td>
            </tr>
          </table>
          <div class='footer-wave'></div>
          <p style='font-size: 7pt; color: #cbd5e1; text-align: center; margin-top: 10px;'>© cademmy learning SAS - Propiedad Intelectual Protegida</p>
        </div>
      </body>
      </html>
    `;

    const fullHtml = `
      <!DOCTYPE html>
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word' 
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${editedStrategy.title}</title>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `;

    const blob = await asBlob(fullHtml, { orientation: 'portrait', margins: { top: 720, right: 720, bottom: 720, left: 720 } });
    const url = URL.createObjectURL(blob as Blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Catalogo_Cursos_2026_${editedStrategy.title.replace(/\s+/g, '_')}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleShareWhatsApp = () => {
    const syllabusText = editedStrategy.syllabus.map((m, i) => `• Módulo ${i+1}: ${cleanModuleTitle(m.title)} (${m.hours}h)`).join('\n');
    
    const text = `🚀 *PROPUESTA CADEMMY: ${editedStrategy.title.toUpperCase()}*\n\n` +
      `🎯 *Objetivo:* ${editedStrategy.generalObjective}\n\n` +
      `⏳ *Duración:* ${editedStrategy.totalDuration}\n\n` +
      `📚 *Temario:* \n${syllabusText}\n\n` +
      `📑 _Diseñado por cademmy learning SAS_ \n_www.cademmy.com_`;
    
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 no-print">
        <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <button 
                onClick={onBack} 
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 shadow-sm w-fit"
              >
                  <ArrowRight className="w-4 h-4 rotate-180 text-orange-500" /> Regresar
              </button>
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight italic">cademmy <span className="text-orange-500 not-italic">mentor</span></h2>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Estrategia Instruccional de Alto Impacto</p>
            </div>
        </div>
        <div className="flex flex-wrap gap-3">
            <button 
              onClick={handleDownloadWord}
              className="px-4 py-3 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2 text-xs shadow-xl shadow-slate-100 uppercase tracking-widest"
            >
              <FileText className="w-4 h-4 text-orange-400" /> Descargar Word Pro
            </button>
            <button 
              onClick={handleShareWhatsApp}
              className="px-4 py-3 bg-emerald-50 border border-emerald-100 text-emerald-600 font-black rounded-xl hover:bg-emerald-100 transition-all flex items-center gap-2 text-xs shadow-sm uppercase tracking-widest"
            >
              <MessageCircle className="w-4 h-4" /> Compartir
            </button>
        </div>
      </div>

      <div id="strategy-document" className="print-container space-y-8 bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden relative">
        
        {/* Cademmy Letterhead */}
        <div className="flex justify-between items-center border-b-2 border-orange-500 pb-8 mb-12">
            <button 
            onClick={onBack}
            className="hover:opacity-80 transition-opacity cursor-pointer"
            title="Ir al inicio"
          >
            <Logo size={60} />
          </button>
            <div className="text-right hidden md:block">
                <div className="flex flex-col items-end gap-2">
                  <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-100">
                      Propuesta Estratégica
                  </span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                    editedStrategy.depth === 'Avanzado' ? 'bg-red-50 text-red-600 border-red-100' :
                    editedStrategy.depth === 'Intermedio' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                    'bg-emerald-50 text-emerald-600 border-emerald-100'
                  }`}>
                    Nivel {editedStrategy.depth}
                  </span>
                  {editedStrategy.category && (
                    <span className="px-3 py-1 bg-slate-50 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-100">
                      {editedStrategy.category}
                    </span>
                  )}
                  {editedStrategy.area && (
                    <span className="px-3 py-1 bg-slate-50 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-100">
                      Área: {editedStrategy.area}
                    </span>
                  )}
                  <span className="px-3 py-1 bg-slate-50 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-100">
                    Propuesta Cliente
                  </span>
                </div>
                <div className="mt-2">
                </div>
                <p className="text-[9px] text-slate-300 font-bold mt-1">cademmy learning SAS © 2024</p>
            </div>
        </div>

        {/* Title and Profile */}
        <section className="print-section">
            <div className="text-center mb-12">
                <div className="flex justify-center gap-4 mb-4">
                    {editedStrategy.area && (
                        <span className="px-4 py-1.5 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                            Área: {editedStrategy.area}
                        </span>
                    )}
                    {editedStrategy.category && (
                        <span className="px-4 py-1.5 bg-orange-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                            Categoría: {editedStrategy.category}
                        </span>
                    )}
                </div>
                <h1 className="text-5xl font-black text-slate-900 mb-3 tracking-tight">{editedStrategy.title}</h1>
                <p className="text-orange-600 font-black uppercase tracking-[0.2em] text-xs">Solución de Arquitectura Académica</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="md:col-span-2 space-y-6">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                    1. Perfil del Participante
                </h3>
                <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                    <p className="text-slate-400 font-black mb-3 uppercase text-[10px] tracking-widest">Dirigido a:</p>
                    <div className="flex flex-wrap gap-2 mb-6">
                        {editedStrategy.targetAudience.directedTo.map((d, i) => (
                            <span key={i} className="px-4 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 shadow-sm">{d}</span>
                        ))}
                    </div>
                    <p className="text-base text-slate-500 leading-relaxed italic font-medium">"{editedStrategy.targetAudience.participantProfile}"</p>
                </div>
              </div>
              <div className="bg-slate-900 rounded-[2rem] p-8 text-white flex flex-col justify-center items-center text-center shadow-xl">
                  <Clock className="w-10 h-10 text-orange-400 mb-4" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Carga Horaria</p>
                  <p className="text-3xl font-black text-white">{editedStrategy.totalDuration}</p>
                  <p className="text-[8px] font-bold text-orange-400/50 uppercase mt-4 tracking-widest">Pedagogía Integral</p>
              </div>
            </div>
        </section>

        {/* General Objective */}
        <section className="print-section mb-12">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight mb-6">
                2. Objetivo General
            </h3>
            <div className="p-10 bg-slate-900 border-2 border-slate-800 rounded-[2.5rem] text-white font-bold text-2xl shadow-xl text-center leading-relaxed relative overflow-hidden">
                <div className="flex flex-col items-center gap-4">
                  {getBloomLevel(editedStrategy.generalObjective) && (
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getBloomLevel(editedStrategy.generalObjective)?.color.replace('bg-', 'bg-white/10 ').replace('text-', 'text-white ')}`}>
                      Nivel Bloom: {getBloomLevel(editedStrategy.generalObjective)?.level}
                    </span>
                  )}
                  "{editedStrategy.generalObjective}"
                </div>
            </div>
        </section>

        {/* Particular Objectives - Optional in PDF but kept for completeness, maybe without number */}
        {editedStrategy.particularObjectives && editedStrategy.particularObjectives.length > 0 && (
          <section className="print-section mb-12">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight mb-6">
                  Objetivos Particulares
              </h3>
              <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem] shadow-sm">
                  <p className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    Al finalizar el curso, el asistente:
                  </p>
                  <div className="space-y-4">
                      {editedStrategy.particularObjectives.map((obj, i) => {
                          const cleanedObj = cleanObjective(obj);
                          const bloom = getBloomLevel(cleanedObj);
                          return (
                            <div key={i} className="flex items-start gap-3 pl-4">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 flex-shrink-0" />
                                <div className="flex-1">
                                    {bloom && (
                                      <span className={`inline-block px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border mb-1 ${bloom.color}`}>
                                        {bloom.level}
                                      </span>
                                    )}
                                    <p className="text-sm font-bold text-slate-700 leading-relaxed">{cleanedObj}</p>
                                </div>
                            </div>
                          );
                      })}
                  </div>
              </div>
          </section>
        )}

        {/* Syllabus Detail */}
        <section className="print-section">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight mb-8">
                3. Estructura Curricular
            </h3>
            <div className="space-y-4">
                {editedStrategy.syllabus.map((module, idx) => (
                    <div key={idx} className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/30 hover:bg-white hover:shadow-md transition-all border-l-4 border-l-orange-500">
                        <div className="p-6 flex items-center justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                  <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Módulo {idx + 1}</span>
                                  <span className="w-1 h-1 rounded-full bg-slate-200" />
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{module.hours} Horas</span>
                                </div>
                                <h4 className="text-lg font-black text-slate-800">{cleanModuleTitle(module.title)}</h4>
                                <div className="flex flex-col gap-2 mt-2 mb-4">
                                  {getBloomLevel(module.objective) && (
                                    <span className={`w-fit px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${getBloomLevel(module.objective)?.color}`}>
                                      {getBloomLevel(module.objective)?.level}
                                    </span>
                                  )}
                                  <p className="text-xs font-medium text-slate-500 leading-relaxed">{module.objective}</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {module.topics.map((topic, ti) => (
                                        <div key={ti} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                            <div className="text-base font-black text-slate-800 flex items-center gap-2 mb-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500" /> {topic.title}
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {topic.subtopics.map((sub, si) => (
                                                    <span key={si} className="text-xs font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                                                        {sub}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>

        {/* Expected Results / Benefits */}
        <section className="print-section">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight mb-6">
                4. Beneficios Esperados
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {editedStrategy.expectedResults.map((result, i) => (
                    <div key={i} className="flex items-start gap-4 p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
                        <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="w-4 h-4 text-orange-500" />
                        </div>
                        <p className="text-sm font-bold text-slate-700 leading-relaxed">{result}</p>
                    </div>
                ))}
            </div>
        </section>

        {/* Benefit Implementation */}
        <section className="print-section">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight mb-6">
                5. ¿Cómo logramos estos beneficios?
            </h3>
            <div className="overflow-hidden border border-slate-100 rounded-[2rem] shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Beneficio</th>
                            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">¿Cómo se logra? (Paso a paso)</th>
                            <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Medición y Comprobación</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {(editedStrategy.benefitImplementation || []).map((bi, i) => (
                            <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-6 align-top">
                                    <p className="text-sm font-black text-slate-800">{bi.benefit}</p>
                                </td>
                                <td className="p-6 align-top">
                                    <p className="text-xs text-slate-500 leading-relaxed">{bi.howToAchieve}</p>
                                </td>
                                <td className="p-6 align-top">
                                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                                        <p className="text-xs font-black text-orange-600 leading-relaxed">{bi.measurement}</p>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>

        {/* Methodology */}
        <section className="print-section">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight mb-6">
                6. Metodología y Técnicas de Enseñanza
            </h3>
            <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
                <p className="text-slate-600 font-medium leading-relaxed italic">
                    {editedStrategy.methodology}
                </p>
            </div>
        </section>

        {/* Leader Pronouncement */}
        <section className="print-section mt-16 pt-16 border-t-2 border-slate-100">
              <div className="flex flex-col md:flex-row gap-12">
                  <div className="md:w-1/3">
                      <div className="relative">
                          <div className="absolute -top-4 -left-4 w-24 h-24 bg-orange-100 rounded-full -z-10" />
                          <img 
                              src="https://lh3.googleusercontent.com/d/1-ZbUpPUTH8g2iVFNae3uZpSNtRccWldG" 
                              alt="Gloria Alba" 
                              className="w-full aspect-[3/4] object-cover rounded-[2rem] shadow-2xl border-4 border-white"
                              referrerPolicy="no-referrer"
                          />
                      </div>
                      <div className="mt-6">
                          <h4 className="text-2xl font-black text-slate-800">Gloria Alba</h4>
                          <p className="text-orange-600 font-bold uppercase tracking-widest text-[10px]">Chief Executive Officer</p>
                          <p className="mt-4 text-slate-500 text-sm leading-relaxed italic font-medium">
                              "{leaderQuote}"
                          </p>
                      </div>
                  </div>
                  <div className="md:w-2/3">
                      <h3 className="text-3xl font-black text-slate-900 mb-8 tracking-tighter uppercase">
                          <span className="text-orange-500">Pronunciamiento</span> del Líder
                      </h3>
                      <div className="space-y-8">
                          <div>
                              <h4 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-tight">
                                  ¿QUÉ QUEREMOS?
                              </h4>
                              <ul className="space-y-6">
                                  <li className="flex gap-4">
                                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                                      <p className="text-slate-600 text-sm leading-relaxed">
                                          <span className="font-black text-slate-800">Empoderar a individuos y organizaciones:</span> a través de educación práctica y de calidad, brindamos herramientas para lograr metas medibles y un impacto positivo en el trabajo.
                                      </p>
                                  </li>
                                  <li className="flex gap-4">
                                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                                      <p className="text-slate-600 text-sm leading-relaxed">
                                          <span className="font-black text-slate-800">Nuestro enfoque:</span> crear experiencias de aprendizaje aplicables, apoyadas por tecnología, con evidencia clara y una ruta de validez. Así, cada intervención se traduce en resultados medibles y trazabilidad.
                                      </p>
                                  </li>
                                  <li className="flex gap-4">
                                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                                      <p className="text-slate-600 text-sm leading-relaxed">
                                          <span className="font-black text-slate-800">Crear oportunidades de desarrollo:</span> facilitamos acceso a rutas formativas modernas (Instructor 4.0) y a certificaciones de competencias laborales con reconocimiento oficial (CONOCER).
                                      </p>
                                  </li>
                                  <li className="flex gap-4">
                                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                                      <p className="text-slate-600 text-sm leading-relaxed">
                                          <span className="font-black text-slate-800">Ser un agente de cambio positivo:</span> impulsamos inclusión, diversidad y responsabilidad social en nuestros programas, con una visión de bienestar y desarrollo sostenible.
                                      </p>
                                  </li>
                                  <li className="flex gap-4">
                                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                                      <p className="text-slate-600 text-sm leading-relaxed">
                                          <span className="font-black text-slate-800">Construir una comunidad colaborativa:</span> promovemos aprendizaje entre pares, redes profesionales y conexiones valiosas que aceleran crecimiento y transferencia al puesto.
                                      </p>
                                  </li>
                              </ul>
                          </div>
                      </div>
                  </div>
              </div>
          </section>
        <section className="print-section mt-16 pt-16 border-t-2 border-slate-100">
            <h3 className="text-3xl font-black text-slate-900 mb-8 tracking-tighter uppercase">Acerca de <span className="text-orange-500">Nosotros</span></h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <p className="text-slate-600 leading-relaxed font-medium">
                  Cademmy es un ecosistema mexicano de aprendizaje y certificación que impulsa competencias laborales con un enfoque moderno: aprendizaje activo, evidencia verificable y tecnología aplicada. Ayudamos a personas y organizaciones a desarrollar habilidades que sí se reflejan en el trabajo, con rutas formativas claras, evaluación estructurada y entregables que permiten medir avance y resultados.
                </p>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <h4 className="font-black text-slate-800 mb-2 uppercase text-xs tracking-widest">Nuestro Propósito</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">Impulsar el desarrollo profesional y organizacional creando experiencias de aprendizaje aplicables, medibles y con evidencia, apoyadas por tecnología.</p>
                </div>
              </div>
              <div className="space-y-6">
                <p className="text-slate-600 leading-relaxed text-sm">
                  Operamos a través de tres áreas que se complementan: Cademmy Certificaciones, Cademmy Learning y Cademmy Consulting.
                </p>
                <div className="p-6 bg-orange-50 rounded-2xl border border-orange-100">
                  <h4 className="font-black text-orange-600 mb-2 uppercase text-xs tracking-widest">Lo que nos distingue</h4>
                  <p className="text-xs text-slate-600 font-bold">Práctica Real + Retroalimentación + Evidencia + Ruta de Validez</p>
                </div>
              </div>
            </div>
          </section>

        {/* Footer info */}
        <div className="mt-20 pt-12 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-10 items-start pb-20">
            <div className="space-y-4">
                <div className="flex items-center gap-4 text-slate-600 text-sm font-bold">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center"><Phone className="w-5 h-5 text-orange-500" /></div>
                    +52 55 8009 9901
                </div>
                <div className="flex items-center gap-4 text-slate-600 text-sm font-bold">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center"><MapPin className="w-5 h-5 text-orange-500" /></div>
                    <span className="max-w-[250px]">Av. Santa Fe 505 Mezanine Oficina 2B, Santa Fe, CDMX</span>
                </div>
                <div className="flex items-center gap-4 text-slate-600 text-sm font-bold">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center"><Mail className="w-5 h-5 text-orange-500" /></div>
                    contacto@cademmy.com
                </div>
            </div>
            <div className="text-right flex flex-col items-end justify-center h-full">
                <div className="flex items-center justify-end gap-2 text-slate-800 font-black text-xl mb-2">
                    <Globe className="w-6 h-6 text-orange-500" /> www.cademmy.com
                </div>
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
                  Propiedad Intelectual Protegida • cademmy learning SAS
                </p>
            </div>
        </div>

        {/* The Wave Graphic for Print */}
        <div className="absolute bottom-0 left-0 w-full h-24 pointer-events-none hidden print:block">
          <svg viewBox="0 0 1440 320" className="w-full h-full" preserveAspectRatio="none">
            <path fill="#0f172a" fillOpacity="1" d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            <path fill="#f97316" fillOpacity="1" d="M0,224L48,213.3C96,203,192,181,288,186.7C384,192,480,224,576,218.7C672,213,768,171,864,149.3C960,128,1056,128,1152,149.3C1248,171,1344,213,1392,234.7L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
          <div className="absolute bottom-4 right-8 text-white font-black text-[10px] tracking-widest uppercase">www.cademmy.com</div>
        </div>
      </div>

      <div className="mt-12 flex flex-col md:flex-row justify-center gap-6 no-print">
        <button 
            onClick={onBack} 
            className="px-12 py-6 bg-white border-2 border-slate-200 text-slate-600 font-black text-xl rounded-3xl shadow-xl hover:bg-slate-50 transition-all flex items-center gap-4 hover:scale-105"
        >
            <ArrowRight className="w-6 h-6 rotate-180 text-orange-500" /> EDITAR FORMULARIO
        </button>
        <button 
            onClick={() => onConfirm(editedStrategy)}
            disabled={isLoading}
            className="px-12 py-6 bg-slate-900 text-white font-black text-xl rounded-3xl shadow-xl hover:bg-black transition-all flex items-center gap-4 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isLoading ? 'GENERANDO...' : 'GENERAR CURSO COMPLETO'} <ArrowRight className="w-6 h-6 text-orange-400" />
        </button>
        <a 
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-12 py-6 bg-orange-500 text-white font-black text-xl rounded-3xl shadow-xl hover:bg-orange-600 transition-all flex items-center gap-4 hover:scale-105"
        >
            ACEPTAR Y AGENDAR UNA CITA <Calendar className="w-6 h-6" />
        </a>
      </div>
    </div>
  );
};
