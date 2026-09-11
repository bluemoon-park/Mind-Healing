import React, { useState, useEffect } from 'react';
import { 
  EmotionCheckIn, 
  CheckInSlot, 
  ScheduledCheckInRecord 
} from '../types';
import { 
  Bell, 
  BellRing, 
  Clock, 
  Sun, 
  Cloud, 
  CloudRain, 
  CloudLightning, 
  Sparkles, 
  BatteryCharging, 
  Check, 
  X, 
  Volume2, 
  Calendar, 
  ArrowRight, 
  Settings2, 
  Plus, 
  Trash2, 
  MessageSquareHeart, 
  Wind,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface ScheduledCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmotion: EmotionCheckIn;
  onSaveEmotion: (emotion: EmotionCheckIn) => void;
  slots: CheckInSlot[];
  onUpdateSlots: (slots: CheckInSlot[]) => void;
  activeSlot?: CheckInSlot | null;
  onSnooze: (minutes: number) => void;
  records: ScheduledCheckInRecord[];
  onAddRecord: (record: ScheduledCheckInRecord) => void;
  isNotificationEnabled: boolean;
  onToggleNotification: (enabled: boolean) => void;
  onOpenCounselorChat?: (initialMessage?: string) => void;
  onOpenBreathing?: () => void;
  initialTab?: 'checkin' | 'settings' | 'history';
}

const WEATHER_ITEMS = [
  { id: 'sun', label: '맑음', icon: Sun, color: 'text-amber-500 bg-amber-50 border-amber-200', desc: '평온하고 긍정적' },
  { id: 'cloud', label: '흐림', icon: Cloud, color: 'text-stone-500 bg-stone-100 border-stone-200', desc: '답답하거나 무기력' },
  { id: 'rain', label: '비', icon: CloudRain, color: 'text-blue-500 bg-blue-50 border-blue-200', desc: '지치고 가라앉음' },
  { id: 'storm', label: '번개', icon: CloudLightning, color: 'text-rose-500 bg-rose-50 border-rose-200', desc: '화나거나 한계치' },
  { id: 'rainbow', label: '회복', icon: Sparkles, color: 'text-emerald-500 bg-emerald-50 border-emerald-200', desc: '회복되고 충전 중' },
];

