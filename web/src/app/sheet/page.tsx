"use client";

import { useEffect, useState, useMemo } from "react";
import { getSheetData, SheetData } from "@/services/api";

export default function SheetPage() {
  const [data, setData] = useState<SheetData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    getSheetData()
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);

  const filteredRows = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase();
    let rows = q
      ? data.rows.filter((row) =>
          Object.values(row).some((v) => v?.toLowerCase().includes(q))
        )
      : data.rows;

    if (sortCol) {
      rows = [...rows].sort((a, b) => {
        const av = a[sortCol] ?? "";
        const bv = b[sortCol] ?? "";
        return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return rows;
  }, [data, search, sortCol, sortAsc]);

  function handleSort(col: string) {
    if (sortCol === col) {
      setSortAsc((prev) => !prev);
    } else {
      setSortCol(col);
      setSortAsc(true);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-1">
            Resource Sheet
          </h1>
          <p className="text-gray-500 text-sm">
            {data ? `${filteredRows.length} of ${data.rows.length} rows` : "Loading…"}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
            Failed to load sheet: {error}
          </div>
        )}

        {!data && !error && (
          <div className="flex items-center gap-3 text-gray-500">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Loading sheet data…
          </div>
        )}

        {data && (
          <>
            <div className="mb-5">
              <input
                type="text"
                placeholder="Search all columns…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full max-w-sm rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 shadow-sm outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>

            <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm bg-white">
              <table className="w-full text-sm text-left text-gray-700">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {data.headers.map((h) => (
                      <th
                        key={h}
                        onClick={() => handleSort(h)}
                        className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap cursor-pointer select-none hover:bg-gray-100 transition-colors"
                      >
                        <span className="flex items-center gap-1">
                          {h}
                          {sortCol === h ? (
                            <span className="text-green-500">
                              {sortAsc ? "↑" : "↓"}
                            </span>
                          ) : (
                            <span className="text-gray-300">↕</span>
                          )}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={data.headers.length}
                        className="px-4 py-10 text-center text-gray-400"
                      >
                        No rows match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row, i) => (
                      <tr
                        key={i}
                        className={`border-t border-gray-100 ${
                          i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                        } hover:bg-green-50/40 transition-colors`}
                      >
                        {data.headers.map((h) => (
                          <td key={h} className="px-4 py-3 align-top whitespace-pre-wrap max-w-xs">
                            {row[h] || (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <p className="mt-4 text-xs text-gray-400 text-right">
              Data fetched live from Google Sheets
            </p>
          </>
        )}
      </div>
    </main>
  );
}
