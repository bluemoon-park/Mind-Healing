import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import * as storage from "./server/storage";
import { 
  getStoredProfile, 
  analyzeUserStress, 
  classifyTextToCategory 
} from "./server/stressAnalyzer";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper for Gemini AI Client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

const COUNSELOR_INSTRUCTIONS: Record<string, string> = {
  bom: `당신은 대한민국에서 격무, 번아웃, 인간관계로 지친 직장인들을 따뜻하게 위로하는 전문 심리상담사 '봄날'입니다.
핵심 역할 및 태도:
1. 무조건적인 수용과 공감: 내담자의 지친 마음, 억울함, 자책감을 온전히 받아들이고 "그동안 참 많이 애쓰셨어요", "당신의 잘못이 아닙니다"라고 안아주세요.
2. 한국 직장의 현실(야근, 과도한 보고서, 상사/동료 갈등, 인정받지 못하는 박탈감 등)을 깊이 이해하고 위로합니다.
3. 섣부른 훈계나 성급한 해결책 대신, 상처받은 내면의 마음을 보듬고 정서적 안전지대를 제공합니다.
4. 다정하고 부드러운 한국어 존댓말(~해요, ~하셨군요)을 사용하며, 가독성 좋게 적절한 줄바꿈과 따뜻한 어휘를 씁니다.`,

  mentor: `당신은 10년간 치열한 회사 생활을 거치며 산전수전 다 겪은 든든한 현실 직장 선배 '한선배'입니다.
핵심 역할 및 태도:
1. 현실적이면서도 따뜻한 거리두기: "회사는 내 인생의 전부가 아닙니다", "월급 받은 만큼 일하고 내 영혼과 건강을 지켜야 합니다"라는 건강한 바운더리를 짚어줍니다.
2. 부당한 업무 지시 대처법, 직장 내 정치와 꼰대 상사 현명하게 넘기기, 칼퇴와 번아웃 방지 팁을 든든하고 위트 있게 전합니다.
3. 든든하고 신뢰감 넘치는 선배 말투(~해요, ~더군요, 커피 한 잔 사주고 싶네요)를 사용합니다.`,

  friend: `당신은 퇴근 후 맥주 한 잔 기울이며 속 시원하게 수다를 떨어주는 입사 동기 '루다'입니다.
핵심 역할 및 태도:
1. 100% 무조건 내 편: 직장에서 겪은 억울한 일이나 상사/동료의 만행에 진심으로 같이 분노해주고 폭풍 맞장구를 쳐줍니다.
2. 친구처럼 격의 없고 편안한 반말("야, 진짜 말도 안 된다!", "오늘 진짜 고생 많았어 ㅠㅠ", "오늘 맛있는 거 먹고 다 잊자")을 씁니다.
3. 솔직하고 발랄하며 유쾌하게 기분을 풀어주고 스트레스를 날려줍니다.`,

  mind: `당신은 생각 과부하와 불면증, 번아웃에 시달리는 직장인을 위한 마인드풀니스 & 이완 코치 '고요'입니다.
핵심 역할 및 태도:
1. 뇌의 과열 끄기: 퇴근 후에도 울리는 머릿속 이메일과 걱정을 잠시 내려놓도록 돕습니다.
2. 호흡(4-7-8 이완 호흡), 어깨와 턱의 긴장 풀기, 신체 감각 느끼기 등 오늘 밤 편안한 휴식과 숙면을 유도하는 구체적인 이완 가이드를 제공합니다.
3. 호수처럼 고요하고 차분한 어투(~해보세요, 편안하게 숨을 내쉬어봅니다)로 마음을 안정시킵니다.`
};

// API Health
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Get all counseling sessions (supports query ?counselorId=&q=)
app.get("/api/sessions", async (req: Request, res: Response) => {
  try {
    const { counselorId, q } = req.query;
    let sessions = await storage.getAllSessions();

    if (counselorId && typeof counselorId === "string") {
      sessions = sessions.filter((s) => s.counselorId === counselorId);
    }

    if (q && typeof q === "string" && q.trim()) {
      const keyword = q.trim().toLowerCase();
      sessions = sessions.filter((s) => {
        const titleMatch = s.title?.toLowerCase().includes(keyword);
        const memoMatch = s.memo?.toLowerCase().includes(keyword);
        const tagMatch = s.tags?.some((t) => t.toLowerCase().includes(keyword));
        const msgMatch = s.messages?.some((m) => m.text.toLowerCase().includes(keyword));
        return titleMatch || memoMatch || tagMatch || msgMatch;
      });
    }

    res.json({ sessions });
  } catch (err: any) {
    console.error("Failed to fetch sessions:", err);
    res.status(500).json({ error: "상담 기록을 불러오는데 실패했습니다." });
  }
});

