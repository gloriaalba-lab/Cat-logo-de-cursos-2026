
import { GoogleGenAI, Type } from "@google/genai";
import { CourseStrategy, Course, CourseModule, CourseContext } from "../types";
import { CatalogCourse } from "../src/data/catalog";

const SYSTEM_INSTRUCTION = `
ROL:
Eres el "Mentor del Catálogo de Cursos 2026" de Cademmy, una plataforma EdTech B2B de alto nivel. 
No eres un asistente genérico. Eres un Consultor Senior experto en Andragogía, Normativa STPS y Diseño Instruccional.

OBJETIVO:
Tu meta es convertir una solicitud de un usuario en una Estructura de Curso Profesional (Temario) de alta calidad. 
Debes diseñar arquitecturas de aprendizaje a medida que se puedan producir en 72 horas por nuestra fábrica de contenidos.
DESGLOSE: Cada módulo debe tener temas claros y cada tema debe tener al menos 3-5 subtemas técnicos detallados.

REGLAS DE DISEÑO Y CONSULTORÍA:
1. OBJETIVOS (ESTÁNDAR CONOCER EC0217.01/EC0301):
   - El OBJETIVO GENERAL debe seguir esta estructura estricta:
     * Sujeto y Tiempo: "Al finalizar el curso, el participante..."
     * Verbo Principal (Dominio Cognitivo): Debe corresponder estrictamente al Nivel de Bloom solicitado (1-6) y estar en futuro (ej: "identificará", "aplicará", "diseñará").
     * PROHIBICIÓN: No uses verbos en infinitivo (ej: "proporcionar", "analizar") inmediatamente después del sujeto.
     * PROHIBICIÓN: No repitas "a los participantes" o "los participantes" dentro del cuerpo del objetivo si ya se mencionó en el prefijo.
     * Ejemplo Correcto: "Al finalizar el curso, el participante aplicará las técnicas de mejora de procesos..."
     * Ejemplo Incorrecto: "Al finalizar el curso, el participante proporcionar a los participantes..."
   - Los OBJETIVOS PARTICULARES deben seguir la misma lógica gramatical.
     - NIVEL BÁSICO (Blooms 1-2):
       * Nivel 1 (Conocimiento): Identificará, Definirá, Listará, Reconocerá, Nombrará, Enunciará.
       * Nivel 2 (Comprensión): Comprenderá, Explicará, Describirá, Interpretará, Resumirá, Clasificará.
     - NIVEL INTERMEDIO (Blooms 3-4):
       * Nivel 3 (Aplicación): Aplicará, Ejecutará, Implementará, Demostrará, Operará, Resolverá.
       * Nivel 4 (Análisis): Analizará, Diagnosticará, Diferenciará, Investigará, Examinará, Contrastará.
     - NIVEL AVANZADO (Blooms 5-6):
       * Nivel 5 (Evaluación): Evaluará, Valorará, Criticará, Justificará, Argumentará, Validará.
       * Nivel 6 (Creación): Diseñará, Integrará, Construirá, Formulará, Desarrollará, Planificará, Propondrá.
     * Objeto de Aprendizaje: Qué va a hacer.
     * Dominio Psicomotor (Saber Hacer): Cómo lo hará técnicamente (ej: mediante la orquestación de protocolos, la ejecución experta).
     * Dominio Afectivo (Saber Ser): Actitud o valor esperado (ej: internalizando la cultura organizacional, comprometiéndose con el rendimiento).
     * Finalidad: Para qué le servirá.
   - Los OBJETIVOS PARTICULARES deben ser una lista de acciones o resultados específicos. 
     * FORMATO: No incluyas el prefijo "Al finalizar el curso, el participante..." en cada objetivo particular, ya que se añadirá automáticamente en la interfaz. Empieza directamente con el verbo en futuro (ej: "Identificará...", "Aplicará...", "Diseñará...").
     * Ejemplo Correcto: ["Identificará los componentes...", "Aplicará las técnicas...", "Diseñará un plan..."]
     * Ejemplo Incorrecto: ["Al finalizar el curso el participante identificará...", "El asistente aplicará..."]
2. ANÁLISIS: Analiza el sector y sugiere un enfoque basado en competencias laborales o normativa mexicana (NOMs, CONOCER) si aplica.
3. PERSONALIDAD: Profesional, Ejecutivo, Consultivo y Resolutivo. Usas terminología de negocios (ROI, KPIs, Competencias, Normativa).
4. LÓGICA DE NIVELES Y PROFUNDIDAD (CRÍTICO):
   - BÁSICO (Niveles Bloom 1-2): Fundamentos, conceptos iniciales, terminología, procesos estándar y "el qué" de las cosas.
   - INTERMEDIO (Niveles Bloom 3-4): Aplicación práctica, análisis de casos, optimización, resolución de problemas comunes y "el cómo" operativo.
   - AVANZADO (Niveles Bloom 5-6): Estrategia, arquitectura de sistemas, resolución de problemas complejos/críticos, liderazgo técnico, innovación y prospectiva (2025-2030).
   - EVITAR REPETICIÓN: Un curso AVANZADO no debe repetir temas de nivel INTERMEDIO. Debe asumir que el usuario ya domina lo operativo y saltar directamente a la alta especialización y visión estratégica.
4. LÓGICA DE HORAS: 
   - La duración es proporcional al alcance. A más horas, mayor cobertura de temas dentro del nivel de profundidad seleccionado.
   - Si el usuario no define horas, propón estructuras de 12, 20 o 30 horas.
4. CONTENIDO MAGISTRAL: Cada módulo debe ser una lectura técnica y profunda (mínimo 1000-1200 palabras) con marcos teóricos contemporáneos (2020-2025).
5. METODOLOGÍA: Se refiere estrictamente a las TÉCNICAS DE ENSEÑANZA APLICADA. 
   - Debes incluir y describir cómo se aplicarán las técnicas: Expositiva (para teoría), Diálogo-Discusión (para análisis) y Demostrativa/Ejecución (para práctica).
   - Menciona el uso de casos de estudio, dinámicas grupales y herramientas tecnológicas específicas.
6. CONTEXTUALIZACIÓN: Adapta TODO a la INDUSTRIA y FOCO ESPECIAL proporcionado por el usuario.
7. ACTIVIDADES: Deben ser de alta dificultad (Pensamiento Crítico), incluyendo Quizzes de 5-10 preguntas y 3 Casos de Razonamiento por módulo.
8. IDIOMA: Español de México/Latinoamérica profesional y corporativo.
`;

const courseStrategySchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Título atractivo y profesional del curso" },
    targetAudience: {
      type: Type.OBJECT,
      properties: {
        directedTo: { type: Type.ARRAY, items: { type: Type.STRING } },
        participantProfile: { type: Type.STRING, description: "Descripción detallada del perfil del alumno" }
      },
      required: ["directedTo", "participantProfile"]
    },
    generalObjective: { type: Type.STRING },
    particularObjectives: { type: Type.ARRAY, items: { type: Type.STRING } },
    totalDuration: { type: Type.STRING, description: "Duración total recomendada o solicitada" },
    methodology: { type: Type.STRING, description: "Técnicas de enseñanza aplicada (Expositiva, Diálogo-Discusión, Demostrativa, Casos, etc.)" },
    prerequisites: { type: Type.ARRAY, items: { type: Type.STRING } },
    expectedResults: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Beneficios y resultados esperados del curso" },
    benefitImplementation: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          benefit: { type: Type.STRING, description: "El beneficio esperado" },
          howToAchieve: { type: Type.STRING, description: "Explicación paso a paso de cómo se logrará este beneficio a través del curso" },
          measurement: { type: Type.STRING, description: "Cómo se va a medir y comprobar que se logró el beneficio (KPIs, evidencias)" }
        },
        required: ["benefit", "howToAchieve", "measurement"]
      },
      description: "Sección detallada sobre cómo se logran los beneficios paso a paso y cómo se miden"
    },
    depth: { type: Type.STRING, enum: ["Básico", "Intermedio", "Avanzado"] },
    category: { type: Type.STRING, description: "Categoría del curso (ej: Cursos de mandos medios (CMM), Habilidades, etc.)" },
    area: { type: Type.STRING, description: "Área técnica del curso (ej: Habilidades, Dirección, etc.)" },
    syllabus: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          hours: { type: Type.NUMBER },
          objective: { type: Type.STRING },
          topics: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Nombre del tema principal" },
                subtopics: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Lista de subtemas técnicos detallados" }
              },
              required: ["title", "subtopics"]
            }
          }
        },
        required: ["title", "hours", "objective", "topics"]
      }
    }
  },
  required: ["title", "targetAudience", "generalObjective", "particularObjectives", "totalDuration", "methodology", "prerequisites", "expectedResults", "benefitImplementation", "depth", "syllabus", "category", "area"]
};

