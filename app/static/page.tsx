'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function StaticScrapingPage() {
  const [url, setUrl] = useState('');
  const [selector, setSelector] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState('');

  const handleWebScrape = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await fetch('/api/static-scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          selector,
          searchTerm,
        }),
      });

      if (!response.ok) {
        throw new Error('Static scraping failed');
      }

      const data = await response.json();
      setResults(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">Statisches Web Scraping</h1>
          <p className="text-muted-foreground">
            Geben Sie eine URL und einen Suchbegriff oder CSS-Selektor ein, um mit dem statischen Scraping zu beginnen
          </p>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="URL zum Scrapen eingeben"
            className="w-full p-3 rounded-lg border bg-background text-foreground"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Suchbegriff eingeben (z.B. 'Preis', 'Titel')"
              className="w-full p-3 rounded-lg border bg-background text-foreground"
            />
            <input
              type="text"
              value={selector}
              onChange={(e) => setSelector(e.target.value)}
              placeholder="Oder CSS-Selektor eingeben (optional)"
              className="w-full p-3 rounded-lg border bg-background text-foreground"
            />
          </div>
          <Button 
            onClick={handleWebScrape}
            disabled={isLoading || !url || (!searchTerm && !selector)}
            className="w-full"
          >
            {isLoading ? 'Verarbeitung...' : 'Statisches Scraping starten'}
          </Button>
          <p className="text-sm text-muted-foreground">
            {!searchTerm && !selector ? 'Geben Sie einen Suchbegriff oder CSS-Selektor ein' : 
             searchTerm ? `Suche nach Inhalt mit "${searchTerm}"` :
             `Verwendeter CSS-Selektor: ${selector}`}
          </p>
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
            {error}
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Ergebnisse:</h2>
            <div className="space-y-2">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-secondary/50"
                >
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
