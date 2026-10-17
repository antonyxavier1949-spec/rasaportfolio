import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { MessageCircle, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";

import posterAsset from "@/assets/antony-touch-my-heart.png.asset.json";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { bookingServices } from "@/lib/booking-data";
import { createBooking } from "@/lib/booking.functions";

type BookingFormValues = {
  name: string;
  phone: string;
  email: string;
  service: string;
  date: string;
  time: string;
  message: string;
};

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

const whatsappNumber = "919585157141";
const emptyBooking: BookingFormValues = { name: "", phone: "", email: "", service: "", date: "", time: "", message: "" };

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
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingValues, setBookingValues] = useState<BookingFormValues>(emptyBooking);
  const [savedBooking, setSavedBooking] = useState<{ booking_reference: string; service_name: string; preferred_date: string; preferred_time: string } | null>(null);
  const [bookingError, setBookingError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const submitBooking = useServerFn(createBooking);

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

  async function handleBookingSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setBookingError("");
    setIsSubmitting(true);
    try {
      const result = await submitBooking({ data: bookingValues });
      setSavedBooking({
        booking_reference: result.booking_reference,
        service_name: result.service_name,
        preferred_date: result.preferred_date,
        preferred_time: result.preferred_time,
      });
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : "Your request could not be saved. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleBookingOpenChange(open: boolean) {
    setBookingOpen(open);
    if (!open) {
      setBookingError("");
      setSavedBooking(null);
    }
  }

  const whatsappMessage = savedBooking
    ? [
        "Hi Antony, I have submitted a service booking request.",
        `Reference: ${savedBooking.booking_reference}`,
        `Name: ${bookingValues.name}`,
        `Phone: ${bookingValues.phone}`,
        `Email: ${bookingValues.email}`,
        `Service: ${savedBooking.service_name}`,
        `Preferred date: ${savedBooking.preferred_date}`,
        `Preferred time: ${savedBooking.preferred_time}`,
        `Additional requirements: ${bookingValues.message || "None"}`,
        "Status: Pending confirmation",
      ].join("\n")
    : "";

  return (
    <>
      <main className="hero-stage">
        <div className="poster-wrap">
          <img className="poster-image" src={posterAsset.url} alt="Antony Xavier holding a glowing heart beneath the words Touch My Heart" />
          <Button type="button" variant="ghost" className="heart-trigger" aria-label="Touch My Heart" aria-expanded={isOpen} aria-controls="services-heart" onClick={() => setIsOpen((open) => !open)}>
          </Button>
        </div>

        <div className={`services-backdrop ${isOpen ? "is-open" : ""}`} aria-hidden={!isOpen} onMouseDown={(event) => event.target === event.currentTarget && setIsOpen(false)}>
          <Button type="button" variant="ghost" className="whatsapp-button" aria-label="Book a service" tabIndex={isOpen ? 0 : -1} onClick={() => setBookingOpen(true)}>
            <MessageCircle aria-hidden="true" />
            <span>WhatsApp</span>
          </Button>
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
      <footer className="site-footer">
        <Button asChild type="button" variant="ghost" size="sm" className="admin-page-link">
          <Link to="/admin/login">Admin Page</Link>
        </Button>
      </footer>

      <Dialog open={bookingOpen} onOpenChange={handleBookingOpenChange}>
        <DialogContent className="booking-dialog">
          {savedBooking ? (
            <div className="booking-success">
              <div className="booking-success-mark" aria-hidden="true">✓</div>
              <DialogHeader>
                <DialogTitle>Your booking request has been submitted successfully!</DialogTitle>
                <DialogDescription>Reference <strong>{savedBooking.booking_reference}</strong></DialogDescription>
              </DialogHeader>
              <dl className="booking-summary">
                <div><dt>Service</dt><dd>{savedBooking.service_name}</dd></div>
                <div><dt>Preferred date</dt><dd>{savedBooking.preferred_date}</dd></div>
                <div><dt>Preferred time</dt><dd>{savedBooking.preferred_time}</dd></div>
              </dl>
              <p className="booking-pending-note">This is a request, not a confirmed appointment. The administrator will confirm availability.</p>
              <div className="booking-success-actions">
                <Button asChild className="booking-submit">
                  <a href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`} target="_blank" rel="noopener noreferrer">
                    <MessageCircle aria-hidden="true" /> Send request on WhatsApp
                  </a>
                </Button>
                <Button type="button" variant="outline" onClick={() => handleBookingOpenChange(false)}>Return to portfolio</Button>
              </div>
              <p className="booking-manual-note">WhatsApp opens with your details ready to send; your request is already saved.</p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <p className="booking-eyebrow">From the heart</p>
                <DialogTitle>Make a booking request</DialogTitle>
                <DialogDescription>Choose a service and preferred time. Your appointment remains pending until confirmed.</DialogDescription>
              </DialogHeader>
              <form className="booking-form" onSubmit={handleBookingSubmit}>
                <div className="booking-form-grid">
                  <div className="booking-field">
                    <Label htmlFor="booking-name">Full name</Label>
                    <Input id="booking-name" autoComplete="name" minLength={2} maxLength={100} required value={bookingValues.name} onChange={(event) => setBookingValues({ ...bookingValues, name: event.target.value })} />
                  </div>
                  <div className="booking-field">
                    <Label htmlFor="booking-phone">Phone with country code</Label>
                    <Input id="booking-phone" type="tel" autoComplete="tel" placeholder="+91 95851 57141" maxLength={20} pattern="^\\+?[1-9][0-9]{7,19}$" title="Enter a valid phone number with country code, using digits and an optional leading +." required value={bookingValues.phone} onChange={(event) => setBookingValues({ ...bookingValues, phone: event.target.value })} />
                  </div>
                  <div className="booking-field">
                    <Label htmlFor="booking-email">Email</Label>
                    <Input id="booking-email" type="email" autoComplete="email" maxLength={255} required value={bookingValues.email} onChange={(event) => setBookingValues({ ...bookingValues, email: event.target.value })} />
                  </div>
                  <div className="booking-field">
                    <Label htmlFor="booking-service">Service</Label>
                    <Select required value={bookingValues.service} onValueChange={(service) => setBookingValues({ ...bookingValues, service })}>
                      <SelectTrigger id="booking-service" aria-label="Service"><SelectValue placeholder="Choose a service" /></SelectTrigger>
                      <SelectContent>{bookingServices.map((service) => <SelectItem key={service} value={service}>{service}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="booking-field">
                    <Label htmlFor="booking-date">Preferred date</Label>
                    <Input id="booking-date" type="date" min={new Date().toISOString().slice(0, 10)} required value={bookingValues.date} onChange={(event) => setBookingValues({ ...bookingValues, date: event.target.value })} />
                  </div>
                  <div className="booking-field">
                    <Label htmlFor="booking-time">Preferred time</Label>
                    <Input id="booking-time" type="time" required value={bookingValues.time} onChange={(event) => setBookingValues({ ...bookingValues, time: event.target.value })} />
                  </div>
                  <div className="booking-field booking-field-wide">
                    <Label htmlFor="booking-message">Additional requirements <span>(optional)</span></Label>
                    <Textarea id="booking-message" maxLength={1000} rows={3} value={bookingValues.message} onChange={(event) => setBookingValues({ ...bookingValues, message: event.target.value })} />
                  </div>
                </div>
                {bookingError && <p className="booking-error" role="alert">{bookingError}</p>}
                <Button type="submit" className="booking-submit" disabled={isSubmitting || !bookingValues.service}>
                  {isSubmitting ? "Saving request…" : "Save booking request"}
                </Button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}