const moduleSchema = {
  type: Type.OBJECT,
  properties: {
    content: { type: Type.STRING, description: "Contenido magistral técnico de 1000-1200 palabras adaptado a la industria" },
    keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
    references: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Bibliografía APA 2020-2025" },
    matchingActivity: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          term: { type: Type.STRING },
          definition: { type: Type.STRING }
        },
        required: ["term", "definition"]
      }
    },
    quiz: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          correctAnswer: { type: Type.NUMBER },
          explanation: { type: Type.STRING }
        },
        required: ["question", "options", "correctAnswer", "explanation"]
      }
    },
    cases: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          scenario: { type: Type.STRING, description: "Situación realista compleja contextualizada a la industria" },
          question: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          correctAnswer: { type: Type.NUMBER },
          explanation: { type: Type.STRING }
        },
        required: ["scenario", "question", "options", "correctAnswer", "explanation"]
      }
    }
  },
  required: ["content", "keyTakeaways", "references", "matchingActivity", "quiz", "cases"]
};

export const generateCourseStrategy = async (context: CourseContext): Promise<CourseStrategy> => {
  console.log('generateCourseStrategy called with context:', context);
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    console.error('API Key is missing');
    throw new Error("La clave de API de Gemini no está configurada. Por favor, agrégala en los Secretos.");
  }
  const ai = new GoogleGenAI({ apiKey: apiKey });
  let promptText = `ACCIÓN: Diseña la estrategia de capacitación estratégica. 
RECUERDA: La profundidad técnica debe ser EXACTAMENTE la solicitada (${context.depth}).
REGLA DE NIVEL: Si el nivel es AVANZADO, el contenido debe ser estratégico y complejo, NO debe repetir temas básicos o intermedios.
LIMITACIÓN: Genera entre 3 y 6 módulos principales para asegurar una carga de contenido equilibrada y rápida.
REGLA DE TÍTULOS: No incluyas "Módulo 1", "Módulo 2", etc., en el título de los módulos; solo el nombre técnico del módulo.\n\n`;
  
  promptText += `DATOS DE CONSULTORÍA:\n`;
  promptText += `- EMPRESA/INDUSTRIA: "${context.targetCompany}"\n`;
  promptText += `- TEMA: "${context.topic}"\n`;
  promptText += `- AUDIENCIA: "${context.audience}"\n`;
  promptText += `- NIVEL SOLICITADO: ${context.depth}\n`;
  promptText += `- FOCO ESPECIAL: "${context.specialFocus}"\n`;
  promptText += `- DURACIÓN/HORAS SOLICITADAS: "${context.preferredDuration}"\n`;
  if (context.desiredOutcome) {
    promptText += `- RESULTADO DESEADO (Para definir el objetivo): "${context.desiredOutcome}"\n`;
  }
  if (context.confirmedThemes && context.confirmedThemes.length > 0) {
    promptText += `\nTEMARIOS COMPROMETIDOS/TEMAS OBLIGATORIOS:\n${context.confirmedThemes.map((t, i) => `${i+1}. ${t}`).join('\n')}\n`;
    promptText += `REGLA DE ESTRUCTURA: DEBES diseñar el temario (syllabus) basándote EXACTAMENTE en estos temas confirmados por el usuario. Puedes expandirlos con subtemas, pero los módulos principales deben coincidir con esta lista.\n`;
  }
  promptText += `\nREGLA: El campo 'depth' en el JSON de respuesta debe ser exactamente: "${context.depth}".\n`;
  promptText += `\nREGLA DE ESTRUCTURA: Debes categorizar el curso en un 'area' (ej: Habilidades, Dirección, Tecnología) y una 'category' (ej: Cursos de mandos medios (CMM), Alta Dirección, Desarrollo Humano).\n`;
  promptText += `\nIMPORTANTE: Para cada beneficio en 'expectedResults', DEBES generar una entrada correspondiente en 'benefitImplementation' que explique el proceso paso a paso para lograrlo y cómo se medirá su éxito.\n`;

  if (context.customTitle) {
    promptText += `\nIMPORTANTE: El usuario ha definido un título obligatorio para el curso: "${context.customTitle}". DEBES usar este título exactamente como está escrito en el campo "title" de la respuesta JSON.\n`;
  }

  const parts: any[] = [{ text: promptText }];
  if (context.proposalFile) {
    promptText += `\nUSA EL DOCUMENTO ADJUNTO PARA ACTUALIZAR O BASAR EL CONTENIDO. 
REVISA CUIDADOSAMENTE EL DOCUMENTO PARA EXTRAER EL OBJETIVO GENERAL Y LOS OBJETIVOS PARTICULARES SI ESTÁN PRESENTES. 
Si el documento contiene objetivos, DEBES priorizarlos y adaptarlos al estándar CONOCER solicitado, asegurando que no se pierda la esencia de la estrategia original del usuario.`;
    parts.push({ 
      inlineData: { 
        data: context.proposalFile.data, 
        mimeType: context.proposalFile.mimeType 
      } 
    });
  }

  console.log('Sending request to Gemini for strategy generation...');
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: { parts },
    config: { 
      systemInstruction: SYSTEM_INSTRUCTION, 
      responseMimeType: "application/json",
      responseSchema: courseStrategySchema,
      temperature: 0.2,
      maxOutputTokens: 8000
    }
  });

  console.log('Gemini response received:', response);
  const text = response.text?.trim();
  if (!text) {
    console.error('Empty response from Gemini');
    throw new Error("El modelo no devolvió ninguna respuesta. Por favor intenta de nuevo.");
  }

  try {
    const data = JSON.parse(text);
    console.log('Parsed strategy data:', data);
    return data as CourseStrategy;
  } catch (parseError) {
    console.error('Error parsing strategy JSON:', parseError, 'Raw text:', text);
    throw new Error("Error al procesar la respuesta de la IA. El formato no es válido.");
  }
};

