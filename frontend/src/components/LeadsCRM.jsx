import React, { useState, useEffect } from 'react';
import { 
  Users, Mail, Phone, Clock, CheckCircle, Download, 
  Search, MessageSquare, Filter, RefreshCw, Sparkles 
} from 'lucide-react';
import { getLeads, updateLeadStatus } from '../services/api';

export default function LeadsCRM() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadLeads();
  }, [statusFilter]);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const res = await getLeads(statusFilter);
      if (res.success) {
        setLeads(res.leads);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await updateLeadStatus(id, newStatus);
      if (res.success) {
        setLeads(leads.map(l => l.id === id ? { ...l, status: newStatus } : l));
      }
    } catch (e) {
      alert('Failed to update status');
    }
  };

  const handleExportCSV = () => {
    if (leads.length === 0) {
      alert('No leads to export');
      return;
    }

    const headers = ['ID', 'Visitor UUID', 'Name', 'Email', 'Phone', 'Category', 'Note', 'Status', 'Created At'];
    const rows = leads.map(l => [
      l.id,
      `"${l.visitor_uuid}"`,
      `"${l.name || ''}"`,
      `"${l.email || ''}"`,
      `"${l.phone || ''}"`,
      `"${l.category || ''}"`,
      `"${(l.note || '').replace(/"/g, '""')}"`,
      l.status,
      l.created_at
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `awayinstyle_vip_leads_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLeads = leads.filter(l => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (l.name && l.name.toLowerCase().includes(s)) ||
      (l.email && l.email.toLowerCase().includes(s)) ||
      (l.phone && l.phone.toLowerCase().includes(s)) ||
      (l.category && l.category.toLowerCase().includes(s))
    );
  });

  return (
    <div className="space-y-6">
      <div className="p-5 bg-obsidian-900 border border-zinc-800 rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold-400" />
              <h3 className="text-base font-bold text-zinc-100 font-luxury tracking-wide">
                VIP Concierge Inquiries & Fallback Leads ({filteredLeads.length})
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Contact requests captured automatically whenever fallback occurs or guests request human editorial assistance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 bg-obsidian-800 hover:bg-gold-500/20 text-gold-300 border border-gold-500/40 text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={loadLeads}
              className="p-2 text-zinc-400 hover:text-gold-300 hover:bg-zinc-800 rounded-lg transition"
              title="Refresh leads"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, phone, or category..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-obsidian-950 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-gold-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-obsidian-950 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-gold-400"
            >
              <option value="">All Statuses</option>
              <option value="new">New Inquiries</option>
              <option value="contacted">Contacted</option>
              <option value="closed">Closed / Converted</option>
            </select>
          </div>
        </div>

        {/* Leads Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-obsidian-850 text-zinc-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Guest Name</th>
                <th className="p-3">Contact Details</th>
                <th className="p-3">Category</th>
                <th className="p-3">Notes & Requirements</th>
                <th className="p-3">Status</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-zinc-500">
                    Loading inquiries...
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-zinc-500">
                    No leads or inquiries matching filter.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-zinc-800/40 transition">
                    <td className="p-3 font-mono text-zinc-500">#{lead.id}</td>
                    <td className="p-3 font-semibold text-zinc-100">
                      {lead.name}
                      <div className="text-[10px] text-zinc-500 font-mono font-normal">
                        {lead.visitor_uuid?.substring(0, 14)}...
                      </div>
                    </td>
                    <td className="p-3 space-y-0.5">
                      {lead.email && (
                        <div className="flex items-center gap-1 text-gold-300">
                          <Mail className="w-3 h-3 text-gold-400" />
                          <a href={`mailto:${lead.email}`} className="hover:underline">{lead.email}</a>
                        </div>
                      )}
                      {lead.phone && (
                        <div className="flex items-center gap-1 text-zinc-300">
                          <Phone className="w-3 h-3 text-zinc-400" />
                          <span>{lead.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-gold-300 font-medium">
                      {lead.category || 'Lifestyle Concierge'}
                    </td>
                    <td className="p-3 max-w-[240px] text-zinc-300 text-[11px] leading-relaxed">
                      {lead.note || <span className="text-zinc-500 italic">No additional notes</span>}
                    </td>
                    <td className="p-3">
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        className={`text-[11px] font-semibold px-2 py-1 rounded border focus:outline-none ${
                          lead.status === 'new'
                            ? 'bg-amber-950/80 border-amber-500/40 text-amber-300'
                            : lead.status === 'contacted'
                            ? 'bg-blue-950/80 border-blue-500/40 text-blue-300'
                            : 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                        }`}
                      >
                        <option value="new">🟡 New</option>
                        <option value="contacted">🔵 Contacted</option>
                        <option value="closed">🟢 Closed / VIP</option>
                      </select>
                    </td>
                    <td className="p-3 text-zinc-500 text-[11px] whitespace-nowrap">
                      {lead.created_at?.substring(0, 16) || ''}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
