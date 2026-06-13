import { useSiteData } from "../context/SiteDataContext";

const Marquee = () => {
  const { data } = useSiteData();
  const items = data.settings.marquee?.items || [];
  const track = [...items, ...items];

  return (
    <div className="border-y border-line bg-ink py-5 text-paper">
      <div className="flex overflow-hidden">
        <div className="flex shrink-0 animate-marquee items-center">
          {track.map((item, i) => (
            <span key={i} className="flex items-center">
              <span className="px-8 font-display text-2xl italic tracking-tightest text-paper/90 md:text-3xl">
                {item}
              </span>
              <span className="text-accent">✦</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Marquee;
