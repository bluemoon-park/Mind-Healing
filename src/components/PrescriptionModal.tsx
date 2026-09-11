import React, { useEffect, useState } from 'react';
import { Prescription, ChatMessage, EmotionCheckIn } from '../types';
import { 
  X, 
  Sparkles, 
  Droplets, 
  BellOff, 
  Coffee, 
  Moon, 
  Music, 
  Copy, 
  Check, 
  RefreshCw, 
  Heart 
} from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  emotionContext: EmotionCheckIn;
}

const ICON_MAP: Record<string, any> = {
  Droplets,
  BellOff,
  Coffee,
  Moon,
  Music,
  Sparkles,
};

export const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
  isOpen,
  onClose,
  messages,
  emotionContext,
}) => {
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchPrescription = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/prescribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.slice(-6),
          emotionContext,
        }),
      });
      const data = await res.json();
      setPrescription(data);
      soundEngine.playChime();
    } catch (err) {
      console.error('Prescription fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !prescription) {
      fetchPrescription();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyText = () => {
    if (!prescription) return;
    const textToCopy = `[토닥토닥 오피스 - 오늘의 퇴근 처방전]
📋 ${prescription.comfortTitle}
💬 "${prescription.healingQuote}"

🌿 퇴근 후 마음 처방:
${prescription.actions.map((a, i) => `${i + 1}. ${a.title}: ${a.description}`).join('\n')}

💖 오늘 나에게 해줄 말:
"${prescription.selfAffirmation}"`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    soundEngine.playChime();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-amber-200 shadow-2xl max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-amber-700 font-bold text-xs mb-1">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>직장인 퇴근길 힐링 케어</span>
        </div>

        <h3 className="text-xl font-bold text-stone-900 mb-1">
          오늘 밤을 위한 맞춤 퇴근 처방전
        </h3>
        <p className="text-xs text-stone-500 mb-5">
          오늘 나눈 대화와 감정 상태를 바탕으로 AI가 지어드린 온전한 쉼의 가이드입니다.
        </p>

        {loading ? (
          <div className="py-16 text-center space-y-4">
            <div className="w-12 h-12 rounded-full border-3 border-amber-200 border-t-amber-600 animate-spin mx-auto" />
            <div className="text-sm font-semibold text-stone-700">
              오늘의 피로도를 분석하고 마음 처방전을 짓고 있어요...
            </div>
            <p className="text-xs text-stone-400 max-w-xs mx-auto">
              수고한 당신을 위해 따뜻한 조약돌 같은 말들을 모으는 중입니다.
            </p>
          </div>
        ) : prescription ? (
          <div className="space-y-4">
            {/* Prescription Ticket Card */}
            <div className="bg-gradient-to-b from-amber-50/80 to-amber-100/40 border border-amber-200/90 rounded-2xl p-5 shadow-inner-sm">
              <div className="border-b border-amber-200/80 pb-3 mb-3">
                <span className="text-[11px] font-bold text-amber-800 tracking-wider uppercase bg-amber-200/70 px-2 py-0.5 rounded">
                  RX. 오늘의 처방명
                </span>
                <h4 className="text-base font-bold text-stone-900 mt-2">
                  {prescription.comfortTitle}
                </h4>
                <p className="text-xs text-amber-900/90 font-medium italic mt-1 leading-relaxed">
                  "{prescription.healingQuote}"
                </p>
              </div>

              {/* 3 Action Items */}
              <div className="space-y-2.5 my-3">
                <div className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                  <span>오늘 밤 실천할 3가지 작은 쉼:</span>
                </div>

                {prescription.actions.map((action, idx) => {
                  const IconComponent = ICON_MAP[action.iconName] || Sparkles;
                  return (
                    <div
                      key={idx}
                      className="bg-white/95 rounded-xl p-3 border border-amber-200/60 shadow-2xs flex items-start gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-100/70 flex items-center justify-center text-amber-800 shrink-0 mt-0.5">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-stone-900">
                          {idx + 1}. {action.title}
                        </div>
                        <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Self-Affirmation */}
              <div className="bg-white/90 border border-amber-200/80 rounded-xl p-3 text-center mt-3">
                <span className="text-[11px] font-semibold text-amber-700 block mb-1">
                  오늘 잠들기 전 나에게 해줄 한마디
                </span>
                <p className="text-sm font-bold text-stone-800">
                  "{prescription.selfAffirmation}"
                </p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={fetchPrescription}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-medium transition-colors"
                title="처방전 새로 받기"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>새로 받기</span>
              </button>

              <button
                type="button"
                onClick={handleCopyText}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>복사 완료되었습니다!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>처방전 텍스트 복사하기</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
