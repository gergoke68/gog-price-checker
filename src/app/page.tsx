"use client";
import { useState } from "react";
import { columns } from "@/components/columns";
import { DataTable } from "@/components/data-table";

export default function Home() {
  const [url, setUrl] = useState("");
  const [prices, setPrices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCheckPrices = async () => {
    if (!url) return;
    setIsLoading(true);
    setError("");
    setPrices([]);

    try {
      const response = await fetch(`/api/price?url=${encodeURIComponent(url)}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "An error occurred while fetching prices");
        return;
      }

      setPrices(data);
    } catch (error) {
      setError("Network error: Could not connect to the server");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-8 bg-slate-800 text-slate-100">
      <h1 className="text-6xl font-bold mb-8">GOG Price Checker</h1>
      <div className="flex flex-col items-center">
        <div className="flex gap-4 items-center">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter URL"
            className="border p-2 rounded bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-400 w-[400px]"
          />
          <button
            onClick={handleCheckPrices}
            disabled={isLoading}
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 disabled:opacity-50 whitespace-nowrap"
          >
            {isLoading ? "Loading..." : "Check Prices"}
          </button>
        </div>
        {error && <div className="text-red-400 text-sm mt-2">{error}</div>}
      </div>

      {prices.length > 0 && (
        <div className="w-full max-w-4xl">
          <DataTable columns={columns} data={prices} />
        </div>
      )}
    </div>
  );
}
