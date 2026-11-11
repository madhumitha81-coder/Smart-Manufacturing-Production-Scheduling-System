import React, { useState, useMemo } from 'react';
import {
  Cpu,
  Activity,
  Wrench,
  AlertCircle,
  CheckCircle2,
  Filter,
  Search,
  Zap,
  Clock,
  Gauge,
  Sliders,
  X
} from 'lucide-react';

export default function MachinesPage({ machines }) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [workcenterFilter, setWorkcenterFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMachine, setSelectedMachine] = useState(null);

  // Filtered machines
  const filteredMachines = useMemo(() => {
    return machines.filter((m) => {
      const matchSearch =
        m.machine_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.machine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.workcenter.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || m.status === statusFilter;
      const matchWorkcenter = workcenterFilter === 'ALL' || m.workcenter === workcenterFilter;
      return matchSearch && matchStatus && matchWorkcenter;
    });
  }, [machines, searchTerm, statusFilter, workcenterFilter]);

  // Status counts
  const counts = useMemo(() => {
    return {
      total: machines.length,
      running: machines.filter(m => m.status === 'running').length,
      available: machines.filter(m => m.status === 'available').length,
      maintenance: machines.filter(m => m.status === 'maintenance').length,
      unavailable: machines.filter(m => m.status === 'unavailable').length,
    };
  }, [machines]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'running':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            RUNNING
          </span>
        );
      case 'available':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            STANDBY READY
          </span>
        );
      case 'maintenance':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Wrench className="w-3 h-3 text-amber-600 animate-spin" />
            MAINTENANCE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            UNAVAILABLE
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Fleet Summary Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Fleet Deployed</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{counts.total} Machines</h3>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600">
            <Cpu className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Active In Cycle</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{counts.running} Running</h3>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Standby Available</p>
            <h3 className="text-2xl font-bold text-blue-600 mt-1">{counts.available} Ready</h3>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Preventive PM</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">{counts.maintenance} Under PM</h3>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
            <Wrench className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Machine ID or Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="running">Running</option>
            <option value="available">Available (Standby)</option>
            <option value="maintenance">Under Maintenance</option>
            <option value="unavailable">Unavailable</option>
          </select>

          {/* Workcenter Filter */}
          <select
            value={workcenterFilter}
            onChange={(e) => setWorkcenterFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Workcenters</option>
            <option value="CNC_MACHINING">CNC Machining</option>
            <option value="CUTTING_BAY">Cutting Bay</option>
            <option value="DRILL_PRESS">Drill Press</option>
            <option value="THERMAL_CELL">Thermal Cell</option>
            <option value="SURFACE_FINISH">Surface Finish</option>
            <option value="ASSEMBLY_LINE">Assembly Line</option>
            <option value="QUALITY_LAB">Quality Lab</option>
          </select>
        </div>
      </div>

      {/* Machine Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMachines.map((m) => (
          <div
            key={m.machine_id}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    {m.machine_id}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm mt-1">{m.machine_name}</h3>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    {m.workcenter.replace('_', ' ')}
                  </span>
                </div>
                <div>{getStatusBadge(m.status)}</div>
              </div>

              {/* Real-time Operation & Rate */}
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Assigned Operation</span>
                  <span className="font-mono font-bold text-slate-800 text-[11px] truncate max-w-[180px]">
                    {m.current_job}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Standard Operating Cost</span>
                  <span className="font-semibold text-slate-700">{m.hourly_rate}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Scheduled Capacity</span>
                  <span className="font-medium text-slate-700">{m.capacity}</span>
                </div>
              </div>

              {/* Progress Utilization Bar */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-blue-600" />
                    Capacity Utilization
                  </span>
                  <span className="font-bold font-mono text-slate-900">{m.utilization}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      m.utilization >= 90
                        ? 'bg-rose-500'
                        : m.utilization >= 75
                        ? 'bg-blue-600'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${m.utilization}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                  <span>OEE Benchmark: <strong>{m.oee}%</strong></span>
                  <span>Target: 85%</span>
                </div>
              </div>

              {/* Downtime & Maintenance Box */}
              <div className="mt-4 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5 font-semibold text-slate-700 mb-0.5">
                  <Clock className="w-3 h-3 text-slate-400" />
                  Health & Downtime Advisory
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">{m.downtime_info}</p>
              </div>
            </div>

            {/* Inspect Button */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedMachine(m)}
                className="w-full py-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Gauge className="w-3.5 h-3.5" />
                Inspect Machine Telemetry
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Machine Telemetry Modal */}
      {selectedMachine && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs font-bold text-blue-600">{selectedMachine.machine_id}</span>
                <h3 className="text-base font-bold text-slate-900">{selectedMachine.machine_name}</h3>
              </div>
              <button
                onClick={() => setSelectedMachine(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Workcenter</span>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedMachine.workcenter}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Standard Cost</span>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedMachine.hourly_rate}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Live OEE Metric</span>
                  <p className="text-xs font-bold text-emerald-600 mt-0.5">{selectedMachine.oee}% Overall Equipment</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Current Utilization</span>
                  <p className="text-xs font-bold text-blue-600 mt-0.5">{selectedMachine.utilization}% Loaded</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100">
                <h4 className="text-xs font-bold text-blue-900 mb-1">Diagnostic Log & Telemetry Summary</h4>
                <p className="text-xs text-blue-800 leading-relaxed">{selectedMachine.downtime_info}</p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedMachine(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
              >
                Close Diagnostic View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

