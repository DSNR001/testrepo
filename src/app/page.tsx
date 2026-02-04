"use client";

import { useState, useCallback } from "react";
import { getSupabase } from "@/lib/supabase";
import type { HSNMasterRow } from "@/lib/supabase/types";

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
      const isNumeric = /^\d+$/.test(term);
      if (isNumeric) {
        const { data: exact, error: errExact } = await supabase
          .from("hsn_master")
          .select('"HSN_CD", "HSN_Description", "GST Rate", gst_math_rate, is_conditional')
          .eq("HSN_CD", term)
          .limit(1);
        if (errExact) throw errExact;
        const { data: like, error: errLike } = await supabase
          .from("hsn_master")
          .select('"HSN_CD", "HSN_Description", "GST Rate", gst_math_rate, is_conditional')
          .or(`"HSN_CD".ilike.${pattern},"HSN_Description".ilike.${pattern}`)
          .limit(50);
        if (errLike) throw errLike;
        const combined = ([...(exact ?? []), ...(like ?? [])] as HSNMasterRow[]).filter((row) => !!row);
        const seen = new Set<string>();
        const merged = combined.filter((row) => {
          const code = String(row.HSN_CD);
          if (seen.has(code)) return false;
          seen.add(code);
          return true;
        });
        setResults(merged);
      } else {
        const { data, error } = await supabase
          .from("hsn_master")
          .select('"HSN_CD", "HSN_Description", "GST Rate", gst_math_rate, is_conditional')
          .or(`"HSN_CD".ilike.${pattern},"HSN_Description".ilike.${pattern}`)
          .limit(50);
        if (error) throw error;
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
              {results.map((row, i) => {
                const key = row.HSN_CD + String(i);
                const displayRate = typeof row["GST Rate"] === "number" ? row["GST Rate"] ?? 0 : Number(row["GST Rate"]) || 0;
                const rawMathRate = typeof row.gst_math_rate === "number" ? row.gst_math_rate ?? 0 : Number(row.gst_math_rate) || 0;
                const mathRate = rawMathRate > 0 ? rawMathRate : (row.is_conditional ? 5 : 0);
                const amt = amounts[key] ?? 0;
                const gstAmt = (amt * mathRate) / 100;
                const cgstAmt = (amt * mathRate) / 200;
                const sgstAmt = (amt * mathRate) / 200;
                const igstAmt = gstAmt;
                const total = amt + gstAmt;
                const usingPlaceholder = rawMathRate === 0 && !!row.is_conditional;
                return (
                  <li
                    key={key}
                    className="rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-800 p-4 shadow-card hover:shadow-card-hover transition-shadow"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-mono font-medium text-primary-600 dark:text-primary-400">
                        {row.HSN_CD}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(String(row.HSN_CD), key)}
                        className="rounded-md border border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-200 px-3 py-1.5 text-xs font-medium hover:bg-surface-200 dark:hover:bg-surface-700"
                        aria-label="Copy HSN code"
                      >
                        {copied[key] ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <div className="mt-1 text-sm text-surface-700 dark:text-surface-300">
                      {row.HSN_Description}
                    </div>
                    {"GST Rate" in row && row["GST Rate"] != null && (
                      <div className="mt-2 text-xs text-surface-500 dark:text-surface-400">
                        GST Rate: <span className="font-medium">{row["GST Rate"]}%</span>
                      </div>
                    )}
                    {row.is_conditional ? (
                      <div className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                        ⚠️ Multiple rates may apply based on conditions.
                      </div>
                    ) : null}
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
                      {usingPlaceholder ? (
                        <div className="text-xs text-amber-700 dark:text-amber-400">
                          Using placeholder 5% for calculation — please verify.
                        </div>
                      ) : null}
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
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
