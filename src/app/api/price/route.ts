import https from "https";
import * as cheerio from "cheerio";
import { NextResponse } from "next/server";
import regions from "./regions";

// Cache interface
interface CacheEntry {
  timestamp: number;
  data: PriceData[];
}

// Cache storage
const priceCache = new Map<string, CacheEntry>();
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

interface PriceData {
  country: string;
  price: number;
}

function normalizeGogUrl(url: string): string {
  const urlObj = new URL(url);
  const pathParts = urlObj.pathname.split('/');
  if (!pathParts.includes('en')) {
    // Insert 'en' after the first segment (which is empty due to leading slash)
    pathParts.splice(1, 0, 'en');
  }
  return pathParts.join('/');
}

function checkPrice(
  url: string,
  country: string,
  callback: (err: Error | null, priceData: PriceData | null) => void
) {
  const normalizedPath = normalizeGogUrl(url);
  const options = {
    hostname: "www.gog.com",
    path: normalizedPath, // Use the normalized URL path
    method: "GET",
    headers: {
      Cookie: "gog_lc=" + country + "_USD_en-US; path=/",
    },
  };

  const req = https.request(options, (res) => {
    let data = "";

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      const $ = cheerio.load(data);
      const price = $(".product-actions-price__final-amount").text().trim();
      if (price && price !== "0.00") {
        callback(null, { country, price: parseFloat(price) });
      } else {
        callback(null, null);
      }
    });
  });

  req.on("error", (e) => {
    callback(e, null);
  });

  req.end();
}

function getCacheKey(url: string): string {
  // Remove "/en" from URL before generating cache key
  const normalizedUrl = url.replace(/\/en\//, '/');
  return `price_${normalizedUrl}`;
}

function isValidCache(entry: CacheEntry): boolean {
  return Date.now() - entry.timestamp < CACHE_DURATION;
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url || !/^https:\/\/www\.gog\.com(\/en)?\/game\/[\w_]+$/.test(url)) {
    return NextResponse.json(
      {
        error:
          "Invalid GOG game URL. Expected format: https://www.gog.com/game/game_name or https://www.gog.com/en/game/game_name",
      },
      { status: 400 }
    );
  }

  // Check cache first
  const cacheKey = getCacheKey(url);
  const cachedData = priceCache.get(cacheKey);
  if (cachedData && isValidCache(cachedData)) {
    return NextResponse.json(cachedData.data);
  }

  return new Promise((resolve) => {
    const results: PriceData[] = [];
    let completedRequests = 0;

    regions.forEach((country) => {
      checkPrice(url, country, (err, priceData) => {
        completedRequests++;
        if (priceData) {
          results.push(priceData);
        }

        if (completedRequests === regions.length) {
          if (results.length > 0) {
            // Store in cache before returning
            priceCache.set(cacheKey, {
              timestamp: Date.now(),
              data: results,
            });
            resolve(NextResponse.json(results));
          } else {
            resolve(
              NextResponse.json(
                { error: "Price not found in any region" },
                { status: 404 }
              )
            );
          }
        }
      });
    });
  });
}