const repairTruncatedJson = (json: string): string => {
  let repaired = json.trim();
  
  // If it doesn't end with } or ], it's likely truncated
  if (!repaired.endsWith('}') && !repaired.endsWith(']')) {
    // Count opening and closing braces
    const openBraces = (repaired.match(/\{/g) || []).length;
    const closeBraces = (repaired.match(/\}/g) || []).length;
    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/\]/g) || []).length;
    
    // Try to close open strings
    const lastQuoteIndex = repaired.lastIndexOf('"');
    const secondLastQuoteIndex = repaired.lastIndexOf('"', lastQuoteIndex - 1);
    
    // If the number of quotes is odd, we have an unclosed string
    const quoteCount = (repaired.match(/"/g) || []).length;
    if (quoteCount % 2 !== 0) {
      repaired += '"';
    }
    
    // Close open brackets and braces in reverse order
    // This is a simple heuristic, but often works for LLM truncation
    let toClose = [];
    for (let i = 0; i < json.length; i++) {
      if (json[i] === '{') toClose.push('}');
      else if (json[i] === '[') toClose.push(']');
      else if (json[i] === '}' || json[i] === ']') toClose.pop();
    }
    
    repaired += toClose.reverse().join('');
  }
  
  return repaired;
};

export const generateCatalogStrategy = async (catalog: CatalogCourse, context: CourseContext): Promise<CourseStrategy> => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    console.error('API Key is missing');
    throw new Error("La clave de API de Gemini no está configurada. Por favor, agrégala en los Secretos.");
  }
  const ai = new GoogleGenAI({ apiKey: apiKey });

  let promptText = `
  ESTRATEGIA BASADA EN CATÁLOGO:
  Debes generar una estrategia de curso profesional basándote ESTRICTAMENTE en los siguientes datos del catálogo de Cademmy:
  
  - TÍTULO: "${catalog.title}"
  - ÁREA: "${catalog.area}"
  - CATEGORÍA: "${catalog.category}"
  - OBJETIVO ORIGINAL: "${catalog.objective}"
  - CONTENIDO TEMÁTICO (Módulos): "${catalog.content}"
  - BENEFICIOS: "${catalog.benefits}"
  - PÚBLICO OBJETIVO: "${catalog.targetAudience}"
  - DURACIÓN: "${catalog.hours} horas"
  - MODALIDAD: "${catalog.modality}"

  INSTRUCCIONES CRÍTICAS DE FIDELIDAD AL CATÁLOGO:
  1. CONTENIDO TEMÁTICO (SYLLABUS): El catálogo lista módulos numerados (ej: 1. Tema A, 2. Tema B). DEBES crear exactamente un módulo en el 'syllabus' por cada uno de estos temas numerados. El título del módulo debe ser el mismo que aparece en el catálogo. No omitas ninguno ni inventes módulos que no estén en la lista. Para cada módulo, expande con subtemas técnicos detallados que sean coherentes con el título.
  2. DISTRIBUCIÓN DE HORAS: La suma de las horas de todos los módulos en el 'syllabus' DEBE ser exactamente igual a ${catalog.hours}. Distribuye las horas de forma lógica entre los módulos.
  3. BENEFICIOS (EXPECTED RESULTS): Los beneficios listados en el catálogo ("${catalog.benefits}") son los ÚNICOS que deben aparecer in 'expectedResults'. No agregues beneficios genéricos.
  4. IMPLEMENTACIÓN DE BENEFICIOS: Para CADA beneficio del catálogo, genera una entrada en 'benefitImplementation' que explique paso a paso cómo se logra y cómo se mide.
  5. OBJETIVOS: El 'generalObjective' debe ser una adaptación del objetivo original al estándar CONOCER (Sujeto + Verbo en futuro + Objeto + Condición).
  6. NIVEL: El nivel debe ser "${context.depth}".
  7. FOCO ESPECIAL: "${context.specialFocus}".

  RECUERDA: Tu prioridad es la fidelidad a la información del catálogo, dándole la estructura técnica de una propuesta de Cademmy.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: { parts: [{ text: promptText }] },
    config: { 
      systemInstruction: SYSTEM_INSTRUCTION, 
      responseMimeType: "application/json",
      responseSchema: courseStrategySchema,
      temperature: 0.1,
      maxOutputTokens: 8192
    }
  });

  let text = response.text?.trim();
  if (!text) {
    throw new Error("El modelo no devolvió ninguna respuesta.");
  }

  try {
    // Try to parse directly first
    let strategy: CourseStrategy;
    try {
      strategy = JSON.parse(text) as CourseStrategy;
    } catch (e) {
      // If parsing fails, try to repair truncated JSON
      console.warn("Attempting to repair truncated JSON...");
      const repairedText = repairTruncatedJson(text);
      strategy = JSON.parse(repairedText) as CourseStrategy;
    }

    // Ensure catalog metadata is preserved
    return {
      ...strategy,
      category: catalog.category,
      area: catalog.area,
      version: 'CAT-1.1'
    };
  } catch (e) {
    console.error("Failed to parse JSON response:", text);
    throw new Error("Error al procesar la estrategia del catálogo.");
  }
};

export const generateModuleIllustration = async (moduleTitle: string): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    console.error('API Key is missing');
    return '';
  }
  const ai = new GoogleGenAI({ apiKey: apiKey });
  const prompt = `Premium minimalist corporate conceptual photography for educational topic: "${moduleTitle}". High-end design, sharp focus, 8k.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return '';
  } catch (e) {
    return '';
  }
};

