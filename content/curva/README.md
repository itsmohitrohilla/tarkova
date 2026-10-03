# Curva blog content

Planned and written Curva posts for tarkova.com/blog, and the tooling that checks and inserts them.
Nothing here is live until the owner approves a sample and runs `--publish`.

| File | What it is |
|---|---|
| `topic-map.json` | The first release: 232 topics, every one indexable, each with a planned `published_at` |
| `backlog.json` | 26 more topics for later waves, once Search Console shows the first ones indexed |
| `posts/<slug>.json` | Finished posts, one file each. Five samples so far |
| `../../scripts/curva-posts.mjs` | Validates the map and posts; inserts drafts; publishes due drafts |
| `../../scripts/curva-md2post.py` | Optional: turns a light Markdown file into a post JSON file |

Facts come only from the Curva repo, read-only: `curva/Content Box/` and the public docs
(`site/`, `README.md`, `CHANGELOG.md`, `recipes/`, the SDK and n8n READMEs, `docs/Guides/`, `docs/Product/`).
The script looks for them at `../curva` (set `CURVA_SOURCES` to move it). Never cite `crates/` or private notes.

## Run it

```bash
node scripts/curva-posts.mjs                          # validate topic-map.json, backlog.json and posts/*.json
node scripts/curva-posts.mjs --insert                 # upsert every post file as a draft, dated from the map
node scripts/curva-posts.mjs --insert --start 2026-10-20   # same, with the whole schedule moved to start that day
node scripts/curva-posts.mjs --insert --slugs a,b     # only these posts
node scripts/curva-posts.mjs --publish --dry-run      # list the drafts that are due today (writes nothing)
node scripts/curva-posts.mjs --publish                # publish drafts whose published_at <= today
node scripts/curva-posts.mjs --publish --slugs a,b    # publish these now (a future date moves to today)
```

- It reads `SUPABASE_DB_URL` from the environment or `.env`, and never prints it. Without it, validation
  still runs but can't check slugs against existing posts.
- `--insert` refuses while there are errors, and while the renderer can't draw a block kind a post uses
  (see "Renderer gaps"). `--force` overrides only the renderer check.
- Upserts are by slug and idempotent. They never touch a post whose tag doesn't start with `curva `,
  and never change `status`: a published post keeps its status and date when its content is updated.
- The site is static, so published posts appear after the next build (see TODO.md, "Rebuild when posts change").
- Waves: run `--publish` once a day (cron or by hand). Only posts whose date has come go live.

## Release plan (in `topic-map.json`)

- Dates start on 2026-10-06 as a placeholder for "the day after approval"; `--insert --start` moves them.
- 6 posts a day, 232 topics, so about 39 days.
- Wave 1 (first ~5 days): the pillar pages and the 21 Content Box drafts (draft 02, "Curva vs Jev", is not
  a blog post: that query belongs to `/curva/vs-jev/`). Each topic built on a draft names it in `draft`.
- Then cluster by cluster, so each cluster's pillar is out before its spokes: concepts, core, python,
  use-cases, jev, providers, cost-speed, typescript, n8n, agents, http-tools, benchmarks, troubleshooting,
  self-hosting, engineering, alternatives, opinion. `wave` records this.

## Topic map fields

Every entry in `topic-map.json` and `backlog.json`:

| Field | Meaning |
|---|---|
| `slug`, `title`, `summary`, `tag` | Become the post's slug, title, meta description and topic. Title at most 60 characters, summary at most 155, no dashes |
| `cluster`, `pillar` | Topic cluster, and whether this is its hub page |
| `primary_keyword` | The query this post must rank for. Unique across the map and the backlog |
| `keywords` | Secondary keywords; written to the `keywords` column with the primary one |
| `search_intent` | informational, how-to, comparison, troubleshooting or commercial |
| `serp_feature` | What to win: featured-snippet (answer in the first paragraph), how-to-steps, table, faq, code, none |
| `angle`, `why_it_can_rank` | What makes this post different, and the question it answers better than what ranks now |
| `outline` | The H2 sections, in order |
| `facts` | `path:Lstart-Lend` in the Curva repo for every fact the post uses |
| `source_check` | The docs that prove each feature the post relies on ships today |
| `code_snippet_ref` | Where the post's main code is quoted from (byte-exact), or null |
| `diagram` | mermaid, svg or none |
| `related` | 3 to 5 slugs to link: the cluster pillar first, then siblings |
| `draft` | The Content Box draft the post is built from, or null |
| `indexable` | Always true. A topic that can't stand on its own is dropped, not noindexed |
| `published_at`, `wave` | Planned release date and wave (map only) |

## Post file format

`posts/<slug>.json`:

```json
{
  "slug": "llm-position-bias",
  "title": "LLM position bias and how order debiasing cancels it",
  "summary": "LLMs favour options by their position in a list. ...",
  "tag": "curva concepts",
  "source_check": ["site/concepts/trust.md", "site/guides/speed-and-cost.md"],
  "body": [ { "kind": "p", "text": "LLM position bias is ..." } ]
}
```

`slug`, `title`, `summary` and `tag` must match the topic map. Tags: `curva guides`, `curva concepts`,
`curva use cases`, `curva vs jev`, `curva benchmarks`, `curva engineering`. `read_minutes` is computed
on insert (prose words / 220).

## Body blocks

The body is an array of blocks, rendered in order by `src/site/pages.js`. Text fields are plain text:
`` `code` `` spans render as code. The title is the H1, so the body starts with a `p`, never a heading.

### Drawn by the renderer today

