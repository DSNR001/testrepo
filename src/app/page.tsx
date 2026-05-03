"use client";

import { useState, useCallback } from "react";
import { getSupabase } from "@/lib/supabase/supabase";
import type { HSNMasterRow } from "@/lib/supabase/types";
export const dynamic = "force-dynamic";
export default function HomePage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<HSNMasterRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [copied, setCopied] = useState<Record<string, boolean>>({});

  const search = useCallback(async () => {
    const term = query.trim();
    if (!term) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const supabase = getSupabase();
      const pattern = `%${term}%`;
      const isNumeric = /^\d{2,8}$/.test(term.trim());
      if (isNumeric) {
        const { data: exact, error: errExact } = await supabase
          .from("hsn_master")
          .select("hsn_code, description, gst_rate, condition_type, notes, keywords,level, category")
          .ilike("hsn_code", `${term}%`)
          .limit(100);
        if (errExact) throw errExact;
        const exactFiltered = (exact ?? []).filter(
  (row) =>
    String(row.hsn_code).startsWith(term) &&
    String(row.hsn_code).slice(0, term.length) === term
);
        const { data: like, error: errLike } = await supabase
          .from("hsn_master")
          .select('hsn_code, description, gst_rate, condition_type, notes, keywords, level, category')
          .or(`hsn_code.ilike."%${term}%",description.ilike."%${term}%"`)
          .limit(200);
        if (errLike) throw errLike;
        const likeFiltered = (like ?? []).filter(
  (row) =>
    String(row.hsn_code).startsWith(term) &&
    String(row.hsn_code).slice(0, term.length) === term
);
        console.log("LIKE DATA:", like);
        const combined = ([...exactFiltered, ...likeFiltered] as HSNMasterRow[]).filter((row) => !!row);
        const seen = new Set<string>();
const merged = combined.filter((row) => {
  const uniqueKey = `${row.hsn_code}-${row.description}-${row.gst_rate}`;
  if (seen.has(uniqueKey)) return false;
  seen.add(uniqueKey);
  return true;
});
        console.log("SUPABASE MERGED:", merged);
        setResults(merged);
      } else {
        const { data, error } = await supabase
          .from("hsn_master")
          .select("hsn_code, description, gst_rate, condition_type, notes, keywords, level, category")
          .or(`hsn_code.ilike."%${term}%",description.ilike."%${term}%"`)
          .limit(50);
        if (error) throw error;
        console.log("LIVE DATA:", data);
        console.log("SUPABASE DATA:", data);
        setResults((data as HSNMasterRow[]) ?? []);
      }
    } catch (err) {
      console.error("HSN search error:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleCopy = async (text: string, key: string) => {
        try {
      await navigator.clipboard.writeText(text);
      setCopied((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopied((prev) => ({ ...prev, [key]: false }));
      }, 1200);
    } catch {}
  };

  const parentResults = results.filter(
  (row) => String(row.hsn_code).length < 8
);

const detailedResults = results.filter(
  (row) => String(row.hsn_code).length === 8
);
return (
    <main className="min-h-screen flex flex-col items-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-center text-surface-900 dark:text-surface-100">
          QuickHSN.in
        </h1>
        <p className="text-center text-surface-600 dark:text-surface-400 text-sm sm:text-base">
          HSN code lookup for GST
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="search"
            placeholder="Search by HSN code or description..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            className="flex-1 min-w-0 rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 px-4 py-3 text-base placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            aria-label="Search HSN code or description"
          />
          <button
            type="button"
            onClick={search}
            disabled={loading}
            className="rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium px-5 py-3 text-base whitespace-nowrap"
          >
            {loading ? "Searching…" : "Search"}
          </button>
        </div>

        {loading && (
          <p className="text-center text-surface-500 dark:text-surface-400 text-sm">
            Searching…
          </p>
        )}

        {searched && !loading && (
          <section className="flex flex-col gap-3" aria-live="polite">
            <h2 className="text-sm font-medium text-surface-600 dark:text-surface-400">
              {results.length === 0
                ? "No results"
                : `${results.length} result${results.length === 1 ? "" : "s"}`}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              <>
  {searched && !loading && (
  <div className="text-sm text-surface-600 dark:text-surface-400 mb-4">
    Showing {results.length} results ({parentResults.length} category + {detailedResults.length} detailed)
  </div>
)}
{searched && !loading && results.length === 0 && (
  <div className="text-sm text-center text-surface-500 mt-6 space-y-2">
    <div>No matching HSN results found</div>
    <div className="text-xs">
      Try:
      <br />
      • Use 2-digit chapter (e.g., 10 for cereals)
      <br />
      • Use product name (e.g., sugar, rice)
      <br />
      • Check spelling
    </div>
  </div>
)}
  <h2 className="text-lg font-semibold mb-3">
      Category Match (4/6 digit HSN) ({parentResults.length})
  </h2>
   <div className="text-xs text-surface-500">
  </div>
<div className="text-xs text-surface-500">
</div>
  {parentResults.map((row, i) => {              
                const key = row.hsn_code + String(i);
                const displayRate = typeof row.gst_rate === "number" ? row.gst_rate ?? 0 : Number(row.gst_rate) || 0;
                const mathRate = displayRate;
                const amt = amounts[key] ?? 0;
                const gstAmt = (amt * mathRate) / 100;
                const cgstAmt = (amt * mathRate) / 200;
                const sgstAmt = (amt * mathRate) / 200;
                const igstAmt = gstAmt;
                const total = amt + gstAmt;
                {amt > 0 && (
  <div className="mt-3 text-sm text-surface-700 dark:text-surface-300 space-y-1">
    <div>GST ({mathRate}%): ₹{gstAmt.toFixed(2)}</div>
    <div>CGST: ₹{cgstAmt.toFixed(2)}</div>
    <div>SGST: ₹{sgstAmt.toFixed(2)}</div>
    <div>IGST: ₹{igstAmt.toFixed(2)}</div>
    <div className="font-medium mt-1">
      Total: ₹{total.toFixed(2)}
    </div>
  </div>
)}
                return (
                  <li
                    key={key}
                    className="rounded-lg border-l-4 border-blue-500 border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-800 p-4 shadow-card hover:shadow-card-hover transition-shadow" 
                    >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
  <div className="font-mono font-medium text-primary-600 dark:text-primary-400">
    {row.hsn_code}
  </div>

  <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
    {String(row.hsn_code).length === 4 ? "4-digit" : "6-digit"}
  </span>
</div>
                      <button
                        type="button"
                        onClick={() => handleCopy(String(row.hsn_code), key)}
                        className="rounded-md border border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-200 px-3 py-1.5 text-xs font-medium hover:bg-surface-200 dark:hover:bg-surface-700"
                        aria-label="Copy HSN code"
                      >
                        {copied[key] ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <div className="mt-1 text-sm text-surface-700 dark:text-surface-300">
                      {row.description}
                    </div>
                    {row.gst_rate != null && (
  <div className="mt-2 text-xs text-surface-500 dark:text-surface-400">
    GST Rate: <span className="font-medium">{row.gst_rate}%</span>
  </div>
                    )}
                    {row.condition_type && (
  <div className="mt-2 text-xs text-surface-500 dark:text-surface-400">
    Condition Type: {row.condition_type}
  </div>
)}
                   
                    {row.notes && (
  <div className="mt-2 text-xs text-surface-500 dark:text-surface-400">
    Note: {row.notes}
  </div>
)}
                    
                      <div className="mt-3 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          inputMode="decimal"
                          placeholder="Enter Price"
                          value={amt || ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            const n = v === "" ? 0 : Number(v);
                            setAmounts((prev) => ({ ...prev, [key]: Number.isFinite(n) ? n : 0 }));
                          }}
                          className="flex-1 rounded-md border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 px-3 py-2 text-sm placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          aria-label="Enter Price"
                        />
                        <div className="text-xs text-surface-500 dark:text-surface-400 whitespace-nowrap">{displayRate}% GST</div>
                      </div>
                      
                        <div className="text-xs text-amber-700 dark:text-amber-400">
                          
                        </div>
                        <div className="text-sm text-surface-700 dark:text-surface-300">
                        Price ₹{amt.toFixed(2)} + GST ₹{gstAmt.toFixed(2)} = <span className="font-medium">Total ₹{total.toFixed(2)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-md bg-surface-100 dark:bg-surface-800 p-2">
                          <div className="text-surface-600 dark:text-surface-400">CGST</div>
                          <div className="font-medium text-surface-900 dark:text-surface-100">₹{cgstAmt.toFixed(2)}</div>
                        </div>
                        <div className="rounded-md bg-surface-100 dark:bg-surface-800 p-2">
                          <div className="text-surface-600 dark:text-surface-400">SGST</div>
                          <div className="font-medium text-surface-900 dark:text-surface-100">₹{sgstAmt.toFixed(2)}</div>
                        </div>
                        <div className="rounded-md bg-surface-100 dark:bg-surface-800 p-2">
                          <div className="text-surface-600 dark:text-surface-400">IGST</div>
                          <div className="font-medium text-surface-900 dark:text-surface-100">₹{igstAmt.toFixed(2)}</div>
                        </div>
                        <div className="rounded-md bg-surface-100 dark:bg-surface-800 p-2">
                          <div className="text-surface-600 dark:text-surface-400">Total</div>
                          <div className="font-medium text-surface-900 dark:text-surface-100">₹{total.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
              </>
              <>
  <h2 className="text-lg font-semibold mt-6 mb-3">
    Suggested Detailed 8-digit HSN Codes ({detailedResults.length})
  </h2>
  <div className="text-xs text-surface-500">
  </div>
  {detailedResults.map((row, i) => {
                const key = row.hsn_code + String(i);
                const displayRate = typeof row.gst_rate === "number" ? row.gst_rate ?? 0 : Number(row.gst_rate) || 0;
                const mathRate = displayRate;
                const amt = amounts[key] ?? 0;
                const gstAmt = (amt * mathRate) / 100;
                const cgstAmt = (amt * mathRate) / 200;
                const sgstAmt = (amt * mathRate) / 200;
                const igstAmt = gstAmt;
                const total = amt + gstAmt;
                {amt > 0 && (
  <div className="mt-3 text-sm text-surface-700 dark:text-surface-300 space-y-1">
    <div>GST ({mathRate}%): ₹{gstAmt.toFixed(2)}</div>
    <div>CGST: ₹{cgstAmt.toFixed(2)}</div>
    <div>SGST: ₹{sgstAmt.toFixed(2)}</div>
    <div>IGST: ₹{igstAmt.toFixed(2)}</div>
    <div className="font-medium mt-1">
      Total: ₹{total.toFixed(2)}
    </div>
  </div>
)}
                return (
                  <li
                    key={key}
                    className="rounded-lg border-l-4 border-green-500 border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-800 p-4 shadow-card hover:shadow-card-hover transition-shadow"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
  <div className="font-mono font-medium text-primary-600 dark:text-primary-400">
    {row.hsn_code}
  </div>

  <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
    8-digit
  </span>
</div>
                      <button
                        type="button"
                        onClick={() => handleCopy(String(row.hsn_code), key)}
                        className="rounded-md border border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-200 px-3 py-1.5 text-xs font-medium hover:bg-surface-200 dark:hover:bg-surface-700"
                        aria-label="Copy HSN code"
                      >
                        {copied[key] ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <div className="mt-1 text-sm text-surface-700 dark:text-surface-300">
                      {row.description}
                    </div>
                    {row.gst_rate != null && (
  <div className="mt-2 text-xs text-surface-500 dark:text-surface-400">
    GST Rate: <span className="font-medium">{row.gst_rate}%</span>
  </div>
                    )}
                    {row.condition_type && (
  <div className="mt-2 text-xs text-surface-500 dark:text-surface-400">
    Condition Type: {row.condition_type}
  </div>
)}
                    {row.notes && (
  <div className="mt-2 text-xs text-surface-500 dark:text-surface-400">
    Note: {row.notes}
  </div>
)}                    
                      <div className="mt-3 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          inputMode="decimal"
                          placeholder="Enter Price"
                          value={amt || ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            const n = v === "" ? 0 : Number(v);
                            setAmounts((prev) => ({ ...prev, [key]: Number.isFinite(n) ? n : 0 }));
                          }}
                          className="flex-1 rounded-md border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 px-3 py-2 text-sm placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          aria-label="Enter Price"
                        />
                        <div className="text-xs text-surface-500 dark:text-surface-400 whitespace-nowrap">{displayRate}% GST</div>
                      </div>
                      
                        <div className="text-xs text-amber-700 dark:text-amber-400">
                          
                        </div>
                        <div className="text-sm text-surface-700 dark:text-surface-300">
                        Price ₹{amt.toFixed(2)} + GST ₹{gstAmt.toFixed(2)} = <span className="font-medium">Total ₹{total.toFixed(2)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-md bg-surface-100 dark:bg-surface-800 p-2">
                          <div className="text-surface-600 dark:text-surface-400">CGST</div>
                          <div className="font-medium text-surface-900 dark:text-surface-100">₹{cgstAmt.toFixed(2)}</div>
                        </div>
                        <div className="rounded-md bg-surface-100 dark:bg-surface-800 p-2">
                          <div className="text-surface-600 dark:text-surface-400">SGST</div>
                          <div className="font-medium text-surface-900 dark:text-surface-100">₹{sgstAmt.toFixed(2)}</div>
                        </div>
                        <div className="rounded-md bg-surface-100 dark:bg-surface-800 p-2">
                          <div className="text-surface-600 dark:text-surface-400">IGST</div>
                          <div className="font-medium text-surface-900 dark:text-surface-100">₹{igstAmt.toFixed(2)}</div>
                        </div>
                        <div className="rounded-md bg-surface-100 dark:bg-surface-800 p-2">
                          <div className="text-surface-600 dark:text-surface-400">Total</div>
                          <div className="font-medium text-surface-900 dark:text-surface-100">₹{total.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
    })}
</>
            </ul>            
          </section>
        )}
      </div>
      {searched && (
  <div className="mt-8 text-xs text-justified text-surface-500 dark:text-surface-400 border-t pt-4">
    Disclaimer: The information provided on QuickHSN.in is for general informational 
        purposes only. While we strive for accuracy, HSN codes and GST rates are subject to 
        government changes. We do not warrant the completeness or accuracy of this data. 
        Users must verify all information with official government sources or a qualified 
        tax professional before making financial decisions. QuickHSN.in is not liable for any 
        inaccuracies or financial losses.
  </div>
)}

    </main>
  );
}
