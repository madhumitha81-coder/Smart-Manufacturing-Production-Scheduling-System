import React from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  Cpu,
  CalendarRange,
  Boxes,
  AlertTriangle,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
  Activity
} from 'lucide-react';

export default function Sidebar({
  currentPage,
  setCurrentPage,
  isCollapsed,
  setIsCollapsed,
  alertCount
}) {
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Production Orders', icon: ClipboardList, badge: '500' },
    { id: 'machines', label: 'Machine Management', icon: Cpu, badge: '10 Online' },
    { id: 'scheduling', label: 'Production Scheduling', icon: CalendarRange, highlight: true },
    { id: 'inventory', label: 'Material Inventory', icon: Boxes },
    { id: 'validation', label: 'Validation & Alerts', icon: AlertTriangle, badge: alertCount > 0 ? alertCount : null, badgeColor: 'bg-rose-500' },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-[#0B1528] text-slate-300 border-r border-slate-800 transition-all duration-300 z-40 flex flex-col justify-between select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Branding Section */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold text-xl">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-white text-base tracking-tight leading-tight flex items-center gap-1.5">
                  YottaFlex
                  <span className="text-[10px] uppercase font-semibold bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30">APS</span>
                </h1>
                <p className="text-[11px] text-slate-400 font-medium">Smart Scheduling System</p>
              </div>
            </div>
          ) : (
            <div className="mx-auto">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
                <Zap className="w-5 h-5" />
              </div>
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition hidden md:block"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="py-4 px-3 space-y-1.5">
          {!isCollapsed && (
            <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Manufacturing Core
            </p>
          )}

          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center rounded-xl transition-all duration-150 group relative ${
                  isCollapsed ? 'justify-center py-3' : 'justify-between px-3 py-2.5'
                } ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 font-medium'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 transition-transform duration-150 ${
                      isActive ? 'text-white scale-110' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  {!isCollapsed && <span className="text-sm tracking-tight">{item.label}</span>}
                </div>

                {!isCollapsed && item.badge && (
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      item.badgeColor
                        ? `${item.badgeColor} text-white animate-pulse`
                        : isActive
                        ? 'bg-blue-500/40 text-white'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Tooltip for collapsed mode */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition whitespace-nowrap z-50 border border-slate-700">
                    {item.label}
                    {item.badge && ` (${item.badge})`}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Status Box */}
      <div className="p-3 border-t border-slate-800/80">
        {!isCollapsed ? (
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                Engine Status
              </span>
              <span className="text-emerald-400 font-semibold text-[11px]">CP-SAT Live</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                PostgreSQL Sync
              </span>
              <span className="text-blue-400 font-semibold text-[11px]">100% Feasible</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-2" title="CP-SAT Solver & PostgreSQL Online">
            <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 animate-pulse" />
          </div>
        )}
      </div>
    </aside>
  );
}

