"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Nagłówek VesicaKarma — sam wordmark + hamburger, bez paska linków jak w 9dom
 * (na razie tylko dwie pozycje w menu, nie potrzeba osobnego nav-desktop).
 * Hamburger/drawer to ten sam wzorzec co czas-duszy/components/SiteHeader.tsx
 * (klasy .nav-burger/.nav-mobile), tu wymuszony na każdej szerokości w CSS.
 */
export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const [poprzedniPathname, setPoprzedniPathname] = useState(pathname);
  if (pathname !== poprzedniPathname) {
    setPoprzedniPathname(pathname);
    setOpen(false);
  }

  return (
    <header style={{ padding: "20px 0", position: "relative" }}>
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ display: "block" }}>
          <img src="/brand/logo-vesicakarma.png" alt="vesicakarma.com" style={{ height: 22, width: "auto", display: "block" }} />
        </Link>

        <button
          className={`nav-burger ${open ? "open" : ""}`}
          onClick={() => setOpen(!open)}
          aria-label={open ? "Zamknij menu" : "Otwórz menu"}
          aria-expanded={open}
        >
          <span /><span /><span />
        </button>
      </div>

      <nav className={`nav-mobile ${open ? "open" : ""}`} aria-label="Nawigacja" style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20 }}>
        <Link href="/konto" className={pathname === "/konto" ? "active" : ""}>Moje konto</Link>
        <Link href="/logowanie" className={pathname === "/logowanie" ? "active" : ""}>Zaloguj</Link>
      </nav>
    </header>
  );
}
