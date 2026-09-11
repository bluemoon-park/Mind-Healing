import React, { useState, useEffect } from 'react';
import { 
  X, 
  Archive, 
  Search, 
  Trash2, 
  Edit3, 
  Download, 
  RefreshCw, 
  Calendar, 
  Tag, 
  Smile, 
  MessageSquare, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  Sparkles, 
  Plus, 
  CornerDownRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { 
  CounselingSession, 
  CounselingStats, 
  ChatMessage, 
  EmotionCheckIn, 
  Prescription, 
  CounselorId,
  StressCategory
} from '../types';
import { COUNSELORS } from '../counselors';
import { soundEngine } from '../utils/audio';

interface CounselingHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMessages: ChatMessage[];
  currentEmotion: EmotionCheckIn;
  currentCounselorId: CounselorId;
  onLoadSession: (session: CounselingSession) => void;
}

export const CounselingHistoryModal: React.FC<CounselingHistoryModalProps> = ({
  isOpen,
  onClose,
  currentMessages,
  currentEmotion,
  currentCounselorId,
  onLoadSession,
}) => {
  const [sessions, setSessions] = useState<CounselingSession[]>([]);
  const [stats, setStats] = useState<CounselingStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCounselorFilter, setSelectedCounselorFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Expanded items state
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  
  // Memo editing state
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [memoText, setMemoText] = useState('');
  const [isSavingMemo, setIsSavingMemo] = useState(false);

  // Quick save current chat form
  const [isSavingCurrent, setIsSavingCurrent] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveMemo, setSaveMemo] = useState('');
  const [saveTags, setSaveTags] = useState('');
  const [saveCategory, setSaveCategory] = useState<StressCategory>('업무');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  const fetchSessionsAndStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sessionsRes, statsRes] = await Promise.all([
        fetch('/api/sessions'),
        fetch('/api/stats'),
      ]);

      if (!sessionsRes.ok || !statsRes.ok) {
        throw new Error('서버에서 상담 데이터를 불러오지 못했습니다.');
      }

      const sessionsData = await sessionsRes.json();
      const statsData = await statsRes.json();

      setSessions(sessionsData.sessions || []);
      setStats(statsData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || '상담 기록을 불러오는 중 문제가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSessionsAndStats();
      // Pre-fill save title if current messages exist
      const firstUserMsg = currentMessages.find((m) => m.role === 'user');
      if (firstUserMsg) {
        setSaveTitle(firstUserMsg.text.slice(0, 25) + ' 상담');
      } else {
        setSaveTitle(`오늘의 ${COUNSELORS[currentCounselorId]?.name || '마음'} 상담`);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveCurrentSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentMessages.length === 0) {
      alert('저장할 현재 상담 대화 내용이 없습니다. 상담사와 먼저 대화를 나눠보세요.');
      return;
    }

    setIsSavingCurrent(true);
    try {
      const parsedTags = saveTags
        .split(/[\s,]+/)
        .filter((t) => t.trim().length > 0)
        .map((t) => (t.startsWith('#') ? t : `#${t}`));

      const payload = {
        title: saveTitle.trim() || '상담 기록',
        counselorId: currentCounselorId,
        messages: currentMessages,
        emotion: currentEmotion,
        category: saveCategory,
        memo: saveMemo.trim(),
        tags: parsedTags,
      };

      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('저장에 실패했습니다.');
      }

      const saved = await res.json();
      soundEngine.playChime();
      setSaveSuccessNotice('현재 상담 대화가 백엔드 서버에 안전하게 보관되었습니다.');
      setTimeout(() => setSaveSuccessNotice(null), 3500);
      setShowSaveForm(false);
      setSaveMemo('');
      setSaveTags('');
      await fetchSessionsAndStats();
    } catch (err: any) {
      alert(err.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSavingCurrent(false);
    }
  };

  const handleSaveMemo = async (sessionId: string) => {
    setIsSavingMemo(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memo: memoText }),
      });

      if (!res.ok) throw new Error('메모 저장 실패');

      const updated = await res.json();
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? updated : s)));
      setEditingMemoId(null);
      soundEngine.playChime();
    } catch (err: any) {
      alert(err.message || '메모 업데이트 실패');
    } finally {
      setIsSavingMemo(false);
    }
  };

  const handleDeleteSession = async (sessionId: string, title: string) => {
    if (!window.confirm(`"${title}" 상담 기록을 영구히 삭제할까요?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('삭제 실패');

      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      soundEngine.playChime();
      fetchSessionsAndStats();
    } catch (err: any) {
      alert(err.message || '삭제 중 오류가 발생했습니다.');
    }
  };

  const handleExportJson = () => {
    const dataStr = JSON.stringify(sessions, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todak_counseling_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtered list
  const filteredSessions = sessions.filter((session) => {
    if (selectedCounselorFilter !== 'all' && session.counselorId !== selectedCounselorFilter) {
      return false;
    }
    if (selectedCategoryFilter !== 'all' && session.category !== selectedCategoryFilter) {
      return false;
    }
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const titleMatch = session.title?.toLowerCase().includes(query);
    const memoMatch = session.memo?.toLowerCase().includes(query);
    const tagMatch = session.tags?.some((t) => t.toLowerCase().includes(query));
    const msgMatch = session.messages?.some((m) => m.text.toLowerCase().includes(query));
    return titleMatch || memoMatch || tagMatch || msgMatch;
  });

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-[#FAF7F2] w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl border border-amber-200/80 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-amber-200/70 bg-amber-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-800">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                마음 상담 보관함
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-900">
                  서버 저장소
                </span>
              </h2>
              <p className="text-xs text-stone-500">
                백엔드 서버에 안전하게 기록된 나의 심리 상담 및 처방 히스토리
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJson}
              title="상담 데이터 JSON 백업 다운로드"
              className="p-2 rounded-xl border border-amber-200 bg-white/80 hover:bg-amber-100/50 text-stone-600 text-xs flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4 text-amber-700" />
              <span className="hidden sm:inline">백업 내보내기</span>
            </button>
            <button
              onClick={fetchSessionsAndStats}
              title="새로고침"
              disabled={isLoading}
              className="p-2 rounded-xl border border-amber-200 bg-white/80 hover:bg-amber-100/50 text-stone-600 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-700' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-amber-100/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* Notification banner */}
          {saveSuccessNotice && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccessNotice}</span>
            </div>
          )}

          {/* Statistics Dashboard Banner */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-white border border-amber-200/70 shadow-2xs">
                <span className="text-xs text-stone-500 font-medium block">총 상담 세션</span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl font-bold text-stone-900">{stats.totalSessions}</span>
                  <span className="text-xs text-stone-400">회 완료</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-amber-200/70 shadow-2xs">
                <span className="text-xs text-stone-500 font-medium block">누적 위로 대화</span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl font-bold text-amber-700">{stats.totalMessages}</span>
                  <span className="text-xs text-stone-400">개 주고받음</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-amber-200/70 shadow-2xs">
                <span className="text-xs text-stone-500 font-medium block">평균 마음 에너지</span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl font-bold text-stone-900">{stats.avgBatteryLevel}%</span>
                  <span className="text-xs text-stone-400">배터리</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-amber-200/70 shadow-2xs">
                <span className="text-xs text-stone-500 font-medium block">주요 고민 키워드</span>
                <div className="mt-1 truncate">
                  {stats.topStressFactors.length > 0 ? (
                    <span className="text-xs font-bold text-rose-700 truncate">
                      {stats.topStressFactors[0].factor}
                    </span>
                  ) : (
                    <span className="text-xs text-stone-400">데이터 없음</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action: Save Current Live Chat to Server */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-100/60 to-orange-100/40 border border-amber-300/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  현재 진행 중인 상담 저장하기
                </h3>
                <p className="text-xs text-stone-600 mt-0.5">
                  현재 열려있는 대화({currentMessages.length}개 메시지)와 감정 상태를 서버에 보관해 언제든 다시 열어보세요.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSaveForm(!showSaveForm)}
                className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showSaveForm ? '입력창 닫기' : '서버에 저장하기'}</span>
              </button>
            </div>

            {showSaveForm && (
              <form onSubmit={handleSaveCurrentSession} className="mt-4 pt-3.5 border-t border-amber-200/70 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">상담 제목</label>
                  <input
                    type="text"
                    value={saveTitle}
                    onChange={(e) => setSaveTitle(e.target.value)}
                    placeholder="예: 과도한 야근과 업무 지시로 인한 번아웃 상담"
                    className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">스트레스 분야 분류</label>
                    <div className="flex flex-wrap gap-1.5">
                      {(['업무', '자기개발', '취미 활동', '인간관계', '건강/생활'] as StressCategory[]).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSaveCategory(cat)}
                          className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                            saveCategory === cat
                              ? 'bg-amber-600 text-white font-bold'
                              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">키워드 태그 (쉼표나 공백 구분)</label>
                    <input
                      type="text"
                      value={saveTags}
                      onChange={(e) => setSaveTags(e.target.value)}
                      placeholder="#야근, #팀장님, #자책금지"
                      className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">나의 느낀 점 메모 (선택)</label>
                  <input
                    type="text"
                    value={saveMemo}
                    onChange={(e) => setSaveMemo(e.target.value)}
                    placeholder="상담사의 위로를 듣고 오늘 밤은 슬랙 끄기로 함"
                    className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowSaveForm(false)}
                    className="px-3 py-1.5 text-xs text-stone-500 hover:text-stone-800"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingCurrent || currentMessages.length === 0}
                    className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
                  >
                    {isSavingCurrent ? '저장 중...' : '서버에 저장 완료'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Search & Counselor Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="상담 제목, 대화 내용, 메모, 태그로 검색..."
                className="w-full pl-9 pr-3.5 py-2 bg-white border border-amber-200/80 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Counselor Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setSelectedCounselorFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCounselorFilter === 'all'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-white border border-amber-200 text-stone-600 hover:bg-amber-100/50'
                }`}
              >
                전체 상담사
              </button>
              {Object.values(COUNSELORS).map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCounselorFilter(c.id)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    selectedCounselorFilter === c.id
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-white border border-amber-200 text-stone-600 hover:bg-amber-100/50'
                  }`}
                >
                  <span>{c.avatar}</span>
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter Chips Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-stone-400 text-[11px] font-medium shrink-0 mr-1">분야 필터:</span>
            <button
              onClick={() => setSelectedCategoryFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedCategoryFilter === 'all'
                  ? 'bg-stone-800 text-white font-bold'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              모든 분야
            </button>
            {(['업무', '자기개발', '취미 활동', '인간관계', '건강/생활'] as StressCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  selectedCategoryFilter === cat
                    ? 'bg-amber-600 text-white font-bold shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sessions List */}
          {isLoading && sessions.length === 0 ? (
            <div className="py-16 text-center text-stone-400 text-xs flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-600" />
              <span>서버에서 상담 기록을 조회하고 있습니다...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="py-16 text-center rounded-2xl bg-white border border-dashed border-amber-200 p-8 space-y-2">
              <Archive className="w-8 h-8 text-stone-300 mx-auto" />
              <p className="text-sm font-semibold text-stone-700">해당하는 상담 기록이 없습니다.</p>
              <p className="text-xs text-stone-500">
                {searchQuery ? '다른 검색어를 입력해보시거나 필터를 변경해보세요.' : '상담을 나누고 상단의 "서버에 저장하기"를 눌러보세요.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredSessions.map((session) => {
                const counselor = COUNSELORS[session.counselorId as CounselorId] || COUNSELORS.bom;
                const isExpanded = expandedSessionId === session.id;
                const isEditingThisMemo = editingMemoId === session.id;

                return (
                  <div
                    key={session.id}
                    className="bg-white rounded-2xl border border-amber-200/80 shadow-2xs hover:shadow-xs transition-shadow p-4.5 space-y-3"
                  >
                    {/* Top Row: Counselor & Date & Actions */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/70 flex items-center justify-center text-lg">
                          {counselor.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-stone-900">{counselor.name}</span>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-medium">
                              {counselor.roleTitle}
                            </span>
                            {session.category && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                                session.category === '업무' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                                session.category === '자기개발' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                session.category === '취미 활동' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                                session.category === '인간관계' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                                'bg-cyan-100 text-cyan-800 border-cyan-200'
                              }`}>
                                {session.category}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-stone-400 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {formatDate(session.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Header Actions */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            if (window.confirm('이 상담 기록을 현재 대화창으로 불러올까요? 현재 작성 중인 대화가 이 상담으로 교체됩니다.')) {
                              onLoadSession(session);
                              onClose();
                              soundEngine.playChime();
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-[11px] font-medium transition-colors"
                          title="이전 대화 이어하기"
                        >
                          대화창에 불러오기
                        </button>
                        <button
                          onClick={() => handleDeleteSession(session.id, session.title)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="상담 기록 영구 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Session Title */}
                    <div>
                      <h4 className="text-sm font-bold text-stone-900 leading-snug">
                        {session.title}
                      </h4>
                    </div>

                    {/* Emotion & Battery indicator */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-medium text-[11px] flex items-center gap-1">
                        <Smile className="w-3 h-3 text-amber-600" />
                        마음 배터리: {session.emotion?.batteryLevel ?? 50}%
                      </span>
                      {session.emotion?.stressFactors && session.emotion.stressFactors.map((f, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-100 text-[11px]">
                          {f}
                        </span>
                      ))}
                      {session.tags && session.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/50 text-[11px] font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Personal Reflection Memo */}
                    <div className="pt-2 border-t border-stone-100">
                      {isEditingThisMemo ? (
                        <div className="space-y-2 mt-1">
                          <textarea
                            value={memoText}
                            onChange={(e) => setMemoText(e.target.value)}
                            rows={2}
                            placeholder="이 상담을 통해 느낀 점이나 실천할 액션을 적어보세요..."
                            className="w-full p-2.5 text-xs bg-[#FAF7F2] border border-amber-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingMemoId(null)}
                              className="px-2.5 py-1 text-xs text-stone-500 hover:text-stone-800"
                            >
                              취소
                            </button>
                            <button
                              type="button"
                              disabled={isSavingMemo}
                              onClick={() => handleSaveMemo(session.id)}
                              className="px-3 py-1 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700"
                            >
                              {isSavingMemo ? '저장 중...' : '메모 저장'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2 group mt-0.5">
                          <div className="flex items-start gap-1.5 text-xs text-stone-600">
                            <FileText className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                            <span className={session.memo ? 'text-stone-800' : 'text-stone-400 italic'}>
                              {session.memo || '작성된 나만의 회고 메모가 없습니다.'}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setEditingMemoId(session.id);
                              setMemoText(session.memo || '');
                            }}
                            className="text-[11px] text-amber-700 hover:underline flex items-center gap-0.5 shrink-0"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>{session.memo ? '메모 수정' : '메모 추가'}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Messages Toggle & Detail */}
                    <div className="pt-1 flex items-center justify-between">
                      <button
                        onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                        className="text-xs text-stone-500 hover:text-amber-800 font-medium flex items-center gap-1 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>대화 내용 ({session.messages?.length || 0}개) {isExpanded ? '접기' : '상세보기'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {session.prescription && (
                        <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          퇴근 처방전 포함
                        </span>
                      )}
                    </div>

                    {/* Expanded Chat Messages */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-amber-100/80 space-y-2.5 bg-amber-50/40 rounded-xl p-3 max-h-60 overflow-y-auto">
                        {session.messages?.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                          >
                            <div className="flex items-center gap-1 text-[10px] text-stone-400 mb-0.5">
                              <span>{msg.role === 'user' ? '나' : counselor.name}</span>
                              <span>·</span>
                              <span>{msg.timestamp}</span>
                            </div>
                            <div
                              className={`p-2.5 rounded-xl text-xs max-w-[85%] whitespace-pre-wrap ${
                                msg.role === 'user'
                                  ? 'bg-amber-600 text-white rounded-tr-none'
                                  : 'bg-white text-stone-800 border border-amber-200/60 rounded-tl-none shadow-2xs'
                              }`}
                            >
                              {msg.text}
                            </div>
                          </div>
                        ))}

                        {/* Prescription summary if present */}
                        {session.prescription && (
                          <div className="mt-3 p-3 rounded-xl bg-white border border-amber-300/80 shadow-2xs space-y-1.5">
                            <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-amber-600" />
                              처방전: {session.prescription.comfortTitle}
                            </span>
                            <p className="text-xs text-stone-600 italic">
                              "{session.prescription.healingQuote}"
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-amber-200/70 bg-amber-50/50 flex items-center justify-between text-xs text-stone-500">
          <span>총 {sessions.length}건의 상담 기록이 보관되어 있습니다.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 font-medium transition-colors"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
};
