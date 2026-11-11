import React, { useState, useMemo } from 'react';
import {
  ClipboardList,
  Search,
  Filter,
  Plus,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Download,
  Calendar,
  X,
  CheckCircle,
  Clock,
  Sparkles
} from 'lucide-react';

export default function OrdersPage({ orders, setOrders }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [currentPageNum, setCurrentPageNum] = useState(1);
  const itemsPerPage = 6;

  // Add Order Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newOrder, setNewOrder] = useState({
    product: 'SmartFrame Alpha',
    product_family: 'SmartFrame',
    quantity: 300,
    priority: 'High',
    release_date: '2026-11-04',
    due_date: '2026-11-12',
    customer: 'Tesla Austin Facility',
  });
  const [toastMessage, setToastMessage] = useState('');

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        o.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customer.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
      const matchPriority = priorityFilter === 'ALL' || o.priority === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [orders, searchTerm, statusFilter, priorityFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPageNum - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPageNum]);

  // Handle Add Order
  const handleAddOrder = (e) => {
    e.preventDefault();
    const nextIdNum = orders.length + 101;
    const createdOrder = {
      order_id: `ORD-2026-${String(nextIdNum).padStart(6, '0')}`,
      product: newOrder.product,
      product_family: newOrder.product_family,
      quantity: Number(newOrder.quantity),
      priority: newOrder.priority,
      release_date: newOrder.release_date,
      due_date: newOrder.due_date,
      status: 'Scheduled',
      progress: 0,
      customer: newOrder.customer,
      revenue: `$${(newOrder.quantity * 215).toLocaleString()}`
    };

    setOrders([createdOrder, ...orders]);
    setIsModalOpen(false);
    setToastMessage(`Order ${createdOrder.order_id} successfully created and scheduled!`);
    setTimeout(() => setToastMessage(''), 4000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle className="w-5 h-5 text-white" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header with Title and Add Order Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Production Orders Directory</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Showing {filteredOrders.length} manufacturing orders with automated routing & sequence scheduling
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const headers = "Order ID,Product,Family,Quantity,Priority,Release Date,Due Date,Status,Customer\n";
              const rows = filteredOrders.map(o => `${o.order_id},${o.product},${o.product_family},${o.quantity},${o.priority},${o.release_date},${o.due_date},${o.status},${o.customer}`).join("\n");
              const blob = new Blob([headers + rows], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = "production_orders_export.csv";
              a.click();
            }}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Export CSV
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Production Order
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Order ID, Product, or Customer..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPageNum(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPageNum(1);
            }}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="In Production">In Production</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setCurrentPageNum(1);
            }}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Normal">Normal</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Modern Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Order ID</th>
                <th className="py-3.5 px-4">Product Details</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Quantity</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Release & Due Dates</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedOrders.map((order) => (
                <tr key={order.order_id} className="hover:bg-blue-50/40 transition">
                  {/* Order ID */}
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                    {order.order_id}
                  </td>

                  {/* Product Details */}
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-slate-900">{order.product}</p>
                    <span className="text-[10px] text-slate-400 font-medium">Family: {order.product_family}</span>
                  </td>

                  {/* Customer */}
                  <td className="py-3.5 px-4 text-slate-600 font-medium">
                    {order.customer}
                  </td>

                  {/* Quantity */}
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900">{order.quantity.toLocaleString()}</span>
                    <span className="text-slate-400 text-[10px] ml-1">units</span>
                  </td>

                  {/* Priority */}
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                      order.priority === 'Urgent'
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : order.priority === 'High'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : order.priority === 'Normal'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {order.priority}
                    </span>
                  </td>

                  {/* Dates */}
                  <td className="py-3.5 px-4">
                    <div className="text-slate-700 font-mono text-[11px] flex items-center gap-1.5">
                      <span>Rel: {order.release_date}</span>
                    </div>
                    <div className="text-slate-500 font-mono text-[11px] flex items-center gap-1.5 mt-0.5">
                      <span>Due: <strong className="text-slate-800">{order.due_date}</strong></span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold text-[10px] ${
                      order.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : order.status === 'In Production'
                        ? 'bg-blue-100 text-blue-800'
                        : order.status === 'Scheduled'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        order.status === 'Completed' ? 'bg-emerald-500' :
                        order.status === 'In Production' ? 'bg-blue-500' :
                        order.status === 'Scheduled' ? 'bg-purple-500' : 'bg-slate-400'
                      }`} />
                      {order.status}
                    </span>
                  </td>

                  {/* Progress */}
                  <td className="py-3.5 px-4 w-36">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            order.progress === 100
                              ? 'bg-emerald-500'
                              : order.progress > 50
                              ? 'bg-blue-600'
                              : 'bg-purple-500'
                          }`}
                          style={{ width: `${order.progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 w-8">{order.progress}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-900">{((currentPageNum - 1) * itemsPerPage) + 1}</span> to{' '}
            <span className="font-semibold text-slate-900">
              {Math.min(currentPageNum * itemsPerPage, filteredOrders.length)}
            </span> of <span className="font-semibold text-slate-900">{filteredOrders.length}</span> orders
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPageNum(p => Math.max(1, p - 1))}
              disabled={currentPageNum === 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-slate-700">
              Page {currentPageNum} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPageNum(p => Math.min(totalPages, p + 1))}
              disabled={currentPageNum === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add Order Modal (Frontend Only Interaction) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Create Production Order</h3>
                  <p className="text-xs text-slate-500">Configure new manufacturing job and automatic routing</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddOrder} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product Family</label>
                <select
                  value={newOrder.product_family}
                  onChange={(e) => setNewOrder({ ...newOrder, product_family: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium focus:border-blue-500"
                >
                  <option value="SmartFrame">SmartFrame (Precision Metallic Frame)</option>
                  <option value="OpticSensor">OpticSensor (Laser & LiDAR Assembly)</option>
                  <option value="PrecisionAlloy">PrecisionAlloy (Aero Rotor Blades)</option>
                  <option value="PowerModule">PowerModule (Silicon Carbide 400V/800V)</option>
                  <option value="MicroController">MicroController (Automotive ECU Node)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product Variant Name</label>
                <input
                  type="text"
                  required
                  value={newOrder.product}
                  onChange={(e) => setNewOrder({ ...newOrder, product: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:border-blue-500"
                  placeholder="e.g. SmartFrame Gen-4 Titanium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity (Units)</label>
                  <input
                    type="number"
                    min="10"
                    required
                    value={newOrder.quantity}
                    onChange={(e) => setNewOrder({ ...newOrder, quantity: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority Level</label>
                  <select
                    value={newOrder.priority}
                    onChange={(e) => setNewOrder({ ...newOrder, priority: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium focus:border-blue-500"
                  >
                    <option value="Urgent">Urgent (Expedited)</option>
                    <option value="High">High Priority</option>
                    <option value="Normal">Normal Production</option>
                    <option value="Low">Low / Fill-in</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Release Date</label>
                  <input
                    type="date"
                    required
                    value={newOrder.release_date}
                    onChange={(e) => setNewOrder({ ...newOrder, release_date: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={newOrder.due_date}
                    onChange={(e) => setNewOrder({ ...newOrder, due_date: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Customer / Program</label>
                <input
                  type="text"
                  required
                  value={newOrder.customer}
                  onChange={(e) => setNewOrder({ ...newOrder, customer: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:border-blue-500"
                  placeholder="e.g. Lockheed Martin Aero Lab"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md shadow-blue-600/20 transition"
                >
                  Confirm & Schedule Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
