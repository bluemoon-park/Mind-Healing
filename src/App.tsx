import React, { useState, useEffect } from 'react';
import { 
  CounselorId, 
  ChatMessage, 
  EmotionCheckIn, 
  CounselingSession,
  CheckInSlot,
  ScheduledCheckInRecord
} from './types';
import { COUNSELORS } from './counselors';
import { Header } from './components/Header';
import { CounselorSelector } from './components/CounselorSelector';
import { ChatThread } from './components/ChatThread';
import { ChatInput } from './components/ChatInput';
import { EmotionCheckInModal } from './components/EmotionCheckInModal';
import { PrescriptionModal } from './components/PrescriptionModal';
import { StressShredderModal } from './components/StressShredderModal';
import { BreathingModal } from './components/BreathingModal';
import { CounselingHistoryModal } from './components/CounselingHistoryModal';
import { DataAnalyticsModal } from './components/DataAnalyticsModal';
import { ScheduledCheckInModal } from './components/ScheduledCheckInModal';
import { soundEngine } from './utils/audio';

const STORAGE_KEY_MESSAGES = 'todak_chat_messages_v1';
const STORAGE_KEY_EMOTION = 'todak_emotion_v1';
const STORAGE_KEY_COUNSELOR = 'todak_counselor_v1';
const STORAGE_KEY_SCHEDULED_SLOTS = 'todak_scheduled_checkin_slots_v2';
const STORAGE_KEY_SCHEDULED_RECORDS = 'todak_scheduled_checkin_records_v2';
const STORAGE_KEY_SCHEDULED_ENABLED = 'todak_scheduled_checkin_enabled_v2';

const DEFAULT_SLOTS: CheckInSlot[] = [
  {
    id: 'slot-morning',
    name: '출근 & 하루 시작',
    time: '09:00',
    enabled: true,
    contextMessage: '새로운 하루를 시작하는 지금, 내 마음 배터리와 날씨는 어떤가요? 가볍게 확인하고 출발해요.',
    recommendedTag: '출근 피로',
  },
  {
    id: 'slot-afternoon',
    name: '오후 피로 슬럼프',
    time: '14:00',
    enabled: true,
    contextMessage: '나른하고 지치기 쉬운 오후 시간이에요. 잠시 눈을 감고 배터리 잔량을 체크해볼까요?',
    recommendedTag: '잡무와 피로',
  },
  {
    id: 'slot-evening',
    name: '퇴근 & 하루 마무리',
    time: '18:00',
    enabled: true,
    contextMessage: '오늘 하루도 정말 고생 많으셨어요! 무거웠던 마음의 짐을 털어내고 편안한 저녁을 맞이해요.',
    recommendedTag: '끝없는 업무량',
  },
  {
    id: 'slot-night',
    name: '취침 전 마음 비우기',
    time: '22:00',
    enabled: true,
    contextMessage: '잠들기 전, 오늘 하루 나를 괴롭혔던 생각들을 정리하고 편안한 쉼을 준비해보세요.',
    recommendedTag: '수면/휴식 부족',
  },
];

