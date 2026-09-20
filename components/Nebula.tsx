/**
 * Mgławica VesicaKarma — subtelne, wolno dryfujące poświaty tła całej
 * strony (pod treścią). Czysty CSS (transform/opacity), bez losowości —
 * pozycje i animacje na sztywno w globals.css (.nebula-1..4).
 */
export default function Nebula() {
  return (
    <div className="nebula" aria-hidden="true">
      <span className="nebula-blob nebula-1" />
      <span className="nebula-blob nebula-2" />
      <span className="nebula-blob nebula-3" />
      <span className="nebula-blob nebula-4" />
    </div>
  );
}
