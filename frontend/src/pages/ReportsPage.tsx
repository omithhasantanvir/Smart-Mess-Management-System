import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Member } from '../types';
import {
  BarChart3,
  FileSpreadsheet,
  FileText,
  Download,
  Filter,
  Calendar,
  Users,
  CheckCircle2,
  Printer
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const ReportsPage: React.FC<{ selectedMonth: string }> = ({ selectedMonth }) => {
  const [reportType, setReportType] = useState<string>('SETTLEMENT');
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [month, setMonth] = useState<string>(selectedMonth);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getMembers().then(res => {
      if (res.success) setMembers(res.members);
    });
  }, []);

  const handleExportCSV = async () => {
    try {
      setLoading(true);
      if (reportType === 'SETTLEMENT') {
        const res = await api.getMonthlySettlement(month);
        if (res.success && res.settlement) {
          const rows = res.settlement.memberSettlements.map((m: any) => ({
            'Member Name': m.memberName,
            'Total Meals': m.totalMeals,
            'Meal Rate': m.mealRate,
            'Meal Cost (৳)': m.mealCost,
            'Shared Bills (৳)': m.sharedBills,
            'Total Cost (৳)': m.totalCost,
            'Market Paid (৳)': m.marketPaid,
            'Deposits (৳)': m.depositsPaid,
            'Total Credit (৳)': m.totalCredit,
            'Prev Due (৳)': m.previousBalance,
            'Final Balance (৳)': m.finalBalance,
            'Status': m.status
          }));
          const ws = XLSX.utils.json_to_sheet(rows);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Settlement');
          XLSX.writeFile(wb, `Settlement_Report_${month}.csv`, { bookType: 'csv' });
        }
      } else if (reportType === 'MARKET') {
        const res = await api.getMarketTransactions({ month });
        if (res.success) {
          const rows = res.transactions.map((t: any) => ({
            'Date': t.date,
            'Purchased By': typeof t.purchasedBy === 'object' ? t.purchasedBy?.name : 'Member',
            'Category': t.category,
            'Payment Method': t.paymentMethod,
            'Total Amount (৳)': t.totalAmount,
            'Notes': t.notes
          }));
          const ws = XLSX.utils.json_to_sheet(rows);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Market');
          XLSX.writeFile(wb, `Market_Bazar_Report_${month}.csv`, { bookType: 'csv' });
        }
      } else if (reportType === 'DEPOSITS') {
        const res = await api.getDeposits({ month });
        if (res.success) {
          const rows = res.deposits.map((d: any) => ({
            'Date': d.date,
            'Member': typeof d.member === 'object' ? d.member?.name : 'Member',
            'Amount (৳)': d.amount,
            'Method': d.paymentMethod,
            'Trx ID': d.transactionId,
            'Notes': d.notes
          }));
          const ws = XLSX.utils.json_to_sheet(rows);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Deposits');
          XLSX.writeFile(wb, `Deposits_Report_${month}.csv`, { bookType: 'csv' });
        }
      }
    } catch (err: any) {
      alert(err.message || 'Export error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setLoading(true);
      const doc = new jsPDF();

      doc.setFontSize(16);
      doc.text(`Smart Mess Management - ${reportType} Report`, 14, 18);
      doc.setFontSize(10);
      doc.text(`Billing Month: ${month} | Generated: ${new Date().toLocaleDateString()}`, 14, 25);

      if (reportType === 'SETTLEMENT') {
        const res = await api.getMonthlySettlement(month);
        if (res.success && res.settlement) {
          const head = [['Member', 'Meals', 'Rate', 'Meal Cost', 'Bills', 'Cost', 'Market', 'Deposit', 'Balance', 'Status']];
          const data = res.settlement.memberSettlements.map((m: any) => [
            m.memberName,
            m.totalMeals,
            `৳${m.mealRate}`,
            `৳${m.mealCost}`,
            `৳${m.sharedBills}`,
            `৳${m.totalCost}`,
            `৳${m.marketPaid}`,
            `৳${m.depositsPaid}`,
            `৳${m.finalBalance}`,
            m.status
          ]);

          autoTable(doc, {
            head,
            body: data,
            startY: 32,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [15, 23, 42] }
          });
        }
      } else if (reportType === 'MARKET') {
        const res = await api.getMarketTransactions({ month });
        if (res.success) {
          const head = [['Date', 'Shopper', 'Category', 'Method', 'Total (৳)']];
          const data = res.transactions.map((t: any) => [
            t.date,
            typeof t.purchasedBy === 'object' ? t.purchasedBy?.name : 'Member',
            t.category,
            t.paymentMethod,
            `৳${t.totalAmount}`
          ]);

          autoTable(doc, {
            head,
            body: data,
            startY: 32,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [15, 23, 42] }
          });
        }
      }

      doc.save(`Mess_Report_${reportType}_${month}.pdf`);
    } catch (err: any) {
      alert(err.message || 'PDF Generation Error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (reportType === 'SETTLEMENT') {
      window.open(`/api/reports/settlement/excel?month=${month}`, '_blank');
    } else {
      handleExportCSV();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Financial Reports & Exports</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Generate and export statements in Excel (.xlsx), PDF, and CSV formats
          </p>
        </div>
      </div>

      {/* Filter and selector card */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Filter className="w-4 h-4 text-brand-400" />
          Report Parameters
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Select Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500 font-medium"
            >
              <option value="SETTLEMENT">Monthly Financial Settlement Report</option>
              <option value="MARKET">Daily Market / Bazar Expenses Report</option>
              <option value="DEPOSITS">Member Deposits Ledger Report</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Billing Month</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Member (Optional)</label>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
            >
              <option value="">All Members</option>
              {members.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name} ({m.memberCode})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Export buttons row */}
        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportExcel}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Download Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/30 transition disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-brand-400" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
};

