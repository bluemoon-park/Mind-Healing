import React, { useState, useEffect } from 'react';
import { X, Wind, Play, Pause, RotateCcw } from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface BreathingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type BreathingPhase = 'inhale' | 'hold' | 'exhale';

export const BreathingModal: React.FC<BreathingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [isActive, setIsActive] = useState(true);
  const [phase, setPhase] = useState<BreathingPhase>('inhale');
  const [countdown, setCountdown] = useState(4);
  const [cycleCount, setCycleCount] = useState(1);

  useEffect(() => {
    if (!isOpen || !isActive) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev > 1) {
          return prev - 1;
        }

        // Switch phase
        if (phase === 'inhale') {
          setPhase('hold');
          return 7;
        } else if (phase === 'hold') {
          setPhase('exhale');
          return 8;
        } else {
          setPhase('inhale');
          setCycleCount((c) => c + 1);
          soundEngine.playChime();
          return 4;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isActive, phase]);

  if (!isOpen) return null;

  const getPhaseText = () => {
    switch (phase) {
      case 'inhale':
        return {
          title: '숨 들이마시기 (코로 깊게)',
          subtitle: '맑고 평온한 공기가 온몸을 채웁니다.',
          color: 'text-sky-700',
          scale: 'scale-125',
          bg: 'bg-sky-100/90 border-sky-300',
        };
      case 'hold':
        return {
          title: '숨 멈추기 (편안하게)',
          subtitle: '몸의 긴장이 부드럽게 풀립니다.',
          color: 'text-indigo-700',
          scale: 'scale-125',
          bg: 'bg-indigo-100/90 border-indigo-300',
        };
      case 'exhale':
        return {
          title: '숨 내쉬기 (입으로 천천히)',
          subtitle: '오늘 쌓인 회사 스트레스와 피로를 모두 밖으로 내보냅니다.',
          color: 'text-emerald-700',
          scale: 'scale-90',
          bg: 'bg-emerald-100/90 border-emerald-300',
        };
    }
  };

  const currentPhaseInfo = getPhaseText();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-sky-200 shadow-2xl max-w-md w-full p-6 relative text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-center gap-1.5 text-sky-700 font-bold text-xs mb-1">
          <Wind className="w-4 h-4" />
          <span>신경계를 안정시키는 4-7-8 이완 호흡법</span>
        </div>

        <h3 className="text-xl font-bold text-stone-900 mb-1">
          1분 마음 안정 호흡
        </h3>
        <p className="text-xs text-stone-500 mb-6">
          심장이 두근거리거나 머리가 복잡할 때, 원의 움직임에 맞추어 숨을 쉬어보세요.
        </p>

        {/* Pulsing Breathing Circle */}
        <div className="py-6 flex items-center justify-center">
          <div
            className={`w-44 h-44 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-1000 shadow-lg ${
              currentPhaseInfo.bg
            } ${currentPhaseInfo.scale}`}
          >
            <span className={`text-4xl font-extrabold ${currentPhaseInfo.color}`}>
              {countdown}
            </span>
            <span className="text-xs font-semibold text-stone-700 mt-1">
              {phase === 'inhale' ? '들숨' : phase === 'hold' ? '멈춤' : '날숨'}
            </span>
          </div>
        </div>

        <div className="my-4">
          <h4 className={`text-base font-bold ${currentPhaseInfo.color}`}>
            {currentPhaseInfo.title}
          </h4>
          <p className="text-xs text-stone-600 mt-1">
            {currentPhaseInfo.subtitle}
          </p>
          <div className="text-[11px] text-stone-400 mt-2">
            현재 {cycleCount}번째 세션 진행 중
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs shadow-xs transition-colors flex items-center gap-1.5"
          >
            {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isActive ? '일시 정지' : '계속하기'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setPhase('inhale');
              setCountdown(4);
              setCycleCount(1);
            }}
            className="px-3 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-medium text-xs transition-colors flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>처음부터</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-sky-300 text-sky-800 bg-sky-50 font-medium text-xs hover:bg-sky-100 transition-colors"
          >
            편안해졌어요
          </button>
        </div>
      </div>
    </div>
  );
};