// Get stats summary
app.get("/api/stats", async (_req: Request, res: Response) => {
  try {
    const stats = await storage.getCounselingStats();
    res.json(stats);
  } catch (err: any) {
    console.error("Failed to fetch stats:", err);
    res.status(500).json({ error: "상담 통계를 불러오는데 실패했습니다." });
  }
});

// Get single session
app.get("/api/sessions/:id", async (req: Request, res: Response) => {
  try {
    const session = await storage.getSessionById(req.params.id);
    if (!session) {
      res.status(404).json({ error: "상담 기록을 찾을 수 없습니다." });
      return;
    }
    res.json(session);
  } catch (err: any) {
    res.status(500).json({ error: "상담 기록 조회 실패" });
  }
});

// Save or create session
app.post("/api/sessions", async (req: Request, res: Response) => {
  try {
    const { id, title, counselorId, category, stressScore, messages, emotion, prescription, memo, tags } = req.body;

    let sessionTitle = title;
    if (!sessionTitle || !sessionTitle.trim()) {
      const firstUserMsg = messages?.find((m: any) => m.role === "user");
      if (firstUserMsg) {
        sessionTitle = firstUserMsg.text.slice(0, 30) + (firstUserMsg.text.length > 30 ? "..." : "");
      } else {
        sessionTitle = `상담 기록 (${new Date().toLocaleDateString("ko-KR")})`;
      }
    }

    // Auto-classify category and stress intensity if not provided
    let sessionCategory = category;
    let score = stressScore;
    if (!sessionCategory) {
      const combined = (sessionTitle || "") + " " + (messages || []).map((m: any) => m.text).join(" ");
      const classified = classifyTextToCategory(combined);
      sessionCategory = classified.category;
      if (!score) score = classified.score;
    }

    const saved = await storage.saveSession({
      id,
      title: sessionTitle,
      counselorId: counselorId || "bom",
      category: sessionCategory,
      stressScore: score || 7,
      messages: messages || [],
      emotion: emotion || { batteryLevel: 50, weather: "cloud", stressFactors: [] },
      prescription: prescription || null,
      memo: memo || "",
      tags: tags || [],
    });

    // Asynchronously refresh the user's stress profile
    storage.getAllSessions().then((allSessions) => {
      analyzeUserStress(allSessions, false).catch(console.error);
    });

    res.status(201).json(saved);
  } catch (err: any) {
    console.error("Failed to save session:", err);
    res.status(500).json({ error: "상담 기록 저장에 실패했습니다." });
  }
});

// Update session (e.g. memo, title, tags, category)
app.patch("/api/sessions/:id", async (req: Request, res: Response) => {
  try {
    const updated = await storage.updateSession(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ error: "상담 기록을 찾을 수 없습니다." });
      return;
    }
    // Asynchronously refresh profile
    storage.getAllSessions().then((allSessions) => {
      analyzeUserStress(allSessions, false).catch(console.error);
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: "상담 기록 수정 실패" });
  }
});

// Delete session
app.delete("/api/sessions/:id", async (req: Request, res: Response) => {
  try {
    const success = await storage.deleteSession(req.params.id);
    if (!success) {
      res.status(404).json({ error: "상담 기록을 찾을 수 없습니다." });
      return;
    }
    // Asynchronously refresh profile
    storage.getAllSessions().then((allSessions) => {
      analyzeUserStress(allSessions, false).catch(console.error);
    });
    res.json({ success: true, message: "상담 기록이 삭제되었습니다." });
  } catch (err: any) {
    res.status(500).json({ error: "상담 기록 삭제 실패" });
  }
});

// Clear all sessions
app.post("/api/sessions/clear", async (_req: Request, res: Response) => {
  try {
    await storage.clearAllSessions();
    res.json({ success: true, message: "모든 상담 기록이 비워졌습니다." });
  } catch (err: any) {
    res.status(500).json({ error: "초기화 실패" });
  }
});

