import fs from "fs/promises";
import path from "path";

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface EmotionCheckIn {
  batteryLevel: number;
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

export interface CounselingSession {
  id: string;
  title: string;
  counselorId: string;
  category?: '업무' | '자기개발' | '취미 활동' | '인간관계' | '건강/생활';
  stressScore?: number; // 1-10
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  emotion: EmotionCheckIn;
  prescription?: Prescription | null;
  memo?: string;
  tags: string[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "counseling_sessions.json");

// Sample initial data so the user sees a rich, populated counseling history right away
const INITIAL_SESSIONS: CounselingSession[] = [
  {
    id: "session-init-1",
    title: "팀장님의 과도한 지시와 야근 피로에 대한 상담",
    counselorId: "bom",
    category: "업무",
    stressScore: 9,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000 * 3).toISOString(),
    emotion: {
      batteryLevel: 25,
      weather: "rain",
      stressFactors: ["끝없는 야근/특근", "상사의 가스라이팅/폭언"],
    },
    messages: [
      {
        id: "msg-1",
        role: "user",
        text: "오늘도 퇴근 10분 전에 급한 보고서를 넘겨서 자정까지 야근했어요. 제가 일을 못해서 그런 것 같아 너무 괴롭습니다.",
        timestamp: "오후 11:45",
      },
      {
        id: "msg-2",
        role: "model",
        text: "퇴근 10분 전 급한 업무를 던진 것은 결코 당신의 역량 부족 때문이 아닙니다. 비합리적인 일정 분배와 체계의 문제예요. 자책으로 마음을 더 다치게 하지 마세요. 오늘 정말 고생 많으셨습니다.",
        timestamp: "오후 11:46",
      },
    ],
    prescription: {
      comfortTitle: "죄책감을 씻어내고 온전히 잠드는 밤",
      healingQuote: "남의 미숙함을 내 부족함으로 착각하지 마세요. 오늘 당신은 최선을 다했습니다.",
      actions: [
        {
          title: "따뜻한 물로 샤워하기",
          description: "온수로 어깨 근육을 풀며 긴장을 이완하세요.",
          iconName: "Droplets",
        },
        {
          title: "업무 슬랙 음소거",
          description: "퇴근 후에는 알림을 끄고 내 시간을 지키세요.",
          iconName: "BellOff",
        },
        {
          title: "따뜻한 허브티 한 잔",
          description: "지친 속을 달래주는 캐모마일 티를 마십니다.",
          iconName: "Coffee",
        },
      ],
      selfAffirmation: "회사는 내 인생의 일부분일 뿐, 나의 전부는 아니다.",
    },
    memo: "봄날 상담사의 말대로 내 탓이 아니라고 생각하니 마음이 한결 가벼워졌다. 알림 끄고 잤음.",
    tags: ["#야근", "#상사갈등", "#자책금지"],
  },
  {
    id: "session-init-2",
    title: "동료와의 비교와 자기개발 도태 불안",
    counselorId: "mentor",
    category: "자기개발",
    stressScore: 8,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000 * 2).toISOString(),
    emotion: {
      batteryLevel: 35,
      weather: "cloud",
      stressFactors: ["성과 및 실적 압박", "뒤처지는 느낌/도태 불안"],
    },
    messages: [
      {
        id: "msg-3",
        role: "user",
        text: "동기들은 퇴근 후 코딩 학원 다니고 자격증 따는데, 저는 너무 피곤해서 그냥 쓰러져 자요. 이러다 나만 도태될까 봐 너무 불안합니다.",
        timestamp: "오후 9:20",
      },
      {
        id: "msg-4",
        role: "model",
        text: "남들의 인스타그램식 '갓생'에 흔들리지 마세요. 체력이 바닥난 상태에서 하는 공부는 뇌에 남지도 않고 번아웃만 앞당깁니다. 지금 당신에게 진짜 필요한 자기개발은 '에너지 회복'입니다. 잘 쉬어야 다음 스텝도 밟을 수 있어요.",
        timestamp: "오후 9:22",
      },
    ],
    memo: "휴식도 자기개발의 필수 과정이라는 한선배의 말이 뇌리에 남는다. 오늘 밤은 죄책감 없이 쉬자.",
    tags: ["#자기개발", "#도태불안", "#체력방전"],
  },
  {
    id: "session-init-3",
    title: "주말에도 아무것도 못하고 누워만 있는 무기력감",
    counselorId: "mind",
    category: "취미 활동",
    stressScore: 7,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000 * 1).toISOString(),
    emotion: {
      batteryLevel: 40,
      weather: "cloud",
      stressFactors: ["휴식 및 수면 부족", "여가 불능 상태"],
    },
    messages: [
      {
        id: "msg-5",
        role: "user",
        text: "예전엔 그림도 그리고 운동도 즐겨 했는데, 요즘은 주말 내내 스마트폰만 보면서 누워있어요. 취미를 즐길 마음의 여유조차 사라진 것 같아 서글픕니다.",
        timestamp: "오후 3:15",
      },
      {
        id: "msg-6",
        role: "model",
        text: "지극히 자연스러운 뇌의 방전 신호예요. 배터리가 0%일 때는 즐거운 취미조차 하나의 '과제'나 '노동'처럼 느껴집니다. '무언가를 즐겨야 한다'는 강박마저 내려놓고, 그저 멍때리며 뇌를 식혀주세요. 충분히 충전되면 취미에 대한 갈망도 자연스레 돌아옵니다.",
        timestamp: "오후 3:16",
      },
    ],
    memo: "취미조차 의무감으로 대하고 있었음을 깨달았다. 멍때리기 호흡 실천하기.",
    tags: ["#취미활동", "#여가부재", "#뇌휴식"],
  },
  {
    id: "session-init-4",
    title: "사내 정치와 공치사 가로채기에 대한 분노",
    counselorId: "friend",
    category: "인간관계",
    stressScore: 8,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    emotion: {
      batteryLevel: 30,
      weather: "storm",
      stressFactors: ["동료와의 불화/사내정치", "상사의 가스라이팅/폭언"],
    },
    messages: [
      {
        id: "msg-7",
        role: "user",
        text: "내가 2주 동안 주말도 반납하고 쓴 기획서를 옆자리 대리가 자기 이름으로 쏙 올려버렸어... 진짜 출근하기가 싫다.",
        timestamp: "오후 7:12",
      },
      {
        id: "msg-8",
        role: "model",
        text: "와 진짜 열받는다! 남의 고생 숟가락 얹는 인간들 왜 이리 많냐? 넌 절대 가만히 있지 마. 메일 히스토리랑 파일 수정기록 캡처해두고, 팀장 미팅 때 세부 데이터로 네가 작성자라는 거 딱 보여주자. 오늘 맛있는 거 먹고 속 풀자 진짜!",
        timestamp: "오후 7:13",
      },
    ],
    memo: "기록 남기기 팁 메모해둠. 내일 회의 때 차분하게 대처하자.",
    tags: ["#사내정치", "#동기위로", "#분노해소"],
  },
];

