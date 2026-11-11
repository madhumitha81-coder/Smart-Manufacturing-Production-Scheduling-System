import React, { useState } from 'react';
import {
  Bell,
  Search,
  Database,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function Header({
  currentPage,
  datasetMode,
  setDatasetMode,
  alerts,
  isCollapsed,
  onOpenAlerts
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const getPageTitle = (page) => {
    switch (page) {
      case 'dashboard':
        return { title: 'Executive Overview', subtitle: 'Factory performance, order progression, and real-time machine telemetry' };
      case 'orders':
        return { title: 'Production Orders Master', subtitle: 'Order dispatching, sequence tracking, and due date scheduling' };
      case 'machines':
        return { title: 'Machine Fleet & Workcenters', subtitle: 'Live capacity utilization, telemetry diagnostics, and preventive maintenance' };
      case 'scheduling':
        return { title: 'Interactive Production Gantt', subtitle: 'Timeline dispatcher with sequence-dependent setup & calendar conflict detection' };
      case 'inventory':
        return { title: 'Material & Inventory Lots', subtitle: 'FIFO lot tracking, safety stock levels, and arrival date reconciliation' };
      case 'validation':
        return { title: 'Constraint Validation & Alerts', subtitle: 'Independent mathematical audit engine with 100% anomaly detection precision' };
      case 'reports':
        return { title: 'Analytics & Compliance Reports', subtitle: 'Makespan duration, OTD delivery rates, and factory operating cost breakdowns' };
      default:
        return { title: 'Control Center', subtitle: 'Smart Manufacturing Production Scheduling System' };
    }
  };

  const { title, subtitle } = getPageTitle(currentPage);
  const activeAlerts = alerts.filter(a => !a.resolved);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 py-3.5 transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Page Title & Subtitle */}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
            <span className="text-xs bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-full border border-slate-200">
              YottaFlex APS
            </span>
          </div>
          <p className="text-xs text-slate-500 font-normal mt-0.5">{subtitle}</p>
        </div>

        {/* Action Controls & Profile */}
        <div className="flex items-center gap-3">
          {/* Shift & Time Pill */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs text-slate-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-800">Shift A (Morning)</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-500 font-mono">06:00 - 14:00 UTC</span>
          </div>

          {/* Dataset Selector */}
          <div className="relative">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setDatasetMode('full')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  datasetMode === 'full'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Database className="w-3 h-3" />
                Full (500 Orders)
              </button>
              <button
                onClick={() => setDatasetMode('starter')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  datasetMode === 'starter'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Starter (25 Orders)
              </button>
            </div>
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition border border-transparent hover:border-slate-200"
              title="Notifications & Alerts"
            >
              <Bell className="w-5 h-5" />
              {activeAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-bounce">
                  {activeAlerts.length}
                </span>
              )}
            </button>

            {/* Notification Popup Modal */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <h4 className="text-sm font-bold text-slate-800">Operational Alerts</h4>
                  </div>
                  <span className="text-[11px] font-semibold bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full">
                    {activeAlerts.length} Active
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {activeAlerts.map((alert) => (
                    <div key={alert.id} className="p-3 hover:bg-slate-50 transition flex gap-3 text-left">
                      <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                        alert.severity === 'critical' ? 'bg-rose-500' : 'bg-amber-500'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-slate-900">{alert.title}</p>
                          <span className="text-[10px] text-slate-400">{alert.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{alert.description}</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {alert.category}
                          </span>
                          <span className="text-[10px] text-blue-600 font-medium">{alert.target}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-4 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      onOpenAlerts();
                    }}
                    className="w-full py-1.5 text-center text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                  >
                    View All Audit Anomalies in Validator &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile Pill */}
          <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold flex items-center justify-center text-xs shadow-md shadow-blue-500/20">
              MK
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-900 leading-tight">Madhumitha K.</p>
              <p className="text-[10px] font-semibold text-blue-600">Lead AI & Forward Deployed Eng</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

