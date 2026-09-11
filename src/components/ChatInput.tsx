import React, { useState, useRef, useEffect } from 'react';
import { Send, CornerDownLeft, Sparkles, SmilePlus } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isStreaming: boolean;
  disabled?: boolean;
}

const QUICK_TAGS = [
  '#오늘야근',
  '#상사갈등',
  '#자존감바닥',
  '#번아웃',
  '#퇴사각',
  '#인간관계스트레스',
  '#성과압박',
  '#그냥위로가필요해'
];

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isStreaming,
  disabled = false,
}) => {
  const [inputText, setInputText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isStreaming || disabled) return;

    onSendMessage(inputText.trim());
    setInputText('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    // Auto grow
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        140
      )}px`;
    }
  };

  const handleQuickTagClick = (tag: string) => {
    setInputText((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed} ${tag}` : tag;
    });
    textareaRef.current?.focus();
  };

  return (
    <div className="bg-white/90 backdrop-blur-md border-t border-amber-200/80 p-3 sm:p-4 shrink-0">
      <div className="max-w-3xl mx-auto space-y-2.5">
        {/* Quick Tags row */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-[11px] font-semibold text-stone-400 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            키워드:
          </span>
          {QUICK_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleQuickTagClick(tag)}
              className="shrink-0 px-2 py-0.5 rounded-full bg-amber-50 hover:bg-amber-100 text-stone-600 hover:text-amber-900 border border-amber-200/70 text-[11px] transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSubmit}
          className="relative flex items-end gap-2 bg-amber-50/50 border border-amber-300/80 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-amber-400/40 focus-within:border-amber-400 bg-white transition-all shadow-xs"
        >
          <textarea
            id="chat-user-input"
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={isStreaming || disabled}
            placeholder="마음속에 쌓인 일, 무엇이든 편하게 이야기해주세요..."
            className="w-full resize-none bg-transparent px-2.5 py-1.5 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-hidden min-h-[40px] max-h-[140px] leading-relaxed"
          />

          <button
            id="chat-submit-btn"
            type="submit"
            disabled={!inputText.trim() || isStreaming || disabled}
            className={`p-2.5 rounded-xl shrink-0 transition-all flex items-center justify-center ${
              inputText.trim() && !isStreaming
                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            }`}
            title="상담 메시지 전송 (Enter)"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center justify-between text-[11px] text-stone-400 px-1">
          <span>* 모든 상담 내용은 익명으로 안전하게 다루어집니다.</span>
          <span className="hidden sm:inline">줄바꿈: Shift + Enter</span>
        </div>
      </div>
    </div>
  );
};
