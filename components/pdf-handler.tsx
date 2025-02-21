'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  PDFPage, 
  RedactionRequest, 
  DetectedTable, 
  detectTablesInPDF, 
  convertPDFToText, 
  redactPDF, 
  extractStructuredTextFromPDF 
} from '../utils/pdfHandler';

export default function PDFHandler() {
  const [pdfText, setPdfText] = useState<string>('');
  const [tables, setTables] = useState<DetectedTable[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PDFPage[]>([]);
  const [redactions] = useState<RedactionRequest[]>([]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      console.log('Selected file:', {
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size
      });
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Bitte wählen Sie eine gültige PDF-Datei aus');
    }
  };

  const handleProcessPDF = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      console.log('Processing file:', {
        name: file.name,
        type: file.type,
        size: file.size
      });

      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('action', 'extract');

      console.log('Sending request with action:', formData.get('action'));

      const response = await fetch('/api/pdf-process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`Failed to process PDF: ${errorText}`);
      }

      const data = await response.json();
      if (data.pages) {
        setPages(data.pages);
        setPdfText(data.pages.map((page: PDFPage) => page.content).join('\n\n'));
      } else {
        throw new Error('No pages found in response');
      }
    } catch (err) {
      console.error('Error processing PDF:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRedact = async () => {
    if (!file) {
      console.error('No file selected');
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const redactedPDF = await redactPDF(buffer, redactions);
      const newFile = new File([redactedPDF], `redacted-${file.name}`, {
        type: file.type,
      });
      
      setFile(newFile);
    } catch (error) {
      console.error('Redaction failed:', error);
    }
  };

  const handleExportText = async () => {
    if (!file) return;
    const text = await convertPDFToText(await file.arrayBuffer());
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.name.replace(/\.pdf$/i, '')}.txt`;
    a.click();
  };

  useEffect(() => {
    const processPDF = async () => {
      if (!file) return;
      const buffer = await file.arrayBuffer();
      const pages = await extractStructuredTextFromPDF(buffer);
      const tables = await detectTablesInPDF(buffer);
      
      setPages(pages);
      setTables(tables);
    };
    
    processPDF();
  }, [file]);

  const renderTables = (pageNumber: number) => (
    <div className="absolute inset-0 z-10 pointer-events-none">
      {tables
        .filter(t => t.pageNumber === pageNumber)
        .map((table, i) => (
          <div key={i} className="border-2 border-blue-400 bg-blue-100/20">
            {table.cells.map((cell, j) => (
              <div 
                key={j}
                className="absolute border border-gray-400 bg-white/30"
                style={{
                  left: `${cell.x}px`,
                  top: `${cell.y}px`,
                  width: `${cell.width}px`,
                  height: `${cell.height}px`,
                }}
              >
                {cell.text}
              </div>
            ))}
          </div>
        ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="pdf-upload" className="text-sm font-medium">
            PDF hochladen
          </label>
          <input
            id="pdf-upload"
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="w-full p-3 rounded-lg border bg-background text-foreground"
          />
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleProcessPDF}
            disabled={!file || loading}
            className="flex-1"
          >
            {loading ? 'Verarbeitung...' : 'Text extrahieren'}
          </Button>

          <Button
            onClick={handleRedact}
            disabled={!file}
            variant="outline"
          >
            Schwärzungen anwenden
          </Button>

          <Button
            onClick={handleExportText}
            disabled={!file}
            variant="outline"
          >
            Als Text exportieren
          </Button>
        </div>

        {file && (
          <p className="text-sm text-muted-foreground">
            Ausgewählte Datei: {file.name}
          </p>
        )}
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
          {error}
        </div>
      )}

      {pages.map(page => (
        <div key={page.pageNumber} className="relative">
          {renderTables(page.pageNumber)}
        </div>
      ))}

      {pdfText && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Extrahierter Text:</h3>
          <div className="p-4 rounded-lg bg-secondary/50 whitespace-pre-wrap">
            {pdfText}
          </div>
        </div>
      )}
    </div>
  );
}
