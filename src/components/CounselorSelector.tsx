import React from 'react';
import { Counselor, CounselorId } from '../types';
import { COUNSELORS } from '../counselors';
import { Sparkles, MessageCircleHeart } from 'lucide-react';

interface CounselorSelectorProps {
  currentCounselorId: CounselorId;
  onSelectCounselor: (id: CounselorId) => void;
}

export const CounselorSelector: React.FC<CounselorSelectorProps> = ({
  currentCounselorId,
  onSelectCounselor,
}) => {
  const counselorList = Object.values(COUNSELORS);

  return (
    <div className="bg-amber-100/30 border-b border-amber-200/50 py-3 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-600">
            <MessageCircleHeart className="w-4 h-4 text-amber-600" />
            <span>나에게 필요한 위로 파트너 선택</span>
          </div>
          <span className="text-[11px] text-stone-400">
            대화 중 언제든 상담사를 바꿀 수 있어요
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {counselorList.map((c) => {
            const isSelected = c.id === currentCounselorId;

            return (
              <button
                key={c.id}
                id={`counselor-tab-${c.id}`}
                onClick={() => onSelectCounselor(c.id)}
                className={`relative flex items-start gap-2.5 p-2.5 sm:p-3 rounded-2xl border text-left transition-all duration-200 ${
                  isSelected
                    ? 'bg-white shadow-md border-amber-300 ring-2 ring-amber-400/30'
                    : 'bg-white/60 hover:bg-white/90 border-amber-200/60 hover:border-amber-300/80 shadow-2xs'
                }`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-xl shrink-0 transition-transform ${
                    isSelected ? 'scale-105 bg-amber-100/60' : 'bg-stone-100/80'
                  }`}
                >
                  {c.avatar}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-stone-900 text-sm truncate">
                      {c.name}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    )}
                  </div>
                  <p className="text-[11px] font-medium text-amber-700 truncate">
                    {c.roleTitle}
                  </p>
                  <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5 leading-tight">
                    {c.tagline}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
