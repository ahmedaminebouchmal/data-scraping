'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PDFHandler } from '@/components/pdf-handler';

export default function Home() {
  const [url, setUrl] = useState('');
  const [selector, setSelector] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'static' | 'dynamic' | 'pdf'>('static');

  const handleWebScrape = async (type: 'static' | 'dynamic') => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await fetch(`/api/${type}-scrape`, {
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
        throw new Error('Scraping failed');
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
          <h1 className="text-3xl font-bold">
            {activeTab === 'static' && 'Static Web Scraping'}
            {activeTab === 'dynamic' && 'Dynamic Web Scraping'}
            {activeTab === 'pdf' && 'PDF Processing Tools'}
          </h1>
          <p className="text-muted-foreground">
            {activeTab === 'pdf' 
              ? 'Upload and process PDF documents'
              : 'Enter a URL and search term or CSS selector to start scraping'}
          </p>
        </div>

        {(activeTab === 'static' || activeTab === 'dynamic') && (
          <div className="space-y-4">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter URL to scrape"
              className="w-full p-3 rounded-lg border bg-background text-foreground"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter search term (e.g., 'price', 'title')"
                className="w-full p-3 rounded-lg border bg-background text-foreground"
              />
              <input
                type="text"
                value={selector}
                onChange={(e) => setSelector(e.target.value)}
                placeholder="Or enter CSS selector (optional)"
                className="w-full p-3 rounded-lg border bg-background text-foreground"
              />
            </div>
            <Button 
              onClick={() => handleWebScrape(activeTab)}
              disabled={isLoading || !url || (!searchTerm && !selector)}
              className="w-full"
            >
              {isLoading ? 'Processing...' : `Start ${activeTab} Scraping`}
            </Button>
            <p className="text-sm text-muted-foreground">
              {!searchTerm && !selector ? 'Enter either a search term or CSS selector' : 
               searchTerm ? `Searching for content containing "${searchTerm}"` :
               `Using CSS selector: ${selector}`}
            </p>
          </div>
        )}

        {activeTab === 'pdf' && <PDFHandler />}

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
            {error}
          </div>
        )}

        {results.length > 0 && activeTab !== 'pdf' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Results:</h2>
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
