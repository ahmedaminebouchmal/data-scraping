import { NextResponse } from 'next/server';
import { 
  extractStructuredTextFromPDF, 
  editPDF, 
  createPDFFromText,
  type PDFEditOperation 
} from '../../../utils/pdfHandler';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('pdf');
    const action = formData.get('action');
    
    console.log('Received request:', {
      action,
      fileExists: !!file,
      fileType: file instanceof File ? 'File' : typeof file
    });

    // Validate action first
    if (!action || typeof action !== 'string' || !['extract', 'edit', 'create'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid or missing action. Must be one of: extract, edit, create' },
        { status: 400 }
      );
    }

    // Then validate file
    if (!file || !(file instanceof File)) {
      console.log('File validation failed:', { file });
      return NextResponse.json(
        { error: 'No valid file provided' },
        { status: 400 }
      );
    }

    console.log('Processing file:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    const fileStart = new TextDecoder().decode(uint8Array.slice(0, 20));
    
    console.log('File content start:', {
      fileStart,
      bufferLength: buffer.byteLength
    });

    // Check if the file starts with the PDF magic number (%PDF-)
    if (!fileStart.startsWith('%PDF-')) {
      console.log('Invalid PDF format:', { fileStart });
      return NextResponse.json(
        { error: 'Invalid PDF file format' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'extract':
        try {
          const pages = await extractStructuredTextFromPDF(buffer);
          console.log('Extraction successful:', {
            pageCount: pages.length,
            firstPageContent: pages[0]?.content.substring(0, 100)
          });
          return NextResponse.json({ pages });
        } catch (extractError) {
          console.error('Extraction error:', extractError);
          throw extractError;
        }

      case 'edit':
        const operationsJson = formData.get('operations');
        if (!operationsJson) {
          return NextResponse.json(
            { error: 'No edit operations provided' },
            { status: 400 }
          );
        }

        const operations = JSON.parse(operationsJson as string) as PDFEditOperation[];
        const editedPdfBuffer = await editPDF(buffer, operations);
        
        return new NextResponse(editedPdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="edited.pdf"'
          }
        });

      case 'create':
        const text = formData.get('text');
        if (!text || typeof text !== 'string') {
          return NextResponse.json(
            { error: 'No text content provided' },
            { status: 400 }
          );
        }

        const newPdfBuffer = await createPDFFromText(text);
        return new NextResponse(newPdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="new.pdf"'
          }
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('PDF processing error:', error);
    return NextResponse.json(
      { error: 'PDF processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
