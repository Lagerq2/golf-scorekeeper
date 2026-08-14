import React, { useState } from 'react';
import { BarChart3, Trophy, Target, Sparkles, TrendingUp, Award, MapPin } from 'lucide-react';
import { Course, GolfRound, Player } from '../types';
import { calculatePlayerSummary, formatToPar } from '../utils/golfStats';

interface AnalyticsViewProps {
  rounds: GolfRound[];
  courses: Course[];
  players: Player[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  rounds,
  courses,
  players
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('all');

  const completedRounds = rounds.filter(r => r.status === 'completed');

  // Compute aggregated stats
  let totalRoundsCount = 0;
  let totalHolesPlayed = 0;
  let totalStrokes = 0;
  let totalPutts = 0;
  let totalFairwaysHit = 0;
  let totalFairwaysPossible = 0;
  let totalGreensHit = 0;
  let totalGreensPossible = 0;

  let totalEagles = 0;
  let totalBirdies = 0;
  let totalPars = 0;
  let totalBogeys = 0;
  let totalDoubles = 0;
  let totalTriplePlus = 0;

  let bestRoundScore = Infinity;
  let bestRoundToPar = Infinity;
  let bestRoundCourse = '';

  const coursePerformance: Record<string, { courseName: string; roundsCount: number; scores: number[]; bestScore: number }> = {};

  completedRounds.forEach(r => {
    const course = courses.find(c => c.id === r.courseId) || courses[0];
    const targetPlayers = selectedPlayerId === 'all'
      ? r.players
      : r.players.filter(p => p.playerId === selectedPlayerId);

    targetPlayers.forEach(p => {
      const summary = calculatePlayerSummary(p, course, r.holesPlayed);
      if (summary.grossTotal > 0) {
        totalRoundsCount++;
        totalHolesPlayed += summary.holesCompleted;
        totalStrokes += summary.grossTotal;
        totalPutts += summary.totalPutts;

        totalFairwaysHit += summary.fairwaysHit;
        totalFairwaysPossible += summary.fairwaysTotal;

        totalGreensHit += summary.greensInRegulation;
        totalGreensPossible += summary.greensTotal;

        totalEagles += summary.eagles;
        totalBirdies += summary.birdies;
        totalPars += summary.pars;
        totalBogeys += summary.bogeys;
        totalDoubles += summary.doubleBogeys;
        totalTriplePlus += summary.triplePlus;

        if (summary.grossTotal < bestRoundScore && summary.holesCompleted === r.holesPlayed) {
          bestRoundScore = summary.grossTotal;
          bestRoundToPar = summary.toParTotal;
          bestRoundCourse = r.courseName;
        }

        if (!coursePerformance[r.courseId]) {
          coursePerformance[r.courseId] = {
            courseName: r.courseName,
            roundsCount: 0,
            scores: [],
            bestScore: Infinity
          };
        }
        coursePerformance[r.courseId].roundsCount++;
        coursePerformance[r.courseId].scores.push(summary.grossTotal);
        if (summary.grossTotal < coursePerformance[r.courseId].bestScore) {
          coursePerformance[r.courseId].bestScore = summary.grossTotal;
        }
      }
    });
  });

  const scoringAvg = totalRoundsCount > 0 ? (totalStrokes / totalRoundsCount).toFixed(1) : '-';
  const puttsPerHole = totalHolesPlayed > 0 ? (totalPutts / totalHolesPlayed).toFixed(2) : '-';
  const firPct = totalFairwaysPossible > 0 ? Math.round((totalFairwaysHit / totalFairwaysPossible) * 100) : 0;
  const girPct = totalGreensPossible > 0 ? Math.round((totalGreensHit / totalGreensPossible) * 100) : 0;

  const totalScoreBadges = totalEagles + totalBirdies + totalPars + totalBogeys + totalDoubles + totalTriplePlus;

  const eaglePct = totalScoreBadges > 0 ? ((totalEagles / totalScoreBadges) * 100).toFixed(1) : '0';
  const birdiePct = totalScoreBadges > 0 ? ((totalBirdies / totalScoreBadges) * 100).toFixed(1) : '0';
  const parPct = totalScoreBadges > 0 ? ((totalPars / totalScoreBadges) * 100).toFixed(1) : '0';
  const bogeyPct = totalScoreBadges > 0 ? ((totalBogeys / totalScoreBadges) * 100).toFixed(1) : '0';
  const doublePct = totalScoreBadges > 0 ? ((totalDoubles / totalScoreBadges) * 100).toFixed(1) : '0';
  const triplePct = totalScoreBadges > 0 ? ((totalTriplePlus / totalScoreBadges) * 100).toFixed(1) : '0';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-xs border border-[#CCD7BE] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#E9EDD9] text-[#2D3A27] border border-[#CCD7BE]">
              <BarChart3 className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#2D3A27] bg-[#E9EDD9] px-2.5 py-0.5 rounded-full border border-[#CCD7BE]">
              Performance Intelligence
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-[#1D2619] mt-2">Golf Analytics & Trends</h1>
          <p className="text-xs sm:text-sm text-[#6C7E64] mt-0.5">
            Aggregated statistics, scoring distribution, and course performance from the database.
          </p>
        </div>

        {/* Player Filter Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#7E8F77] uppercase tracking-wider">Golfer:</span>
          <select
            value={selectedPlayerId}
            onChange={(e) => setSelectedPlayerId(e.target.value)}
            className="text-xs font-bold py-2 px-3 bg-[#F7F9F2] rounded-xl border border-[#CCD7BE] text-[#1D2619] focus:outline-hidden focus:ring-2 focus:ring-[#8EA67B]"
          >
            <option value="all">All Golfers Combined</option>
            {players.map(p => (
              <option key={p.id} value={p.id}>{p.name} (Hcp {p.handicapIndex})</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Scoring Average */}
        <div className="bg-white p-5 rounded-3xl border border-[#CCD7BE] shadow-xs">
          <span className="text-xs font-bold text-[#7E8F77] uppercase tracking-wider block">Scoring Average</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-bold text-[#1D2619] font-mono">{scoringAvg}</span>
            <span className="text-xs text-[#7E8F77] font-semibold">strokes</span>
          </div>
          <span className="text-[11px] text-[#6C7E64] mt-1 block">
            Across {totalRoundsCount} scorecards
          </span>
        </div>

        {/* Best Round */}
        <div className="bg-white p-5 rounded-3xl border border-[#CCD7BE] shadow-xs">
          <span className="text-xs font-bold text-[#7E8F77] uppercase tracking-wider block">Best Round</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-3xl font-bold text-[#2D3A27] font-mono">
              {bestRoundScore !== Infinity ? bestRoundScore : '-'}
            </span>
            {bestRoundToPar !== Infinity && (
              <span className="text-xs font-bold px-1.5 py-0.5 rounded-md bg-[#E9EDD9] text-[#2D3A27]">
                {formatToPar(bestRoundToPar)}
              </span>
            )}
          </div>
          <span className="text-[11px] text-[#6C7E64] truncate block mt-1">
            {bestRoundCourse || 'No completed rounds'}
          </span>
        </div>

        {/* Fairways in Regulation */}
        <div className="bg-white p-5 rounded-3xl border border-[#CCD7BE] shadow-xs">
          <span className="text-xs font-bold text-[#7E8F77] uppercase tracking-wider block">Fairways Hit (FIR)</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-bold text-[#1D2619] font-mono">{firPct}%</span>
          </div>
          <span className="text-[11px] text-[#6C7E64] mt-1 block">
            {totalFairwaysHit} / {totalFairwaysPossible} tee shots
          </span>
        </div>

        {/* Greens in Regulation */}
        <div className="bg-white p-5 rounded-3xl border border-[#CCD7BE] shadow-xs">
          <span className="text-xs font-bold text-[#7E8F77] uppercase tracking-wider block">Greens Hit (GIR)</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-bold text-[#1D2619] font-mono">{girPct}%</span>
          </div>
          <span className="text-[11px] text-[#6C7E64] mt-1 block">
            {totalGreensHit} / {totalGreensPossible} greens
          </span>
        </div>
      </div>

      {/* Scoring Distribution Visualizer */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-[#CCD7BE] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold font-serif text-[#1D2619]">Scoring Distribution Breakdown</h3>
            <p className="text-xs text-[#6C7E64]">Percentage of total holes recorded ({totalScoreBadges} holes played)</p>
          </div>
          <span className="text-xs font-bold text-[#7E8F77] uppercase tracking-wider">
            Putts/Hole: <strong className="text-[#1D2619] font-mono">{puttsPerHole}</strong>
          </span>
        </div>

        {/* Multi-segment distribution progress bar */}
        <div className="w-full h-7 rounded-2xl overflow-hidden flex bg-[#F7F9F2] border border-[#CCD7BE] shadow-inner">
          {totalEagles > 0 && (
            <div
              style={{ width: `${eaglePct}%` }}
              className="bg-[#C2A649] flex items-center justify-center text-[10px] font-bold text-[#1D2619]"
              title={`Eagles: ${totalEagles} (${eaglePct}%)`}
            >
              {parseFloat(eaglePct) >= 5 ? `${eaglePct}%` : ''}
            </div>
          )}
          {totalBirdies > 0 && (
            <div
              style={{ width: `${birdiePct}%` }}
              className="bg-[#9E4747] flex items-center justify-center text-[10px] font-bold text-white"
              title={`Birdies: ${totalBirdies} (${birdiePct}%)`}
            >
              {parseFloat(birdiePct) >= 5 ? `${birdiePct}%` : ''}
            </div>
          )}
          {totalPars > 0 && (
            <div
              style={{ width: `${parPct}%` }}
              className="bg-[#5A6F4E] flex items-center justify-center text-[10px] font-bold text-white"
              title={`Pars: ${totalPars} (${parPct}%)`}
            >
              {parseFloat(parPct) >= 5 ? `${parPct}%` : ''}
            </div>
          )}
          {totalBogeys > 0 && (
            <div
              style={{ width: `${bogeyPct}%` }}
              className="bg-[#3B5360] flex items-center justify-center text-[10px] font-bold text-white"
              title={`Bogeys: ${totalBogeys} (${bogeyPct}%)`}
            >
              {parseFloat(bogeyPct) >= 5 ? `${bogeyPct}%` : ''}
            </div>
          )}
          {totalDoubles > 0 && (
            <div
              style={{ width: `${doublePct}%` }}
              className="bg-[#5C4532] flex items-center justify-center text-[10px] font-bold text-white"
              title={`Double Bogeys: ${totalDoubles} (${doublePct}%)`}
            >
              {parseFloat(doublePct) >= 5 ? `${doublePct}%` : ''}
            </div>
          )}
          {totalTriplePlus > 0 && (
            <div
              style={{ width: `${triplePct}%` }}
              className="bg-[#1D2619] flex items-center justify-center text-[10px] font-bold text-white"
              title={`Triple+ Bogeys: ${totalTriplePlus} (${triplePct}%)`}
            >
              {parseFloat(triplePct) >= 5 ? `${triplePct}%` : ''}
            </div>
          )}
        </div>

        {/* Detailed Breakdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-2">
          <div className="p-3 bg-[#FBF6E2] rounded-2xl border border-[#E6CC7A] text-center">
            <span className="text-[10px] font-bold text-[#1D2619] uppercase block">Eagle/Better</span>
            <span className="text-xl font-bold text-[#1D2619] font-mono">{totalEagles}</span>
            <span className="text-[10px] text-[#7E8F77] block font-medium">{eaglePct}%</span>
          </div>

          <div className="p-3 bg-[#FDF0ED] rounded-2xl border border-[#E5B5AA] text-center">
            <span className="text-[10px] font-bold text-[#9E4747] uppercase block">Birdies</span>
            <span className="text-xl font-bold text-[#9E4747] font-mono">{totalBirdies}</span>
            <span className="text-[10px] text-[#9E4747] block font-medium">{birdiePct}%</span>
          </div>

          <div className="p-3 bg-[#E9EDD9] rounded-2xl border border-[#CCD7BE] text-center">
            <span className="text-[10px] font-bold text-[#2D3A27] uppercase block">Pars</span>
            <span className="text-xl font-bold text-[#2D3A27] font-mono">{totalPars}</span>
            <span className="text-[10px] text-[#6C7E64] block font-medium">{parPct}%</span>
          </div>

          <div className="p-3 bg-[#F0F4F6] rounded-2xl border border-[#CCD7BE] text-center">
            <span className="text-[10px] font-bold text-[#3B5360] uppercase block">Bogeys</span>
            <span className="text-xl font-bold text-[#3B5360] font-mono">{totalBogeys}</span>
            <span className="text-[10px] text-[#3B5360] block font-medium">{bogeyPct}%</span>
          </div>

          <div className="p-3 bg-[#F8F4F0] rounded-2xl border border-[#D5C2B4] text-center">
            <span className="text-[10px] font-bold text-[#5C4532] uppercase block">Double Bogey</span>
            <span className="text-xl font-bold text-[#5C4532] font-mono">{totalDoubles}</span>
            <span className="text-[10px] text-[#5C4532] block font-medium">{doublePct}%</span>
          </div>

          <div className="p-3 bg-[#F7F9F2] rounded-2xl border border-[#CCD7BE] text-center">
            <span className="text-[10px] font-bold text-[#1D2619] uppercase block">Triple+</span>
            <span className="text-xl font-bold text-[#1D2619] font-mono">{totalTriplePlus}</span>
            <span className="text-[10px] text-[#7E8F77] block font-medium">{triplePct}%</span>
          </div>
        </div>
      </div>

      {/* Course Performance Breakdown */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-[#CCD7BE] space-y-4">
        <h3 className="text-base font-bold font-serif text-[#1D2619]">Performance By Golf Course</h3>

        <div className="divide-y divide-[#E9EDD9] border border-[#CCD7BE] rounded-2xl overflow-hidden">
          {Object.keys(coursePerformance).length === 0 ? (
            <div className="p-6 text-center text-xs text-[#7E8F77]">
              No completed course rounds recorded in database yet.
            </div>
          ) : (
            Object.values(coursePerformance).map((cp) => {
              const avgScore = (cp.scores.reduce((a, b) => a + b, 0) / cp.scores.length).toFixed(1);
              return (
                <div key={cp.courseName} className="p-4 flex items-center justify-between hover:bg-[#F7F9F2] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#E9EDD9] text-[#2D3A27] font-bold text-xs border border-[#CCD7BE]">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#1D2619]">{cp.courseName}</h4>
                      <span className="text-[11px] text-[#6C7E64]">{cp.roundsCount} {cp.roundsCount === 1 ? 'Round' : 'Rounds'} played</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 text-right">
                    <div>
                      <span className="text-[10px] text-[#7E8F77] uppercase font-medium block">Average</span>
                      <span className="text-sm font-bold text-[#1D2619] font-mono">{avgScore}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#7E8F77] uppercase font-medium block">Best 18</span>
                      <span className="text-sm font-bold text-[#2D3A27] font-mono">{cp.bestScore}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};

