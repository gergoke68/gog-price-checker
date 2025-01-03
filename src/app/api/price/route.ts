import https from "https";
import * as cheerio from "cheerio";
import { NextResponse } from "next/server";
import regions from "./regions";

interface PriceData {
  country: string;
  price: number;
}

function checkPrice(
  url: string,
  country: string,
  callback: (err: Error | null, priceData: PriceData | null) => void
) {
  const options = {
    hostname: "www.gog.com",
    path: url, // Use the provided URL parameter
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url || !/^https:\/\/www\.gog\.com(\/en)?\/game\/[\w_]+$/.test(url)) {
    return NextResponse.json(
      { error: "Invalid GOG game URL. Expected format: https://www.gog.com/game/game_name or https://www.gog.com/en/game/game_name" },
      { status: 400 }
    );
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
