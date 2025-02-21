import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { getRandomUserAgent, humanDelay } from '../../../utils/antiBot';
import { isRateLimited, getRemainingTokens, getTimeUntilReset } from '../../../utils/rateLimit';

interface ScrapeRequest {
  url: string;
  selector?: string;
  searchTerm?: string;
}

function getSmartSelector(searchTerm: string): string[] {
  // Common selectors for different types of content
  return [
    // Text content selectors
    `*:contains("${searchTerm}")`,
    `[title*="${searchTerm}" i]`,
    `[aria-label*="${searchTerm}" i]`,
    
    // Product selectors
    '.product-title, .product-name, .product-price',
    '[data-product-name], [data-product-price]',
    
    // List items and links
    'li:contains("${searchTerm}")',
    'a:contains("${searchTerm}")',
    
    // Headers and paragraphs
    'h1, h2, h3, h4, h5, h6',
    'p:contains("${searchTerm}")',
    
    // Common class patterns
    `[class*="title" i]:contains("${searchTerm}")`,
    `[class*="price" i]:contains("${searchTerm}")`,
    `[class*="name" i]:contains("${searchTerm}")`,
    
    // Common ID patterns
    `[id*="title" i]:contains("${searchTerm}")`,
    `[id*="price" i]:contains("${searchTerm}")`,
    `[id*="name" i]:contains("${searchTerm}")`
  ];
}

export async function POST(request: Request) {
  const clientId = request.headers.get('x-forwarded-for') || 'default-client';
  
  // Check rate limit
  if (isRateLimited(clientId)) {
    const timeUntilReset = getTimeUntilReset(clientId);
    return NextResponse.json(
      { 
        error: 'Rate limit exceeded',
        timeUntilReset,
        remainingTokens: 0
      },
      { status: 429 }
    );
  }

  try {
    const { url, selector, searchTerm }: ScrapeRequest = await request.json();
    
    // Validate input
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    await humanDelay();
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      timeout: 10000 // 10 second timeout
    });

    const $ = cheerio.load(response.data);
    let results: string[] = [];

    if (selector) {
      // If specific selector is provided, use it
      results = $(selector)
        .map((_, el) => $(el).text().trim())
        .get()
        .filter(text => text.length > 0);
    } else if (searchTerm) {
      // If search term is provided, use smart selectors
      const smartSelectors = getSmartSelector(searchTerm);
      
      for (const smartSelector of smartSelectors) {
        const elements = $(smartSelector);
        if (elements.length > 0) {
          const texts = elements
            .map((_, el) => $(el).text().trim())
            .get()
            .filter(text => text.length > 0 && text.toLowerCase().includes(searchTerm.toLowerCase()));
          
          results.push(...texts);
        }
      }

      // Remove duplicates
      results = [...new Set(results)];
    } else {
      // If no selector or search term, get all visible text content
      results = $('body')
        .find('h1, h2, h3, h4, h5, h6, p, li, a, span')
        .map((_, el) => $(el).text().trim())
        .get()
        .filter(text => text.length > 0);
    }
    
    return NextResponse.json({ data: results });
  } catch (error: any) {
    console.error('Scraping error:', error);

    // Handle specific error types
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        return NextResponse.json(
          { error: 'Request timed out' },
          { status: 408 }
        );
      }
      if (error.response) {
        // Server responded with error status
        return NextResponse.json(
          { 
            error: `Server responded with error: ${error.response.status}`,
            details: error.response.statusText
          },
          { status: error.response.status }
        );
      }
      if (error.request) {
        // Request made but no response received
        return NextResponse.json(
          { error: 'No response from server' },
          { status: 503 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      { 
        error: 'Scraping failed',
        details: error.message || 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
