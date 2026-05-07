
export interface Topic {
  title: string;
  subtopics: string[];
}

export interface ModuleOutline {
  title: string;
  hours: number;
  objective: string;
  topics: Topic[];
}

export interface Pillar {
  id: string;
  title: string;
  description: string;
  hours: number;
  moduleObjective: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface MatchingPair {
  term: string;
  definition: string;
}

export interface ReasoningCase {
  scenario: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface CourseModule extends ModuleOutline {
  content: string; 
  keyTakeaways: string[];
  references: string[]; 
  imageUrl?: string; 
  matchingActivity: MatchingPair[];
  quiz: QuizQuestion[]; // 10 questions per module
  cases: ReasoningCase[]; // 5 realistic reasoning cases
}

export interface CourseStrategy {
  title: string;
  targetAudience: {
    directedTo: string[];
    participantProfile: string;
  };
  generalObjective: string;
  particularObjectives: string[];
  totalDuration: string;
  methodology: string;
  prerequisites: string[];
  expectedResults: string[];
  benefitImplementation: {
    benefit: string;
    howToAchieve: string;
    measurement: string;
  }[];
  depth: 'Básico' | 'Intermedio' | 'Avanzado';
  syllabus: ModuleOutline[];
  category?: string;
  area?: string;
  groundingSources?: GroundingSource[];
  version?: string;
}

export interface Course extends Omit<CourseStrategy, 'syllabus'> {
  modules: CourseModule[];
  version?: string;
}

export interface CourseContext {
  topic: string;
  audience: string;
  depth: 'Básico' | 'Intermedio' | 'Avanzado';
  targetCompany: string;
  industry: string;
  companySize?: string;
  userRole?: string;
  specialFocus: string;
  preferredDuration: string;
  desiredOutcome: string;
  confirmedThemes?: string[];
  customTitle?: string;
  proposalFile?: {
    data: string;
    mimeType: string;
    name: string;
  };
}

export enum AppStep {
  INPUT = 0,
  STRATEGY = 1,
  COURSE = 2,
}