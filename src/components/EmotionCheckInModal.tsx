import React, { useState } from 'react';
import { EmotionCheckIn } from '../types';
import { 
  X, 
  BatteryCharging, 
  CloudRain, 
  CloudLightning, 
  Cloud, 
  Sun, 
  Sparkles, 
  Check 
} from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface EmotionCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmotion: EmotionCheckIn;
  onSaveEmotion: (emotion: EmotionCheckIn) => void;
}

const WEATHER_OPTIONS = [
  { id: 'storm', label: '천둥번개', icon: CloudLightning, desc: '마음이 무너질 듯 격한 상태' },
  { id: 'rain', label: '비 내림', icon: CloudRain, desc: '눈물이 나거나 우울하고 지침' },
  { id: 'cloud', label: '흐림', icon: Cloud, desc: '답답하고 무기력한 상태' },
  { id: 'sun', label: '맑음', icon: Sun, desc: '비교적 평온하고 안정적임' },
];

const STRESS_TAGS = [
  '끝없는 야근/특근',
  '상사의 가스라이팅/폭언',
  '동료와의 불화/사내정치',
  '성과 및 실적 압박',
  '잡무 폭탄과 일정 촉박',
  '커리어 정체와 미래 불안',
  '내 능력 부족 같은 자책',
  '육체적 만성 피로',
  '이직/퇴사 고민',
];

export const EmotionCheckInModal: React.FC<EmotionCheckInModalProps> = ({
  isOpen,
  onClose,
  currentEmotion,
  onSaveEmotion,
}) => {
  const [battery, setBattery] = useState(currentEmotion.batteryLevel);
  const [weather, setWeather] = useState(currentEmotion.weather);
  const [selectedTags, setSelectedTags] = useState<string[]>(
    currentEmotion.stressFactors
  );

  if (!isOpen) return null;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = () => {
    onSaveEmotion({
      batteryLevel: battery,
      weather: weather as any,
      stressFactors: selectedTags,
    });
    soundEngine.playChime();
    onClose();
  };

  const getBatteryDesc = (val: number) => {
    if (val <= 20) return '🔴 방전 직전 (한계에 도달했어요. 즉각적인 쉼이 필요해요)';
    if (val <= 40) return '🟠 간당간당 (억지로 버티고 있는 중이에요)';
    if (val <= 60) return '🟡 절반 유지 (피로하지만 하루를 마무리할 수 있어요)';
    if (val <= 80) return '🟢 비교적 여유 (충분히 휴식을 취하면 회복돼요)';
    return '🌟 완충 (마음이 단단하고 안정적이에요)';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-amber-200 shadow-xl max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-amber-700 font-bold text-sm mb-1">
          <BatteryCharging className="w-4 h-4" />
          <span>오늘의 마음 상태 체크인</span>
        </div>
        <h3 className="text-xl font-bold text-stone-900 mb-2">
          지금 나의 에너지 배터리는 몇 %인가요?
        </h3>
        <p className="text-xs text-stone-500 mb-6">
          선택하신 상태는 AI 상담사가 당신의 에너지에 맞추어 대화하는 데 반영됩니다.
        </p>

        {/* Battery Slider */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-stone-700">에너지 배터리</span>
            <span className="text-lg font-extrabold text-amber-700">{battery}%</span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={battery}
            onChange={(e) => setBattery(Number(e.target.value))}
            className="w-full h-2.5 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
          />

          <div className="text-xs font-medium text-stone-600 mt-2.5">
            {getBatteryDesc(battery)}
          </div>
        </div>

        {/* Emotion Weather */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-stone-700 mb-2.5">
            오늘 내 마음의 날씨는 어떤가요?
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {WEATHER_OPTIONS.map((item) => {
              const Icon = item.icon;
              const isSel = weather === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setWeather(item.id as any)}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    isSel
                      ? 'bg-amber-100/70 border-amber-400 ring-2 ring-amber-400/20 text-amber-900 font-bold'
                      : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-600'
                  }`}
                >
                  <Icon className={`w-6 h-6 mx-auto mb-1 ${isSel ? 'text-amber-700' : 'text-stone-500'}`} />
                  <div className="text-xs">{item.label}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Stress Tags */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-stone-700 mb-2">
            가장 마음을 갉아먹는 요인을 골라주세요 (중복 선택)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {STRESS_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-600'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-stone-200 text-stone-600 font-medium text-sm hover:bg-stone-50 transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>체크인 완료</span>
          </button>
        </div>
      </div>
    </div>
  );
};
