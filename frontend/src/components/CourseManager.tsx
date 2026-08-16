import React, { useState } from 'react';
import { Course, HoleInfo, TeeColor } from '../types';
import { getAvailableTees, getHoleDistanceMeters, normalizeCourseDistances, setHoleDistanceMeters, teeLabel, TEE_OPTIONS } from '../utils/teeDistances';
import { MapPin, Plus, Trash2, ChevronDown, ChevronUp, Flag, X, Check, Edit2 } from 'lucide-react';

interface CourseManagerProps {
  courses: Course[];
  onCreateCourse: (course: Partial<Course>) => Promise<void>;
  onUpdateCourse: (id: string, course: Partial<Course>) => Promise<void>;
  onDeleteCourse: (id: string) => Promise<void>;
  onStartRoundWithCourse: (courseId: string) => void;
}

export const CourseManager: React.FC<CourseManagerProps> = ({
  courses,
  onCreateCourse,
  onUpdateCourse,
  onDeleteCourse,
  onStartRoundWithCourse
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(courses[0]?.id || null);
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);
  const [isDeletingCourse, setIsDeletingCourse] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  // New Course Form State
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [holesCount, setHolesCount] = useState<9 | 18>(18);
  const [rating, setRating] = useState<number>(72.0);
  const [slope, setSlope] = useState<number>(125);
  const [selectedTee, setSelectedTee] = useState<TeeColor>('white');
  const [holes, setHoles] = useState<HoleInfo[]>(() => generateDefaultHoles(18));
  const [loading, setLoading] = useState(false);

  function generateDefaultHoles(count: 9 | 18): HoleInfo[] {
    const defaultPars = [4, 5, 4, 3, 4, 3, 4, 5, 4, 4, 4, 3, 5, 4, 5, 3, 4, 4];

    return Array.from({ length: count }, (_, i) => ({
      holeNumber: i + 1,
      par: defaultPars[i] || 4,
      handicapIndex: i + 1,
      tees: [],
      meters: {},
      notes: ''
    }));
  }

  const handleHolesCountChange = (count: 9 | 18) => {
    setHolesCount(count);
    setHoles(generateDefaultHoles(count));
  };

  const handleUpdateHole = (index: number, updates: Partial<HoleInfo>) => {
    setHoles(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  const openCreate = () => {
    setEditingCourseId(null);
    setName('');
    setLocation('');
    setHolesCount(18);
    setRating(72);
    setSlope(125);
    setSelectedTee('white');
    setHoles(generateDefaultHoles(18));
    setIsCreateModalOpen(true);
  };

  const openEdit = (course: Course) => {
    const normalized = normalizeCourseDistances(course);
    const available = getAvailableTees(normalized);
    setEditingCourseId(course.id);
    setName(course.name);
    setLocation(course.location || '');
    setHolesCount(course.holesCount);
    setRating(course.rating || 72);
    setSlope(course.slope || 113);
    setSelectedTee((available[0] as TeeColor) || 'white');
    setHoles(normalized.holes);
    setIsCreateModalOpen(true);
  };

  const handleCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a course name');
      return;
    }

    try {
      setLoading(true);
      const courseData: Partial<Course> = {
        name: name.trim(),
        location: location.trim(),
        holesCount,
        holes,
        parTotal: holes.reduce((sum, h) => sum + Number(h.par), 0),
        rating: Number(rating) || 72,
        slope: Number(slope) || 113
      };
      if (editingCourseId) await onUpdateCourse(editingCourseId, courseData);
      else await onCreateCourse(courseData);

      setIsCreateModalOpen(false);
      setName('');
      setLocation('');
      setHoles(generateDefaultHoles(18));
    } catch (err: any) {
      alert(`Failed to save course: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-xs border border-[#CCD7BE] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#E9EDD9] text-[#2D3A27] border border-[#CCD7BE]">
              <MapPin className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#2D3A27] bg-[#E9EDD9] px-2.5 py-0.5 rounded-full border border-[#CCD7BE]">
              Course Library ({courses.length})
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-[#1D2619] mt-2">Golf Courses & Layouts</h1>
          <p className="text-xs sm:text-sm text-[#6C7E64] mt-0.5">
            Manage course distances, par configurations, handicap hole ratings, and custom clubs.
          </p>
        </div>

        <button
          id="btn-open-create-course-modal"
          onClick={openCreate}
          className="px-4 py-2.5 rounded-xl bg-[#2D3A27] hover:bg-[#1D2619] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add New Course</span>
        </button>
      </div>

      {/* Course List */}
      <div className="space-y-4">
        {courses.map((course) => {
          const isExpanded = expandedCourseId === course.id;
          const parTotal = course.parTotal || course.holes.reduce((s, h) => s + h.par, 0);
          const availableTees = getAvailableTees(course);

          return (
            <div
              key={course.id}
              className="bg-white rounded-3xl shadow-xs border border-[#CCD7BE] overflow-hidden transition-all"
            >
              {/* Course Main Card Row */}
              <div className="p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#2D3A27] text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-xs">
                    <Flag className="w-6 h-6 fill-current text-[#8EA67B]" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold font-serif text-[#1D2619] leading-tight">{course.name}</h3>
                      {course.isCustom && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FBF6E2] text-[#1D2619] border border-[#E6CC7A]">
                          Custom
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6C7E64] flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-[#7E8F77]" />
                      <span>{course.location || 'Championship Golf Club'}</span>
                    </p>
                    <p className="text-xs font-semibold text-[#5A6F4E] mt-1">
                      Tees: {availableTees.length ? availableTees.map(teeLabel).join(', ') : 'No distances registered'}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-semibold text-[#6C7E64]">
                      <span className="bg-[#F7F9F2] border border-[#CCD7BE] px-2 py-0.5 rounded-md text-[#2D3A27]">Par {parTotal}</span>
                      <span className="bg-[#F7F9F2] border border-[#CCD7BE] px-2 py-0.5 rounded-md text-[#2D3A27]">{course.holesCount} Holes</span>
                      {course.rating && <span className="bg-[#F7F9F2] border border-[#CCD7BE] px-2 py-0.5 rounded-md text-[#2D3A27]">Rating: {course.rating}</span>}
                      {course.slope && <span className="bg-[#F7F9F2] border border-[#CCD7BE] px-2 py-0.5 rounded-md text-[#2D3A27]">Slope: {course.slope}</span>}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(course)}
                    className="p-2 rounded-xl bg-[#F7F9F2] hover:bg-[#E9EDD9] text-[#2D3A27] border border-[#CCD7BE] transition-colors"
                    title="Edit Course"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onStartRoundWithCourse(course.id)}
                    className="px-4 py-2 bg-[#2D3A27] hover:bg-[#1D2619] text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95"
                  >
                    Play This Course
                  </button>

                  <button
                    onClick={() => setExpandedCourseId(isExpanded ? null : course.id)}
                    className="p-2 rounded-xl bg-[#E9EDD9] hover:bg-[#DCE4D0] text-[#2D3A27] text-xs font-semibold flex items-center gap-1 transition-colors border border-[#CCD7BE]"
                  >
                    <span>{isExpanded ? 'Hide Layout' : 'View Holes'}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {deletingCourseId === course.id ? (
                    <div className="flex items-center gap-1.5 bg-[#FDF0ED] p-1 rounded-xl border border-[#E5B5AA]">
                      <span className="text-[11px] font-bold text-[#9E4747] px-1">Delete?</span>
                      <button
                        disabled={isDeletingCourse}
                        onClick={async () => {
                          try {
                            setIsDeletingCourse(true);
                            await onDeleteCourse(course.id);
                            setDeletingCourseId(null);
                          } finally {
                            setIsDeletingCourse(false);
                          }
                        }}
                        className="px-2 py-1 rounded-lg bg-[#9E4747] hover:bg-[#833838] text-white font-bold text-xs shadow-xs transition-colors"
                      >
                        {isDeletingCourse ? '...' : 'Yes'}
                      </button>
                      <button
                        disabled={isDeletingCourse}
                        onClick={() => setDeletingCourseId(null)}
                        className="px-1.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-[#2D3A27] font-semibold text-xs border border-[#CCD7BE] transition-colors"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeletingCourseId(course.id)}
                      className="p-2 text-[#7E8F77] hover:text-[#9E4747] hover:bg-[#FDF0ED] rounded-xl transition-colors"
                      title="Delete Course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded Hole-by-Hole Details */}
              {isExpanded && (
                <div className="border-t border-[#E9EDD9] bg-[#F7F9F2] p-4 sm:p-6 overflow-x-auto">
                  <h4 className="text-xs font-bold text-[#6C7E64] uppercase tracking-wider mb-3">
                    Course Hole Matrix & Handicap Ratings
                  </h4>
                  <table className="w-full text-center border-collapse text-xs bg-white rounded-xl shadow-xs border border-[#CCD7BE]">
                    <thead>
                      <tr className="bg-[#2D3A27] text-white text-[11px] font-bold">
                        <th className="p-2 text-left pl-3">Hole</th>
                        {course.holes.map(h => (
                          <th key={h.holeNumber} className="p-2 border-l border-[#3E4F37]">{h.holeNumber}</th>
                        ))}
                      </tr>
                      <tr className="bg-[#E9EDD9] text-[#2D3A27] font-bold border-b border-[#CCD7BE]">
                        <td className="p-2 text-left pl-3 font-bold">Par</td>
                        {course.holes.map(h => (
                          <td key={h.holeNumber} className="p-2 border-l border-[#CCD7BE]">{h.par}</td>
                        ))}
                      </tr>
                      <tr className="bg-[#F7F9F2] text-[#7E8F77] font-semibold border-b border-[#CCD7BE] text-[10px]">
                        <td className="p-1.5 text-left pl-3">Handicap Index</td>
                        {course.holes.map(h => (
                          <td key={h.holeNumber} className="p-1.5 border-l border-[#CCD7BE]">{h.handicapIndex}</td>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#CCD7BE] text-[11px] font-mono">
                      {availableTees.map(tee => (
                        <tr key={tee} className="text-[#2D3A27]">
                          <td className="p-1.5 text-left pl-3 font-bold font-sans">{teeLabel(tee)}</td>
                          {course.holes.map(h => (
                            <td key={h.holeNumber} className="p-1.5 border-l border-[#CCD7BE]">{getHoleDistanceMeters(h, tee) || '-'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create Course Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-7 shadow-2xl border border-[#CCD7BE] animate-in fade-in my-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E9EDD9]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#2D3A27] flex items-center justify-center text-white shadow-xs">
                  <Flag className="w-6 h-6 fill-current text-[#8EA67B]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-serif text-[#1D2619]">{editingCourseId ? 'Edit Golf Course' : 'Create Custom Golf Course'}</h2>
                  <p className="text-xs text-[#6C7E64]">Configure pars, distances, and hole handicap ratings</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-[#7E8F77] hover:text-[#2D3A27] rounded-lg hover:bg-[#E9EDD9]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCourseSubmit} className="mt-5 space-y-5">
              
              {/* Course Meta Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#6C7E64] uppercase tracking-wider block mb-1">
                    Course Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Whispering Pines Golf Club"
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-[#CCD7BE] bg-[#FDFEFA] focus:outline-hidden focus:ring-2 focus:ring-[#8EA67B]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#6C7E64] uppercase tracking-wider block mb-1">
                    City / Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Austin, Texas"
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-[#CCD7BE] bg-[#FDFEFA] focus:outline-hidden focus:ring-2 focus:ring-[#8EA67B]"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-[#CCD7BE] bg-[#E9EDD9] p-4">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#2D3A27] uppercase tracking-wider block mb-1">
                      Distance Tee
                    </label>
                    <p className="text-xs text-[#6C7E64]">Choose the tee whose hole distances you are editing.</p>
                  </div>
                  <select
                    value={selectedTee}
                    onChange={(e) => setSelectedTee(e.target.value as TeeColor)}
                    className="min-w-40 text-sm font-bold px-3 py-2 rounded-xl border border-[#8EA67B] bg-white text-[#1D2619] focus:outline-hidden focus:ring-2 focus:ring-[#8EA67B]"
                  >
                    {TEE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label} Tee</option>)}
                  </select>
                </div>
                <p className="mt-2 text-xs font-bold text-[#2D3A27]">Currently editing: {teeLabel(selectedTee)} Tee</p>
              </div>

              {/* Number of Holes, Rating, Slope */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#6C7E64] uppercase tracking-wider block mb-1">
                    Holes Count
                  </label>
                  <div className="grid grid-cols-2 gap-1 p-1 bg-[#F7F9F2] rounded-xl border border-[#CCD7BE]">
                    <button
                      type="button"
                      onClick={() => handleHolesCountChange(18)}
                      className={`py-1.5 rounded-lg text-xs font-bold ${
                        holesCount === 18 ? 'bg-[#2D3A27] text-white shadow-xs' : 'text-[#6C7E64] hover:text-[#2D3A27]'
                      }`}
                    >
                      18 Holes
                    </button>
                    <button
                      type="button"
                      onClick={() => handleHolesCountChange(9)}
                      className={`py-1.5 rounded-lg text-xs font-bold ${
                        holesCount === 9 ? 'bg-[#2D3A27] text-white shadow-xs' : 'text-[#6C7E64] hover:text-[#2D3A27]'
                      }`}
                    >
                      9 Holes
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#6C7E64] uppercase tracking-wider block mb-1">
                    Course Rating
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={rating}
                    onChange={(e) => setRating(parseFloat(e.target.value) || 72.0)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-[#CCD7BE] bg-[#FDFEFA] focus:outline-hidden focus:ring-2 focus:ring-[#8EA67B] font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#6C7E64] uppercase tracking-wider block mb-1">
                    Slope Rating
                  </label>
                  <input
                    type="number"
                    value={slope}
                    onChange={(e) => setSlope(parseInt(e.target.value, 10) || 113)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-[#CCD7BE] bg-[#FDFEFA] focus:outline-hidden focus:ring-2 focus:ring-[#8EA67B] font-mono"
                  />
                </div>
              </div>

              {/* Hole-by-Hole Grid Editor */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#6C7E64] uppercase tracking-wider">
                    Hole Matrix (Total Par: {holes.reduce((sum, h) => sum + Number(h.par || 4), 0)})
                  </label>
                </div>

                <div className="max-h-72 overflow-y-auto border border-[#CCD7BE] rounded-2xl p-2 bg-[#F7F9F2]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {holes.map((hole, idx) => (
                      <div key={hole.holeNumber} className="bg-white p-3 rounded-xl border border-[#CCD7BE] shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#1D2619] bg-[#E9EDD9] px-2 py-0.5 rounded-md border border-[#CCD7BE]">
                            Hole {hole.holeNumber}
                          </span>
                          
                          {/* Par selector */}
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-[#7E8F77] font-bold uppercase">Par:</span>
                            <select
                              value={hole.par}
                              onChange={(e) => handleUpdateHole(idx, { par: parseInt(e.target.value, 10) })}
                              className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#E9EDD9] text-[#2D3A27] border border-[#CCD7BE]"
                            >
                              <option value={3}>3</option>
                              <option value={4}>4</option>
                              <option value={5}>5</option>
                              <option value={6}>6</option>
                            </select>
                          </div>
                        </div>

                        {/* Distance inputs */}
                        <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                          <div>
                            <span className="text-[#7E8F77] block font-medium">{teeLabel(selectedTee)} Tee Distance (m):</span>
                            <input
                              type="number"
                              min="1"
                              value={getHoleDistanceMeters(hole, selectedTee) || ''}
                              placeholder="Enter meters"
                              onChange={(e) => setHoles(prev => prev.map((item, holeIndex) =>
                                holeIndex === idx ? setHoleDistanceMeters(item, selectedTee, parseInt(e.target.value, 10) || 0) : item
                              ))}
                              className="w-full px-1.5 py-1 text-xs rounded-md border border-[#CCD7BE] font-mono bg-[#FDFEFA]"
                            />
                          </div>

                          <div>
                            <span className="text-[#7E8F77] block font-medium">Handicap Index:</span>
                            <input
                              type="number"
                              min="1"
                              max="18"
                              value={hole.handicapIndex}
                              onChange={(e) => handleUpdateHole(idx, { handicapIndex: parseInt(e.target.value, 10) || 1 })}
                              className="w-full px-1.5 py-1 text-xs rounded-md border border-[#CCD7BE] font-mono bg-[#FDFEFA]"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit Footer */}
              <div className="pt-4 border-t border-[#E9EDD9] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#CCD7BE] text-[#6C7E64] hover:bg-[#E9EDD9] text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>

                <button
                  id="btn-save-custom-course"
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-2.5 rounded-xl bg-[#2D3A27] hover:bg-[#1D2619] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{loading ? 'Saving Course...' : editingCourseId ? 'Update Course' : 'Save Course to Database'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
