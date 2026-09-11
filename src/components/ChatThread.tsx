import React, { useEffect, useRef } from 'react';
import { Counselor, ChatMessage } from '../types';
import Markdown from 'react-markdown';
import { 
  Bot, 
  User, 
  Sparkles, 
  Clock, 
  Copy, 
  Check, 
  MessageSquarePlus, 
  RefreshCw 
} from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface ChatThreadProps {
  messages: ChatMessage[];
  counselor: Counselor;
  isStreaming: boolean;
  onSendPrompt: (promptText: string) => void;
  onClearHistory: () => void;
}

export const ChatThread: React.FC<ChatThreadProps> = ({
  messages,
  counselor,
  isStreaming,
  onSendPrompt,
  onClearHistory,
}) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    soundEngine.playChime();
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 space-y-5">
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Welcome Card when no messages or only intro */}
        {messages.length === 0 && (
          <div className="bg-white/90 backdrop-blur-xs border border-amber-200 rounded-3xl p-5 sm:p-7 shadow-sm text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-300/60 flex items-center justify-center text-3xl mx-auto mb-3 shadow-xs">
              {counselor.avatar}
            </div>

            <div className="inline-block px-3 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold mb-2">
              {counselor.roleTitle}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 mb-2">
              {counselor.name}와의 마음 상담실
            </h2>

            <p className="text-sm text-stone-600 max-w-lg mx-auto leading-relaxed mb-6">
              {counselor.introMessage}
            </p>

            {/* Suggested prompts */}
            <div className="text-left border-t border-amber-100 pt-5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>지쳐서 글을 쓰기 힘들 땐, 아래 버튼을 눌러보세요</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {counselor.suggestedPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    id={`suggested-prompt-${idx}`}
                    onClick={() => onSendPrompt(prompt)}
                    className="p-3 text-left text-xs bg-amber-50/60 hover:bg-amber-100/70 border border-amber-200/80 rounded-xl text-stone-800 transition-all hover:border-amber-300 flex items-center justify-between group"
                  >
                    <span className="line-clamp-2 pr-2 font-medium leading-relaxed">
                      "{prompt}"
                    </span>
                    <span className="text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Message Thread */}
        {messages.map((message) => {
          const isUser = message.role === 'user';

          return (
            <div
              key={message.id}
              className={`flex items-start gap-2.5 sm:gap-3.5 ${
                isUser ? 'justify-end' : 'justify-start'
              }`}
            >
              {/* Counselor Avatar */}
              {!isUser && (
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-100 border border-amber-300/80 flex items-center justify-center text-xl shrink-0 shadow-2xs mt-1">
                  {counselor.avatar}
                </div>
              )}

              {/* Message Content Bubble */}
              <div
                className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3.5 shadow-xs ${
                  isUser
                    ? 'bg-amber-600 text-white rounded-tr-xs'
                    : 'bg-white text-stone-800 border border-amber-200/90 rounded-tl-xs'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-stone-100">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-stone-900">
                        {counselor.name}
                      </span>
                      <span className="text-[11px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/60 font-medium">
                        {counselor.roleTitle}
                      </span>
                    </div>

                    <button
                      onClick={() => handleCopy(message.id, message.text)}
                      className="text-stone-400 hover:text-stone-600 p-1 rounded transition-colors"
                      title="위로 문구 복사하기"
                    >
                      {copiedId === message.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}

                {/* Body Text */}
                <div
                  className={`text-sm leading-relaxed prose prose-stone max-w-none break-words ${
                    isUser ? 'text-white' : 'text-stone-800'
                  }`}
                >
                  <Markdown>{message.text}</Markdown>
                </div>

                {/* Footer / Timestamp */}
                <div
                  className={`flex items-center justify-end gap-1 mt-2 text-[10px] ${
                    isUser ? 'text-amber-200/90' : 'text-stone-400'
                  }`}
                >
                  <Clock className="w-2.5 h-2.5" />
                  <span>{message.timestamp}</span>
                </div>
              </div>

              {/* User Avatar */}
              {isUser && (
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-stone-700 border border-stone-600 flex items-center justify-center text-white shrink-0 shadow-2xs mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Streaming Indicator */}
        {isStreaming && (
          <div className="flex items-start gap-2.5 sm:gap-3.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-100 border border-amber-300/80 flex items-center justify-center text-xl shrink-0 animate-bounce">
              {counselor.avatar}
            </div>
            <div className="bg-white border border-amber-200 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-900 font-medium">
                  {counselor.name} 상담사가 따뜻한 말을 고르고 있어요
                </span>
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"
                    style={{ animationDelay: '0.2s' }}
                  />
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"
                    style={{ animationDelay: '0.4s' }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action button if messages exist */}
        {messages.length > 2 && (
          <div className="flex justify-center pt-2">
            <button
              onClick={onClearHistory}
              className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 px-3 py-1 rounded-full border border-stone-200/80 hover:bg-stone-50 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>새로운 상담 시작하기</span>
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
};
