import { getTranslations } from "next-intl/server";

export default async function Page() {
  const t = await getTranslations("AstrokartografiaStub");
  return (
    <div className="container section" style={{ maxWidth: 640, textAlign: "center" }}>
      <h1 style={{ marginBottom: 12 }}>{t("tytul")}</h1>
      <p className="muted">{t("opis")}</p>
    </div>
  );
}
