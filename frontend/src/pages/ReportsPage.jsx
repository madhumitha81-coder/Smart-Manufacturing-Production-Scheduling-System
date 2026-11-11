import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  FileText,
  Database,
  CheckCircle2,
  Calendar,
  DollarSign,
  Cpu,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  productionPerformanceData,
  workcenterUtilizationData,
  onTimeDeliveryData
} from '../mockData';

export default function ReportsPage() {
  const [toastMessage, setToastMessage] = useState('');

  const triggerDownload = (filename, content, type = 'text/plain') => {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setToastMessage(`Generated and downloaded ${filename}!`);
    setTimeout(() => setToastMessage(''), 4000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header and Download Action Buttons */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Manufacturing Analytics & Executive Reports</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational KPIs, makespan performance, workcenter capacity loads, and on-time customer delivery metrics
          </p>
        </div>

        {/* Download Buttons (Frontend Only) */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() =>
              triggerDownload(
                'yottaflex_schedule_export.csv',
                'schedule_id,order_id,operation_id,machine_id,scheduled_start_time,scheduled_end_time,duration_minutes\nSCH-2026-000001,ORD-2026-000101,OP-ORD-2026-000101-01,MACH-001,2026-11-02T06:00:00,2026-11-02T10:30:00,270\nSCH-2026-000002,ORD-2026-000102,OP-ORD-2026-000102-01,MACH-003,2026-11-02T06:00:00,2026-11-02T10:30:00,270\n',
                'text/csv'
              )
            }
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Download Schedule CSV
          </button>

          <button
            onClick={() =>
              triggerDownload(
                'manufacturing_audit_report.txt',
                '=======================================================\nYOTTAFLEX SMART MANUFACTURING APS: EXECUTIVE AUDIT REPORT\nGenerated: 2026-11-11 13:00 UTC\n=======================================================\nTotal Orders: 500\nTotal Operations: 2,000\nFleet: 40 Machines across 7 Workcenters\nMakespan: 1,778.35 hours (74.1 days)\nTotal Operating Cost: $382,705.88\nOn-Time Delivery Rate: 95.8%\nConstraint Audit: 100% Precision, 100% Recall, 100% F1-Score\nBaseline Feasibility: 100% (0 Violations)\n=======================================================\n'
              )
            }
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/20"
          >
            <FileText className="w-4 h-4" />
            Export Executive Report
          </button>
        </div>
      </div>

      {/* KPI Highlights Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Makespan Duration</p>
          <h3 className="text-xl font-bold text-slate-900 mt-1">1,778.4 Hours</h3>
          <span className="text-[11px] text-slate-400">74.1 Manufacturing Days</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Average On-Time Delivery</p>
          <h3 className="text-xl font-bold text-emerald-600 mt-1">95.8% OTD</h3>
          <span className="text-[11px] text-emerald-600 font-semibold">+1.8% vs Annual Target</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Factory Operating Cost</p>
          <h3 className="text-xl font-bold text-slate-900 mt-1">$382,705.88</h3>
          <span className="text-[11px] text-slate-400">Direct Machine & Labor</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Changeover Ratio</p>
          <h3 className="text-xl font-bold text-amber-600 mt-1">1.84% Setup</h3>
          <span className="text-[11px] text-slate-400">Minimized by Family Clustering</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production Throughput Chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Weekly Production Throughput</h3>
              <p className="text-xs text-slate-500">Finished goods output vs engineering targets</p>
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
              Area Trend
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={productionPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorThroughput" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="actual" name="Throughput (Units)" stroke="#2563eb" fillOpacity={1} fill="url(#colorThroughput)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* On-Time Delivery Chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">On-Time Delivery Performance (%)</h3>
              <p className="text-xs text-slate-500">Trailing 6-month historical OTD vs 92% SLA Target</p>
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
              95.8% Current
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={onTimeDeliveryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis domain={[80, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="otd" name="Actual OTD %" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="target" name="Contract SLA Target %" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Machine Utilization Breakdown */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Workcenter Fleet Utilization Analysis</h3>
            <p className="text-xs text-slate-500">Distribution across 7 factory workcenters (Productive vs Changeover vs Idle)</p>
          </div>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={workcenterUtilizationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="workcenter" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="productive" name="Productive Run %" fill="#2563eb" stackId="a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="changeover" name="Changeover Setup %" fill="#f59e0b" stackId="a" />
              <Bar dataKey="idle" name="Idle / Buffer %" fill="#cbd5e1" stackId="a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Order Performance Summary Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Key Program Order Performance Summary</h3>
            <p className="text-xs text-slate-500">Delivery variance, makespan latency, and cycle-time efficiency</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
                <th className="py-3 px-3">Product Family</th>
                <th className="py-3 px-3">Orders Tracked</th>
                <th className="py-3 px-3">Total Units</th>
                <th className="py-3 px-3">Avg Run Duration</th>
                <th className="py-3 px-3">Avg Setup Time</th>
                <th className="py-3 px-3">OTD Compliance</th>
                <th className="py-3 px-3">Operating Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/60 transition">
                <td className="py-3 px-3 font-bold text-slate-900">SmartFrame</td>
                <td className="py-3 px-3">125 Orders</td>
                <td className="py-3 px-3 font-semibold">14,200 Units</td>
                <td className="py-3 px-3 font-mono">351.0 hrs</td>
                <td className="py-3 px-3 font-mono text-amber-600">143.5 hrs</td>
                <td className="py-3 px-3 text-emerald-600 font-bold">96.8%</td>
                <td className="py-3 px-3 font-bold text-slate-900">$118,400</td>
              </tr>
              <tr className="hover:bg-slate-50/60 transition">
                <td className="py-3 px-3 font-bold text-slate-900">OpticSensor</td>
                <td className="py-3 px-3">110 Orders</td>
                <td className="py-3 px-3 font-semibold">18,500 Units</td>
                <td className="py-3 px-3 font-mono">575.3 hrs</td>
                <td className="py-3 px-3 font-mono text-amber-600">116.5 hrs</td>
                <td className="py-3 px-3 text-emerald-600 font-bold">94.5%</td>
                <td className="py-3 px-3 font-bold text-slate-900">$98,250</td>
              </tr>
              <tr className="hover:bg-slate-50/60 transition">
                <td className="py-3 px-3 font-bold text-slate-900">PrecisionAlloy</td>
                <td className="py-3 px-3">95 Orders</td>
                <td className="py-3 px-3 font-semibold">6,800 Units</td>
                <td className="py-3 px-3 font-mono">321.5 hrs</td>
                <td className="py-3 px-3 font-mono text-amber-600">83.2 hrs</td>
                <td className="py-3 px-3 text-emerald-600 font-bold">95.2%</td>
                <td className="py-3 px-3 font-bold text-slate-900">$84,600</td>
              </tr>
              <tr className="hover:bg-slate-50/60 transition">
                <td className="py-3 px-3 font-bold text-slate-900">PowerModule</td>
                <td className="py-3 px-3">105 Orders</td>
                <td className="py-3 px-3 font-semibold">12,400 Units</td>
                <td className="py-3 px-3 font-mono">231.4 hrs</td>
                <td className="py-3 px-3 font-mono text-amber-600">27.0 hrs</td>
                <td className="py-3 px-3 text-emerald-600 font-bold">97.1%</td>
                <td className="py-3 px-3 font-bold text-slate-900">$54,200</td>
              </tr>
              <tr className="hover:bg-slate-50/60 transition">
                <td className="py-3 px-3 font-bold text-slate-900">MicroController</td>
                <td className="py-3 px-3">65 Orders</td>
                <td className="py-3 px-3 font-semibold">32,000 Units</td>
                <td className="py-3 px-3 font-mono">213.1 hrs</td>
                <td className="py-3 px-3 font-mono text-amber-600">0.0 hrs</td>
                <td className="py-3 px-3 text-emerald-600 font-bold">98.4%</td>
                <td className="py-3 px-3 font-bold text-slate-900">$27,255</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