const BATTERY_PRESETS = [
  { level: 20, label: '방전 (20%)', color: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  { level: 40, label: '간당 (40%)', color: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  { level: 60, label: '보통 (60%)', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  { level: 80, label: '여유 (80%)', color: 'bg-lime-50 text-lime-700 border-lime-200', dot: 'bg-lime-500' },
  { level: 100, label: '든든 (100%)', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
];

const QUICK_TAGS = [
  '끝없는 업무량',
  '상사/동료 갈등',
  '성과 마감 압박',
  '수면/휴식 부족',
  '잡무와 피로',
  '커리어 미래 불안',
  '성취감과 보람',
  '기분 좋은 휴식'
];

export const ScheduledCheckInModal: React.FC<ScheduledCheckInModalProps> = ({
  isOpen,
  onClose,
  currentEmotion,
  onSaveEmotion,
  slots,
  onUpdateSlots,
  activeSlot,
  onSnooze,
  records,
  onAddRecord,
  isNotificationEnabled,
  onToggleNotification,
  onOpenCounselorChat,
  onOpenBreathing,
  initialTab = 'checkin'
}) => {
  const [activeTab, setActiveTab] = useState<'checkin' | 'settings' | 'history'>(initialTab);
  
  // Check-in form state
  const [battery, setBattery] = useState(currentEmotion.batteryLevel);
  const [weather, setWeather] = useState(currentEmotion.weather);
  const [selectedTags, setSelectedTags] = useState<string[]>(currentEmotion.stressFactors || []);
  const [note, setNote] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // New slot form state
  const [newSlotName, setNewSlotName] = useState('');
  const [newSlotTime, setNewSlotTime] = useState('12:00');
  const [newSlotMsg, setNewSlotMsg] = useState('');
  const [showAddSlot, setShowAddSlot] = useState(false);

  // Browser notification permission state
  const [browserPerm, setBrowserPerm] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setBrowserPerm(Notification.permission);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setBattery(currentEmotion.batteryLevel);
      setWeather(currentEmotion.weather);
      setSelectedTags(currentEmotion.stressFactors || []);
      setNote('');
      setIsSubmitted(false);
      setActiveTab(initialTab);
    }
  }, [isOpen, currentEmotion, initialTab]);

  if (!isOpen) return null;

  const currentDisplaySlot = activeSlot || slots.find(s => s.enabled) || {
    id: 'default',
    name: '정기 감정 체크인',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    enabled: true,
    contextMessage: '잠시 숨을 고르고, 지금 내 마음 날씨와 에너지 배터리를 기록해보세요.',
    recommendedTag: '휴식 부족'
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSaveCheckIn = () => {
    const updatedEmotion: EmotionCheckIn = {
      batteryLevel: battery,
      weather: weather as any,
      stressFactors: selectedTags,
      note: note.trim() || undefined,
    };

    onSaveEmotion(updatedEmotion);

    // Save history record
    const newRecord: ScheduledCheckInRecord = {
      id: `record-${Date.now()}`,
      timestamp: new Date().toISOString(),
      slotName: currentDisplaySlot.name,
      batteryLevel: battery,
      weather: weather as any,
      stressFactors: selectedTags,
      note: note.trim() || undefined,
    };
    onAddRecord(newRecord);

    soundEngine.playChime();
    setIsSubmitted(true);
  };

  const handleRequestPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const result = await Notification.requestPermission();
        setBrowserPerm(result);
        if (result === 'granted') {
          setNoticeMessage('브라우저 알림 권한이 허용되었습니다!');
          new Notification('토닥토닥 마음 상담소', {
            body: '정기 감정 체크인 알림이 성공적으로 활성화되었습니다.',
            icon: '/favicon.ico',
          });
        }
      } catch (err) {
        console.warn('Notification permission error:', err);
      }
    }
  };

  const handleToggleSlot = (id: string) => {
    const updated = slots.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s);
    onUpdateSlots(updated);
  };

  const handleTimeChange = (id: string, newTime: string) => {
    const updated = slots.map(s => s.id === id ? { ...s, time: newTime } : s);
    onUpdateSlots(updated);
  };

  const handleDeleteSlot = (id: string) => {
    const updated = slots.filter(s => s.id !== id);
    onUpdateSlots(updated);
  };

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlotName.trim()) return;

    const newSlot: CheckInSlot = {
      id: `slot-${Date.now()}`,
      name: newSlotName.trim(),
      time: newSlotTime,
      enabled: true,
      contextMessage: newSlotMsg.trim() || `${newSlotName.trim()} 시간이에요. 내 마음을 잠시 돌아보세요.`,
      recommendedTag: '일상 피로'
    };

    onUpdateSlots([...slots, newSlot]);
    setNewSlotName('');
    setNewSlotMsg('');
    setShowAddSlot(false);
    setNoticeMessage(`'${newSlot.name}' 알림 시간대가 추가되었습니다.`);
  };

  const getComfortMessage = () => {
    if (battery <= 30) {
      return '에너지가 많이 고갈되었군요. 잠시 모든 짐을 내려놓고 깊은 숨을 들이쉬어 보세요.';
    }
    if (battery <= 60) {
      return '오늘도 묵묵히 버텨내느라 수고 많았어요. 따뜻한 차 한 잔으로 스스로를 달래주세요.';
    }
    return '안정적인 에너지를 유지하고 계시네요! 이 편안함이 오늘 밤까지 이어지길 응원해요.';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-[#FAF7F2] border border-amber-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden font-sans text-stone-800 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-amber-100/90 via-amber-50 to-orange-50/80 border-b border-amber-200/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-xs">
              <BellRing className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-stone-900 text-base">정기 감정 체크인</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/90 text-amber-900 border border-amber-300">
                  {currentDisplaySlot.name}
                </span>
              </div>
              <p className="text-[11px] text-stone-600">
                하루의 특정 시간에 가볍게 나를 돌아보는 10초 케어 루틴
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-amber-200/70 bg-amber-50/40 px-5 pt-2 text-xs font-medium shrink-0">
          <button
            onClick={() => { setActiveTab('checkin'); setIsSubmitted(false); }}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'checkin'
                ? 'border-amber-600 text-amber-900 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            마음 체크인
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'settings'
                ? 'border-amber-600 text-amber-900 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>알림 시간 설정</span>
            {slots.filter(s => s.enabled).length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'history'
                ? 'border-amber-600 text-amber-900 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>체크인 기록 ({records.length})</span>
          </button>
        </div>

        {/* Toast / Notice alert */}
        {noticeMessage && (
          <div className="mx-5 mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{noticeMessage}</span>
            </div>
            <button onClick={() => setNoticeMessage(null)} className="text-emerald-600 hover:text-emerald-800 text-xs">
              &times;
            </button>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: CHECK-IN MODE */}
          {activeTab === 'checkin' && (
            <>
              {!isSubmitted ? (
                <>
                  {/* Context Prompt Card */}
                  <div className="p-3.5 rounded-2xl bg-amber-100/60 border border-amber-200/80 text-xs text-stone-800 flex items-start gap-2.5 shadow-2xs">
                    <div className="p-2 rounded-xl bg-amber-200/90 text-amber-900 shrink-0 mt-0.5">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-stone-900 flex items-center gap-1.5">
                        <span>[{currentDisplaySlot.name} 알림]</span>
                        <span className="text-[11px] text-amber-800 font-normal">({currentDisplaySlot.time})</span>
                      </div>
                      <p className="mt-0.5 leading-relaxed text-stone-700">
                        {currentDisplaySlot.contextMessage}
                      </p>
                    </div>
                  </div>

                  {/* 1. Weather Selection */}
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-2">
                      1. 지금 마음 날씨는 어떤가요?
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {WEATHER_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isSelected = weather === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setWeather(item.id as any);
                              soundEngine.playClick();
                            }}
                            className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500 text-white border-amber-600 shadow-sm scale-102 ring-2 ring-amber-300'
                                : 'bg-white hover:bg-stone-50 text-stone-700 border-amber-200/70 hover:border-amber-300'
                            }`}
                          >
                            <Icon className={`w-5 h-5 mb-1 ${isSelected ? 'text-white' : item.color.split(' ')[0]}`} />
                            <span className="text-xs font-bold">{item.label}</span>
                            <span className={`text-[9px] mt-0.5 truncate max-w-full ${isSelected ? 'text-amber-100' : 'text-stone-400'}`}>
                              {item.desc.slice(0, 4)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Battery Level */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-stone-800 flex items-center gap-1">
                        <BatteryCharging className="w-3.5 h-3.5 text-amber-600" />
                        <span>2. 남은 에너지 배터리 ({battery}%)</span>
                      </label>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="grid grid-cols-5 gap-1.5 mb-2.5">
                      {BATTERY_PRESETS.map((preset) => (
                        <button
                          key={preset.level}
                          type="button"
                          onClick={() => {
                            setBattery(preset.level);
                            soundEngine.playClick();
                          }}
                          className={`py-1.5 px-1 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                            battery === preset.level
                              ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                              : 'bg-white text-stone-600 border-amber-200/70 hover:bg-amber-50'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${battery === preset.level ? 'bg-white' : preset.dot}`}></span>
                          <span>{preset.level}%</span>
                        </button>
                      ))}
                    </div>

                    {/* Fine-tuning Range slider */}
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={battery}
                      onChange={(e) => setBattery(Number(e.target.value))}
                      className="w-full h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                    />
                  </div>

                  {/* 3. Quick Stress Factors */}
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1.5">
                      3. 지금 가장 신경 쓰이는 요인 (선택)
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_TAGS.map((tag) => {
                        const isSelected = selectedTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleTag(tag)}
                            className={`px-2.5 py-1 rounded-xl text-xs transition-all cursor-pointer border ${
                              isSelected
                                ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold shadow-2xs'
                                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                            }`}
                          >
                            {isSelected ? '✓ ' : ''}{tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. Optional One-line Note */}
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      4. 나에게 남기는 한 줄 메모 (선택)
                    </label>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="예: 3시 미팅 전 잠시 스트레칭하기, 오늘 퇴근 후 산책"
                      className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Main Action Buttons */}
                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      id="submit-scheduled-checkin-btn"
                      type="button"
                      onClick={handleSaveCheckIn}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>체크인 완료하고 에너지 충전하기</span>
                    </button>

                    <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          onSnooze(30);
                          onClose();
                        }}
                        className="hover:text-amber-800 underline decoration-dotted cursor-pointer"
                      >
                        ⏰ 30분 뒤에 다시 알려줘 (Snooze)
                      </button>

                      <button
                        type="button"
                        onClick={onClose}
                        className="hover:text-stone-800 cursor-pointer"
                      >
                        오늘은 건너뛰기
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* Success Screen */
                <div className="py-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-stone-900">감정 체크인이 안전하게 기록되었습니다!</h4>
                    <p className="text-xs text-stone-600 mt-1 max-w-xs mx-auto leading-relaxed">
                      {getComfortMessage()}
                    </p>
                  </div>

                  <div className="p-3 bg-white border border-amber-200 rounded-2xl text-xs text-stone-700 max-w-sm mx-auto flex items-center justify-around">
                    <div>
                      <span className="text-[10px] text-stone-400 block">오늘의 날씨</span>
                      <span className="font-bold text-amber-800">
                        {WEATHER_ITEMS.find(w => w.id === weather)?.label}
                      </span>
                    </div>
                    <div className="h-6 w-px bg-stone-200"></div>
                    <div>
                      <span className="text-[10px] text-stone-400 block">배터리 잔량</span>
                      <span className="font-bold text-rose-600">{battery}%</span>
                    </div>
                    <div className="h-6 w-px bg-stone-200"></div>
                    <div>
                      <span className="text-[10px] text-stone-400 block">다음 알림</span>
                      <span className="font-bold text-stone-800">
                        {slots.find(s => s.enabled && s.id !== currentDisplaySlot.id)?.time || '내일 아침'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2 max-w-sm mx-auto">
                    {onOpenCounselorChat && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenCounselorChat(`방금 ${currentDisplaySlot.name} 감정 체크인을 했어요. 배터리가 ${battery}%이고 마음 날씨는 ${WEATHER_ITEMS.find(w => w.id === weather)?.label} 상태예요.`);
                        }}
                        className="w-full sm:w-auto flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <MessageSquareHeart className="w-3.5 h-3.5" />
                        <span>상담사와 바로 대화하기</span>
                      </button>
                    )}

                    {onOpenBreathing && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenBreathing();
                        }}
                        className="w-full sm:w-auto py-2 px-3 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Wind className="w-3.5 h-3.5 text-sky-600" />
                        <span>1분 호흡하기</span>
                      </button>
                    )}
                  </div>

                  <div>
                    <button
                      onClick={onClose}
                      className="text-xs text-stone-500 hover:text-stone-800 underline mt-2 cursor-pointer"
                    >
                      창 닫기
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 2: NOTIFICATION SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              {/* Master Toggle */}
              <div className="p-3.5 rounded-2xl bg-white border border-amber-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-amber-600" />
                    <span>정기 감정 체크인 알림 사용</span>
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    원하는 시간에 맞춰 감정을 점검할 수 있도록 알림 모달을 띄웁니다.
                  </p>
                </div>
                <button
                  onClick={() => onToggleNotification(!isNotificationEnabled)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    isNotificationEnabled ? 'bg-amber-600' : 'bg-stone-300'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    isNotificationEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Browser Push Permission Card */}
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-700 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-stone-900 block">브라우저 시스템 알림 연동</span>
                  <span className="text-[11px] text-stone-500">
                    다른 탭에 있거나 창이 내려가 있어도 브라우저 푸시로 알려드립니다.
                  </span>
                </div>
                {browserPerm === 'granted' ? (
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-bold">
                    허용됨
                  </span>
                ) : (
                  <button
                    onClick={handleRequestPermission}
                    className="px-2.5 py-1 bg-stone-800 hover:bg-stone-900 text-white rounded-lg text-[11px] font-medium cursor-pointer"
                  >
                    권한 요청
                  </button>
                )}
              </div>

              {/* Slots List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800">
                    하루 루틴별 알림 시간대 ({slots.length}개)
                  </span>
                  <button
                    onClick={() => setShowAddSlot(!showAddSlot)}
                    className="text-xs text-amber-700 hover:text-amber-900 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>새 시간대 추가</span>
                  </button>
                </div>

                {/* Add slot form */}
                {showAddSlot && (
                  <form onSubmit={handleAddSlot} className="p-3 bg-white border border-amber-300 rounded-2xl space-y-2.5 animate-in fade-in">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-stone-600 mb-1">알림 이름</label>
                        <input
                          type="text"
                          value={newSlotName}
                          onChange={(e) => setNewSlotName(e.target.value)}
                          placeholder="예: 점심 식사 후, 야간 공부 전"
                          className="w-full px-2.5 py-1.5 border border-stone-200 rounded-xl text-xs"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-stone-600 mb-1">알림 시간</label>
                        <input
                          type="time"
                          value={newSlotTime}
                          onChange={(e) => setNewSlotTime(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-stone-200 rounded-xl text-xs"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-stone-600 mb-1">유도 문구 (선택)</label>
                      <input
                        type="text"
                        value={newSlotMsg}
                        onChange={(e) => setNewSlotMsg(e.target.value)}
                        placeholder="예: 점심 먹고 나른할 때, 커피 한 잔과 함께 체크인해요."
                        className="w-full px-2.5 py-1.5 border border-stone-200 rounded-xl text-xs"
                      />
                    </div>
                    <div className="flex justify-end gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddSlot(false)}
                        className="px-2.5 py-1 text-xs text-stone-500 hover:text-stone-700"
                      >
                        취소
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        추가하기
                      </button>
                    </div>
                  </form>
                )}

                {/* Slots */}
                <div className="space-y-2">
                  {slots.map((slot) => (
                    <div
                      key={slot.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        slot.enabled 
                          ? 'bg-white border-amber-200 shadow-2xs' 
                          : 'bg-stone-50/70 border-stone-200 opacity-60'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-stone-900">{slot.name}</span>
                          <input
                            type="time"
                            value={slot.time}
                            onChange={(e) => handleTimeChange(slot.id, e.target.value)}
                            disabled={!slot.enabled}
                            className="text-xs font-mono font-semibold px-2 py-0.5 bg-amber-50 text-amber-900 rounded-lg border border-amber-200 cursor-pointer disabled:opacity-50"
                          />
                        </div>
                        <p className="text-[11px] text-stone-500 truncate mt-0.5">
                          {slot.contextMessage}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleSlot(slot.id)}
                          className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                            slot.enabled ? 'bg-amber-600' : 'bg-stone-300'
                          }`}
                        >
                          <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            slot.enabled ? 'translate-x-4' : 'translate-x-0'
                          }`} />
                        </button>

                        {slots.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="p-1 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Test Notification Trigger */}
              <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-xs">
                <span className="text-stone-500">알림 작동을 직접 확인해보세요</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('checkin');
                    setIsSubmitted(false);
                    soundEngine.playChime();
                  }}
                  className="px-3 py-1.5 bg-stone-100 hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-xl font-medium transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5 text-amber-700" />
                  <span>알림 모달 즉시 테스트</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: CHECK-IN HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-800">최근 정기 체크인 기록 ({records.length}회)</span>
                <span className="text-stone-500 text-[11px]">로컬 기기에 안전하게 보관됩니다</span>
              </div>

              {records.length === 0 ? (
                <div className="py-12 text-center text-xs text-stone-500">
                  아직 정기 체크인 기록이 없습니다. 오늘 하루의 감정을 첫 번째로 남겨보세요.
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {records.map((rec) => {
                    const weatherObj = WEATHER_ITEMS.find(w => w.id === rec.weather) || WEATHER_ITEMS[0];
                    const Icon = weatherObj.icon;
                    return (
                      <div 
                        key={rec.id}
                        className="p-3 rounded-2xl bg-white border border-stone-200 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`p-2 rounded-xl shrink-0 ${weatherObj.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="font-bold text-stone-900">{rec.slotName}</span>
                              <span className="text-[10px] text-stone-400">
                                {new Date(rec.timestamp).toLocaleDateString('ko-KR', {
                                  month: 'numeric',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[11px] font-semibold text-rose-600">
                                배터리 {rec.batteryLevel}%
                              </span>
                              {rec.stressFactors && rec.stressFactors.slice(0, 2).map((f, i) => (
                                <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-stone-100 text-stone-600">
                                  {f}
                                </span>
                              ))}
                            </div>
                            {rec.note && (
                              <p className="text-[11px] text-stone-600 truncate mt-0.5">
                                "{rec.note}"
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-stone-100/80 border-t border-amber-200/60 flex items-center justify-between text-xs text-stone-600 shrink-0">
          <span className="text-[11px] text-stone-500">
            {isNotificationEnabled 
              ? `하루 ${slots.filter(s => s.enabled).length}회 자동 알림 대기 중` 
              : '현재 정기 알림이 일시정지 상태입니다'}
          </span>

          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-medium transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
