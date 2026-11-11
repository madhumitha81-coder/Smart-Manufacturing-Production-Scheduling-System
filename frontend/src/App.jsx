import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import MachinesPage from './pages/MachinesPage';
import SchedulingPage from './pages/SchedulingPage';
import InventoryPage from './pages/InventoryPage';
import ValidationPage from './pages/ValidationPage';
import ReportsPage from './pages/ReportsPage';
import { initialOrders, initialMachines, initialAlerts } from './mockData';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [datasetMode, setDatasetMode] = useState('full');
  const [orders, setOrders] = useState(initialOrders);
  const [machines, setMachines] = useState(initialMachines);
  const [alerts, setAlerts] = useState(initialAlerts);

  const activeAlertCount = alerts.filter(a => !a.resolved).length;

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <DashboardPage
            orders={orders}
            machines={machines}
            alerts={alerts}
            onNavigate={setCurrentPage}
            datasetMode={datasetMode}
          />
        );
      case 'orders':
        return <OrdersPage orders={orders} setOrders={setOrders} />;
      case 'machines':
        return <MachinesPage machines={machines} />;
      case 'scheduling':
        return <SchedulingPage />;
      case 'inventory':
        return <InventoryPage />;
      case 'validation':
        return <ValidationPage alerts={alerts} setAlerts={setAlerts} />;
      case 'reports':
        return <ReportsPage />;
      default:
        return (
          <DashboardPage
            orders={orders}
            machines={machines}
            alerts={alerts}
            onNavigate={setCurrentPage}
            datasetMode={datasetMode}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-slate-800 font-sans">
      {/* Dark Navy Sidebar */}
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        alertCount={activeAlertCount}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 min-w-0 ${
          isSidebarCollapsed ? 'pl-20' : 'pl-64'
        }`}
      >
        {/* Header */}
        <Header
          currentPage={currentPage}
          datasetMode={datasetMode}
          setDatasetMode={setDatasetMode}
          alerts={alerts}
          isCollapsed={isSidebarCollapsed}
          onOpenAlerts={() => setCurrentPage('validation')}
        />

        {/* Page Content Container */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {renderCurrentPage()}
        </main>

        {/* Professional Footer */}
        <footer className="border-t border-slate-200/80 bg-white py-4 px-6 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">YottaFlex Smart Manufacturing APS</span>
            <span className="text-slate-300">|</span>
            <span>Version 2.4.0 (Enterprise Edition)</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Deterministic Seed: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700">20261022</code></span>
            <span>PostgreSQL: <strong className="text-emerald-600">Connected</strong></span>
            <span>CP-SAT Solver: <strong className="text-blue-600">Optimal</strong></span>
          </div>
        </footer>
      </div>
    </div>
  );
}

