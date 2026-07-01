import { useState, useEffect, useCallback } from "react";
import { api } from "../../../lib/api";

const C = {
  bg: "#060610", surface: "#0f0f1e", surface2: "#16162b",
  border: "rgba(123,123,200,0.12)", accent: "#7c3aed",
  cyan: "#06b6d4", green: "#10b981", red: "#ef4444",
  amber: "#f59e0b", text: "#e2e2f0", muted: "#7b7b9a", gold: "#d4af37",
};

const REPORT_TYPES = [
  { value: "full",      label: "🌐 Full System Report",   desc: "AI usage + errors + bookings + chat + system stats" },
  { value: "ai-usage",  label: "🤖 AI Usage Report",      desc: "Provider stats, token consumption, success rates" },
  { value: "errors",    label: "🚨 Error Summary",         desc: "Error counts by severity, resolved vs unresolved" },
  { value: "bookings",  label: "📅 Booking Analytics",    desc: "Booking volume, status breakdown, services" },
  { value: "chat",      label: "💬 Chat Analysis",         desc: "Session count, message volume, engagement" },
];

const TYPE_COLOR = {
  full: C.accent,
  "ai-usage": C.cyan,
  errors: C.red,
  bookings: C.green,
  chat: C.amber,
};

export default function ReportCenter() {
  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [selectedType, setSelectedType] = useState("full");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [generating, setGenerating] = useState(false);
  const [latestResult, setLatestResult] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await api.techReports({ limit: 20 });
      setReports(data.reports || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleGenerate = async () => {
    setGenerating(true);
    setLatestResult(null);
    try {
      const report = await api.techGenerateReport({ type: selectedType, startDate, endDate });
      setLatestResult(report);
      load();
    } catch (err) {
      alert("Failed: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (id, type) => {
    try {
      const report = await api.techReportDetail(id);
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `havi-report-${type}-${id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Download failed: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this report?")) return;
    try {
      await api.techReportDelete(id);
      load();
      if (latestResult?.id === id) setLatestResult(null);
    } catch (err) {
      alert("Failed: " + err.message);
    }
  };

  const inputStyle = {
    padding: "8px 12px", borderRadius: 8,
    background: C.surface2, border: `1px solid ${C.border}`,
    color: C.text, fontSize: 13, outline: "none",
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: C.text }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #d4af37, #f59e0b)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📊</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Report Center</h1>
            <p style={{ margin: 0, fontSize: 13, color: C.muted }}>{total} report{total !== 1 ? "s" : ""} generated · Download as JSON</p>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        {/* Generator Panel */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 18 }}>⚡ Generate New Report</div>

          {/* Report type selector */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Report Type</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {REPORT_TYPES.map((t) => (
                <label key={t.value} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderRadius: 10, border: `1px solid ${selectedType === t.value ? TYPE_COLOR[t.value] || C.accent : C.border}`, background: selectedType === t.value ? `${(TYPE_COLOR[t.value] || C.accent)}18` : "transparent", cursor: "pointer", transition: "all 0.15s" }}>
                  <input type="radio" name="reportType" value={t.value} checked={selectedType === t.value} onChange={() => setSelectedType(t.value)} style={{ marginTop: 2, accentColor: TYPE_COLOR[t.value] || C.accent }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: selectedType === t.value ? TYPE_COLOR[t.value] || C.accent : C.text }}>{t.label}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{t.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Date range */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Date Range</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>From</div>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ ...inputStyle, width: "100%", boxSizing: "border-box", colorScheme: "dark" }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>To</div>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ ...inputStyle, width: "100%", boxSizing: "border-box", colorScheme: "dark" }} />
              </div>
            </div>
          </div>

          <button onClick={handleGenerate} disabled={generating} style={{ width: "100%", padding: "12px 0", borderRadius: 12, background: generating ? "rgba(124,58,237,0.3)" : "linear-gradient(135deg, #7c3aed, #06b6d4)", border: "none", color: "#fff", fontWeight: 700, fontSize: 14, cursor: generating ? "not-allowed" : "pointer", letterSpacing: 0.5 }}>
            {generating ? "⏳ Generating…" : "📊 Generate Report"}
          </button>
        </div>

        {/* Latest Result Preview */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, overflow: "auto", maxHeight: 480 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>📄 Latest Result</div>
          {!latestResult && (
            <div style={{ textAlign: "center", padding: "40px 0", color: C.muted }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📊</div>
              <div>Generate a report to see the preview here</div>
            </div>
          )}
          {latestResult && (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <span style={{ background: `${TYPE_COLOR[latestResult.type] || C.accent}18`, color: TYPE_COLOR[latestResult.type] || C.accent, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{latestResult.type}</span>
                <span style={{ color: C.muted, fontSize: 11, padding: "3px 0" }}>{new Date(latestResult.generatedAt).toLocaleString()}</span>
                <button onClick={() => handleDownload(latestResult.id, latestResult.type)} style={{ marginLeft: "auto", padding: "3px 12px", borderRadius: 8, background: "rgba(16,185,129,0.12)", border: `1px solid ${C.green}`, color: C.green, fontSize: 11, cursor: "pointer", fontWeight: 600 }}>⬇ Download</button>
              </div>
              {/* Render result sections */}
              {latestResult.result && Object.entries(latestResult.result).map(([section, data]) => (
                <div key={section} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, paddingBottom: 6, borderBottom: `1px solid ${C.border}` }}>{section}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 6 }}>
                    {Object.entries(data || {}).map(([k, v]) => (
                      <div key={k} style={{ background: C.surface2, borderRadius: 8, padding: "8px 10px" }}>
                        <div style={{ fontSize: 10, color: C.muted, textTransform: "capitalize", marginBottom: 2 }}>{k.replace(/([A-Z])/g, " $1")}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                          {typeof v === "object" ? JSON.stringify(v) : String(v)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* History Table */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>📋 Report History ({total})</div>
        {reports.length === 0 ? (
          <div style={{ textAlign: "center", padding: 30, color: C.muted, fontSize: 13 }}>No reports generated yet</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Type", "Date Range", "Generated", "Actions"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "6px 12px", borderBottom: `1px solid ${C.border}`, color: C.muted, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} style={{ borderBottom: `1px solid rgba(123,123,200,0.06)` }}>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ background: `${TYPE_COLOR[r.type] || C.accent}18`, color: TYPE_COLOR[r.type] || C.accent, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{r.type}</span>
                    </td>
                    <td style={{ padding: "10px 12px", color: C.muted, fontSize: 12 }}>
                      {r.params?.startDate ? `${new Date(r.params.startDate).toLocaleDateString()} → ${new Date(r.params.endDate).toLocaleDateString()}` : "—"}
                    </td>
                    <td style={{ padding: "10px 12px", color: C.muted, fontSize: 12 }}>{new Date(r.generatedAt).toLocaleString()}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => handleDownload(r.id, r.type)} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid rgba(16,185,129,0.3)`, background: "rgba(16,185,129,0.1)", color: C.green, fontSize: 11, cursor: "pointer" }}>⬇ Download</button>
                        <button onClick={() => handleDelete(r.id)} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid rgba(239,68,68,0.3)`, background: "rgba(239,68,68,0.1)", color: C.red, fontSize: 11, cursor: "pointer" }}>✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
