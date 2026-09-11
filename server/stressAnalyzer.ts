import { GoogleGenAI, Type } from "@google/genai";
import { CounselingSession, getAllSessions } from "./storage";
import fs from "fs/promises";
import path from "path";

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
  overallStressLevel: number; // 1 to 100
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

const PROFILE_FILE = path.join(process.cwd(), "data", "stress_profile.json");

// Category metadata definitions
export const CATEGORY_META: Record<StressCategory, { color: string; description: string; defaultTriggers: string[] }> = {
  '업무': {
    color: '#E11D48', // rose
    description: '과도한 업무량, 야근, 마감 압박, 상사 및 팀 내 소통, 성과 책임감',
    defaultTriggers: ['끝없는 야근/특근', '상사의 가스라이팅/폭언', '성과 및 실적 압박', '불합리한 업무 분장'],
  },
  '자기개발': {
    color: '#D97706', // amber
    description: '커리어 도태 불안, 자격증/어학 공부 부담, 이직 준비 스트레스, 완벽주의',
    defaultTriggers: ['뒤처지는 느낌/도태 불안', '퇴근 후 강박적 공부', '커리어 정체감', '완벽주의로 인한 자책'],
  },
  '취미 활동': {
    color: '#059669', // emerald
    description: '워라밸 붕괴로 인한 여가 부재, 쉴 때 느끼는 죄책감, 무기력과 취미 박탈',
    defaultTriggers: ['퇴근 후 무기력/누워만 있음', '쉴 때 드는 죄책감', '취미를 즐길 시간/체력 부족', '여가 불능 상태'],
  },
  '인간관계': {
    color: '#4F46E5', // indigo
    description: '사내정치, 동료와의 냉기류, 타인의 시선과 눈치 보기, 고립감',
    defaultTriggers: ['사내정치/파벌', '동료와의 미묘한 신경전', '거절하지 못하는 성격', '직장 내 외로움'],
  },
  '건강/생활': {
    color: '#0891B2', // cyan
    description: '수면장애, 만성 두통/위장장애, 체력 고갈, 불규칙한 식습관',
    defaultTriggers: ['불면증/수면의 질 저하', '만성 신체 피로', '주말 몰아자기', '신경성 두통/소화불량'],
  },
};

// Keyword-based heuristic classifier
export function classifyTextToCategory(text: string): { category: StressCategory; score: number } {
  const lower = text.toLowerCase();
  
  const scores: Record<StressCategory, number> = {
    '업무': 0,
    '자기개발': 0,
    '취미 활동': 0,
    '인간관계': 0,
    '건강/생활': 0,
  };

  // Keywords dictionary
  const workKeywords = ['업무', '회사', '팀장', '야근', '특근', '보고서', '일', '과장', '부장', '성과', '실적', '마감', '퇴사', '직장', '회의', '프로젝트', '클라이언트', '상사'];
  const devKeywords = ['자기개발', '공부', '자격증', '스펙', '영어', '코딩', '이직', '포트폴리오', '역량', '성장', '도태', '뒤처', '학원', '강의', '책', '발전', '완벽'];
  const hobbyKeywords = ['취미', '여가', '주말', '휴식', '쉬는', '놀', '영화', '운동', '멍때', '유튜브', '넷플릭스', '취미활동', '죄책감', '놀지', '시간이 없', '무기력'];
  const relKeywords = ['동료', '대리', '사원', '사내정치', '정치', '따돌', '눈치', '대화', '관계', '선배', '후배', '사람', '친구', '미움', '억울', '배신'];
  const healthKeywords = ['잠', '수면', '불면', '피곤', '두통', '소화', '아프', '체력', '몸', '약', '병원', '눈', '목', '어깨', '허리', '식사'];

  workKeywords.forEach(k => { if (lower.includes(k)) scores['업무'] += 2; });
  devKeywords.forEach(k => { if (lower.includes(k)) scores['자기개발'] += 2.5; });
  hobbyKeywords.forEach(k => { if (lower.includes(k)) scores['취미 활동'] += 2.5; });
  relKeywords.forEach(k => { if (lower.includes(k)) scores['인간관계'] += 2; });
  healthKeywords.forEach(k => { if (lower.includes(k)) scores['건강/생활'] += 2; });

  let bestCat: StressCategory = '업무';
  let maxScore = -1;

  for (const [cat, score] of Object.entries(scores) as [StressCategory, number][]) {
    if (score > maxScore) {
      maxScore = score;
      bestCat = cat;
    }
  }

  // Intensity (1 to 10)
  const intensity = Math.min(10, Math.max(4, Math.round(5 + maxScore * 0.4)));

  return { category: bestCat, score: intensity };
}

