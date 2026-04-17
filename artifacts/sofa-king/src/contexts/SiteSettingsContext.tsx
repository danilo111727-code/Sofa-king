import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { fetchSiteSettings, type SiteSettings } from "@/lib/api";

const DEFAULTS: SiteSettings = {
  heroImage: "/images/hero.png",
  pixDiscountPct: 10,
  maxInstallments: 10,
};

const SiteSettingsContext = createContext<SiteSettings>(DEFAULTS);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULTS);

  useEffect(() => {
    fetchSiteSettings()
      .then(setSettings)
      .catch(() => {});
  }, []);

  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings(): SiteSettings {
  return useContext(SiteSettingsContext);
}

export function applyCardMarkup(pixPrice: number, pixDiscountPct: number): number {
  const factor = 1 - pixDiscountPct / 100;
  if (factor <= 0) return pixPrice;
  return pixPrice / factor;
}
