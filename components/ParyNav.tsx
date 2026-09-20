"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Pasek rodziny „Dla par" — spina narzędzia dla dwojga. Data ślubu to
 * funkcja astrologii wedyjskiej, której VesicaKarma (jeszcze) nie ma —
 * świadomie linkujemy na zewnątrz, do 9dom, zamiast dublować kod.
 */
const POZYCJE = [
  { href: "/dopasowanie", label: "Dopasowanie (Guna Milan)", zewnetrzny: false },
  { href: "https://9dom.pl/data-slubu", label: "Data ślubu", zewnetrzny: true },
  { href: "/dopasowanie#miejsca-pary", label: "Miejsca dla pary", zewnetrzny: false },
  { href: "/numerologia-partnerska", label: "Numerologia partnerska", zewnetrzny: false },
];

export default function ParyNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Narzędzia dla par" style={{
      display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center",
      margin: "0 auto 26px",
    }}>
      {POZYCJE.map((p) => {
        const on = !p.zewnetrzny && !p.href.includes("#") && pathname.startsWith(p.href);
        const styl: React.CSSProperties = {
          padding: "8px 16px", fontSize: "0.85rem", textDecoration: "none",
          background: on ? "rgba(230,196,138,0.12)" : "transparent",
          borderColor: on ? "var(--line-gold)" : "var(--line-soft)",
          color: on ? "var(--primary-soft)" : "var(--muted)",
        };
        return p.zewnetrzny ? (
          <a key={p.href} href={p.href} className="badge" style={styl}>{p.label}</a>
        ) : (
          <Link key={p.href} href={p.href} className="badge" style={styl}>{p.label}</Link>
        );
      })}
    </nav>
  );
}