export const generateFullCourseContent = async (
  strategy: CourseStrategy, 
  context: CourseContext,
  onProgress?: (message: string) => void
): Promise<Course> => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    console.error('API Key is missing');
    throw new Error("La clave de API de Gemini no está configurada. Por favor, agrégala en los Secretos.");
  }
  const ai = new GoogleGenAI({ apiKey: apiKey });
  
  const modules: CourseModule[] = [];
  
  for (let i = 0; i < strategy.syllabus.length; i++) {
    const moduleOutline = strategy.syllabus[i];
    const progressMsg = `Fabricando Módulo ${i + 1}: ${moduleOutline.title}`;
    if (onProgress) onProgress(progressMsg);
    console.log(progressMsg);

    const prompt = `
      GENERA EL CONTENIDO MAGISTRAL PROFUNDO PARA EL SIGUIENTE MÓDULO:
      
      DATOS DEL CURSO:
      - TÍTULO: "${strategy.title}"
      - INDUSTRIA: "${context.targetCompany}"
      - FOCO: "${context.specialFocus}"
      - NIVEL: "${strategy.depth}"
      
      DATOS DEL MÓDULO:
      - TÍTULO DEL MÓDULO: "${moduleOutline.title}"
      - OBJETIVO DEL MÓDULO: "${moduleOutline.objective}"
      - DURACIÓN ASIGNADA: ${moduleOutline.hours} horas
      - TEMAS A CUBRIR: ${JSON.stringify(moduleOutline.topics)}
      
      REQUISITOS DE CONTENIDO:
      1. El 'content' debe ser una lectura técnica y profunda de 1000-1200 palabras.
      2. Debe incluir marcos teóricos contemporáneos (2020-2025).
      3. El tono debe ser ejecutivo y consultivo.
      4. Las actividades (quiz y casos) deben ser de alta dificultad.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: { 
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: moduleSchema,
          temperature: 0.3,
          maxOutputTokens: 8000
        }
      });

      const text = response.text?.trim();
      if (!text) throw new Error(`Respuesta vacía para el módulo ${i + 1}`);

      const moduleContent = JSON.parse(text);
      
      modules.push({
        ...moduleOutline,
        ...moduleContent
      });
    } catch (error) {
      console.error(`Error generating content for module ${i + 1}:`, error);
      throw new Error(`Error al generar el contenido del módulo ${i + 1}. Por favor intenta de nuevo.`);
    }
  }

  return { 
    ...strategy, 
    modules 
  } as Course;
};

export const generateTitleSuggestions = async (originalTitle: string): Promise<string[]> => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    console.error('API Key is missing');
    throw new Error("La clave de API de Gemini no está configurada. Por favor, agrégala en los Secretos.");
  }
  const ai = new GoogleGenAI({ apiKey: apiKey });
  
  const prompt = `El usuario ha solicitado un curso titulado: "${originalTitle}".
  Genera exactamente 3 opciones de títulos similares, más profesionales o con enfoques ligeramente distintos que podrían interesarle a una empresa B2B.
  Responde únicamente con un arreglo JSON de strings.
  Ejemplo: ["Título 1", "Título 2", "Título 3"]`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      },
      temperature: 0.7
    }
  });

  const text = response.text?.trim();
  if (!text) return [];

  try {
    return JSON.parse(text) as string[];
  } catch (e) {
    return [];
  }
};

export const searchCatalogWithAI = async (topic: string, catalog: any[]): Promise<{ id: string; reasoning: string }[]> => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  const ai = new GoogleGenAI({ apiKey: apiKey || "" });
  
  const catalogSummary = catalog.map(c => ({
    id: c.id,
    title: c.title,
    area: c.area,
    objective: c.objective,
    content: c.content
  }));

  const prompt = `Analiza el catálogo de cursos de Cademmy y determina cuáles se relacionan de forma DIRECTA y RELEVANTE con la búsqueda del usuario: "${topic}".
  
  CATÁLOGO:
  ${JSON.stringify(catalogSummary, null, 2)}
  
  REGLAS:
  1. Sé estricto con la relevancia. Si el curso no aborda el tema principal solicitado, no lo incluyas.
  2. No incluyas cursos "complementarios" si no tienen una relación directa con el tema central.
  3. Para cada curso seleccionado, proporciona un breve "razonamiento" (máximo 15 palabras) de por qué es relevante.
  4. Responde únicamente con un arreglo JSON de objetos con 'id' y 'reasoning'.
  5. Si no hay ninguno directamente relacionado, devuelve un arreglo vacío [].`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            reasoning: { type: Type.STRING }
          },
          required: ["id", "reasoning"]
        }
      },
      temperature: 0.2
    }
  });

  const text = response.text?.trim();
  if (!text) return [];

  try {
    return JSON.parse(text) as { id: string; reasoning: string }[];
  } catch (e) {
    return [];
  }
};

export const generateThemesForCourse = async (context: CourseContext): Promise<string[]> => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    console.error('API Key is missing');
    throw new Error("La clave de API de Gemini no está configurada.");
  }
  const ai = new GoogleGenAI({ apiKey: apiKey });
  
  const prompt = `Como Consultor Instruccional Senior de Cademmy, genera una lista de los 6 a 8 TEMAS O MÓDULOS PRINCIPALES que debería tener un curso con los siguientes parámetros:
  
  - TEMA: "${context.topic}"
  - NIVEL: "${context.depth}"
  - AUDIENCIA: "${context.audience}"
  - EMPRESA/SITUACIÓN: "${context.targetCompany}"
  - FOCO ESPECIAL: "${context.specialFocus}"
  - RESULTADO DESEADO: "${context.desiredOutcome}"
  
  REGLAS:
  1. Deben ser títulos de temas profesionales y técnicos.
  2. No incluyas números (ej. "Módulo 1").
  3. Responde únicamente con un arreglo JSON de strings.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      },
      temperature: 0.4
    }
  });

  const text = response.text?.trim();
  if (!text) return [];

  try {
    return JSON.parse(text) as string[];
  } catch (e) {
    return [];
  }
};