// Get user's current aggregated stress analytics profile
app.get("/api/stress-profile", async (_req: Request, res: Response) => {
  try {
    let profile = await getStoredProfile();
    if (!profile) {
      const sessions = await storage.getAllSessions();
      profile = await analyzeUserStress(sessions, false);
    }
    res.json(profile);
  } catch (err: any) {
    console.error("Failed to get stress profile:", err);
    res.status(500).json({ error: "스트레스 분석 프로필 조회 실패" });
  }
});

// Run on-demand deep AI stress analysis across all conversations
app.post("/api/stress-profile/analyze", async (_req: Request, res: Response) => {
  try {
    const sessions = await storage.getAllSessions();
    const profile = await analyzeUserStress(sessions, true);
    res.json(profile);
  } catch (err: any) {
    console.error("Deep AI analysis error:", err);
    res.status(500).json({ error: "스트레스 심층 AI 분석 중 오류가 발생했습니다." });
  }
});

// Chat API (Streaming with SSE)
app.post("/api/chat", async (req: Request, res: Response) => {
  const { messages, counselorId, emotionContext } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "메시지가 필요합니다." });
    return;
  }

  const ai = getGeminiClient();
  if (!ai) {
    // If no API key configured, return empathetic fallback
    res.status(200).json({
      fallback: true,
      text: "오늘 하루 정말 고생 많으셨어요. 마음에 품은 무거운 짐들을 여기서 잠시 내려놓으세요. (API 키가 설정되지 않아 기본 응답으로 안내해 드립니다.)"
    });
    return;
  }

  const counselorKey = (counselorId in COUNSELOR_INSTRUCTIONS) ? counselorId : 'bom';
  let systemInstruction = COUNSELOR_INSTRUCTIONS[counselorKey];

  // Inject User Stress Profile for hyper-personalized, informed counseling
  try {
    const userProfile = await getStoredProfile();
    if (userProfile && userProfile.categories) {
      const primaryStat = userProfile.categories.find((c) => c.category === userProfile.primaryDomain);
      systemInstruction += `\n\n[★ 내담자 심리 데이터 분석 프로필 연동 - 맞춤 상담 필수 반영]
- 가장 많은 스트레스를 받는 1순위 핵심 영역: '${userProfile.primaryDomain}' (집중도: ${primaryStat?.percentage ?? 40}%, 심각도: ${primaryStat?.avgIntensity ?? 8}/10)
- 2순위 스트레스 영역: '${userProfile.secondaryDomain}'
- 주요 스트레스 촉발 요인(트리거): ${primaryStat?.keyTriggers?.join(', ') || '과도한 책임감과 피로'}
- 내담자 성향 및 취약점: ${userProfile.aiDiagnosis?.vulnerabilityTrigger || '완벽주의와 쉼에 대한 죄책감'}
- 상담사 맞춤형 케어 가이드: ${userProfile.counselorGuidance || userProfile.aiDiagnosis?.counselorRecommendation || '자책을 덜어주고 작은 쉼을 격려'}
* 지침: 내담자가 이번 대화에서 털어놓는 고민과 더불어, 내담자의 기저에 깔려 있는 '${userProfile.primaryDomain}' 및 '${userProfile.secondaryDomain}' 영역의 스트레스 특성을 세심하게 배려하여 더욱 깊이 있고 실질적인 위로와 조언을 건네주세요.`;
    }
  } catch (err) {
    console.warn("Could not inject stress profile into chat instruction:", err);
  }

  if (emotionContext) {
    systemInstruction += `\n\n[내담자 현재 상태 참고]
- 현재 배터리(에너지): ${emotionContext.batteryLevel ?? '미지정'}%
- 마음 날씨: ${emotionContext.weather ?? '보통'}
- 주요 스트레스 요인: ${(emotionContext.stressFactors || []).join(', ') || '없음'}
내담자의 현재 에너지 수준과 마음 상태를 고려하여 감정적 부담을 주지 않도록 공감해 주세요.`;
  }

  try {
    // Set headers for Server-Sent Events (SSE)
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    // Map messages into Gemini contents format
    const contents = messages.map((m: { role: string; text: string }) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    }));

    const streamResponse = await ai.models.generateContentStream({
      model: "gemini-3.8-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.8,
      },
    });

    for await (const chunk of streamResponse) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error: any) {
    console.error("Chat generation error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "상담 처리 중 오류가 발생했습니다." });
    } else {
      res.write(`data: ${JSON.stringify({ error: "응답 생성 중 문제가 발생했습니다." })}\n\n`);
      res.end();
    }
  }
});

