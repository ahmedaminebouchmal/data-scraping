/**
 * Type extension for PDF.js worker configuration
 * Required for TypeScript to recognize workerSrc property
 * @see https://mozilla.github.io/pdf.js/getting_started/#typescript
 */
declare module 'pdfjs-dist' {
  interface GlobalWorkerOptionsType {
    workerSrc: string | false;
  }
}

import { PDFDocument, rgb } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import { createCanvas } from 'canvas';

// Configure Node canvas for PDF.js
const canvas = createCanvas(800, 600);
const canvasContext = canvas.getContext('2d');

// Set the worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Type guard for text items
interface PDFTextItem {
  str: string;
  transform: number[];
  width?: number;
  fontName?: string;
  height?: number;
  confidence?: number;
}

function isTextItem(item: any): item is PDFTextItem {
  return item && typeof item.str === 'string' && Array.isArray(item.transform);
}

export interface ProcessedPDFTextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  fontSize: number;
  fontFamily: string;
  height: number;
  confidence: number;
}

export interface PDFPage {
  pageNumber: number;
  content: string;
  dimensions: {
    width: number;
    height: number;
  };
  items: ProcessedPDFTextItem[];
}

export interface PDFElement {
  type: 'text' | 'heading' | 'paragraph';
  content: string;
  position: {
    x: number;
    y: number;
  };
  fontSize?: number;
}

export interface PDFEditOperation {
  type: 'text' | 'image';
  content: string;
  x: number;
  y: number;
  page: number;
}

interface TableCell {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectedTable {
  pageNumber: number;
  cells: TableCell[];
}

export interface RedactionRequest {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export async function extractStructuredTextFromPDF(buffer: ArrayBuffer): Promise<PDFPage[]> {
  try {
    const data = new Uint8Array(buffer);
    const loadingTask = pdfjsLib.getDocument(data);
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    const pages: PDFPage[] = [];

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Get page dimensions
      const viewport = page.getViewport({ scale: 1.0 });
      const { width, height } = viewport;

      // Process each text item to include position and styling information
      const processedItems = textContent.items
        .filter((item): item is TextItem => 'str' in item)
        .map((item) => {
          const transform = item.transform;
          const fontSize = Math.sqrt(transform[0] * transform[0] + transform[1] * transform[1]);
          
          return {
            text: item.str,
            x: transform[4],
            y: height - transform[5], // Convert PDF coordinates to top-left origin
            width: item.width ?? 0,
            fontSize,
            fontFamily: item.fontName ?? 'unknown',
            height: item.height ?? 0,
            confidence: (item as any).confidence ?? 0
          };
        });

      // Sort items by y position (top to bottom) and then x position (left to right)
      const sortedItems = processedItems.sort((a, b) => {
        const yDiff = Math.abs(a.y - b.y);
        if (yDiff < 5) { // Items within 5 units are considered on the same line
          return a.x - b.x;
        }
        return b.y - a.y;
      });

      // Group items into lines
      const lines: ProcessedPDFTextItem[][] = [];
      let currentLine: ProcessedPDFTextItem[] = [];
      let currentY = sortedItems[0]?.y;

      sortedItems.forEach((item) => {
        if (Math.abs(item.y - currentY) < 5) {
          currentLine.push(item);
        } else {
          if (currentLine.length > 0) {
            lines.push([...currentLine]);
          }
          currentLine = [item];
          currentY = item.y;
        }
      });
      if (currentLine.length > 0) {
        lines.push(currentLine);
      }

      // Convert lines to structured content
      const content = lines.map(line => {
        return line.map(item => item.text).join(' ');
      }).join('\n');

      pages.push({
        pageNumber: i,
        content,
        dimensions: { width, height },
        items: sortedItems
      });
    }

