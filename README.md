# PINCHme landing page (POC)

Static HTML/CSS/JS proof of concept for the PINCHme member landing page.

## Run locally

```bash
python3 -m http.server 4173
```

Then open http://localhost:4173.

## Structure

- `index.html`: member landing page
- `assets/styles.css`: design system and page styles (pink and font rules are noted at the top)
- `assets/main.js`: carousel, pinned "How it works", reels playback, scroll effects
- `assets/hero/`, `assets/perks/`: visuals exported from the Figma file
- `assets/logos/`: brand logos from pinchme.com
- `assets/qr-pinchme.svg`: QR code linking to pinchme.com

## Not in this repo (yet)

- `brands.html`: brand page, unpublished for now
- `assets/reels/`: member reels from Instagram, pending permission from PINCHme and the members. Without them, the "PINCHers on camera" cards are empty.

Headlines use Helvetica Neue Condensed Black, which renders on macOS only. Other platforms fall back to Archivo until a licensed web font is added.
