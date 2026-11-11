import React, { useState } from 'react';
import {
  Boxes,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Package,
  Calendar,
  Send,
  ArrowDownCircle,
  Truck,
  Plus
} from 'lucide-react';
import { initialMaterials } from '../mockData';

export default function InventoryPage() {
  const [materials, setMaterials] = useState(initialMaterials);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [toastMessage, setToastMessage] = useState('');

  // Low stock materials
  const lowStockMaterials = materials.filter(m => m.status === 'low_stock' || m.status === 'critical');

  // Filtered materials
  const filteredMaterials = materials.filter((m) => {
    const matchSearch =
      m.material_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.material_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = categoryFilter === 'ALL' || m.category === categoryFilter;
    const matchStatus = statusFilter === 'ALL' || m.status === statusFilter;
    return matchSearch && matchCategory && matchStatus;
  });

  const handleRestockRequest = (matId, matName) => {
    setToastMessage(`Automated purchase requisition dispatched for ${matName} (${matId})!`);
    setTimeout(() => setToastMessage(''), 4000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <Truck className="w-5 h-5 text-white" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Low-Stock Warning Alert Banner */}
      {lowStockMaterials.length > 0 && (
        <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-900">
                  Material Bottleneck Warning: {lowStockMaterials.length} Items Below Safety Stock Threshold
                </h3>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  Operations scheduled in Week 2 require immediate procurement release for Silicon Carbide Substrates and Copper Busbars to prevent factory starvation.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {lowStockMaterials.map(m => (
                    <span
                      key={m.material_id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-amber-200 text-amber-900 shadow-xs"
                    >
                      <span className="font-mono">{m.material_id}</span>
                      <span>({m.material_name.split(' ')[0]})</span>
                      <strong className="text-rose-600">{m.available_qty} / {m.required_qty} {m.unit}</strong>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setToastMessage('Batch replenishment PO sent to all primary suppliers!');
                setTimeout(() => setToastMessage(''), 4000);
              }}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl transition shrink-0 cursor-pointer shadow-sm"
            >
              Request All Restocks
            </button>
          </div>
        </div>
      )}

      {/* Header and Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Materials</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{materials.length} SKUs</h3>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">In Safe Stock</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">
              {materials.filter(m => m.status === 'in_stock').length} SKUs
            </h3>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Low Stock Alerts</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">
              {materials.filter(m => m.status === 'low_stock').length} SKUs
            </h3>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Critical Shortages</p>
            <h3 className="text-2xl font-bold text-rose-600 mt-1">
              {materials.filter(m => m.status === 'critical').length} SKUs
            </h3>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
            <ArrowDownCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Material ID, Name, or Supplier..."
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
            <option value="ALL">All Stock Levels</option>
            <option value="in_stock">In Stock (Normal)</option>
            <option value="low_stock">Low Stock (Warning)</option>
            <option value="critical">Critical Shortage</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="Metals & Alloys">Metals & Alloys</option>
            <option value="Optics & Photonics">Optics & Photonics</option>
            <option value="Electrical Conductors">Electrical Conductors</option>
            <option value="Semiconductors">Semiconductors</option>
            <option value="Chemicals & Synthetics">Chemicals & Synthetics</option>
            <option value="Coolants & Fluids">Coolants & Fluids</option>
            <option value="Industrial Gases">Industrial Gases</option>
          </select>
        </div>
      </div>

      {/* Materials Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Material ID</th>
                <th className="py-3.5 px-4">Material Name & Category</th>
                <th className="py-3.5 px-4">Available Qty</th>
                <th className="py-3.5 px-4">Required Qty</th>
                <th className="py-3.5 px-4">Safety Stock</th>
                <th className="py-3.5 px-4">Availability Date</th>
                <th className="py-3.5 px-4">Storage & Supplier</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMaterials.map((mat) => {
                const isUnderstock = mat.available_qty < mat.required_qty;

                return (
                  <tr key={mat.material_id} className="hover:bg-slate-50/80 transition">
                    {/* Material ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                      {mat.material_id}
                    </td>

                    {/* Name & Category */}
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900">{mat.material_name}</p>
                      <span className="text-[10px] text-slate-400 font-medium">{mat.category} • Cost: {mat.unit_cost}</span>
                    </td>

                    {/* Available */}
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {mat.available_qty.toLocaleString()} <span className="text-slate-400 text-[10px] font-normal">{mat.unit}</span>
                    </td>

                    {/* Required */}
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {mat.required_qty.toLocaleString()} <span className="text-slate-400 text-[10px] font-normal">{mat.unit}</span>
                    </td>

                    {/* Safety Stock */}
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {mat.safety_stock} {mat.unit}
                    </td>

                    {/* Availability Date */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{mat.availability_date}</span>
                      </div>
                    </td>

                    {/* Storage & Supplier */}
                    <td className="py-3.5 px-4">
                      <p className="font-mono text-[11px] text-slate-700">{mat.storage_bin}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[140px]">{mat.supplier}</p>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      {mat.status === 'in_stock' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          IN STOCK
                        </span>
                      ) : mat.status === 'low_stock' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          LOW STOCK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 animate-pulse">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          CRITICAL SHORTAGE
                        </span>
                      )}
                    </td>

                    {/* Restock Button */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleRestockRequest(mat.material_id, mat.material_name)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 font-semibold text-[11px] transition inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        Restock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

