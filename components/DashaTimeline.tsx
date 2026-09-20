"use client";

import { useState } from "react";
import { GRAHAS } from "@/lib/astro/constants";
import type { DashaPeriod } from "@/lib/astro/dasha";

const fmt = (d: Date) =>
  d.toLocaleDateString("pl-PL", { year: "numeric", month: "2-digit", day: "2-digit" });

function PeriodRow({ p, depth }: { p: DashaPeriod; depth: number }) {
  const [open, setOpen] = useState(false);
  const now = new Date();
  const active = now >= p.start && now < p.end;
  const g = GRAHAS[p.lord];
  return (
    <div style={{ marginLeft: depth * 20 }}>
      <button
        onClick={() => p.sub && setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: 10, width: "100%",
          background: active ? "rgba(201,162,39,0.10)" : "transparent",
          border: "none", borderLeft: active ? "2px solid var(--primary)" : "2px solid transparent",
          color: "var(--text)", padding: "8px 10px", cursor: p.sub ? "pointer" : "default",
          fontFamily: "var(--font-sans)", fontSize: "0.95rem", textAlign: "left",
          borderRadius: 6,
        }}
      >
        <span style={{ color: g.color, fontSize: "1.1rem", width: 22 }}>{g.symbol}</span>
        <span style={{ minWidth: 90, fontWeight: active ? 700 : 400 }}>{g.pl}</span>
        <span className="muted" style={{ fontVariantNumeric: "tabular-nums" }}>
          {fmt(p.start)} — {fmt(p.end)}
        </span>
        {active && <span className="badge" style={{ marginLeft: "auto" }}>teraz</span>}
        {p.sub && <span className="muted" style={{ marginLeft: active ? 8 : "auto" }}>{open ? "▾" : "▸"}</span>}
      </button>
      {open && p.sub?.map((s, i) => <PeriodRow key={i} p={s} depth={depth + 1} />)}
    </div>
  );
}

export default function DashaTimeline({ periods, birth }: { periods: DashaPeriod[]; birth: Date }) {
  // Ukryj część pierwszej mahadaszy sprzed urodzenia w prezentacji dat
  const visible = periods.map((p, i) =>
    i === 0 && p.start < birth ? { ...p, start: birth } : p,
  );
  return (
    <div>
      {visible.map((p, i) => (
        <PeriodRow key={i} p={p} depth={0} />
      ))}
    </div>
  );
}
