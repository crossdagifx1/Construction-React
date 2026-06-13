import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";
import { DEFAULT_SITE } from "../lib/defaults";

const SiteDataContext = createContext({ data: DEFAULT_SITE, loading: true });

export const SiteDataProvider = ({ children }) => {
  const [data, setData] = useState(DEFAULT_SITE);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const site = await api.getSite();
      // Deep-merge each settings group (hero/about/contact/marquee) so any field
      // missing from the DB (e.g. social URLs) falls back to defaults instead of
      // the whole group being replaced — otherwise icons "disappear" once the API
      // resolves. Empty strings from the DB still override (intentional clears).
      const groups = new Set([
        ...Object.keys(DEFAULT_SITE.settings),
        ...Object.keys(site.settings || {}),
      ]);
      const settings = {};
      for (const key of groups) {
        settings[key] = {
          ...(DEFAULT_SITE.settings[key] || {}),
          ...((site.settings || {})[key] || {}),
        };
      }

      setData({
        settings,
        services: site.services?.length ? site.services : DEFAULT_SITE.services,
        steps: site.steps?.length ? site.steps : DEFAULT_SITE.steps,
        projects: site.projects?.length ? site.projects : DEFAULT_SITE.projects,
        testimonials: site.testimonials?.length
          ? site.testimonials
          : DEFAULT_SITE.testimonials,
      });
    } catch {
      // API/DB unavailable — keep defaults so the site still renders.
      setData(DEFAULT_SITE);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <SiteDataContext.Provider value={{ data, loading, reload: load }}>
      {children}
    </SiteDataContext.Provider>
  );
};

export const useSiteData = () => useContext(SiteDataContext);
