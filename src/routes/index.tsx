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
          <span className="heart-ring" aria-hidden="true" />
          <span className="heart-spark heart-spark-one" aria-hidden="true" />
          <span className="heart-spark heart-spark-two" aria-hidden="true" />
          <span className="heart-spark heart-spark-three" aria-hidden="true" />
          <span className="heart-hint" aria-hidden="true">Touch</span>
        </Button>
      </div>

      <div className={`services-backdrop ${isOpen ? "is-open" : ""}`} aria-hidden={!isOpen} onMouseDown={(event) => event.target === event.currentTarget && setIsOpen(false)}>
        <section id="services-heart" className="services-heart" role="dialog" aria-modal="true" aria-label="Services">
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