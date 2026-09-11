import React, { useState, useEffect } from 'react';
import { 
  UserStressProfile, 
  StressCategory, 
  CounselingSession 
} from '../types';
import { 
  BarChart3, 
  Brain, 
  Sparkles, 
  RefreshCw, 
  ShieldCheck, 
  AlertTriangle, 
  TrendingUp, 
  Briefcase, 
  GraduationCap, 
  Palmtree, 
  Users, 
  HeartPulse, 
  CheckCircle2, 
  X, 
  ArrowRight,
  Zap,
  Info
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar 
} from 'recharts';

interface DataAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenHistoryWithFilter?: (category: StressCategory) => void;
}

const CATEGORY_ICONS: Record<StressCategory, React.ComponentType<{ className?: string }>> = {
  '업무': Briefcase,
  '자기개발': GraduationCap,
  '취미 활동': Palmtree,
  '인간관계': Users,
  '건강/생활': HeartPulse,
};

const CATEGORY_COLORS: Record<StressCategory, { hex: string; bg: string; text: string; border: string; badgeBg: string }> = {
  '업무': { hex: '#E11D48', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', badgeBg: 'bg-rose-100' },
  '자기개발': { hex: '#D97706', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', badgeBg: 'bg-amber-100' },
  '취미 활동': { hex: '#059669', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', badgeBg: 'bg-emerald-100' },
  '인간관계': { hex: '#4F46E5', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', badgeBg: 'bg-indigo-100' },
  '건강/생활': { hex: '#0891B2', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', badgeBg: 'bg-cyan-100' },
};

export const DataAnalyticsModal: React.FC<DataAnalyticsModalProps> = ({
  isOpen,
  onClose,
  onOpenHistoryWithFilter,
}) => {
  const [profile, setProfile] = useState<UserStressProfile | null>(null);
  const [sessions, setSessions] = useState<CounselingSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartView, setChartView] = useState<'bar' | 'radar'>('bar');
  const [activeCategory, setActiveCategory] = useState<StressCategory | 'all'>('all');
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const fetchProfileAndSessions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [profileRes, sessionsRes] = await Promise.all([
        fetch('/api/stress-profile'),
        fetch('/api/sessions')
      ]);

      if (profileRes.ok) {
        const pData = await profileRes.json();
        setProfile(pData);
      }
      if (sessionsRes.ok) {
        const sData = await sessionsRes.json();
        setSessions(sData.sessions || []);
      }
    } catch (err: any) {
      console.error('Failed to load analytics data:', err);
      setError('스트레스 분석 데이터를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProfileAndSessions();
    }
  }, [isOpen]);

  const handleRunDeepAnalysis = async () => {
    setIsAnalyzing(true);
    setNoticeMessage(null);
    setError(null);
    try {
      const res = await fetch('/api/stress-profile/analyze', {
        method: 'POST',
      });
      if (!res.ok) {
        throw new Error('AI 정밀 분석 요청 실패');
      }
      const updatedProfile = await res.json();
      setProfile(updatedProfile);
      setNoticeMessage('Gemini AI가 모든 상담 대화를 정밀 분석하여 스트레스 프로필과 상담사 지침을 업데이트했습니다.');
      setTimeout(() => setNoticeMessage(null), 5000);
    } catch (err: any) {
      console.error('Error in deep AI analysis:', err);
      setError('AI 분석 실행 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isOpen) return null;

  // Prepare chart data
  const chartData = profile?.categories?.map((cat) => ({
    name: cat.category,
    비중: cat.percentage,
    강도: cat.avgIntensity,
    건수: cat.count,
    fill: CATEGORY_COLORS[cat.category]?.hex || '#78716C',
  })) || [];

  const radarData = profile?.categories?.map((cat) => ({
    subject: cat.category,
    스트레스비중: cat.percentage,
    심각도: cat.avgIntensity * 10,
    fullMark: 100,
  })) || [];

  // Filtered sessions for the category preview
  const relevantSessions = activeCategory === 'all' 
    ? sessions 
    : sessions.filter(s => s.category === activeCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-[#FAF7F2] border border-amber-200 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans text-stone-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-100/90 via-amber-50 to-orange-50/70 border-b border-amber-200/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-stone-900 tracking-tight">스트레스 분야 데이터 분석 & AI 맞춤 케어</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-200 text-amber-900 border border-amber-300">
                  Gemini 연동
                </span>
              </div>
              <p className="text-xs text-stone-600">
                대화 데이터를 기반으로 스트레스 영역을 분류하고, 상담사에게 내담자 맞춤형 지침을 주입합니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="analytics-deep-analyze-btn"
              onClick={handleRunDeepAnalysis}
              disabled={isAnalyzing || isLoading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-all cursor-pointer"
              title="최신 대화 전체를 바탕으로 Gemini AI 심층 재분석 실행"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'AI 정밀 분석 중...' : 'AI 심층 재분석'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 transition-colors cursor-pointer"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notice alert */}
        {noticeMessage && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{noticeMessage}</span>
          </div>
        )}

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {isLoading ? (
            <div className="py-24 text-center">
              <RefreshCw className="w-8 h-8 mx-auto text-amber-500 animate-spin mb-3" />
              <p className="text-sm font-medium text-stone-700">스트레스 데이터 및 심리 프로필을 분석하는 중입니다...</p>
            </div>
          ) : profile ? (
            <>
              {/* Top Banner: Counselor Integration Status */}
              <div className="p-4 rounded-2xl bg-white border border-amber-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 shrink-0">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-900">AI 상담사 실시간 맞춤 연동 가동 중</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        상담 프롬프트 활성
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                      모든 상담사(봄날, 한선배, 루다, 고요)가 내담자의 1순위 취약 스트레스 영역인{' '}
                      <strong className="text-amber-900 underline font-semibold">[{profile.primaryDomain}]</strong>과 2순위{' '}
                      <strong className="text-stone-800 font-semibold">[{profile.secondaryDomain}]</strong> 문제를 상담 기본 지침으로 사전 학습하여 대화에 임합니다.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 md:border-l border-amber-100 pt-3 md:pt-0 md:pl-4 text-xs">
                  <div className="text-center px-3">
                    <div className="text-[10px] text-stone-500">분석된 상담 세션</div>
                    <div className="text-base font-bold text-stone-900">{profile.totalAnalyzedSessions}회</div>
                  </div>
                  <div className="h-6 w-px bg-stone-200"></div>
                  <div className="text-center px-3">
                    <div className="text-[10px] text-stone-500">종합 피로 지수</div>
                    <div className="text-base font-bold text-rose-600">{profile.overallStressLevel}%</div>
                  </div>
                </div>
              </div>

              {/* Stress Domain Cards (3-column hero metrics) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {profile.categories.map((cat) => {
                  const Icon = CATEGORY_ICONS[cat.category] || Briefcase;
                  const colors = CATEGORY_COLORS[cat.category];
                  const isPrimary = cat.category === profile.primaryDomain;
                  const isSecondary = cat.category === profile.secondaryDomain;

                  return (
                    <div
                      key={cat.category}
                      onClick={() => setActiveCategory(activeCategory === cat.category ? 'all' : cat.category)}
                      className={`relative p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                        activeCategory === cat.category
                          ? 'ring-2 ring-amber-500 shadow-md bg-white'
                          : 'bg-white/80 hover:bg-white hover:shadow-xs'
                      } ${colors.border}`}
                    >
                      {isPrimary && (
                        <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white shadow-xs">
                          최다 스트레스 (1위)
                        </span>
                      )}
                      {isSecondary && !isPrimary && (
                        <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-xs">
                          주의 필요 (2위)
                        </span>
                      )}

                      <div className="flex items-center justify-between mb-2 mt-1">
                        <div className={`p-2 rounded-xl ${colors.bg} ${colors.text}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-lg font-extrabold text-stone-900">{cat.percentage}%</span>
                      </div>

                      <h3 className="text-xs font-bold text-stone-900 mb-1 flex items-center gap-1.5">
                        <span>{cat.category}</span>
                        <span className="text-[10px] font-normal text-stone-500">({cat.count}건)</span>
                      </h3>

                      <div className="flex items-center gap-1 mb-2">
                        <span className="text-[10px] text-stone-500">스트레스 강도:</span>
                        <span className="text-[11px] font-semibold text-stone-800">{cat.avgIntensity} / 10</span>
                      </div>

                      <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden mb-2.5">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ width: `${cat.percentage}%`, backgroundColor: colors.hex }}
                        />
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {cat.keyTriggers.slice(0, 2).map((trig, idx) => (
                          <span 
                            key={idx} 
                            className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-stone-100 text-stone-600 truncate max-w-full"
                            title={trig}
                          >
                            {trig}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chart & Diagnostics Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Visual Chart Card */}
                <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-amber-600" />
                        <span>스트레스 분야별 분포도</span>
                      </h3>
                      <p className="text-[11px] text-stone-500">
                        어떤 삶의 영역에서 에너지가 가장 많이 소진되는지 비교합니다.
                      </p>
                    </div>

                    <div className="flex items-center bg-stone-100 p-0.5 rounded-xl text-[11px] font-medium">
                      <button
                        onClick={() => setChartView('bar')}
                        className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                          chartView === 'bar' ? 'bg-white font-bold text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        막대 그래프
                      </button>
                      <button
                        onClick={() => setChartView('radar')}
                        className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                          chartView === 'radar' ? 'bg-white font-bold text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        방사형 차트
                      </button>
                    </div>
                  </div>

                  <div className="h-64 w-full flex items-center justify-center">
                    {chartView === 'bar' ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#57534E' }} />
                          <YAxis unit="%" tick={{ fontSize: 11, fill: '#78716C' }} />
                          <Tooltip 
                            formatter={(value: any) => [`${value}%`, '스트레스 비중']}
                            contentStyle={{ backgroundColor: '#FAF7F2', borderRadius: '12px', borderColor: '#FDE68A', fontSize: '12px' }}
                          />
                          <Bar dataKey="비중" radius={[6, 6, 0, 0]}>
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="#E7E5E4" />
                          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#44403C' }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: '#78716C' }} />
                          <Radar name="스트레스 비중" dataKey="스트레스비중" stroke="#D97706" fill="#F59E0B" fillOpacity={0.4} />
                          <Tooltip contentStyle={{ backgroundColor: '#FAF7F2', borderRadius: '12px', fontSize: '12px' }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between text-xs text-stone-600">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                      1위 집중 분야: <strong>{profile.primaryDomain}</strong>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      2위 집중 분야: <strong>{profile.secondaryDomain}</strong>
                    </span>
                  </div>
                </div>

                {/* Gemini Psychological Diagnosis Report */}
                <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>Gemini AI 심층 심리 진단 리포트</span>
                      </h3>
                      <span className="text-[10px] text-stone-400">
                        {new Date(profile.lastAnalyzedAt).toLocaleDateString('ko-KR')} 분석
                      </span>
                    </div>

                    {/* Core Diagnosis Box */}
                    <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/60 mb-3 text-xs leading-relaxed text-stone-800">
                      <strong className="block text-amber-900 font-bold mb-1 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-amber-600" />
                        핵심 종합 진단
                      </strong>
                      {profile.aiDiagnosis.coreDiagnosis}
                    </div>

                    {/* Vulnerability & Strength */}
                    <div className="space-y-2 mb-3 text-xs">
                      <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-100 text-rose-950">
                        <span className="font-bold text-rose-800 block mb-0.5 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-500" />
                          취약 요인 (소진 유발 트리거)
                        </span>
                        <p className="text-rose-900 leading-normal">{profile.aiDiagnosis.vulnerabilityTrigger}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-emerald-950">
                        <span className="font-bold text-emerald-800 block mb-0.5 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          내면의 강점 및 회복 잠재력
                        </span>
                        <p className="text-emerald-900 leading-normal">{profile.aiDiagnosis.strengthAndResilience}</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Prescriptions */}
                  <div className="pt-3 border-t border-stone-100">
                    <span className="text-xs font-bold text-stone-900 block mb-2">
                      💡 일상 회복을 위한 3대 실천 처방
                    </span>
                    <ul className="space-y-1.5 text-xs text-stone-700">
                      {profile.aiDiagnosis.actionPrescription.map((act, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Counselor Instruction Peek Section */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300/80 text-xs">
                <div className="flex items-center gap-2 mb-1.5">
                  <Brain className="w-4 h-4 text-amber-800" />
                  <h4 className="font-bold text-amber-950">
                    AI 상담사 프롬프트에 실시간 주입되는 맞춤형 케어 지침
                  </h4>
                </div>
                <p className="text-stone-800 bg-white/80 p-3 rounded-xl border border-amber-200/80 leading-relaxed font-mono text-[11px]">
                  "{profile.counselorGuidance}"
                </p>
              </div>

              {/* Sessions Linked to Domains Section */}
              <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                      <span>분류 영역별 상담 대화 데이터</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-stone-100 text-stone-600 font-normal">
                        총 {relevantSessions.length}건
                      </span>
                    </h3>
                    <p className="text-xs text-stone-500">
                      상담 대화 내용에 따라 자동으로 분류된 세션 목록입니다.
                    </p>
                  </div>

                  {/* Filter chips */}
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setActiveCategory('all')}
                      className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                        activeCategory === 'all'
                          ? 'bg-amber-600 text-white'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      전체 보기
                    </button>
                    {(['업무', '자기개발', '취미 활동', '인간관계', '건강/생활'] as StressCategory[]).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                          activeCategory === cat
                            ? `${CATEGORY_COLORS[cat].bg} ${CATEGORY_COLORS[cat].text} font-bold border ${CATEGORY_COLORS[cat].border}`
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {relevantSessions.length === 0 ? (
                  <div className="py-10 text-center text-xs text-stone-500">
                    선택하신 [{activeCategory}] 영역에 해당하는 상담 데이터가 아직 없습니다.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {relevantSessions.map((session) => {
                      const cat = session.category || '업무';
                      const colors = CATEGORY_COLORS[cat] || CATEGORY_COLORS['업무'];
                      const Icon = CATEGORY_ICONS[cat] || Briefcase;

                      return (
                        <div
                          key={session.id}
                          className="p-3.5 rounded-xl border border-stone-200 hover:border-amber-300 bg-stone-50/50 hover:bg-white transition-all flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div className={`p-2 rounded-xl shrink-0 ${colors.bg} ${colors.text}`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${colors.badgeBg} ${colors.text}`}>
                                  {cat}
                                </span>
                                <span className="font-semibold text-stone-900 truncate">
                                  {session.title}
                                </span>
                                <span className="text-[10px] text-stone-400 shrink-0">
                                  {new Date(session.createdAt).toLocaleDateString('ko-KR')}
                                </span>
                              </div>
                              <p className="text-stone-600 truncate text-[11px]">
                                {session.messages?.find(m => m.role === 'user')?.text || '대화 내용 없음'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {session.emotion && (
                              <span className="text-[10px] text-stone-500 hidden sm:inline">
                                배터리 {session.emotion.batteryLevel}%
                              </span>
                            )}
                            {onOpenHistoryWithFilter && (
                              <button
                                onClick={() => {
                                  onClose();
                                  onOpenHistoryWithFilter(cat);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <span>열기</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-stone-500 text-sm">
              분석 가능한 상담 데이터가 없습니다. 상담사와 먼저 대화를 나눠보세요.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-stone-100/80 border-t border-amber-200/60 flex items-center justify-between text-xs text-stone-600 shrink-0">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-stone-500" />
            <span>상담을 진행할 때마다 스트레스 데이터와 지침이 자동으로 고도화됩니다.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-medium transition-colors cursor-pointer"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
