import React from 'react';
import { Counselor, EmotionCheckIn } from '../types';
import { 
  HeartHandshake, 
  Volume2, 
  VolumeX, 
  FileText, 
  Smile, 
  Trash2, 
  Wind,
  Sparkles,
  Archive,
  BarChart3,
  BellRing
} from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface HeaderProps {
  currentCounselor: Counselor;
  onOpenCheckIn: () => void;
  onOpenPrescription: () => void;
  onOpenShredder: () => void;
  onOpenBreathing: () => void;
  onOpenHistory: () => void;
  onOpenAnalytics: () => void;
  onOpenScheduledCheckIn: () => void;
  isScheduledCheckInEnabled?: boolean;
  emotion: EmotionCheckIn;
  isRainPlaying: boolean;
  setIsRainPlaying: (playing: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentCounselor,
  onOpenCheckIn,
  onOpenPrescription,
  onOpenShredder,
  onOpenBreathing,
  onOpenHistory,
  onOpenAnalytics,
  onOpenScheduledCheckIn,
  isScheduledCheckInEnabled = true,
  emotion,
  isRainPlaying,
  setIsRainPlaying,
}) => {
  const toggleRain = () => {
    const nextState = soundEngine.toggleRain();
    setIsRainPlaying(nextState);
  };

  const getBatteryColor = (level: number) => {
    if (level <= 20) return 'text-rose-600 bg-rose-50 border-rose-200';
    if (level <= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  };

  return (
    <header className="sticky top-0 z-30 bg-amber-50/90 backdrop-blur-md border-b border-amber-200/70 px-4 py-3 sm:px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-700 shadow-xs">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-stone-900 tracking-tight">
                  토닥토닥 오피스
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200/60 text-amber-900 font-medium">
                  직장인 힐링
                </span>
              </div>
              <p className="text-xs text-stone-500">
                수고한 당신을 위한 온전한 위로와 휴식처
              </p>
            </div>
          </div>

          {/* Quick status on mobile */}
          <div className="md:hidden flex items-center gap-1.5">
            <button
              onClick={toggleRain}
              title={isRainPlaying ? '빗소리 끄기' : '빗소리 켜기'}
              className={`p-2 rounded-xl border text-xs transition-colors ${
                isRainPlaying
                  ? 'bg-amber-200/70 border-amber-300 text-amber-900'
                  : 'bg-white/80 border-amber-200 text-stone-600'
              }`}
            >
              {isRainPlaying ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Action Controls & Healing Tools */}
        <div className="flex items-center flex-wrap gap-2 justify-end w-full md:w-auto">
          {/* Energy Check-In Indicator */}
          <button
            id="header-checkin-btn"
            onClick={onOpenCheckIn}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all hover:shadow-xs ${getBatteryColor(
              emotion.batteryLevel
            )}`}
            title="마음 배터리 & 감정 날씨 체크하기"
          >
            <Smile className="w-3.5 h-3.5" />
            <span>배터리 {emotion.batteryLevel}%</span>
            {emotion.stressFactors.length > 0 && (
              <span className="hidden sm:inline text-[11px] opacity-80">
                · {emotion.stressFactors[0]}
              </span>
            )}
          </button>

          {/* 1-Minute Breathing */}
          <button
            id="header-breathing-btn"
            onClick={onOpenBreathing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 hover:bg-sky-50 text-sky-800 border border-sky-200 text-xs font-medium transition-all hover:shadow-xs"
            title="불안할 때 하는 1분 호흡"
          >
            <Wind className="w-3.5 h-3.5 text-sky-600" />
            <span className="hidden sm:inline">1분 호흡</span>
            <span className="sm:hidden">호흡</span>
          </button>

          {/* Stress Shredder */}
          <button
            id="header-shredder-btn"
            onClick={onOpenShredder}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 hover:bg-rose-50 text-rose-800 border border-rose-200 text-xs font-medium transition-all hover:shadow-xs"
            title="회사 스트레스 적어서 분쇄하기"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden sm:inline">고민 분쇄기</span>
            <span className="sm:hidden">분쇄기</span>
          </button>

          {/* Counseling History Archives (Backend Managed) */}
          <button
            id="header-history-btn"
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 hover:bg-amber-100/60 text-amber-900 border border-amber-300/80 text-xs font-medium transition-all hover:shadow-xs"
            title="서버에 보관된 나의 상담 기록 및 통계 보기"
          >
            <Archive className="w-3.5 h-3.5 text-amber-700" />
            <span className="hidden sm:inline">상담 보관함</span>
            <span className="sm:hidden">보관함</span>
          </button>

          {/* Stress Data Analytics & AI Care Menu */}
          <button
            id="header-analytics-btn"
            onClick={onOpenAnalytics}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 text-xs font-bold transition-all hover:shadow-xs"
            title="대화 기반 스트레스 분야 분류 및 AI 심리 데이터 분석"
          >
            <BarChart3 className="w-3.5 h-3.5 text-amber-700" />
            <span className="hidden sm:inline">데이터 분석</span>
            <span className="sm:hidden">분석</span>
          </button>

          {/* Scheduled Emotion Check-In Alert & Settings */}
          <button
            id="header-scheduled-checkin-btn"
            onClick={onOpenScheduledCheckIn}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100/70 hover:bg-amber-200/80 text-amber-950 border border-amber-300 text-xs font-medium transition-all hover:shadow-xs"
            title="하루 정기 감정 체크인 알림 설정 및 지금 체크하기"
          >
            <BellRing className="w-3.5 h-3.5 text-amber-700" />
            <span className="hidden sm:inline">정기 알림</span>
            <span className="sm:hidden">알림</span>
            {isScheduledCheckInEnabled && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
            )}
          </button>

          {/* Post-Work Prescription */}
          <button
            id="header-prescription-btn"
            onClick={onOpenPrescription}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-semibold shadow-xs transition-all hover:shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-100" />
            <span>퇴근 처방전</span>
          </button>

          {/* Rain Ambient Sound Toggle (Desktop) */}
          <button
            id="header-sound-toggle-btn"
            onClick={toggleRain}
            title={isRainPlaying ? '배경 빗소리 끄기' : '편안한 창밖 빗소리 켜기'}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
              isRainPlaying
                ? 'bg-amber-200/80 border-amber-300 text-amber-900 shadow-xs'
                : 'bg-white/80 border-amber-200 text-stone-600 hover:bg-amber-100/60'
            }`}
          >
            {isRainPlaying ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
                <span>빗소리 재생중</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-stone-400" />
                <span>빗소리 켜기</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
