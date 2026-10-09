# Crowkis guides

The Crowkis side of the blog had about 240 short posts (most under 300 words), many covering the same topic.
`pillars.json` groups them into 24 guides. Each guide takes over one existing post's URL, absorbs the short posts
listed under it, and is rewritten as one full article. The absorbed posts stay online, link to their guide, and
are kept out of search (`noindex`) by the short-post rule in `src/site/pages.js`.

| File | What it is |
|---|---|
| `pillars.json` | The 24 guides: the post each replaces, the search it answers, the posts it absorbs; and the hosts outside sources may be on |
| `posts/<slug>.json` | A finished guide: `slug`, `title`, `summary`, `keywords`, `sources`, `body` (the same blocks as `content/curva/README.md`, "Body blocks") |
| `../../scripts/crowkis-posts.mjs` | Validates the guides, and with `--apply` writes them over the posts they replace |

Facts come only from the Crowkis repo, read-only (`../crowkis`, or set `CROWKIS_SOURCES`): `README.md` and
`crowkis.docs/` (`COMMANDS.md`, `CROWKIS_FEATURES_BUILT.md`, `DEVELOPER_GUIDE.md`, `MEASURED_CAPABILITY.md`,
`DOCKER_USER_GUIDE.md`, `PII_REDACTION.md`, `CUSTOM_EMBEDDER.md`, `METRICS_API.md`, the benchmark notes), plus
what the site already states (`tarkova:src/site/products.js`). Plans, strategy and sales documents are not sources.

Rules the validator enforces: 1,100 to 2,400 words; the first paragraph answers the search directly; at least
four sections; at least four links to live pages and three outside sources on approved hosts that answer; every
number with a unit is in the listed sources or sits beside an outside source; no savings percentage (it saves
cost, with no figure); no "Redis", no certification or compliance claims, no dashes, no superlatives.

The posts table was copied to `posts_backup_20261009` before the first guides were applied.
