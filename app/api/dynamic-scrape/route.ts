import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { getRandomUserAgent, humanDelay } from '../../../utils/antiBot';

interface ScrapeRequest {
  url: string;
  selector?: string;
  searchTerm?: string;
}

function getSmartSelector(searchTerm: string): string[] {
  return [
    // Text content selectors
    `[title*="${searchTerm}" i]`,
    `[aria-label*="${searchTerm}" i]`,
    
    // Product selectors
    '.product-title, .product-name, .product-price',
    '[data-product-name], [data-product-price]',
    
    // Headers and paragraphs
    'h1, h2, h3, h4, h5, h6',
    
    // Common class patterns
    `[class*="title" i]`,
    `[class*="price" i]`,
    `[class*="name" i]`,
    
    // Common ID patterns
    `[id*="title" i]`,
    `[id*="price" i]`,
    `[id*="name" i]`
  ];
}

export async function POST(request: Request) {
  const { url, selector, searchTerm }: ScrapeRequest = await request.json();
  
  try {
    const browser = await puppeteer.launch({ 
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    });
    
    const page = await browser.newPage();
    await page.setUserAgent(getRandomUserAgent());
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Set default navigation timeout
    page.setDefaultNavigationTimeout(30000);

    // Enable request interception
    await page.setRequestInterception(true);
    
    // Block unnecessary resources
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (resourceType === 'image' || resourceType === 'stylesheet' || resourceType === 'font') {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto(url, { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Wait for content to load
    await page.waitForSelector('body', { timeout: 10000 });
    await humanDelay(2000, 5000);

    let results: string[] = [];

    if (selector) {
      // Wait for specific selector if provided
      await page.waitForSelector(selector, { timeout: 10000 });
      results = await page.evaluate((sel) => {
        return Array.from(document.querySelectorAll(sel))
          .map(el => el.textContent?.trim())
          .filter(text => text && text.length > 0) as string[];
      }, selector);
    } else if (searchTerm) {
      // If search term is provided, use smart selectors
      const smartSelectors = getSmartSelector(searchTerm);
      
      results = await page.evaluate((selectors, term) => {
        const allResults: string[] = [];
        
        // First try common product selectors
        const productSelectors = [
          // Amazon specific selectors
          '.a-price-whole', '.a-price-fraction', '.a-text-price',
          '.a-size-base-plus', '.a-size-medium',
          '.a-link-normal .a-text-normal',
          '.product-title', '.product-name', '.product-price',
          '[data-component-type="s-product-image"]',
          '.s-title-instructions-style',
          '.a-price',
          '.a-offscreen',
          // Generic product selectors
          '[class*="price"]', '[class*="title"]', '[class*="name"]',
          '[id*="price"]', '[id*="title"]', '[id*="name"]',
          'h1, h2, h3'
        ];

        productSelectors.forEach(selector => {
          try {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
              const text = el.textContent?.trim();
              if (text && text.length > 0) {
                // If search term provided, only include matching text
                if (!term || text.toLowerCase().includes(term.toLowerCase())) {
                  allResults.push(text);
                }
              }
            });
          } catch (e) {
            // Continue if selector fails
          }
        });

        // Remove duplicates and clean up
        return [...new Set(allResults)]
          .filter(text => text && text.length > 2 && !text.includes('JavaScript'))
          .map(text => text.replace(/\\s+/g, ' ').trim());
      }, smartSelectors, searchTerm);
    }

    await browser.close();
    return NextResponse.json({ data: results });
  } catch (error) {
    return NextResponse.json(
      { error: 'Dynamic scraping failed: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