| kind | Fields | Renders as |
|---|---|---|
| `p` | `text` | Paragraph |
| `plain` | `text` | "In plain words." callout box. Use one per post for the one-sentence takeaway |
| `h2` | `text` | Section heading with an anchor; also listed in "On this page" |
| `quote` | `text` | Pull quote |
| `code` | `code`, `title` (e.g. `python`, `bash`, `json`), optional `original: true` | Code block with a copy button and highlighting |
| `table` | `head` (cells), `rows` (arrays of cells, same length as `head`), optional `title` | Scrollable table; cells allow `` `code` `` |
| `diagram` | `chart` (Mermaid source), optional `title`, `caption` | Mermaid diagram, numbered as a figure |
| `art` | `svg` (one inline `<svg>`, no scripts or handlers), optional `title`, `caption` | Inline SVG figure |
| `bars` | `title`, `series` [{`label`, `value`, `sub`?, `accent`?}], optional `unit`, `caption` | Horizontal bar chart |
| `venn` | `left`, `right`, `leftItems`, `rightItems`, `overlap` (newline separated), optional `title`, `caption` | Two-set Venn diagram |

### Planned, not drawn yet (the validator accepts them; `--insert` waits for the renderer)

| kind / syntax | Fields | Needed for |
|---|---|---|
| `list` | `items`, optional `ordered: true` | Steps and short lists (today they would have to be separate paragraphs) |
| `h3` | `text` | Sub-sections in long posts |
| `callout` | `text`, optional `title` | Notes and warnings other than "In plain words" |
| `[anchor](/blog/slug/)` inside text | | Internal links. Without it, the `related` plan can't appear in the body |

Every block may carry two flags the renderer ignores:
- `"numbers": true` marks a block holding benchmark numbers, so it is easy to refresh when
  `4 Benchmarks/benchmarks.md` is regenerated (the Content Box's "numbers block").
- `"example": true` marks made-up illustration numbers. The number check skips that block and warns, so the
  text must say the numbers are made up.

Diagrams are Mermaid (`flowchart`, `sequenceDiagram`, ...) in a `diagram` block; the site renders them in
the browser. For charts with real numbers prefer `bars` or a `table`.

## What the validator enforces

On the map (and backlog): required fields, slug format, unique slugs and primary keywords, no slug taken
by an existing non-Curva post, `curva vs jev` reserved for `/curva/vs-jev/`, every entry indexable,
title and summary lengths, no dashes, banned and hype words, no superlatives in titles or summaries,
known tags and intents, 3 to 5 `related` slugs that exist, every `facts` / `source_check` path inside
the allowed sources, and near-duplicates (title word overlap 0.6+, summary 0.5+, or outline structure 0.5+).

On posts:
- **Block schema** as above; tables with matching row lengths; Mermaid charts; safe SVG.
- **Claim rules**: no "Redis", no compliance names (HIPAA, SOC 2, GDPR, FedRAMP, ISO 27001, PCI DSS), no hype
  words, no em dashes, no link to the private repo, never the retracted 0.136. Superlatives in the body
  are flagged for review.
- **Numbers**: every number with a decimal, a % or a value of 10 or more must appear in
  `4 Benchmarks/benchmarks.md` or in the post's own `source_check` docs (not the fact sheet, the drafts or
  the docs' older benchmark page).
- **Ship-today rule**: commands, flags, env vars, endpoints, SDK calls and imports in code, and every
  `` `code` `` span in text, must appear in the post's `source_check` docs. Third-party names (FastAPI,
  LangChain, Zapier, Ollama, ...) may appear only if a `source_check` doc mentions them.
- **Code**: quoted code must be byte-exact from a source. Your own glue code says `"original": true`, and
  then still passes the ship-today check.
- **Links**: only to posts in the map or the DB, the site's own pages, the public Curva URLs (docs, PyPI,
  npm, n8n node, docs repo, ghcr.io image) or URLs that appear in the post's sources.
- **SEO shape**: opens with a `p` that answers the query; primary keyword in the first 100 words; 3+ H2s;
  900 to 1,800 words of prose; title and an H2 carrying the keyword (warnings).
- **Near-duplicate bodies**: two posts sharing 30%+ of their 5-word phrases fail.

## Writing a post

1. Take the next topic from `topic-map.json`. Read every `facts` ref and the `draft`, if there is one.
2. Check the draft against `4 Benchmarks/benchmarks.md`: drafts were refreshed on 2026-09-30, benchmarks
   on 2026-10-01 (some draft numbers are now retired).
3. Write plain, short sentences. First paragraph: the direct answer, with the primary keyword. Every number
   with model, dataset, n and date. "Once calibrated" or "after 30 labels" whenever you promise calibrated
   probabilities. Say where Curva loses when the post touches that metric. End with the docs link, an
   install line and one or two related posts.
4. Save as `posts/<slug>.json` (or write Markdown and convert it with `scripts/curva-md2post.py in.md out.json`;
   its header lists the syntax).
5. Run the validator until it reports 0 errors.

## Renderer gaps (for the blog redesign)

- `list`, `h3`, `callout` and inline `[text](/link/)` links are not drawn yet. All five samples use lists
  and links, so `--insert` will wait for them (or use `--force` and accept plain-text links).
- The post's closing pitch picks Curva only when "Curva" is in the title or summary. Most Curva posts don't
  name it there; key it on the tag (`tag` starts with `curva `) instead.
- The article JSON-LD always lists Crowkis in `mentions`, and the blog index and topic blurbs talk only about
  semantic caching. Curva tags need entries in `TOPIC_LEDE` and `ACCENT` (src/site/art.js).
- Glossary auto-links match "embedding" and "semantic cache" and point to Crowkis posts; avoid those words in
  Curva posts or scope the glossary to Crowkis tags.
- "Keep reading" is computed from tags and title words; it ignores `related`. Reading `related` from the
  topic map (or a `related` column) would give each post its planned internal links.