export default function App() {
  const [counselorId, setCounselorId] = useState<CounselorId>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_COUNSELOR);
    return (saved && saved in COUNSELORS ? saved : 'bom') as CounselorId;
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MESSAGES);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return [];
  });

  const [emotion, setEmotion] = useState<EmotionCheckIn>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EMOTION);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return {
      batteryLevel: 45,
      weather: 'cloud',
      stressFactors: ['끝없는 야근/특근', '성과 및 실적 압박'],
    };
  });

  const [isStreaming, setIsStreaming] = useState(false);
  const [isRainPlaying, setIsRainPlaying] = useState(false);

  // Modals state
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isPrescriptionOpen, setIsPrescriptionOpen] = useState(false);
  const [isShredderOpen, setIsShredderOpen] = useState(false);
  const [isBreathingOpen, setIsBreathingOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

  // Scheduled check-in state
  const [isScheduledCheckInOpen, setIsScheduledCheckInOpen] = useState(false);
  const [scheduledTab, setScheduledTab] = useState<'checkin' | 'settings' | 'history'>('checkin');
  const [activeSlot, setActiveSlot] = useState<CheckInSlot | null>(null);

  const [isNotificationEnabled, setIsNotificationEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SCHEDULED_ENABLED);
    return saved !== null ? saved === 'true' : true;
  });

  const [slots, setSlots] = useState<CheckInSlot[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SCHEDULED_SLOTS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_SLOTS;
  });

  const [records, setRecords] = useState<ScheduledCheckInRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SCHEDULED_RECORDS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Sync scheduled check-in settings to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SCHEDULED_SLOTS, JSON.stringify(slots));
  }, [slots]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SCHEDULED_RECORDS, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SCHEDULED_ENABLED, String(isNotificationEnabled));
  }, [isNotificationEnabled]);

  // Scheduled Time Monitor Interval (checks every 25s)
  useEffect(() => {
    if (!isNotificationEnabled) return;

    const checkScheduledTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${hours}:${minutes}`;
      const todayDateStr = now.toISOString().slice(0, 10);

      const triggerKey = `todak_alert_${todayDateStr}_${currentTimeStr}`;
      if (sessionStorage.getItem(triggerKey)) return;

      const matchedSlot = slots.find((s) => s.enabled && s.time === currentTimeStr);
      if (matchedSlot) {
        sessionStorage.setItem(triggerKey, 'true');
        setActiveSlot(matchedSlot);
        setScheduledTab('checkin');
        setIsScheduledCheckInOpen(true);
        soundEngine.playChime();

        if (
          typeof window !== 'undefined' &&
          'Notification' in window &&
          Notification.permission === 'granted'
        ) {
          try {
            new Notification(`토닥토닥: [${matchedSlot.name}] 감정 체크인 시간`, {
              body: matchedSlot.contextMessage,
              icon: '/favicon.ico',
            });
          } catch (e) {
            console.warn(e);
          }
        }
      }
    };

    checkScheduledTime();
    const timer = setInterval(checkScheduledTime, 25000);
    return () => clearInterval(timer);
  }, [isNotificationEnabled, slots]);

  const handleSnooze = (minutes: number) => {
    setTimeout(() => {
      soundEngine.playChime();
      setIsScheduledCheckInOpen(true);
    }, minutes * 60 * 1000);
  };

  const handleAddRecord = (record: ScheduledCheckInRecord) => {
    setRecords((prev) => [record, ...prev.slice(0, 29)]);
  };

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EMOTION, JSON.stringify(emotion));
  }, [emotion]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_COUNSELOR, counselorId);
  }, [counselorId]);

  const currentCounselor = COUNSELORS[counselorId] || COUNSELORS.bom;

  const formatCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: text.trim(),
      timestamp: formatCurrentTime(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    // Placeholder model message for streaming
    const modelMsgId = `model-${Date.now()}`;
    const initialModelMessage: ChatMessage = {
      id: modelMsgId,
      role: 'model',
      text: '',
      timestamp: formatCurrentTime(),
      isStreaming: true,
    };

    setMessages([...newMessages, initialModelMessage]);
    setIsStreaming(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, text: m.text })),
          counselorId,
          emotionContext: emotion,
        }),
      });

      if (!response.ok) {
        throw new Error('네트워크 응답 오류');
      }

      // Check if fallback JSON returned
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const json = await response.json();
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === modelMsgId
              ? { ...msg, text: json.text || json.error, isStreaming: false }
              : msg
          )
        );
        setIsStreaming(false);
        soundEngine.playChime();
        return;
      }

      // Read SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      if (reader) {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const dataStr = trimmed.slice(6);
              if (dataStr === '[DONE]') {
                break;
              }
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.text) {
                  accumulatedText += parsed.text;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === modelMsgId
                        ? { ...msg, text: accumulatedText }
                        : msg
                    )
                  );
                } else if (parsed.error) {
                  accumulatedText += `\n\n*${parsed.error}*`;
                }
              } catch {}
            }
          }
        }
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === modelMsgId
            ? { ...msg, text: accumulatedText || '위로의 말을 건네는 중 잠시 연결이 원활하지 않았습니다.', isStreaming: false }
            : msg
        )
      );
      soundEngine.playChime();
    } catch (err: any) {
      console.error('Chat error:', err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === modelMsgId
            ? {
                ...msg,
                text: '상담 연결이 잠시 원활하지 않습니다. 마음을 가다듬고 잠시 후 다시 말씀해주세요.',
                isStreaming: false,
              }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('이전 상담 내용을 모두 비우고 새로운 마음으로 시작할까요?')) {
      setMessages([]);
      localStorage.removeItem(STORAGE_KEY_MESSAGES);
      soundEngine.playChime();
    }
  };

  const handleLoadSession = (session: CounselingSession) => {
    if (session.counselorId && session.counselorId in COUNSELORS) {
      setCounselorId(session.counselorId as CounselorId);
    }
    if (session.messages && Array.isArray(session.messages)) {
      setMessages(session.messages);
    }
    if (session.emotion) {
      setEmotion(session.emotion);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#FAF7F2] text-stone-800 overflow-hidden font-sans">
      {/* Top Header */}
      <Header
        currentCounselor={currentCounselor}
        onOpenCheckIn={() => setIsCheckInOpen(true)}
        onOpenPrescription={() => setIsPrescriptionOpen(true)}
        onOpenShredder={() => setIsShredderOpen(true)}
        onOpenBreathing={() => setIsBreathingOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        onOpenScheduledCheckIn={() => {
          setScheduledTab('checkin');
          setIsScheduledCheckInOpen(true);
        }}
        isScheduledCheckInEnabled={isNotificationEnabled}
        emotion={emotion}
        isRainPlaying={isRainPlaying}
        setIsRainPlaying={setIsRainPlaying}
      />

      {/* Counselor Selection Bar */}
      <CounselorSelector
        currentCounselorId={counselorId}
        onSelectCounselor={(id) => {
          setCounselorId(id);
          soundEngine.playChime();
        }}
      />

      {/* Main Chat Scrollable Thread */}
      <ChatThread
        messages={messages}
        counselor={currentCounselor}
        isStreaming={isStreaming}
        onSendPrompt={handleSendMessage}
        onClearHistory={handleClearHistory}
      />

      {/* Bottom Chat Input Form */}
      <ChatInput
        onSendMessage={handleSendMessage}
        isStreaming={isStreaming}
      />

      {/* Interactive Modals */}
      <EmotionCheckInModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        currentEmotion={emotion}
        onSaveEmotion={setEmotion}
      />

      <PrescriptionModal
        isOpen={isPrescriptionOpen}
        onClose={() => setIsPrescriptionOpen(false)}
        messages={messages}
        emotionContext={emotion}
      />

      <StressShredderModal
        isOpen={isShredderOpen}
        onClose={() => setIsShredderOpen(false)}
      />

      <BreathingModal
        isOpen={isBreathingOpen}
        onClose={() => setIsBreathingOpen(false)}
      />

      <CounselingHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        currentMessages={messages}
        currentEmotion={emotion}
        currentCounselorId={counselorId}
        onLoadSession={handleLoadSession}
      />

      <DataAnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        onOpenHistoryWithFilter={(category) => {
          setIsAnalyticsOpen(false);
          setIsHistoryOpen(true);
        }}
      />

      <ScheduledCheckInModal
        isOpen={isScheduledCheckInOpen}
        onClose={() => setIsScheduledCheckInOpen(false)}
        currentEmotion={emotion}
        onSaveEmotion={setEmotion}
        slots={slots}
        onUpdateSlots={setSlots}
        activeSlot={activeSlot}
        onSnooze={handleSnooze}
        records={records}
        onAddRecord={handleAddRecord}
        isNotificationEnabled={isNotificationEnabled}
        onToggleNotification={setIsNotificationEnabled}
        initialTab={scheduledTab}
        onOpenCounselorChat={(prompt) => {
          setIsScheduledCheckInOpen(false);
          if (prompt) handleSendMessage(prompt);
        }}
        onOpenBreathing={() => {
          setIsScheduledCheckInOpen(false);
          setIsBreathingOpen(true);
        }}
      />
    </div>
  );
}
