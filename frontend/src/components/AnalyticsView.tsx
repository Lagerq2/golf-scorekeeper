import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, Flag, Lightbulb, MapPin, TrendingDown, Trophy } from 'lucide-react';
import { Course, GolfRound, PerformanceStats, Player, TrendPoint } from '../types';
import { api } from '../services/api';
import { formatToPar } from '../utils/golfStats';

interface AnalyticsViewProps { rounds: GolfRound[]; courses: Course[]; players: Player[] }

const metric = (value: number | null | undefined, suffix = '', digits = 1) =>
  value == null ? '—' : `${value.toFixed(digits)}${suffix}`;

const Sparkline = ({ points, field, invert = false }: { points: TrendPoint[]; field: keyof TrendPoint; invert?: boolean }) => {
  const values = points.map(point => Number(point[field])).filter(Number.isFinite);
  if (values.length < 2) return <div className="h-28 grid place-items-center text-xs text-[#7E8F77]">Play at least two rounds to see a trend.</div>;
  const min = Math.min(...values), max = Math.max(...values), range = max - min || 1;
  const coords = values.map((value, index) => `${(index / (values.length - 1)) * 100},${invert ? 8 + ((value - min) / range) * 72 : 80 - ((value - min) / range) * 72}`).join(' ');
  return <div className="h-32">
    <svg viewBox="0 0 100 90" preserveAspectRatio="none" className="w-full h-24 overflow-visible" aria-label="Recent performance trend">
      <path d="M0 80 H100" stroke="#DCE4D0" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <polyline points={coords} fill="none" stroke="#5A6F4E" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
      {coords.split(' ').map((point, index) => { const [x, y] = point.split(','); return <circle key={index} cx={x} cy={y} r="2" fill="#C2A649" stroke="#2D3A27" strokeWidth="1" vectorEffect="non-scaling-stroke" />; })}
    </svg>
    <div className="flex justify-between text-[10px] text-[#7E8F77]">{points.map(point => <span key={point.roundId}>{new Date(point.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>)}</div>
  </div>;
};

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ rounds, players }) => {
  const personalPlayers = useMemo(() => players.filter(player => rounds.some(round => round.players.some(p => p.playerId === player.id))), [players, rounds]);
  const [playerId, setPlayerId] = useState(personalPlayers[0]?.id || players[0]?.id || '');
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trendMetric, setTrendMetric] = useState<'score' | 'putts' | 'girPct' | 'fairwayPct'>('score');

  useEffect(() => {
    if (!playerId) return;
    let active = true;
    setLoading(true); setError('');
    api.getPlayerStatistics(playerId).then(value => { if (active) setStats(value); })
      .catch(err => { if (active) { setStats(null); setError(err.message); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [playerId, rounds]);

  const player = players.find(item => item.id === playerId);
  const recentFive = stats?.trend.slice(-5) || [];
  const recentAverage = recentFive.length ? recentFive.reduce((sum, point) => sum + point.score, 0) / recentFive.length : null;

  return <div className="max-w-6xl mx-auto space-y-5 pb-12">
    <section className="rounded-3xl bg-[#2D3A27] text-white p-6 sm:p-8 overflow-hidden relative">
      <div className="absolute right-0 top-0 w-64 h-64 rounded-full bg-[#8EA67B]/10 translate-x-1/3 -translate-y-1/3" />
      <div className="relative flex flex-wrap justify-between gap-4 items-end">
        <div><span className="text-xs uppercase tracking-[.18em] text-[#E6CC7A] font-bold">Your game</span><h1 className="text-3xl font-serif font-bold mt-1">{player?.name ? `${player.name}'s performance` : 'Personal performance'}</h1><p className="text-sm text-[#CCD7BE] mt-2 max-w-xl">See where shots are gained, where they are lost, and how your game changes over time.</p></div>
        <select value={playerId} onChange={event => setPlayerId(event.target.value)} className="rounded-xl bg-[#1D2619] border border-[#5A6F4E] px-4 py-2.5 text-sm font-bold text-white focus:outline-hidden focus:ring-2 focus:ring-[#E6CC7A]">
          {players.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </div>
    </section>

    {loading && <div className="rounded-2xl bg-white border border-[#CCD7BE] p-8 text-center text-sm text-[#6C7E64]">Calculating your performance…</div>}
    {error && <div className="rounded-2xl bg-[#FDF0ED] border border-[#E5B5AA] p-5 flex gap-3 text-sm text-[#9E4747]"><AlertTriangle className="w-5 h-5 shrink-0" />{error}. Make sure the backend is running.</div>}
    {!loading && stats && <>
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ['Rounds', String(stats.roundsPlayed), `${stats.holesPlayed} holes tracked`, Flag],
          ['Average score', metric(stats.averageScore), stats.averageToPar == null ? 'No scoring data' : `${formatToPar(stats.averageToPar)} to par`, BarChart3],
          ['Personal best', stats.bestScore == null ? '—' : String(stats.bestScore), 'Completed round', Trophy],
          ['Recent form', metric(recentAverage), `Last ${recentFive.length} rounds`, TrendingDown]
        ].map(([label, value, hint, Icon]) => <div key={String(label)} className="bg-white border border-[#CCD7BE] rounded-2xl p-4 sm:p-5"><div className="flex justify-between"><span className="text-[11px] uppercase tracking-wider font-bold text-[#7E8F77]">{String(label)}</span><Icon className="w-4 h-4 text-[#8EA67B]" /></div><strong className="block text-3xl font-mono text-[#1D2619] mt-2">{String(value)}</strong><span className="text-xs text-[#6C7E64]">{String(hint)}</span></div>)}
      </section>

      <section className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
        <div className="bg-white border border-[#CCD7BE] rounded-3xl p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3 mb-4"><div><h2 className="font-serif font-bold text-lg text-[#1D2619]">Progress over time</h2><p className="text-xs text-[#6C7E64]">Your latest ten completed rounds</p></div><div className="flex bg-[#F7F9F2] rounded-xl p-1 border border-[#DCE4D0]">{(['score','putts','girPct','fairwayPct'] as const).map(item => <button key={item} onClick={() => setTrendMetric(item)} className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold ${trendMetric === item ? 'bg-[#2D3A27] text-white' : 'text-[#6C7E64]'}`}>{item === 'girPct' ? 'GIR' : item === 'fairwayPct' ? 'Fairways' : item[0].toUpperCase() + item.slice(1)}</button>)}</div></div><Sparkline points={stats.trend} field={trendMetric} invert={trendMetric === 'score' || trendMetric === 'putts'} /></div>
        <div className="bg-[#FBF6E2] border border-[#E6CC7A] rounded-3xl p-5 sm:p-6"><div className="flex gap-2 items-center"><Lightbulb className="w-5 h-5 text-[#8C6F1E]"/><h2 className="font-serif font-bold text-lg text-[#1D2619]">Areas to improve</h2></div><div className="mt-4 space-y-3">{stats.insights.length ? stats.insights.map(insight => <article key={insight.category} className="bg-white/80 rounded-2xl p-4 border border-[#E6CC7A]"><h3 className="text-sm font-bold text-[#1D2619]">{insight.title}</h3><p className="text-xs leading-relaxed text-[#6C7E64] mt-1">{insight.message}</p></article>) : <p className="text-sm text-[#6C7E64] py-6 text-center">Complete at least three rounds with hole statistics to unlock meaningful insights.</p>}</div></div>
      </section>

      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[['Putts / round', metric(stats.averagePuttsPerRound)], ['Putts / hole', metric(stats.puttsPerHole, '', 2)], ['Fairways hit', metric(stats.fairwayPct, '%')], ['Greens in regulation', metric(stats.girPct, '%')], ['Penalties / round', metric(stats.averagePenalties)], ['Bunker shots / round', metric(stats.averageBunkerShots)]].map(([label, value]) => <div key={label} className="bg-white border border-[#CCD7BE] rounded-2xl p-4"><span className="text-[11px] uppercase tracking-wider font-bold text-[#7E8F77]">{label}</span><strong className="block text-2xl font-mono mt-1 text-[#1D2619]">{value}</strong></div>)}
        <div className="sm:col-span-2 bg-[#E9EDD9] border border-[#CCD7BE] rounded-2xl p-4"><span className="text-[11px] uppercase tracking-wider font-bold text-[#6C7E64]">Scoring by hole type</span><div className="grid grid-cols-3 gap-3 mt-2">{(['3','4','5'] as const).map(par => <div key={par}><span className="text-xs text-[#6C7E64]">Par {par}</span><strong className="block text-xl font-mono text-[#1D2619]">{stats.byPar[par].averageToPar == null ? '—' : formatToPar(stats.byPar[par].averageToPar)}</strong><span className="text-[10px] text-[#7E8F77]">avg to par</span></div>)}</div></div>
      </section>

      <section className="bg-white border border-[#CCD7BE] rounded-3xl p-5 sm:p-6"><div className="flex items-center gap-2 mb-4"><MapPin className="w-5 h-5 text-[#5A6F4E]"/><div><h2 className="font-serif font-bold text-lg text-[#1D2619]">Course intelligence</h2><p className="text-xs text-[#6C7E64]">Personal records and the holes that most often cost you shots</p></div></div><div className="grid lg:grid-cols-2 gap-3">{stats.courses.map(course => { const hardest = [...course.holes].sort((a,b) => b.averageToPar - a.averageToPar).slice(0,3); return <article key={course.courseId} className="rounded-2xl border border-[#DCE4D0] p-4"><div className="flex justify-between gap-3"><div><h3 className="font-bold text-sm text-[#1D2619]">{course.courseName}</h3><span className="text-xs text-[#6C7E64]">{course.roundsPlayed} rounds</span></div><div className="text-right"><strong className="text-xl font-mono text-[#1D2619]">{course.bestScore ?? '—'}</strong><span className="block text-[10px] uppercase text-[#7E8F77]">personal best</span></div></div><div className="grid grid-cols-2 gap-2 mt-4 text-xs"><div className="bg-[#F7F9F2] rounded-xl p-3">Average <strong className="float-right">{metric(course.averageScore)}</strong></div><div className="bg-[#F7F9F2] rounded-xl p-3">To par <strong className="float-right">{course.averageToPar == null ? '—' : formatToPar(course.averageToPar)}</strong></div></div>{hardest.length > 0 && <div className="mt-3"><span className="text-[10px] uppercase font-bold text-[#7E8F77]">Toughest holes</span><div className="flex gap-2 mt-1">{hardest.map(hole => <span key={hole.holeNumber} className="text-xs bg-[#FDF0ED] text-[#9E4747] rounded-lg px-2 py-1">#{hole.holeNumber} {formatToPar(hole.averageToPar)}</span>)}</div></div>}</article>})}{stats.courses.length === 0 && <p className="text-sm text-[#7E8F77] py-8 text-center lg:col-span-2">Complete a round to build your course history.</p>}</div></section>
    </>}
  </div>;
};
