import React, { useState } from 'react';
import { X, Trash2, Sparkles, CheckCircle2, RotateCcw } from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface StressShredderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StressShredderModal: React.FC<StressShredderModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [worryText, setWorryText] = useState('');
  const [isShredding, setIsShredding] = useState(false);
  const [isShredded, setIsShredded] = useState(false);

  if (!isOpen) return null;

  const handleShred = () => {
    if (!worryText.trim() || isShredding) return;

    setIsShredding(true);
    soundEngine.playChime();

    setTimeout(() => {
      setIsShredding(false);
      setIsShredded(true);
      setWorryText('');
    }, 1200);
  };

  const handleReset = () => {
    setIsShredded(false);
    setWorryText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-rose-200 shadow-2xl max-w-lg w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-rose-600 font-bold text-xs mb-1">
          <Trash2 className="w-4 h-4" />
          <span>감정 쓰레기통 & 분쇄기</span>
        </div>

        <h3 className="text-xl font-bold text-stone-900 mb-1">
          회사 스트레스 완전 분쇄하기
        </h3>
        <p className="text-xs text-stone-500 mb-5">
          오늘 나를 화나게 한 사람, 억울했던 일, 답답한 생각들을 솔직하게 적고 흔적도 없이 갈아버리세요.
        </p>

        {!isShredded ? (
          <div className="space-y-4">
            <div className={`relative transition-all duration-700 ${
              isShredding ? 'scale-95 opacity-20 blur-xs' : ''
            }`}>
              <textarea
                id="shredder-input"
                rows={5}
                value={worryText}
                onChange={(e) => setWorryText(e.target.value)}
                placeholder="예: 오늘 나한테 억울하게 책임 떠넘긴 김팀장 진짜 너무 화난다... 아무 이유 없이 쿠사리 먹고 하루 종일 자책했는데 이제 털어버릴래!"
                className="w-full p-4 rounded-2xl bg-stone-50 border border-stone-200 text-sm text-stone-800 placeholder:text-stone-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-400/40 focus:border-rose-400 resize-none leading-relaxed"
              />

              {isShredding && (
                <div className="absolute inset-0 flex items-center justify-center bg-rose-100/60 rounded-2xl">
                  <div className="text-center font-bold text-rose-800 text-sm animate-pulse">
                    ✂️ 스트레스를 파쇄하는 중입니다...
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-stone-400">
              <span>* 입력된 내용은 서버에 저장되지 않고 화면에서 즉시 소멸합니다.</span>
            </div>

            <button
              id="shredder-submit-btn"
              type="button"
              onClick={handleShred}
              disabled={!worryText.trim() || isShredding}
              className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-xs ${
                worryText.trim() && !isShredding
                  ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>지금 분쇄기에 넣고 갈아버리기</span>
            </button>
          </div>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-lg font-bold text-stone-900 mb-1">
                스트레스 분쇄 완료!
              </h4>
              <p className="text-sm text-stone-600 max-w-sm mx-auto leading-relaxed">
                마음속 찌꺼기가 깨끗하게 사라졌습니다.<br />
                <span className="font-semibold text-amber-800">
                  회사의 일은 회사에 두고 퇴근하세요.
                </span><br />
                당신의 영혼은 회사의 소유물이 아닙니다.
              </p>
            </div>

            <div className="flex gap-2 pt-3">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-xs font-semibold hover:bg-stone-50 transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>또 다른 고민 갈아버리기</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                가벼운 마음으로 돌아가기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