// Prescription API (Generates a comforting post-work healing prescription card)
app.post("/api/prescribe", async (req: Request, res: Response) => {
  const { messages, emotionContext } = req.body;

  const ai = getGeminiClient();
  if (!ai) {
    res.json({
      comfortTitle: "오늘 유난히 무거웠던 어깨를 내려놓는 밤",
      healingQuote: "오늘 하루도 어떻게든 버텨낸 당신, 그것만으로도 충분히 위대했습니다.",
      actions: [
        {
          title: "따뜻한 물 샤워와 어깨 풀기",
          description: "샤워기 물줄기를 어깨와 목 뒤에 3분간 맞으며 회사 생각을 물과 함께 씻어내세요.",
          iconName: "Droplets",
        },
        {
          title: "업무 알림 강제 차단",
          description: "지금 바로 슬랙, 이메일, 업무 톡의 알림을 무음으로 전환하고 내일을 위해 선을 그으세요.",
          iconName: "BellOff",
        },
        {
          title: "좋아하는 간식과 10분 멍때리기",
          description: "달콤한 디저트나 따뜻한 차 한 잔과 함께 휴대폰을 내려두고 멍하니 호흡하세요.",
          iconName: "Coffee",
        },
      ],
      selfAffirmation: "회사가 나의 전부는 아니야. 오늘 나는 내 몫을 다했어.",
    });
    return;
  }

  const prompt = `당신은 지친 직장인을 위한 심리 힐링 처방 전문가입니다.
사용자의 최근 상담 대화와 마음 상태를 바탕으로, 오늘 퇴근 후 긴장을 풀고 마음을 보듬을 수 있는 맞춤형 '퇴근 처방전'을 작성해주세요.

[내담자 대화 요약]:
${(messages || []).slice(-4).map((m: any) => `${m.role}: ${m.text}`).join('\n')}

[감정 정보]:
배터리: ${emotionContext?.batteryLevel ?? 50}%, 주요 요인: ${(emotionContext?.stressFactors || []).join(', ')}

부담스럽지 않고 오늘 밤 당장 실천할 수 있는 현실적이고 포근한 3가지 액션과 따뜻한 위로 문구를 JSON 형식으로 작성하세요.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            comfortTitle: {
              type: Type.STRING,
              description: "오늘의 처방 제목 (예: '억울했던 감정을 비워내고 나를 껴안는 밤')",
            },
            healingQuote: {
              type: Type.STRING,
              description: "마음을 어루만지는 1~2문장의 감동적인 위로 문구",
            },
            actions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "행동 제목" },
                  description: { type: Type.STRING, description: "친절하고 쉬운 실천 설명" },
                  iconName: {
                    type: Type.STRING,
                    description: "Droplets, BellOff, Coffee, Moon, Music, Sparkles 중 하나",
                  },
                },
                required: ["title", "description", "iconName"],
              },
            },
            selfAffirmation: {
              type: Type.STRING,
              description: "오늘 잠들기 전 나 자신에게 들려줄 다정한 확언 한마디",
            },
          },
          required: ["comfortTitle", "healingQuote", "actions", "selfAffirmation"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (err: any) {
    console.error("Prescription error:", err);
    res.json({
      comfortTitle: "오늘 유난히 무거웠던 어깨를 내려놓는 밤",
      healingQuote: "오늘 하루도 수많은 일들 사이에서 당신은 최선을 다했습니다.",
      actions: [
        {
          title: "따뜻한 물 샤워와 어깨 풀기",
          description: "샤워기 물줄기를 어깨와 목 뒤에 3분간 맞으며 회사 생각을 물과 함께 씻어내세요.",
          iconName: "Droplets",
        },
        {
          title: "업무 메일/메신저 알림 끄기",
          description: "퇴근 후 시간은 오롯이 당신의 것입니다. 알림을 끄고 내일을 준비하세요.",
          iconName: "BellOff",
        },
        {
          title: "따뜻한 차 한 잔 마시기",
          description: "카페인이 없는 허브티나 따뜻한 보리차로 긴장된 위장을 달래주세요.",
          iconName: "Coffee",
        },
      ],
      selfAffirmation: "오늘도 잘 버텼다. 이제 푹 쉬어도 괜찮아.",
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
