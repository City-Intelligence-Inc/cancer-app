"use client";

import { useEffect, useState, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://iutm2kyhqq.us-east-1.awsapprunner.com";

interface SyncStatus {
  sheetCount: number;
  dbCount: number;
  inSync: number;
  inSheetOnly: string[];
  inDbOnly: string[];
  lastSynced: string | null;
}

interface DbResource {
  resourceId: string;
  name: string;
  helpTypes: string[];
  cancerTypes: string[];
  cities: string[];
  countries: string[];
  entireCountry: boolean;
  patientCarer: string;
  treatmentStage: string;
  websiteUrl: string;
  syncedAt: string;
}

interface SheetRow {
  [key: string]: string;
}

export default function AdminPage() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [dbResources, setDbResources] = useState<DbResource[]>([]);
  const [sheetRows, setSheetRows] = useState<SheetRow[]>([]);
  const [sheetHeaders, setSheetHeaders] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"status" | "sheet" | "dynamo">("status");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statusRes, resourcesRes, sheetRes] = await Promise.all([
        fetch(`${API_URL}/sync-status`),
        fetch(`${API_URL}/resources`),
        fetch(`${API_URL}/sheet-data`),
      ]);
      if (statusRes.ok) setSyncStatus(await statusRes.json());
      if (resourcesRes.ok) {
        const data = await resourcesRes.json();
        setDbResources(data.resources || []);
      }
      if (sheetRes.ok) {
        const data = await sheetRes.json();
        setSheetHeaders(data.headers || []);
        setSheetRows(data.rows || []);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch(`${API_URL}/sync-resources`, { method: "POST" });
      const data = await res.json();
      setSyncResult(`Synced ${data.synced} resources, skipped ${data.skipped}`);
      await fetchAll();
    } catch (e) {
      setSyncResult(`Sync failed: ${e}`);
    }
    setSyncing(false);
  };

  const tabClass = (t: string) =>
    `px-4 py-2 text-sm font-semibold rounded-lg cursor-pointer transition-colors ${
      tab === t ? "bg-sage text-white" : "bg-white text-text-primary hover:bg-chip-bg"
    }`;

  return (
    <main className="min-h-screen bg-warm-bg px-6 py-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-text-primary mb-1">Sheet &harr; DynamoDB Sync</h1>
            <p className="text-sm text-text-secondary">
              Live view of Google Sheet and DynamoDB resource table
            </p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="bg-sage text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-sage-light disabled:opacity-50 cursor-pointer transition-colors"
          >
            {syncing ? "Syncing..." : "Sync Now"}
          </button>
        </div>

        {syncResult && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 mb-6 text-sm">
            {syncResult}
          </div>
        )}

        {/* Sync status cards */}
        {syncStatus && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Card label="Sheet Rows" value={syncStatus.sheetCount} />
            <Card label="DynamoDB Items" value={syncStatus.dbCount} />
            <Card label="In Sync" value={syncStatus.inSync} color="green" />
            <Card label="Sheet Only" value={syncStatus.inSheetOnly.length} color={syncStatus.inSheetOnly.length > 0 ? "amber" : "green"} />
            <Card label="DB Only" value={syncStatus.inDbOnly.length} color={syncStatus.inDbOnly.length > 0 ? "amber" : "green"} />
          </div>
        )}

        {syncStatus?.lastSynced && (
          <p className="text-xs text-text-secondary mb-6">
            Last synced: {new Date(syncStatus.lastSynced).toLocaleString()}
          </p>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button className={tabClass("status")} onClick={() => setTab("status")}>Sync Details</button>
          <button className={tabClass("sheet")} onClick={() => setTab("sheet")}>Google Sheet ({sheetRows.length})</button>
          <button className={tabClass("dynamo")} onClick={() => setTab("dynamo")}>DynamoDB ({dbResources.length})</button>
        </div>

        {loading && (
          <div className="flex items-center gap-3 text-text-secondary py-10">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-sage" />
            Loading...
          </div>
        )}

        {/* Sync Details */}
        {tab === "status" && syncStatus && !loading && (
          <div className="space-y-6">
            {syncStatus.inSheetOnly.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h3 className="font-semibold text-amber-800 mb-2">
                  In Sheet but NOT in DynamoDB ({syncStatus.inSheetOnly.length})
                </h3>
                <p className="text-sm text-amber-700 mb-2">These need syncing:</p>
                <div className="flex flex-wrap gap-2">
                  {syncStatus.inSheetOnly.map((id) => (
                    <span key={id} className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-mono">
                      ID {id}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {syncStatus.inDbOnly.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <h3 className="font-semibold text-red-800 mb-2">
                  In DynamoDB but NOT in Sheet ({syncStatus.inDbOnly.length})
                </h3>
                <p className="text-sm text-red-700 mb-2">These were removed from the sheet:</p>
                <div className="flex flex-wrap gap-2">
                  {syncStatus.inDbOnly.map((id) => (
                    <span key={id} className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-mono">
                      ID {id}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {syncStatus.inSheetOnly.length === 0 && syncStatus.inDbOnly.length === 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <p className="text-2xl mb-2">&#10003;</p>
                <h3 className="font-semibold text-green-800">Everything is in sync</h3>
                <p className="text-sm text-green-700 mt-1">
                  {syncStatus.inSync} resources match between Sheet and DynamoDB
                </p>
              </div>
            )}
          </div>
        )}

        {/* Sheet table */}
        {tab === "sheet" && !loading && (
          <div className="overflow-x-auto rounded-2xl border border-border shadow-sm bg-white">
            <table className="w-full text-sm text-left text-text-primary">
              <thead className="bg-chip-bg border-b border-border">
                <tr>
                  {sheetHeaders.map((h) => (
                    <th key={h} className="px-4 py-3 font-semibold text-text-secondary whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sheetRows.map((row, i) => (
                  <tr key={i} className={`border-t border-border ${i % 2 === 0 ? "bg-white" : "bg-warm-bg/50"}`}>
                    {sheetHeaders.map((h) => (
                      <td key={h} className="px-4 py-3 align-top whitespace-pre-wrap max-w-xs text-sm">
                        {row[h] || <span className="text-text-secondary/40">&mdash;</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* DynamoDB table */}
        {tab === "dynamo" && !loading && (
          <div className="overflow-x-auto rounded-2xl border border-border shadow-sm bg-white">
            <table className="w-full text-sm text-left text-text-primary">
              <thead className="bg-chip-bg border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-semibold text-text-secondary">ID</th>
                  <th className="px-4 py-3 font-semibold text-text-secondary">Name</th>
                  <th className="px-4 py-3 font-semibold text-text-secondary">Help Types</th>
                  <th className="px-4 py-3 font-semibold text-text-secondary">Cancer Types</th>
                  <th className="px-4 py-3 font-semibold text-text-secondary">Cities</th>
                  <th className="px-4 py-3 font-semibold text-text-secondary">Countries</th>
                  <th className="px-4 py-3 font-semibold text-text-secondary">UK-wide</th>
                  <th className="px-4 py-3 font-semibold text-text-secondary">Patient/Carer</th>
                  <th className="px-4 py-3 font-semibold text-text-secondary">Stage</th>
                  <th className="px-4 py-3 font-semibold text-text-secondary">Synced At</th>
                </tr>
              </thead>
              <tbody>
                {dbResources
                  .sort((a, b) => (a.resourceId ?? "").localeCompare(b.resourceId ?? "", undefined, { numeric: true }))
                  .map((r, i) => (
                  <tr key={r.resourceId} className={`border-t border-border ${i % 2 === 0 ? "bg-white" : "bg-warm-bg/50"}`}>
                    <td className="px-4 py-3 font-mono text-xs">{r.resourceId}</td>
                    <td className="px-4 py-3 font-medium max-w-xs">{r.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(r.helpTypes || []).map((t) => (
                          <span key={t} className="bg-chip-bg text-sage text-xs px-2 py-0.5 rounded-full">{t}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">{(r.cancerTypes || []).join(", ") || "All"}</td>
                    <td className="px-4 py-3 text-xs">{(r.cities || []).join(", ") || "—"}</td>
                    <td className="px-4 py-3 text-xs">{(r.countries || []).join(", ") || "—"}</td>
                    <td className="px-4 py-3 text-xs">{r.entireCountry ? "Yes" : "No"}</td>
                    <td className="px-4 py-3 text-xs">{r.patientCarer}</td>
                    <td className="px-4 py-3 text-xs">{r.treatmentStage}</td>
                    <td className="px-4 py-3 text-xs text-text-secondary">
                      {r.syncedAt ? new Date(r.syncedAt).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

function Card({ label, value, color = "default" }: { label: string; value: number; color?: string }) {
  const colors: Record<string, string> = {
    default: "bg-white border-border",
    green: "bg-green-50 border-green-200",
    amber: "bg-amber-50 border-amber-200",
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color] || colors.default}`}>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="text-xs text-text-secondary mt-1">{label}</p>
    </div>
  );
}
