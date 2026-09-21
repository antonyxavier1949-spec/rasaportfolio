import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { X } from "lucide-react";

import posterAsset from "@/assets/antony-touch-my-heart.png.asset.json";
import { Button } from "@/components/ui/button";

const serviceRows = [
  ["Financier", "Investor"],
  ["Philosopher", "Relationship Counsellor"],
  ["Strangers Partner", "Event Co-ordinator"],
  ["Life Partner", "Sperm Donor"],
  ["Authentic Speaker", "Time Seller"],
  ["Yoga Instructor", "Skater"],
  ["Actor", "Singer"],
  ["Dancer", "Model"],
  ["Producer", "Sponsor"],
] as const;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Touch My Heart | Antony Xavier" },
      { name: "description", content: "Discover Antony Xavier's services through the interactive Touch My Heart experience." },
      { property: "og:title", content: "Touch My Heart | Antony Xavier" },
      { property: "og:description", content: "A personal, interactive introduction to Antony Xavier and his services." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [isOpen, setIsOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && setIsOpen(false);
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    window.setTimeout(() => closeButtonRef.current?.focus(), 320);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <main className="hero-stage">
      <div className="poster-wrap">
        <img className="poster-image" src={posterAsset.url} alt="Antony Xavier holding a glowing heart beneath the words Touch My Heart" />
        <Button type="button" variant="ghost" className="heart-trigger" aria-label="Touch My Heart" aria-expanded={isOpen} aria-controls="services-heart" onClick={() => setIsOpen((open) => !open)}>
        </Button>
      </div>

      <div className={`services-backdrop ${isOpen ? "is-open" : ""}`} aria-hidden={!isOpen} onMouseDown={(event) => event.target === event.currentTarget && setIsOpen(false)}>
        <section id="services-heart" className="services-heart" role="dialog" aria-modal="true" aria-label="Services">
          <svg className="services-heart-shape" viewBox="0 0 1000 1000" aria-hidden="true" preserveAspectRatio="none">
            <defs>
              <linearGradient id="heart-glass-gradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" className="heart-stop-highlight" />
                <stop offset="0.52" className="heart-stop-glass" />
                <stop offset="1" className="heart-stop-rose" />
              </linearGradient>
              <linearGradient id="heart-shine-gradient" x1="0.12" y1="0.05" x2="0.88" y2="0.92">
                <stop offset="0" className="heart-stop-shine" />
                <stop offset="0.48" className="heart-stop-clear" />
                <stop offset="1" className="heart-stop-glow" />
              </linearGradient>
            </defs>
            <path className="heart-glow-path" d="M500 930 C430 852 92 622 82 348 C74 126 337 45 500 198 C663 45 926 126 918 348 C908 622 570 852 500 930 Z" />
            <path className="heart-glass-path" d="M500 930 C430 852 92 622 82 348 C74 126 337 45 500 198 C663 45 926 126 918 348 C908 622 570 852 500 930 Z" />
            <path className="heart-shine-path" d="M500 930 C430 852 92 622 82 348 C74 126 337 45 500 198 C663 45 926 126 918 348 C908 622 570 852 500 930 Z" />
          </svg>
          <Button ref={closeButtonRef} type="button" variant="ghost" size="icon" className="heart-close" aria-label="Close services" onClick={() => setIsOpen(false)}>
            <X aria-hidden="true" />
          </Button>
          <div className="services-content">
            <p className="services-kicker">From the heart</p>
            <h1>How can I be there for you?</h1>
            <div className="services-list">
              {serviceRows.map(([left, right], index) => (
                <div className="service-row" key={left} style={{ "--row-delay": `${170 + index * 55}ms` } as CSSProperties}>
                  <span>{left}</span><i aria-hidden="true" /><span>{right}</span>
                </div>
              ))}
              <div className="service-row service-row-final" style={{ "--row-delay": "670ms" } as CSSProperties}><span>Astrologer</span></div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}