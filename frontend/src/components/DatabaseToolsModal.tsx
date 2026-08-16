import React, { useState } from 'react';
import { Database, Download, Upload, Trash2, CheckCircle, AlertTriangle, X, RefreshCw, HardDrive, FileSpreadsheet } from 'lucide-react';
import { api, DatabaseStatus } from '../services/api';
import { GolfRound } from '../types';

interface DatabaseToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbStatus: DatabaseStatus | null;
  rounds: GolfRound[];
  onRefreshData: () => Promise<void>;
}

export const DatabaseToolsModal: React.FC<DatabaseToolsModalProps> = ({
  isOpen,
  onClose,
  dbStatus,
  rounds,
  onRefreshData
}) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!isOpen) return null;

  const handleExportJson = async () => {
    try {
      setLoading(true);
      const backup = await api.exportBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `golf-score-database-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'Database exported successfully as JSON file.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to export database.' });
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = () => {
    try {
      if (rounds.length === 0) {
        setMessage({ type: 'error', text: 'No rounds available to export.' });
        return;
      }

      // Headers for CSV
      const headers = [
        'Round ID',
        'Date',
        'Course Name',
        'Course Location',
        'Holes Played',
        'Status',
        'Player Name',
        'Handicap',
        'Tee',
        'Total Gross',
        'Total Putts',
        'Fairways Hit',
        'GIR',
        'Penalties',
        'Hole-by-Hole Scores'
      ];

      const rows: string[][] = [];

      rounds.forEach(r => {
        r.players.forEach(p => {
          let gross = 0;
          let putts = 0;
          let fir = 0;
          let gir = 0;
          let penalties = 0;
          const holeScoresArr: string[] = [];

          Object.keys(p.holeScores).sort((a,b) => Number(a)-Number(b)).forEach(hNum => {
            const h = p.holeScores[Number(hNum)];
            if (h && h.strokes > 0) {
              gross += h.strokes;
              putts += (h.putts || 0);
              penalties += (h.penalties || 0);
              if (h.fairwayHit === 'hit') fir++;
              if (h.greenInRegulation) gir++;
              holeScoresArr.push(`H${hNum}:${h.strokes}`);
            }
          });

          rows.push([
            `"${r.id}"`,
            `"${r.date ? r.date.split('T')[0] : ''}"`,
            `"${r.courseName.replace(/"/g, '""')}"`,
            `"${(r.courseLocation || '').replace(/"/g, '""')}"`,
            `${r.holesPlayed}`,
            `"${r.status}"`,
            `"${p.playerName.replace(/"/g, '""')}"`,
            `${p.handicap}`,
            `"${p.teeColor}"`,
            `${gross}`,
            `${putts}`,
            `${fir}`,
            `${gir}`,
            `${penalties}`,
            `"${holeScoresArr.join('; ')}"`
          ]);
        });
      });

      const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `golf-rounds-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'All scorecards exported to CSV file successfully.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to generate CSV export.' });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setLoading(true);
        const json = JSON.parse(evt.target?.result as string);
        await api.restoreBackup(json);
        await onRefreshData();
        setMessage({ type: 'success', text: 'Database successfully restored from JSON file!' });
      } catch (err: any) {
        setMessage({ type: 'error', text: `Failed to restore backup: ${err.message}` });
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleReset = async () => {
    try {
      setLoading(true);
      setShowResetConfirm(false);
      await api.resetDatabase();
      await onRefreshData();
      setMessage({ type: 'success', text: 'Database has been reset with default courses and players.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to reset database.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-[#CCD7BE] animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E9EDD9]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#E9EDD9] text-[#2D3A27] border border-[#CCD7BE]">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif text-[#1D2619]">Database & Backup Vault</h2>
              <p className="text-xs text-[#6C7E64]">Persistent storage management & data exports</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#7E8F77] hover:text-[#2D3A27] p-1.5 rounded-lg hover:bg-[#E9EDD9]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`my-4 p-3.5 rounded-2xl text-xs flex items-center gap-2 border ${
              message.type === 'success'
                ? 'bg-[#E9EDD9] text-[#2D3A27] border-[#CCD7BE]'
                : 'bg-[#FDF0ED] text-[#9E4747] border-[#E8C5BE]'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-[#5A6F4E] shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-[#9E4747] shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* DB Metrics Cards */}
        <div className="grid grid-cols-3 gap-3 my-5">
          <div className="p-3.5 rounded-2xl bg-[#F7F9F2] border border-[#CCD7BE] text-center">
            <span className="text-xs text-[#7E8F77] font-medium block">Total Rounds</span>
            <span className="text-xl font-bold font-mono text-[#1D2619] mt-0.5 block">
              {dbStatus ? dbStatus.totalRounds : rounds.length}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#F7F9F2] border border-[#CCD7BE] text-center">
            <span className="text-xs text-[#7E8F77] font-medium block">Courses</span>
            <span className="text-xl font-bold font-mono text-[#1D2619] mt-0.5 block">
              {dbStatus ? dbStatus.totalCourses : '-'}
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#F7F9F2] border border-[#CCD7BE] text-center">
            <span className="text-xs text-[#7E8F77] font-medium block">Storage Type</span>
            <span className="text-xs font-bold text-[#2D3A27] bg-[#E9EDD9] border border-[#CCD7BE] px-2 py-0.5 rounded-md mt-1 inline-block">
              Persistent DB
            </span>
          </div>
        </div>

        {/* Actions List */}
        <div className="space-y-3">
          
          {/* JSON Export */}
          <div className="p-3.5 rounded-2xl border border-[#CCD7BE] bg-[#FDFEFA] flex items-center justify-between hover:border-[#8EA67B] transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#E9EDD9] text-[#2D3A27]">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#1D2619]">Export Complete Database (JSON)</h4>
                <p className="text-[11px] text-[#6C7E64]">Full backup of all courses, scorecards, and player profiles</p>
              </div>
            </div>
            <button
              id="btn-export-db-json"
              onClick={handleExportJson}
              disabled={loading}
              className="px-3.5 py-2 bg-[#2D3A27] hover:bg-[#1D2619] text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
            >
              Export JSON
            </button>
          </div>

          {/* CSV Export */}
          <div className="p-3.5 rounded-2xl border border-[#CCD7BE] bg-[#FDFEFA] flex items-center justify-between hover:border-[#8EA67B] transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#E9EDD9] text-[#2D3A27]">
                <FileSpreadsheet className="w-4 h-4 text-[#3B5360]" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#1D2619]">Export Scorecards to CSV</h4>
                <p className="text-[11px] text-[#6C7E64]">Excel / Google Sheets compatible spreadsheet data</p>
              </div>
            </div>
            <button
              id="btn-export-rounds-csv"
              onClick={handleExportCsv}
              disabled={loading}
              className="px-3.5 py-2 bg-[#3B5360] hover:bg-[#2A3C46] text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
            >
              Export CSV
            </button>
          </div>

          {/* Restore JSON Backup */}
          <div className="p-3.5 rounded-2xl border border-[#CCD7BE] bg-[#FDFEFA] flex items-center justify-between hover:border-[#8EA67B] transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#E9EDD9] text-[#2D3A27]">
                <Upload className="w-4 h-4 text-[#5A6F4E]" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#1D2619]">Restore Database from JSON</h4>
                <p className="text-[11px] text-[#6C7E64]">Import a previously exported backup file</p>
              </div>
            </div>
            <label className="px-3.5 py-2 bg-[#5A6F4E] hover:bg-[#46573C] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0">
              Select File
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
                disabled={loading}
              />
            </label>
          </div>

          {/* Reset Database */}
          <div className="p-3.5 rounded-2xl border border-[#E8C5BE] bg-[#FDF0ED] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white text-[#9E4747] border border-[#E8C5BE]">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#9E4747]">Reset to Defaults</h4>
                <p className="text-[11px] text-[#9E4747]/80">Reload classic championship courses & initial golfers</p>
              </div>
            </div>
            {showResetConfirm ? (
              <div className="flex items-center gap-1.5">
                <button
                  id="btn-confirm-reset-database"
                  onClick={handleReset}
                  disabled={loading}
                  className="px-3 py-1.5 bg-[#9E4747] hover:bg-[#833838] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  {loading ? 'Resetting...' : 'Yes, Reset All'}
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  disabled={loading}
                  className="px-2.5 py-1.5 bg-white border border-[#E8C5BE] text-[#2D3A27] text-xs font-semibold rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                id="btn-reset-database"
                onClick={() => setShowResetConfirm(true)}
                disabled={loading}
                className="px-3.5 py-2 bg-white border border-[#E8C5BE] hover:bg-[#FCE6E2] text-[#9E4747] text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
              >
                Reset Data
              </button>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-[#E9EDD9] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-[#7E8F77]">
            <HardDrive className="w-3.5 h-3.5" />
            <span>Database synchronized on server & local storage</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#E9EDD9] hover:bg-[#DCE4D0] text-[#2D3A27] text-xs font-bold rounded-xl transition-colors border border-[#CCD7BE]"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
