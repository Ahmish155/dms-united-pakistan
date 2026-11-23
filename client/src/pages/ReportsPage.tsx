import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/api';
import { useWorkspace } from '../context/WorkspaceContext';
import {
  FileText,
  Copy,
  Download,
  Calendar,
  CheckCircle2,
  Share2,
  Printer,
  FileSpreadsheet,
  File
} from 'lucide-react';
import { WorkspaceRole } from '@dms/shared';

export const ReportsPage: React.FC = () => {
  const { activeWorkspace, activeRole, permissions } = useWorkspace();

  // Date range (defaults to past 7 days)
  const defaultEnd = new Date();
  const defaultStart = new Date();
  defaultStart.setDate(defaultStart.getDate() - 7);

  const [startDate, setStartDate] = useState(
    defaultStart.toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(defaultEnd.toISOString().split('T')[0]);

  const [reportData, setReportData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const data = await ApiService.get<any>(
        `/reports/weekly?startDate=${startDate}&endDate=${endDate}`
      );
      setReportData(data);
    } catch (err: any) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeWorkspace) {
      fetchReport();
    }
  }, [activeWorkspace, startDate, endDate]);

  const handleCopyWhatsApp = () => {
    if (!reportData?.whatsappText) return;
    navigator.clipboard.writeText(reportData.whatsappText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const downloadFile = (format: 'csv' | 'doc' | 'txt') => {
    const token = localStorage.getItem('dms_token');
    const wsId = localStorage.getItem('dms_active_workspace_id');

    const url = `/api/v1/reports/export/${format}?startDate=${startDate}&endDate=${endDate}`;
    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-workspace-id': wsId || ''
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error('Download failed');
        return res.blob();
      })
      .then((blob) => {
        const fileUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = fileUrl;
        a.download = `Weekly-Dawati-Report-${startDate}-to-${endDate}.${format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch((err) => alert(err.message || 'Export error'));
  };

  const canExport =
    activeRole === WorkspaceRole.SECTOR_SECRETARY || permissions?.canExportReports;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-typography-main">
            Dawati Executive Reports
          </h1>
          <p className="text-xs text-typography-secondary mt-0.5">
            Official operational reporting & multi-format export center for {activeWorkspace?.name}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyWhatsApp}
            className="btn-primary gap-1.5 text-xs py-2 shadow-sm"
          >
            {copied ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copy WhatsApp Report</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-xl border border-surface-border text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-brand-red" />
          <span className="font-semibold text-typography-main">Reporting Window:</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-typography-secondary">From:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input-field text-xs py-1 w-36"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-typography-secondary">To:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="input-field text-xs py-1 w-36"
          />
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="py-12 text-center text-xs text-typography-secondary">
          Generating report data...
        </div>
      ) : !reportData ? (
        <div className="rounded-xl border border-surface-border bg-white p-8 text-center">
          <FileText className="mx-auto h-8 w-8 text-typography-muted" />
          <p className="mt-2 text-xs text-typography-secondary">
            Unable to generate report for selected period.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* WhatsApp Clean Preview Document */}
          <div className="rounded-2xl border border-surface-border bg-white shadow-sm overflow-hidden">
            <div className="bg-surface-secondary/70 p-3.5 border-b border-surface-border flex items-center justify-between">
              <span className="font-bold text-xs text-typography-main">
                Official Report Document Preview
              </span>
              <span className="font-mono text-[10px] bg-emerald-50 text-status-success border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                APP SYNCED: YES
              </span>
            </div>

            <div className="p-6 font-mono text-xs whitespace-pre-wrap leading-relaxed text-typography-main bg-[#FCFCFC] border-b border-surface-border select-all">
              {reportData.whatsappText}
            </div>

            {/* Export Toolbar */}
            <div className="p-4 bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-typography-secondary">Export File:</span>
                {canExport ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => downloadFile('doc')}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface-secondary px-3 py-1.5 font-medium text-typography-main hover:bg-gray-100 transition-colors"
                    >
                      <File className="h-3.5 w-3.5 text-blue-600" />
                      <span>Word (.doc)</span>
                    </button>

                    <button
                      onClick={() => downloadFile('csv')}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface-secondary px-3 py-1.5 font-medium text-typography-main hover:bg-gray-100 transition-colors"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Excel (.csv)</span>
                    </button>

                    <button
                      onClick={() => downloadFile('txt')}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface-secondary px-3 py-1.5 font-medium text-typography-main hover:bg-gray-100 transition-colors"
                    >
                      <FileText className="h-3.5 w-3.5 text-typography-muted" />
                      <span>Plain Text</span>
                    </button>
                  </div>
                ) : (
                  <span className="text-typography-muted italic">
                    Downloads disabled for Spectator accounts
                  </span>
                )}
              </div>

              <button
                onClick={() => window.print()}
                className="btn-secondary gap-1.5 text-xs py-1.5 px-3"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
