# Heartfelt Connect

Implement the requested interactive landing page now. Use internal planning and do not present another implementation plan for user approval.

### Original User Request:
Create a modern, visually striking interactive landing page using the uploaded image as the main hero image.

IMPORTANT:
- Use the uploaded image exactly as provided (Attachment ID: uploads/949452b2-aa0f-429a-8bf1-8ccdad923fb1).
- Do not recreate, redraw, alter or replace the person.
- Preserve the person's face, clothing, pose, headphones, accessories and overall appearance.
- The glowing heart in the person's hand must be the main interactive element.

HERO SECTION:
- Full-width responsive hero section.
- Place the uploaded person image prominently in the center of the hero section.
- The image should look like a professional promotional poster.
- Keep the "TOUCH MY HEART" text visible near the glowing heart as part of the uploaded image.
- The glowing heart in the image should be clickable/tappable (place an interactive overlay trigger positioned right over the heart in the hand).
- Add a subtle cursor/pointer interaction to indicate that the heart is interactive (e.g., pulsing ring, soft sparkle, pointer cursor, tooltip or subtle glow pulse).
- aria-label="Touch My Heart" on the interactive trigger button.

When the user clicks/taps the glowing heart:
1. Smoothly animate the heart with a gentle pulse/glow effect and particle/light sparkles.
2. Reveal a beautiful heart-shaped services panel.
3. The services panel should appear from the glowing heart using a smooth scale + fade animation (expanding smoothly outward).
4. Do not navigate to another page; the services appear directly on the same page.
5. Add a subtle background blur/dimming backdrop behind the services panel.
6. Clicking the heart again should close the services panel.
7. Also allow the user to close the panel by clicking outside it, pressing Escape, or clicking a subtle close button.
8. On mobile, touch interaction must work seamlessly.

SERVICES PANEL:
- Create a large elegant heart-shaped container using CSS clip-path or an SVG container so it is genuinely heart-shaped (not a generic rectangle).
- Design style:
  - White / very light glass background with soft pale-red and pink gradient glow
  - Glassmorphism effect (backdrop-blur, subtle white border/highlights, soft drop shadow, subtle inner glow)
  - Premium, modern, romantic, minimal appearance
  - Ensure the heart shape works seamlessly across desktop and mobile

Services list (exact wording and 2-column layout where specified):
Financier | Investor
Philosopher | Relationship Counsellor
Strangers Partner | Event Co-ordinator
Life Partner | Sperm Donor
Authentic Speaker | Time Seller
Yoga Instructor | Skater
Actor | Singer
Dancer | Model
Producer | Sponsor
Astrologer (centered at the bottom)

ANIMATIONS & RESPONSIVENESS:
- Staggered fade-in animation for the service rows when opened.
- Smooth scale and fade back down on close.
- Fully responsive: on mobile, person remains visible without cropping head or heart, clickable heart is easy to tap, and the heart container scales to fit the viewport comfortably with readable typography and no horizontal scroll.
- High-end dark theme complementing the black background of the hero photo.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://rasaportfolio.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/29662825-910f-413f-aa09-1635f09aba1b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
