import React from 'react';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  Cpu,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Layers,
  ChevronRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  productionPerformanceData,
  workcenterUtilizationData
} from '../mockData';

export default function DashboardPage({
  orders,
  machines,
  alerts,
  onNavigate,
  datasetMode
}) {
  const totalOrders = datasetMode === 'full' ? 500 : 25;
  const scheduledOrders = datasetMode === 'full' ? 485 : 24;
  const pendingOrders = totalOrders - scheduledOrders;
  const activeAlerts = alerts.filter(a => !a.resolved);

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0B1528] via-[#10203d] to-[#1e3a66] rounded-2xl p-6 text-white shadow-xl border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-400/30">
              <Zap className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              Advanced Planning & Scheduling Active • Seed 20261022
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Factory Operational Control Center
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl mt-1.5 leading-relaxed">
              Real-time synchronization across 40 flexible job-shop machines, sequence-dependent changeovers, and material inventory constraints.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('scheduling')}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-xs transition shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              Open Interactive Gantt
            </button>
            <button
              onClick={() => onNavigate('validation')}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 font-semibold text-xs transition border border-slate-700 flex items-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Audit Constraints (100% F1)
            </button>
          </div>
        </div>

        {/* Subtle decorative background circle */}
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Orders */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Orders</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">{totalOrders}</span>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>100% Released</span>
            </div>
          </div>
        </div>

        {/* Scheduled Orders */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Scheduled Orders</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">{scheduledOrders}</span>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
              <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded text-[10px]">97.0%</span>
              <span className="text-slate-500 font-normal">on timeline</span>
            </div>
          </div>
        </div>

        {/* Pending / Infeasible Orders */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pending Orders</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">{pendingOrders}</span>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 mt-1">
              <span className="text-amber-600 font-bold">3.0%</span>
              <span>awaiting release</span>
            </div>
          </div>
        </div>

        {/* Machine Fleet Utilization */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Fleet Utilization</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">86.4%</span>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+4.2% vs target</span>
            </div>
          </div>
        </div>

        {/* On-Time Delivery Rate */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">On-Time Delivery</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">95.8%</span>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>OTD compliant</span>
            </div>
          </div>
        </div>

        {/* Total Production Cost */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Operating Cost</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">$382.7k</span>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
              <span className="text-slate-500 font-normal">Makespan: 74.1d</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production Performance Chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Production Performance Trend</h3>
              <p className="text-xs text-slate-500">Planned vs Actual completed units across 7-day cycle</p>
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
              96.2% Avg Efficiency
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={productionPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPlanned" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
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
                <Area type="monotone" dataKey="planned" name="Planned Units" stroke="#94a3b8" fillOpacity={1} fill="url(#colorPlanned)" strokeWidth={2} />
                <Area type="monotone" dataKey="actual" name="Actual Units Dispatched" stroke="#2563eb" fillOpacity={1} fill="url(#colorActual)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Machine Utilization by Workcenter */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Workcenter Capacity Breakdown</h3>
              <p className="text-xs text-slate-500">Productive run-time vs changeover setup vs idle time (%)</p>
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
              Low Idle (&lt;10%)
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workcenterUtilizationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="workcenter" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="productive" name="Productive Run %" fill="#2563eb" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="changeover" name="Changeover Setup %" fill="#f59e0b" stackId="a" />
                <Bar dataKey="idle" name="Idle Capacity %" fill="#e2e8f0" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Lower Row: Recent Orders Table & Recent Alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Production Orders (Span 2) */}
        <div className="xl:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Active Production Orders</h3>
              <p className="text-xs text-slate-500">Live order execution state and due-date compliance</p>
            </div>
            <button
              onClick={() => onNavigate('orders')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View All Orders &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-semibold">Order ID</th>
                  <th className="pb-3 font-semibold">Product</th>
                  <th className="pb-3 font-semibold">Priority</th>
                  <th className="pb-3 font-semibold">Due Date</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.order_id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 font-mono font-bold text-blue-600">{order.order_id}</td>
                    <td className="py-3 font-medium text-slate-800">{order.product}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                        order.priority === 'Urgent'
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : order.priority === 'High'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {order.priority}
                      </span>
                    </td>
                    <td className="py-3 text-slate-600 font-mono text-[11px]">{order.due_date}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                        order.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.status === 'In Production'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          order.status === 'Completed' ? 'bg-emerald-500' : 'bg-blue-500'
                        }`} />
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 w-32">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              order.progress === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                            }`}
                            style={{ width: `${order.progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">{order.progress}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Alerts Feed (Span 1) */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <h3 className="font-bold text-slate-900 text-sm">Active Constraint Alerts</h3>
              </div>
              <span className="text-xs font-semibold bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full">
                {activeAlerts.length} Detected
              </span>
            </div>

            <div className="space-y-3">
              {activeAlerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/60 transition text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      alert.severity === 'critical' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {alert.category}
                    </span>
                    <span className="text-[10px] text-slate-400">{alert.timestamp}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 mt-1">{alert.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{alert.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <button
              onClick={() => onNavigate('validation')}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 shadow-sm"
            >
              Open Audit & Anomaly Engine
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
