'use client';

import { FileText } from 'lucide-react';

export default function ExportPdfButton() {
  const handleExport = () => {
    window.open('/api/export-pdf', '_blank');
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:opacity-90 transition"
    >
      <FileText className="w-4 h-4" />
      Export PDF Report
    </button>
  );
}
