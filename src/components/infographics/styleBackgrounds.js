// Full-page background shown behind the card on the public /card/:id view,
// matching each style's own dominant color so opening a link feels like a
// themed page rather than a generic boxed preview. `dark` flags which ones
// need light-colored page text (label/back-link) for contrast.
export const STYLE_BACKGROUNDS = {
  civicpass: { background: 'linear-gradient(135deg, #eef2fb 0%, #f7f3e8 100%)', dark: false },
  techpass: { background: 'linear-gradient(160deg, #14171c 0%, #1f242c 100%)', dark: true },
  license: { background: '#d7e6f2', dark: false },
  membership: { background: '#ffffff', dark: false },
  republic: { background: 'linear-gradient(135deg, #dce9f7 0%, #eef2fb 45%, #f7eef5 100%)', dark: false },
  colorful: { background: '#fdf8f0', dark: false },
  minimal: { background: '#ffffff', dark: false },
  gamestat: { background: '#242a42', dark: true },
  scrapbook: { background: '#ece6d8', dark: false },
  sparkle: { background: 'linear-gradient(135deg,#dfe6ff 0%,#f7dcf0 50%,#ffe9d6 100%)', dark: false },
  browser: { background: '#5b6bb8', dark: true },
  vintage: { background: '#f3ecd9', dark: false },
  neon: { background: '#121218', dark: true },
};

export const DEFAULT_PAGE_BG = { background: '#eef0e6', dark: false };
