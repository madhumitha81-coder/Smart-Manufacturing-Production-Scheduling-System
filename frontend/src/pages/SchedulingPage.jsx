import React, { useState } from 'react';
import {
  CalendarRange,
  Layers,
  Sparkles,
  Filter,
  Clock,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Download,
  Info,
  X,
  Play,
  RotateCw
} from 'lucide-react';
import { initialGanttMachines } from '../mockData';

export default function SchedulingPage() {
  const [ganttData, setGanttData] = useState(initialGanttMachines);
  const [workcenterFilter, setWorkcenterFilter] = useState('ALL');
  const [selectedTask, setSelectedTask] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSuccess, setGenerationSuccess] = useState('');
  const [selectedShift, setSelectedShift] = useState('ALL');

  // Timeline hours from 06:00 to 24:00 (18 hours span)
  const timelineHours = [6, 8, 10, 12, 14, 16, 18, 20, 22, 24];

  // Filtered machines
  const filteredMachines = ganttData.filter((m) => {
    return workcenterFilter === 'ALL' || m.workcenter.toLowerCase() === workcenterFilter.toLowerCase();
  });

  // Frontend simulation of Schedule Generation (CP-SAT / Heuristic Solver)
  const handleGenerateSchedule = () => {
    setIsGenerating(true);
    setGenerationSuccess('');

    setTimeout(() => {
      setIsGenerating(false);
      setGenerationSuccess('Google OR-Tools CP-SAT & Forward Simulator completed! 2,000 Operations scheduled with 100% feasibility and 0 conflicts.');
      setTimeout(() => setGenerationSuccess(''), 6000);
    }, 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {generationSuccess && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200 max-w-md">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-xs font-semibold leading-relaxed">{generationSuccess}</span>
        </div>
      )}

      {/* Header and Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarRange className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Interactive Flexible Job-Shop Gantt</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Synchronized timeline depicting operation sequences, sequence-dependent changeovers, and shift calendar windows
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Shift Filter */}
          <select
            value={selectedShift}
            onChange={(e) => setSelectedShift(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Shifts (24 Hours)</option>
            <option value="1">Shift 1 (06:00 - 14:00)</option>
            <option value="2">Shift 2 (14:00 - 22:00)</option>
            <option value="3">Shift 3 (22:00 - 06:00)</option>
          </select>

          {/* Workcenter Filter */}
          <select
            value={workcenterFilter}
            onChange={(e) => setWorkcenterFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Workcenters</option>
            <option value="CNC">CNC Machining</option>
            <option value="Cutting">Cutting Bay</option>
            <option value="Thermal">Thermal Cell</option>
            <option value="Assembly">Cleanroom Assembly</option>
            <option value="Quality">Quality Lab</option>
          </select>

          {/* Generate Schedule Button */}
          <button
            onClick={handleGenerateSchedule}
            disabled={isGenerating}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition shadow-md shadow-blue-600/20 flex items-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Solving CP-SAT (15s)...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Schedule</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Color Legend Bar */}
      <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="font-bold text-slate-700 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-slate-400" />
          Schedule Color Taxonomy:
        </span>

        <div className="flex flex-wrap items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-blue-600" />
            <span className="text-slate-600 font-medium">SmartFrame (Alloy)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-cyan-600" />
            <span className="text-slate-600 font-medium">OpticSensor (Glass/LiDAR)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-indigo-600" />
            <span className="text-slate-600 font-medium">PrecisionAlloy (Rotors)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-purple-600" />
            <span className="text-slate-600 font-medium">PowerModule (SiC)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-amber-500 ring-2 ring-amber-300" />
            <span className="text-amber-800 font-bold">Changeover Setup (30-45m)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-rose-500" />
            <span className="text-rose-700 font-bold">Scheduled Maintenance</span>
          </div>
        </div>
      </div>

      {/* Gantt Chart Board */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Horizontal Timeline Scale Header */}
        <div className="border-b border-slate-200/80 bg-slate-50/90 flex items-center">
          {/* Left Machine Column Label */}
          <div className="w-56 shrink-0 p-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider border-r border-slate-200">
            Machine Fleet
          </div>

          {/* Time markers across 06:00 to 24:00 */}
          <div className="flex-1 flex text-[11px] font-mono text-slate-500 font-semibold py-3 px-2">
            {timelineHours.map((hour, idx) => (
              <div key={hour} className="flex-1 text-center border-l border-slate-200/60 first:border-l-0">
                {String(hour).padStart(2, '0')}:00
              </div>
            ))}
          </div>
        </div>

        {/* Machine Rows */}
        <div className="divide-y divide-slate-100">
          {filteredMachines.map((m) => (
            <div key={m.machine_id} className="flex items-center hover:bg-slate-50/40 transition">
              {/* Machine Info Left Column */}
              <div className="w-56 shrink-0 p-3.5 border-r border-slate-200/80 bg-white">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                    {m.machine_id}
                  </span>
                  <span className="text-xs font-bold text-slate-800 truncate">{m.name}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                  <span>{m.workcenter}</span>
                  <span className="text-emerald-600 font-semibold">{m.tasks.length} Operations</span>
                </div>
              </div>

              {/* Horizontal Timeline Track */}
              <div className="flex-1 relative h-16 bg-slate-50/30 overflow-hidden flex items-center px-1">
                {/* Background hour grid vertical lines */}
                {timelineHours.map((hour) => (
                  <div
                    key={hour}
                    className="absolute top-0 bottom-0 border-r border-slate-100/90 pointer-events-none"
                    style={{ left: `${((hour - 6) / 18) * 100}%` }}
                  />
                ))}

                {/* Operation & Setup Blocks */}
                {m.tasks.map((task) => {
                  // Position calculations: span 6 to 24 (18 hours)
                  const leftPct = Math.max(0, ((task.start - 6) / 18) * 100);
                  const widthPct = Math.min(100 - leftPct, ((task.end - task.start) / 18) * 100);

                  return (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTask({ ...task, machineName: m.name, machineId: m.machine_id })}
                      className={`absolute h-10 rounded-lg p-2 text-white shadow-xs transition-all duration-150 hover:scale-[1.01] hover:shadow-md cursor-pointer flex flex-col justify-center overflow-hidden z-10 ${task.color} ${
                        task.type === 'changeover' ? 'border-2 border-amber-300' : ''
                      }`}
                      style={{
                        left: `${leftPct}%`,
                        width: `${widthPct}%`
                      }}
                      title={`${task.label} (${task.start}:00 - ${task.end}:00)`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold leading-tight truncate">
                        <span>{task.order || task.type?.toUpperCase()}</span>
                        <span className="text-[9px] opacity-80">{task.end - task.start}h</span>
                      </div>
                      <span className="text-[9px] opacity-90 truncate font-medium">
                        {task.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task Inspection Drawer / Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${selectedTask.color}`} />
                <h3 className="font-bold text-slate-900 text-sm">{selectedTask.label}</h3>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Target Machine</span>
                  <span className="font-bold text-slate-800">{selectedTask.machineId} ({selectedTask.machineName})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Scheduled Time</span>
                  <span className="font-mono font-bold text-blue-600">
                    {String(Math.floor(selectedTask.start)).padStart(2, '0')}:00 - {String(Math.floor(selectedTask.end)).padStart(2, '0')}:00 UTC
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Duration</span>
                  <span className="font-semibold text-slate-800">
                    {Math.round((selectedTask.end - selectedTask.start) * 60)} minutes
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Product Family</span>
                  <span className="font-semibold text-slate-800">{selectedTask.family}</span>
                </div>
              </div>

              {selectedTask.type === 'changeover' ? (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                  <h4 className="font-bold text-xs mb-1 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-amber-700" />
                    Sequence-Dependent Changeover Rule
                  </h4>
                  <p className="text-[11px] leading-relaxed text-amber-800">
                    Mandatory mechanical tooling recalibration, sterile cleanroom purge, and nozzle adjustments between different material families.
                  </p>
                </div>
              ) : selectedTask.type === 'maintenance' ? (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-900">
                  <h4 className="font-bold text-xs mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
                    Preventive Maintenance Window
                  </h4>
                  <p className="text-[11px] leading-relaxed text-rose-800">
                    Shift calendar restriction: Machine is unavailable for production jobs during periodic sensor calibration.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-blue-900">
                  <h4 className="font-bold text-xs mb-1">Precedence & Material Traceability</h4>
                  <p className="text-[11px] text-blue-800">
                    Order <strong>{selectedTask.order}</strong> verified against preceding step completion and FIFO lot allocation.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