    return pages;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw error;
  }
}

export async function editPDF(buffer: ArrayBuffer, operations: PDFEditOperation[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(buffer);
  
  for (const op of operations) {
    const page = pdfDoc.getPage(op.page - 1);
    
    if (op.type === 'text') {
      page.drawText(op.content, {
        x: op.x,
        y: page.getHeight() - op.y, // Convert to PDF coordinates
        size: 12 // Default font size
      });
    }
    // Add support for images and other operations as needed
  }

  return await pdfDoc.save();
}

export async function createPDFFromText(text: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  
  page.drawText(text, {
    x: 50,
    y: page.getHeight() - 50,
    size: 12
  });

  return await pdfDoc.save();
}

export async function extractTextFromPDF(buffer: ArrayBuffer) {
  const loadingTask = pdfjsLib.getDocument(new Uint8Array(buffer));
  const pdf = await loadingTask.promise;
  let text = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items
    .filter((item): item is TextItem => 'str' in item)
    .map(item => item.str)
      .join(' ');
  }
  
  return text;
}

export async function detectTablesInPDF(buffer: ArrayBuffer): Promise<DetectedTable[]> {
  const pdf = await pdfjsLib.getDocument(new Uint8Array(buffer)).promise;
  const tables: DetectedTable[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });
    
    const cells = textContent.items
      .filter((item): item is TextItem => 'str' in item)
      .map(item => ({
        text: item.str,
        x: item.transform[4],
        y: viewport.height - item.transform[5],
        width: item.width ?? 0,
        height: Math.hypot(item.transform[2], item.transform[3]),
      }));

    // Table detection logic
    const columnGroups = groupByColumns(cells);
    const rowGroups = columnGroups.flatMap(col => groupByRows(col));
    const detectedTables = rowGroups.filter(group => group.length > 1);

    tables.push({
      pageNumber: pageNum,
      cells: detectedTables.flat()
    });
  }

  return tables;
}

export async function redactPDF(
  buffer: ArrayBuffer,
  redactions: RedactionRequest[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(buffer);
  
  for (const { page, x, y, width, height } of redactions) {
    const pdfPage = pdfDoc.getPage(page - 1);
    pdfPage.drawRectangle({
      x,
      y: pdfPage.getHeight() - y - height,
      width,
      height,
      color: rgb(0, 0, 0), // Using PDF-Lib's rgb function
      borderWidth: 0,
      opacity: 1
    });
  }

  return pdfDoc.save();
}

export async function convertPDFToText(buffer: ArrayBuffer): Promise<string> {
  const pdf = await pdfjsLib.getDocument(new Uint8Array(buffer)).promise;
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });
    
    const items = textContent.items
      .filter((item): item is TextItem => 'str' in item)
      .sort((a, b) => {
        const aY = viewport.height - a.transform[5];
        const bY = viewport.height - b.transform[5];
        return bY - aY || a.transform[4] - b.transform[4];
      });

    let currentParagraph = '';
    let lastY = -Infinity;
    
    for (const item of items) {
      const currentY = viewport.height - item.transform[5];
      if (Math.abs(currentY - lastY) > (item.height ?? 10)) {
        if (currentParagraph) fullText += currentParagraph + '\n';
        currentParagraph = item.str;
      } else {
        currentParagraph += ` ${item.str}`;
      }
      lastY = currentY;
    }
    
    if (currentParagraph) fullText += currentParagraph + '\n\n';
  }
  
  return fullText.trim();
}

// Helper functions
function groupByColumns(cells: TableCell[], threshold = 10): TableCell[][] {
  const columns: TableCell[][] = [];
  cells.sort((a, b) => a.x - b.x);
  
  let currentCol: TableCell[] = [];
  let prevX = -Infinity;

  for (const cell of cells) {
    if (Math.abs(cell.x - prevX) > threshold) {
      if (currentCol.length) columns.push(currentCol);
      currentCol = [cell];
    } else {
      currentCol.push(cell);
    }
    prevX = cell.x;
  }
  
  return columns;
}

function groupByRows(cells: TableCell[], threshold = 5): TableCell[][] {
  const rows: TableCell[][] = [];
  cells.sort((a, b) => b.y - a.y);
  
  let currentRow: TableCell[] = [];
  let prevY = -Infinity;

  for (const cell of cells) {
    if (Math.abs(cell.y - prevY) > threshold) {
      if (currentRow.length) rows.push(currentRow);
      currentRow = [cell];
    } else {
      currentRow.push(cell);
    }
    prevY = cell.y;
  }
  
  return rows;
}
