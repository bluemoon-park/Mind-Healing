export type CounselorId = 'bom' | 'mentor' | 'friend' | 'mind';

export interface Counselor {
  id: CounselorId;
  name: string;
  roleTitle: string;
  avatar: string;
  tagline: string;
  tone: string;
  color: {
    primary: string;
    bgLight: string;
    border: string;
    text: string;
    bubble: string;
    badge: string;
  };
  introMessage: string;
  suggestedPrompts: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  isStreaming?: boolean;
}

export interface EmotionCheckIn {
  batteryLevel: number; // 0 - 100
  weather: 'storm' | 'rain' | 'cloud' | 'sun' | 'rainbow';
  stressFactors: string[];
  note?: string;
}

export interface Prescription {
  comfortTitle: string;
  healingQuote: string;
  actions: {
    title: string;
    description: string;
    iconName: string;
  }[];
  selfAffirmation: string;
}

export type StressCategory = '업무' | '자기개발' | '취미 활동' | '인간관계' | '건강/생활';

export interface CategoryStat {
  category: StressCategory;
  count: number;
  percentage: number;
  avgIntensity: number; // 1 to 10
  color: string;
  description: string;
  keyTriggers: string[];
}

export interface UserStressProfile {
  primaryDomain: StressCategory;
  secondaryDomain: StressCategory;
  totalAnalyzedSessions: number;
  overallStressLevel: number;
  categories: CategoryStat[];
  counselorGuidance: string;
  aiDiagnosis: {
    coreDiagnosis: string;
    vulnerabilityTrigger: string;
    strengthAndResilience: string;
    actionPrescription: string[];
    counselorRecommendation: string;
  };
  lastAnalyzedAt: string;
}

export interface CounselingSession {
  id: string;
  title: string;
  counselorId: CounselorId;
  category?: StressCategory;
  stressScore?: number; // 1-10
  createdAt: string; // ISO string
  updatedAt: string;
  messages: ChatMessage[];
  emotion: EmotionCheckIn;
  prescription?: Prescription | null;
  memo?: string;
  tags: string[];
}

export interface CounselingStats {
  totalSessions: number;
  totalMessages: number;
  counselorDistribution: Record<CounselorId, number>;
  avgBatteryLevel: number;
  topStressFactors: { factor: string; count: number }[];
}

export interface CheckInSlot {
  id: string;
  name: string;
  time: string; // e.g. "09:00", "14:00", "18:00", "22:00"
  enabled: boolean;
  contextMessage: string;
  recommendedTag: string;
}

export interface ScheduledCheckInRecord {
  id: string;
  timestamp: string; // ISO string
  slotName: string;
  batteryLevel: number;
  weather: 'storm' | 'rain' | 'cloud' | 'sun' | 'rainbow';
  stressFactors: string[];
  note?: string;
}