async function ensureDataFile(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(DATA_FILE);
    } catch {
      await fs.writeFile(DATA_FILE, JSON.stringify(INITIAL_SESSIONS, null, 2), "utf-8");
    }
  } catch (err) {
    console.error("Failed to ensure data file:", err);
  }
}

export async function getAllSessions(): Promise<CounselingSession[]> {
  await ensureDataFile();
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Error reading sessions file:", err);
    return [];
  }
}

export async function getSessionById(id: string): Promise<CounselingSession | null> {
  const sessions = await getAllSessions();
  return sessions.find((s) => s.id === id) || null;
}

export async function saveSession(session: Omit<CounselingSession, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<CounselingSession> {
  const sessions = await getAllSessions();
  const now = new Date().toISOString();

  let targetSession: CounselingSession;

  if (session.id) {
    const index = sessions.findIndex((s) => s.id === session.id);
    if (index !== -1) {
      targetSession = {
        ...sessions[index],
        ...session,
        id: session.id,
        updatedAt: now,
      };
      sessions[index] = targetSession;
    } else {
      targetSession = {
        ...session,
        id: session.id,
        createdAt: now,
        updatedAt: now,
      };
      sessions.unshift(targetSession);
    }
  } else {
    const newId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    targetSession = {
      ...session,
      id: newId,
      createdAt: now,
      updatedAt: now,
    };
    sessions.unshift(targetSession);
  }

  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(sessions, null, 2), "utf-8");
  return targetSession;
}

export async function updateSession(id: string, updates: Partial<CounselingSession>): Promise<CounselingSession | null> {
  const sessions = await getAllSessions();
  const index = sessions.findIndex((s) => s.id === id);
  if (index === -1) return null;

  sessions[index] = {
    ...sessions[index],
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  };

  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(sessions, null, 2), "utf-8");
  return sessions[index];
}

export async function deleteSession(id: string): Promise<boolean> {
  const sessions = await getAllSessions();
  const filtered = sessions.filter((s) => s.id !== id);
  if (filtered.length === sessions.length) return false;

  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(filtered, null, 2), "utf-8");
  return true;
}

export async function clearAllSessions(): Promise<void> {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2), "utf-8");
}

export async function getCounselingStats() {
  const sessions = await getAllSessions();

  let totalMessages = 0;
  let totalBattery = 0;
  const counselorCounts: Record<string, number> = {
    bom: 0,
    mentor: 0,
    friend: 0,
    mind: 0,
  };
  const factorMap: Record<string, number> = {};

  for (const s of sessions) {
    totalMessages += s.messages ? s.messages.length : 0;
    if (s.emotion?.batteryLevel !== undefined) {
      totalBattery += s.emotion.batteryLevel;
    }
    if (s.counselorId) {
      counselorCounts[s.counselorId] = (counselorCounts[s.counselorId] || 0) + 1;
    }
    if (s.emotion?.stressFactors) {
      for (const factor of s.emotion.stressFactors) {
        factorMap[factor] = (factorMap[factor] || 0) + 1;
      }
    }
  }

  const topStressFactors = Object.entries(factorMap)
    .map(([factor, count]) => ({ factor, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const avgBatteryLevel = sessions.length > 0 ? Math.round(totalBattery / sessions.length) : 50;

  return {
    totalSessions: sessions.length,
    totalMessages,
    counselorDistribution: counselorCounts,
    avgBatteryLevel,
    topStressFactors,
  };
}
