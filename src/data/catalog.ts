export interface CatalogCourse {
  id: string;
  title: string;
  area: string;
  category: string;
  hours: number;
  price: string;
  objective: string;
  targetAudience: string;
  content: string;
  benefits: string;
  includes: string[];
  minParticipants: number;
  maxParticipants: number;
  modality: string;
  stps?: string;
}

export const courseCatalog: CatalogCourse[] = [
  {
    id: "DIR-HD-001",
    title: "Visión y Acción: Curso Intensivo de Planeación Estratégica para el Sector Público",
    area: "Dirección",
    category: "Cursos para el sector público (CSP)",
    hours: 20,
    price: "$39,800.00",
    objective: "Adquirir los conocimientos y herramientas para administrar y diseñar de forma estratégica los planes y programas del sector público, así como las metodologías de seguimiento y evaluación para cumplir sus programas físicos y financieros con apego al Plan Nacional de Desarrollo.",
    targetAudience: "Funcionarios gubernamentales, profesionales de la administración pública, equipos de planificación estratégica.",
    content: "1. Aspectos conceptuales de la evaluación del desempeño institucional. 2. Planificación estratégica como instrumento de gestión institucional. 3. Componentes de la planeación estratégica en el sector público. 4. Planeación estratégica y programas operativos anuales. 5. Indicadores del desempeño. 6. Análisis del entorno y diagnóstico estratégico. 7. Gestión del cambio organizacional. 8. Formulación de estrategias. 9. Monitoreo y evaluación de la estrategia. 10. Gobernanza y participación ciudadana.",
    benefits: "Adquisición de conocimientos sólidos, mejora de habilidades estratégicas, optimización de la toma de decisiones, desarrollo de habilidades de liderazgo, mayor eficiencia organizacional.",
    includes: ["Manual digital para cada asistente", "Constancia"],
    minParticipants: 3,
    maxParticipants: 30,
    modality: "Presencial"
  },
  {
    id: "CMP-001",
    title: "Transforma tu Negocio: Curso Avanzado de Mejora de Procesos",
    area: "Mejora de Procesos",
    category: "Cursos de mejora de procesos (CMP)",
    hours: 24,
    price: "$47,760.00",
    objective: "Proporcionar a los participantes los conocimientos teóricos y prácticos necesarios para comprender y aplicar de manera efectiva las técnicas y metodologías de mejora de procesos en un entorno empresarial.",
    targetAudience: "Gerentes de operaciones, consultores de negocios, analistas de procesos, profesionales de calidad.",
    content: "1. Fundamentos de la mejora de procesos. 2. Factores clave para el éxito. 3. Reingeniería vs Mejora Continua. 4. Metodología de reingeniería y herramientas de soporte. 5. Gestión del cambio.",
    benefits: "Identificación de oportunidades de mejora, reducción de costos, mejora de la calidad, aumento de la productividad.",
    includes: ["Manual digital para cada asistente", "Constancia"],
    minParticipants: 3,
    maxParticipants: 30,
    modality: "Presencial"
  },
  {
    id: "DIR-HB-001",
    title: "Habilidades de Supervisión mediante un liderazgo SMART para una industria 4.0",
    area: "Habilidades",
    category: "Cursos de mandos medios (CMM)",
    hours: 16,
    price: "$31,840.00",
    objective: "Comprender los conceptos y principios clave de la industria 4.0, adquirir habilidades de supervisión SMART y aplicar estrategias de liderazgo efectivas.",
    targetAudience: "Gerentes y supervisores de equipos, profesionales de la industria 4.0, recursos humanos.",
    content: "1. Introducción a la industria 4.0. 2. Liderazgo en la era digital. 3. Habilidades SMART. 4. Comunicación efectiva. 5. Gestión del cambio. 6. Desarrollo de habilidades técnicas y blandas.",
    benefits: "Mejora de habilidades de supervisión, liderazgo adaptativo, comunicación efectiva, gestión del cambio exitosa.",
    includes: ["Manual digital para cada asistente", "Constancia"],
    minParticipants: 3,
    maxParticipants: 30,
    modality: "Presencial"
  },
  {
    id: "DIR-HB-002",
    title: "Máximo Impacto: Curso Avanzado de Gestión de Proyectos",
    area: "Habilidades",
    category: "Cursos de habilidades ejecutivas financieras",
    hours: 30,
    price: "$59,700.00",
    objective: "Proporcionar a los participantes los conocimientos, habilidades y herramientas necesarias para que sean capaces de seleccionar y presentar proyectos de manera efectiva.",
    targetAudience: "Profesionales en administración, gerentes de proyectos, consultores, emprendedores.",
    content: "1. Identificación y análisis de problemas. 2. Planificación y gestión de proyectos. 3. Ejecución y control. 4. Cierre y consideraciones adicionales.",
    benefits: "Adquisición de conocimientos sólidos, desarrollo de habilidades prácticas, mejora de la toma de decisiones, fortalecimiento del liderazgo.",
    includes: ["Manual digital para cada asistente", "Constancia"],
    minParticipants: 3,
    maxParticipants: 30,
    modality: "Presencial"
  },
  {
    id: "DIR-HB-003",
    title: "Gestión de Conflictos: Comunicación Efectiva en el Trabajo",
    area: "Habilidades",
    category: "Cursos de habilidades ejecutivas financieras",
    hours: 16,
    price: "$31,840.00",
    objective: "Gestionar de manera efectiva los conflictos en el entorno laboral, promoviendo la resolución constructiva y la comunicación efectiva.",
    targetAudience: "Gerentes, líderes de equipo, empleados, recursos humanos.",
    content: "1. Definición del conflicto. 2. Comunicación. 3. Manejo de emociones. 4. Tipos de conflicto. 5. Acuerdos ganar-ganar.",
    benefits: "Mejor resolución de conflictos, comunicación más efectiva, mayor conciencia emocional, mejora del clima laboral.",
    includes: ["Manual digital para cada asistente", "Constancia"],
    minParticipants: 3,
    maxParticipants: 30,
    modality: "Presencial"
  },
  {
    id: "DIR-HB-004",
    title: "Liderazgo 360: Herramientas Prácticas para el Éxito Empresarial",
    area: "Habilidades",
    category: "Cursos de mandos medios (CMM)",
    hours: 24,
    price: "$47,760.00",
    objective: "Desarrollar una visión integral del liderazgo, proporcionando herramientas prácticas para gestionar equipos, motivar al personal y alcanzar los objetivos empresariales.",
    targetAudience: "Líderes de equipo, gerentes, directivos y cualquier persona interesada en mejorar sus habilidades de liderazgo.",
    content: "1. Fundamentos del Liderazgo 360. 2. Comunicación asertiva y escucha activa. 3. Inteligencia emocional en el liderazgo. 4. Gestión del tiempo y productividad. 5. Delegación efectiva y empoderamiento. 6. Resolución de conflictos y negociación. 7. Motivación y compromiso del equipo. 8. Liderazgo en tiempos de cambio. 9. Coaching y mentoring para el desarrollo del talento. 10. Plan de acción personal de liderazgo.",
    benefits: "Mejora en la gestión de equipos, aumento de la productividad, mejor clima laboral, desarrollo de habilidades de comunicación, visión estratégica del liderazgo.",
    includes: ["Manual digital para cada asistente", "Constancia"],
    minParticipants: 3,
    maxParticipants: 30,
    modality: "Presencial"
  }
];
