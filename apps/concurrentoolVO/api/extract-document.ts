// Polyfill browser globals required by pdfjs-dist (used by pdf-parse) in serverless
if (typeof globalThis.DOMMatrix === 'undefined') {
  // @ts-expect-error — minimal polyfill for PDF text extraction only
  globalThis.DOMMatrix = class DOMMatrix {
    m: number[] = [1, 0, 0, 1, 0, 0];
    constructor(init?: string | number[]) {
      if (Array.isArray(init)) this.m = init;
    }
  };
}

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

// Module-level init (reused across warm invocations)
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

const DOCUMENT_EXTRACTION_PROMPT = `Je extraheert prijzen uit documenten voor onderwijstoetsen in het voortgezet onderwijs.

Herkende modules: rekenwiskunde, nederlands, engels, taalverzorging, sociaal-emotioneel, cognitieve-capaciteiten
Herkende aanbieders: cito, dia, jij

Extraheer per gevonden prijs:
- moduleId: een van de herkende modules (of 'onbekend')
- provider: een van de herkende aanbieders (of 'onbekend')
- amount: bedrag per leerling per jaar in euro's
- source: waar de prijs vandaan komt (documentnaam, paginanummer als zichtbaar)
- priceType: 'publication' als het een officiële prijslijst is, 'agreed' als het een offerte of afspraak is

Retourneer een JSON-array van objecten. Als geen prijzen gevonden: retourneer een lege array [].
Geef ALLEEN geldige JSON terug, geen markdown of uitleg.`;

// ─── Text extraction from various document formats ──────────────────────────

async function extractTextFromFile(buffer: Buffer, fileName: string): Promise<string> {
  const ext = fileName.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'pdf': {
      // Pre-register pdfjs worker on main thread to avoid dynamic import of pdf.worker.mjs
      // which fails in Vercel serverless (file not bundled)
      await import('pdfjs-dist/legacy/build/pdf.worker.mjs');
      const { PDFParse } = await import('pdf-parse');
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      const text = result.text ?? '';
      await parser.destroy();
      return text;
    }
    case 'xlsx':
    case 'xls': {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      return workbook.SheetNames
        .map((name) => XLSX.utils.sheet_to_csv(workbook.Sheets[name]))
        .join('\n\n');
    }
    case 'docx': {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
    case 'csv':
    case 'txt':
      return buffer.toString('utf-8');
    default:
      throw new Error(`Niet-ondersteund bestandsformaat: .${ext}`);
  }
}

// ─── API handler ────────────────────────────────────────────────────────────

export async function POST(request: Request): Promise<Response> {
  try {
    // Skip auth in dev mode (SKIP_AUTH=true in .env.local)
    const skipAuth = process.env.SKIP_AUTH === 'true';

    if (!skipAuth) {
      // Extract and verify Bearer token
      const authHeader = request.headers.get('Authorization');
      const token = authHeader?.replace('Bearer ', '');

      if (!token) {
        return new Response('Unauthorized', { status: 401 });
      }

      // Verify JWT via Supabase admin client
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

      if (authError || !user) {
        return new Response('Unauthorized', { status: 401 });
      }
    }

    // Parse and validate request body
    const { storagePath, fileName } = await request.json();

    if (!storagePath || typeof storagePath !== 'string') {
      return new Response('Opslagpad is verplicht', { status: 400 });
    }
    if (!fileName || typeof fileName !== 'string') {
      return new Response('Bestandsnaam is verplicht', { status: 400 });
    }

    // Download file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('documents')
      .download(storagePath);

    if (downloadError || !fileData) {
      return new Response('Bestand niet gevonden', { status: 404 });
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());

    // Extract text from document
    let text: string;
    try {
      text = await extractTextFromFile(buffer, fileName);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Onbekend fout';
      if (message.startsWith('Niet-ondersteund bestandsformaat')) {
        return new Response(message, { status: 400 });
      }
      return new Response('Dit document kon niet worden gelezen.', { status: 422 });
    }

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify([]),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Send extracted text to Claude Haiku for price extraction
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 2048,
      system: DOCUMENT_EXTRACTION_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Analyseer het volgende document en extraheer alle prijsinformatie:\n\n${text.slice(0, 10000)}`,
        },
      ],
    });

    // Parse Claude response
    const content = response.content[0];
    if (content.type !== 'text') {
      return new Response(
        JSON.stringify([]),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Strip markdown fences if present
    let cleaned = content.text.trim();
    const fenceMatch = cleaned.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/);
    if (fenceMatch) {
      cleaned = fenceMatch[1].trim();
    }

    try {
      const prices = JSON.parse(cleaned);
      return new Response(
        JSON.stringify(Array.isArray(prices) ? prices : []),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    } catch {
      // If parse fails, return empty array with message
      return new Response(
        JSON.stringify([]),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }
  } catch {
    return new Response('Extractie mislukt. Probeer het opnieuw.', { status: 500 });
  }
}
