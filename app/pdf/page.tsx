'use client';

import { PDFHandler } from '@/components/pdf-handler';

export default function PDFProcessingPage() {
  return (
    <div className="container py-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">PDF-Verarbeitungstools</h1>
          <p className="text-muted-foreground">
            Laden Sie PDF-Dateien hoch, um Text zu extrahieren, Tabellen zu erkennen und Schwärzungen anzuwenden
          </p>
        </div>

        <div className="space-y-4 bg-background rounded-lg border p-6">
          <PDFHandler />
        </div>
      </div>
    </div>
  );
}
