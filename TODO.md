# Tarkova site: TODO

Everything still open for the landing page, blog and SEO work. Tick items off as they land.

## Needs your answer
- [ ] **Contact email.** The Privacy and Terms pages print `hello@tarkova.com`. Confirm the inbox exists, or give the right one (`CONTACT` in `src/site/pages.js`).
- [ ] **Curva.** What does it do, and who is it for? With that, `/curva/` gets the same problem / what it is / how it works / what it can do for you sections as `/crowkis/` (fill `page` in `src/site/products.js`). Also its domain, when there is one. Until then the page is a "Coming soon" teaser.
- [ ] **Subhraneel's photo.** LinkedIn blocks automated downloads of his profile. Save his portrait as `public/team/subhraneel.jpg` and the About page uses it (in black and white) instead of the "SB" monogram. Mohit's is in place (from his public LinkedIn photo).
- [ ] **Founder titles.** Cards show each founder's focus from Mohit's post (Product & Engineering / GTM & Growth). Swap in formal titles if you have them (`TEAM` in `src/site/pages.js`).
- [ ] **Governing law.** The Terms say "laws of India". Confirm, or name the right jurisdiction.
- [ ] **Site address.** Canonical URLs, the sitemap and social cards use `https://www.tarkova.com`. Set `SITE_URL` in `.env` if it's different.

## Crowkis page: open questions
- [ ] **Voice release.** The voice section says "New · Voice agents". PyPI/npm still show 0.5.0 and Docker Hub 0.5.1; voice landed in 0.5.2. If 0.5.2 isn't published yet, relabel it "Coming in 0.5.2" (`src/site/crowkis/scenes/voice.js`).
- [ ] **"Redis" in blog posts.** Site copy no longer says "Redis", but 288 of 980 posts (9 in the title) do; they're database content. Decide: keep (good search traffic for "Redis semantic cache"), hide, or rewrite.

## Security
- [ ] **Rotate the Supabase database password** (it was shared in chat), then update `SUPABASE_DB_URL` in `.env`.
- [ ] Pin Supabase's CA certificate in `vite.config.js`, so the database connection is verified as well as encrypted.

## Launch / hosting
- [ ] Pick a host (Vercel, Netlify or Cloudflare Pages all serve `dist/` as-is), and set `SUPABASE_DB_URL` as a build-time env var there.
- [ ] Enforce HTTPS and turn on HSTS at the host.
- [ ] Check that the host serves `dist/404.html` for unknown URLs.
- [ ] **Rebuild when posts change.** The live site is static HTML built from Supabase, which is best for SEO. New or edited posts appear after the next build. Wire a Supabase database webhook on `posts` to the host's deploy hook, so publishing a post triggers a rebuild. (Locally, `npm run dev` re-reads Supabase every minute.)

## SEO (in order of impact)
- [ ] Submit `https://www.tarkova.com/sitemap.xml` in Google Search Console and Bing Webmaster Tools, then request indexing for `/`, `/blog/` and `/products/`.
- [ ] **Real backlinks** (links from other sites to tarkova.com):
  - [ ] Add "A Tarkova product" → https://www.tarkova.com/ in the crowkis.com footer and About page.
  - [ ] Link tarkova.com from the Crowkis GitHub README, Docker Hub page and docs.
  - [ ] Launch posts: Product Hunt, Hacker News (Show HN), relevant subreddits, dev.to / Medium cross-posts with a canonical link back.
  - [ ] Get listed in AI / LLM tooling directories and "awesome-llm" lists.
- [ ] **Expand thin posts.** 977 of 980 posts are under 400 words; posts that rank usually run 1,500+. Start with the ~50 hand-written posts in features, vs the field, economics and benchmarks.
- [ ] **Fix doubled phrases** in 30 posts (for example "on repetitive workloads on repetitive workloads"). Needs a database update; get sign-off first.
- [ ] **Template pages.** The 610 "Cache {framework} in your {use case} with Crowkis" posts are `noindex` on purpose (scaled-content risk). Give each one use-case-specific content, then set `INDEX_MATRIX_PAGES = true` in `src/site/pages.js`.
- [ ] Fill the empty `keywords` column on posts (it feeds the article structured data).
- [ ] Per-post social images. Every post shares `/og.jpg` today; a per-post card would lift click-through from shares.
- [ ] Add author pages (a named person with a bio) for stronger E-E-A-T signals.
- [ ] Crowkis page copy added by the build: the problem meter's per-call cost/wait are illustrative (labelled "Example"), plus two small lines ("Five ways the same question keeps costing you." and "`crowkis why` walks the five gates for any query."). Check you're happy with them.

## Analytics
- [ ] Add cookie-free analytics (Plausible, or Cloudflare Web Analytics). That needs no cookie banner. If you pick a cookie-based tool instead, add a consent banner and update `/privacy/`.

## Forms (only when needed)
- [ ] The `feedback` and `ratings` tables exist, but the site has no forms yet. If you add them: server-side validation, spam protection (honeypot + rate limit), and RLS insert policies.

## Done
- [x] Blog from Supabase: index, 10 topic pages, pagination, 980 post pages, generated banner art, diagrams, charts, code blocks.
- [x] Internal-link hubs, auto-linked glossary terms, Crowkis links, related posts, prev/next, breadcrumbs.
- [x] SEO: titles, descriptions, canonicals, Open Graph/Twitter cards, structured data (article, breadcrumbs, organisation), sitemap, robots.txt, RSS, llms.txt.
- [x] Products page (Crowkis + Curva), Privacy policy, Terms & conditions, custom 404.
- [x] Menu everywhere: About · Crowkis · Curva · Blog (Read More and Products removed); nav always open; Blog has a live dot + newest-post peek.
- [x] Dedicated `/crowkis/` and `/curva/` pages on tarkova.com (menu, tiles and footer stay on-site; crowkis.com is linked from inside the page).
- [x] Blog pages use the same glass nav; the logo goes home.
- [x] `/about/`: black-and-white story + founders (Mohit Rohilla, Subhraneel Baruah) with LinkedIn buttons; founders in Organization structured data.
- [x] One shared footer on every page (`src/site/footer.js` + `footer.css`) with the animated particle wordmark.
- [x] Landing trimmed to hero + About study + footer (Products and Read More sections removed).
- [x] Crowkis and Curva pages use their official wordmarks; transparent crow mark on the Crowkis hero; logos don't animate.
- [x] `/crowkis/` rebuilt as a scroll-driven motion piece (Lenis + GSAP, `src/site/crowkis/`): hero dot field, déjà-vu problem stage + 5-panel track, pinned "how it works" pipeline, kinetic capabilities, red CTA finale. 60fps, no pop-ins, all copy server-rendered.
- [x] `/about/` tells the real story from Mohit's LinkedIn posts (how Crowkis started, why the mark is क) with his photo and quotes.
- [x] No scroll pop-ins or lazy-loaded images anywhere.
- [x] Footer: full-width layout, dotted TARKOVA wordmark with a shimmer, no tagline.
- [x] Favicon, apple-touch icon, social image; image compression (hero 2.6 MB → 456 KB).
- [x] `.env` ignored by git; database URL never reaches the browser (build output checked).
- [x] Dev server loads posts from Supabase at startup and refreshes every minute.