// Ensure initial profile
export async function getStoredProfile(): Promise<UserStressProfile | null> {
  try {
    const data = await fs.readFile(PROFILE_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function saveProfile(profile: UserStressProfile): Promise<void> {
  try {
    await fs.mkdir(path.dirname(PROFILE_FILE), { recursive: true });
    await fs.writeFile(PROFILE_FILE, JSON.stringify(profile, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save stress profile:", err);
  }
}

// Compute profile from sessions + optional AI deep reasoning
export async function analyzeUserStress(sessions: CounselingSession[], forceAi: boolean = false): Promise<UserStressProfile> {
  const categoryCounts: Record<StressCategory, { count: number; totalIntensity: number; triggers: Set<string> }> = {
    '업무': { count: 0, totalIntensity: 0, triggers: new Set() },
    '자기개발': { count: 0, totalIntensity: 0, triggers: new Set() },
    '취미 활동': { count: 0, totalIntensity: 0, triggers: new Set() },
    '인간관계': { count: 0, totalIntensity: 0, triggers: new Set() },
    '건강/생활': { count: 0, totalIntensity: 0, triggers: new Set() },
  };

  let totalSessions = sessions.length;

  for (const session of sessions) {
    let cat: StressCategory = session.category || '업무';
    let score = session.stressScore || 6;

    if (!session.category) {
      const allText = (session.title || "") + " " + (session.messages?.map(m => m.text).join(" ") || "");
      const classified = classifyTextToCategory(allText);
      cat = classified.category;
      score = classified.score;
    }

    categoryCounts[cat].count += 1;
    categoryCounts[cat].totalIntensity += score;

    if (session.emotion?.stressFactors) {
      session.emotion.stressFactors.forEach(f => categoryCounts[cat].triggers.add(f));
    }
    if (session.tags) {
      session.tags.forEach(t => categoryCounts[cat].triggers.add(t));
    }
  }

  // If no sessions, provide clean baseline distribution
  if (totalSessions === 0) {
    totalSessions = 1;
    categoryCounts['업무'].count = 1;
    categoryCounts['업무'].totalIntensity = 7;
  }

  const sortedCategories = (Object.keys(categoryCounts) as StressCategory[]).sort(
    (a, b) => categoryCounts[b].count - categoryCounts[a].count
  );

  const primaryDomain = sortedCategories[0];
  const secondaryDomain = sortedCategories[1] || '자기개발';

  const categoryStats: CategoryStat[] = (Object.keys(categoryCounts) as StressCategory[]).map(cat => {
    const data = categoryCounts[cat];
    const percentage = Math.round((data.count / totalSessions) * 100);
    const avgIntensity = data.count > 0 ? Math.round((data.totalIntensity / data.count) * 10) / 10 : 5;
    const keyTriggers = Array.from(data.triggers);
    if (keyTriggers.length === 0) {
      keyTriggers.push(...CATEGORY_META[cat].defaultTriggers.slice(0, 3));
    }

    return {
      category: cat,
      count: data.count,
      percentage,
      avgIntensity,
      color: CATEGORY_META[cat].color,
      description: CATEGORY_META[cat].description,
      keyTriggers: keyTriggers.slice(0, 4),
    };
  });

  // Calculate overall stress level (1 to 100)
  const avgBattery = sessions.reduce((acc, s) => acc + (s.emotion?.batteryLevel || 40), 0) / (sessions.length || 1);
  const overallStressLevel = Math.max(20, Math.min(95, Math.round(100 - avgBattery)));

  // Try Gemini AI synthesis if API key is present
  const apiKey = process.env.GEMINI_API_KEY;
  let aiDiagnosis = {
    coreDiagnosis: `현재 내담자는 '${primaryDomain}' 영역(${categoryStats.find(c => c.category === primaryDomain)?.percentage || 50}%)에서 가장 높은 심리적 소진과 중압감을 겪고 있으며, 2순위로 '${secondaryDomain}' 관련 고민이 복합적으로 작용하고 있습니다.`,
    vulnerabilityTrigger: `업무 마감과 성과 책임감이 개인의 휴식과 자기개발 시간까지 침범하여, 쉴 때조차 죄책감을 느끼는 '가짜 휴식' 패턴이 주된 취약 요인입니다.`,
    strengthAndResilience: `자신의 상태를 정직하게 관찰하고 상담을 통해 주도적으로 치유하려는 성찰 능력과 성장에 대한 진정성이 매우 높습니다.`,
    actionPrescription: [
      `퇴근 후 첫 30분 동안 업무와 자기개발 생각 완전 단절 루틴 갖기`,
      `주말 중 반나절은 '아무 생산성 없는 온전한 쉼' 허용하기`,
      `타인의 미숙함이나 과도한 일정을 내 부족함으로 자책하지 않는 연습하기`
    ],
    counselorRecommendation: `내담자는 이미 일과 성장에 대해 최선을 다하고 있으므로, "더 열심히 하라"는 조언보다는 "지금도 충분히 잘하고 있으며, 영혼을 지키는 쉼이 최우선"임을 강조해주세요.`
  };

  let counselorGuidance = `내담자의 가장 심각한 스트레스 근원은 [${primaryDomain}]입니다. 업무나 자기개발 강박으로 인한 피로도가 높으니 절대적인 지지와 무조건적인 수용으로 죄책감을 덜어주고 실현 가능한 '작은 멈춤'을 처방해주세요.`;

  if (apiKey && (forceAi || sessions.length > 0)) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } }
      });

      const conversationSnippets = sessions.slice(0, 6).map((s, idx) => {
        const uText = s.messages?.filter(m => m.role === 'user').map(m => m.text).join(" / ").slice(0, 200);
        return `세션 ${idx + 1} (${s.title}): [카테고리:${s.category || '미지정'}, 배터리:${s.emotion?.batteryLevel}%] 대화요약: ${uText}`;
      }).join("\n");

      const prompt = `당신은 직장인 정신건강의학 및 심리코칭 최고 권위자입니다.
내담자의 누적 상담 데이터와 대화록을 분석하여 스트레스 영역('업무', '자기개발', '취미 활동', '인간관계', '건강/생활')에 대한 정밀 심리 진단 리포트를 JSON으로 작성해주세요.

[내담자 상담 이력 요약]:
${conversationSnippets}

[현재 카테고리 집계]:
- 1위 주 스트레스 영역: ${primaryDomain}
- 2위 부 스트레스 영역: ${secondaryDomain}
- 전반적 피로도: ${overallStressLevel}%

반드시 아래 JSON 형식으로만 응답하세요:
{
  "coreDiagnosis": "내담자의 현재 스트레스 상태에 대한 통찰력 있는 2-3문장 종합 진단",
  "vulnerabilityTrigger": "내담자가 무너지기 쉬운 핵심 트리거 (예: 퇴근 후 뒤처짐에 대한 불안, 상사의 모호한 피드백 등)",
  "strengthAndResilience": "내담자가 가진 내면의 강점 및 회복 잠재력",
  "actionPrescription": ["오늘부터 실천할 구체적 액션 1", "구체적 액션 2", "구체적 액션 3"],
  "counselorRecommendation": "앞으로 AI 상담사들이 내담자를 케어할 때 숙지해야 할 필수 상담 태도 및 가이드",
  "counselorGuidance": "상담 프롬프트에 직접 주입될 1-2문장의 핵심 지침"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.3,
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        if (parsed.coreDiagnosis) {
          aiDiagnosis = {
            coreDiagnosis: parsed.coreDiagnosis,
            vulnerabilityTrigger: parsed.vulnerabilityTrigger || aiDiagnosis.vulnerabilityTrigger,
            strengthAndResilience: parsed.strengthAndResilience || aiDiagnosis.strengthAndResilience,
            actionPrescription: Array.isArray(parsed.actionPrescription) ? parsed.actionPrescription : aiDiagnosis.actionPrescription,
            counselorRecommendation: parsed.counselorRecommendation || aiDiagnosis.counselorRecommendation,
          };
          if (parsed.counselorGuidance) {
            counselorGuidance = parsed.counselorGuidance;
          }
        }
      }
    } catch (aiErr) {
      console.warn("AI Stress synthesis failed, using rule-based profile:", aiErr);
    }
  }

  const profile: UserStressProfile = {
    primaryDomain,
    secondaryDomain,
    totalAnalyzedSessions: sessions.length,
    overallStressLevel,
    categories: categoryStats,
    counselorGuidance,
    aiDiagnosis,
    lastAnalyzedAt: new Date().toISOString(),
  };

  await saveProfile(profile);
  return profile;
}
