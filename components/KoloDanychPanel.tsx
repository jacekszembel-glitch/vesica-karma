"use client";

import { useEffect, useRef } from "react";

/**
 * Owija .kolo-danych-scena/.kolo-danych (kosmogram, numerologia) i animuje
 * zapisanie danych: po "Zapisz" koło zmniejsza się do ROZMIAR_ZWINIETY
 * (patrz .kolo-danych-zwiniete .kolo-danych w globals.css — musi się zgadzać
 * z tą liczbą tam) i zostaje widoczne jako złota kropka z czytelnym
 * podpisem "Twoje dane", a wynik pod spodem sam wjeżdża w zwolnione miejsce
 * (animujemy realną wysokość kontenera, nie samo opacity/scale koła).
 * Kliknięcie tej złotej kropki rozwija koło z powrotem — można wrócić
 * i poprawić dane. Większy niż przycisk Zapisz (74px) na wyraźną prośbę
 * użytkownika — sam przycisk był za mały, żeby podpis był czytelny.
 *
 * Wysokość mierzymy z DOM (scrollHeight) zamiast zakładać stałą liczbę,
 * bo koło ma zmienną średnicę (min(92vw, 580px) / płaska karta <640px).
 */
const ROZMIAR_ZWINIETY = 150;

export default function KoloDanychPanel({
  zlozone,
  onRozwin,
  children,
}: {
  zlozone: boolean;
  onRozwin?: () => void;
  children: React.ReactNode;
}) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const bylZlozoneRef = useRef(false);

  useEffect(() => {
    const scena = sceneRef.current;
    if (!scena) return;

    if (zlozone && !bylZlozoneRef.current) {
      // rozwinięte -> złożone: zmierz aktualną wysokość, wymuś reflow, zwiń do rozmiaru przycisku
      const pelna = scena.scrollHeight;
      scena.style.height = `${pelna}px`;
      scena.style.overflow = "hidden";
      void scena.offsetHeight;
      scena.style.height = `${ROZMIAR_ZWINIETY}px`;
    } else if (!zlozone && bylZlozoneRef.current) {
      // złożone -> rozwinięte: zmierz docelową (pełną) wysokość przez chwilowe "auto", wróć i animuj do niej
      scena.style.height = "auto";
      const pelna = scena.scrollHeight;
      scena.style.height = `${ROZMIAR_ZWINIETY}px`;
      void scena.offsetHeight;
      scena.style.height = `${pelna}px`;
      const naKoniec = () => {
        scena.style.height = "auto";
        scena.style.overflow = "";
        scena.removeEventListener("transitionend", naKoniec);
      };
      scena.addEventListener("transitionend", naKoniec);
    }
    bylZlozoneRef.current = zlozone;
  }, [zlozone]);

  return (
    <div
      ref={sceneRef}
      className={`kolo-danych-scena${zlozone ? " kolo-danych-zwiniete" : ""}`}
    >
      <div
        className="kolo-danych"
        onClick={zlozone ? onRozwin : undefined}
        role={zlozone ? "button" : undefined}
        tabIndex={zlozone ? 0 : undefined}
        aria-label={zlozone ? "Pokaż ponownie formularz danych" : undefined}
        onKeyDown={
          zlozone
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") onRozwin?.();
              }
            : undefined
        }
        style={zlozone ? { cursor: "pointer" } : undefined}
      >
        {children}
      </div>
    </div>
  );
}
