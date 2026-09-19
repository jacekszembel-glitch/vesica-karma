import type { TypDloni } from "./hiromancja";

/**
 * Opisy czterech klasycznych typów dłoni — ta sama zasada co ZNACZENIE_CYFRY
 * w numerologia-tresc.ts: ciepły, praktyczny ton, "nie wyrok", zawsze z
 * konkretną wskazówką, nie tylko etykietą.
 */
export interface OpisTypuDloni { title: string; text: string }

export const OPIS_TYPU_DLONI: Record<TypDloni, OpisTypuDloni> = {
  ziemia: {
    title: "Dłoń Ziemi",
    text: "Kwadratowa dłoń, krótsze palce — klasycznie kojarzona z praktycznością, stabilnością i potrzebą namacalnego efektu pracy rąk. Dobrze się czujesz tam, gdzie widać rezultat, a decyzje zapadają na podstawie tego, co sprawdzone, nie tego, co teoretyczne. To nie znaczy brak wyobraźni — raczej to, że wyobraźnia u Ciebie chce wylądować w konkrecie, nie zostać samą ideą.",
  },
  powietrze: {
    title: "Dłoń Powietrza",
    text: "Kwadratowa dłoń, dłuższe palce — klasycznie kojarzona z ciekawością, komunikacją i potrzebą rozumienia, zanim się zadziała. Łatwiej przychodzi Ci nazwanie i przeanalizowanie sprawy niż porzucenie jej bez zrozumienia „dlaczego”. Warto pilnować, żeby analiza nie zastępowała decyzji — Twoja siła to łączenie faktów, nie tylko ich gromadzenie.",
  },
  ogien: {
    title: "Dłoń Ognia",
    text: "Wydłużona dłoń, krótsze palce — klasycznie kojarzona z energią, inicjatywą i szybkim przechodzeniem od pomysłu do działania. Zapalasz się łatwo i potrafisz porwać innych tempem — pułapką bywa zostawianie spraw w połowie, kiedy pojawi się coś nowego, bardziej ekscytującego. Świadome domykanie tego, co zaczęte, to Twoja najbardziej opłacalna dyscyplina.",
  },
  woda: {
    title: "Dłoń Wody",
    text: "Wydłużona dłoń, dłuższe palce — klasycznie kojarzona z wrażliwością, intuicją i głęboką reakcją na nastroje (własne i cudze). Odbierasz więcej niż inni widzą wprost, co bywa darem (empatia, wyczucie) i obciążeniem (łatwość przejmowania nie swoich emocji). Warto świadomie pilnować granicy między współodczuwaniem a wchłanianiem cudzego stanu jako własnego.",
  },
};
