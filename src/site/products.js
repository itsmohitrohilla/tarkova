// Shared by the React landing page and the static product pages (/crowkis/, /curva/, /products/).
// Crowkis copy follows crowkis.com (/why, /product, /features) as of 2026-09.
export const products = [
  {
    id: 'crowkis',
    name: 'Crowkis',
    status: 'Live',
    url: 'https://www.crowkis.com/',
    logo: '/products/crowkis.png',
    logoAlt: 'Crowkis logo: a white geometric crow on red',
    wordmark: ['/products/crowkis-wordmark-white.png', 1200, 231], // white on transparent
    mark: ['/products/crowkis-mark-white.png', 900, 634], // the crow alone, white on transparent, for brand-colour grounds
    color: '#d50000',
    tagline: 'The cache with a brain.',
    summary:
      'A semantic cache and agent memory layer, built in Rust for LLM workloads. It understands what a question means and safely reuses answers, so you stop paying twice for the same answer.',
    facts: [
      ['0.4 ms', 'semantic hit latency'],
      ['5', 'safety checks on every hit'],
      ['4', 'protocols: RESP3, gRPC, REST, MCP'],
      ['Free', 'community edition, no sign-up'],
    ],
    links: [
      ['Visit crowkis.com', 'https://www.crowkis.com/'],
      ['Read the docs', 'https://www.crowkis.com/docs'],
      ['Run it with Docker', 'https://www.crowkis.com/docker'],
    ],
    page: {
      title: 'Crowkis: the semantic cache for LLMs, built in Rust',
      description:
        'Crowkis is a semantic cache and agent memory layer for LLM apps. It reuses answers by meaning, checks every hit for safety, and serves it in under a millisecond.',
      hero: 'A cache for AI apps. When users ask the same thing in different words, Crowkis answers from cache in under a millisecond, so you only pay your LLM once.',
      who: {
        title: 'Built for anything that answers the *same questions*.',
        intro: 'If your users ask the same things in different words, Crowkis answers the repeats from cache, instantly and safely. You keep your model, your stack and your existing clients.',
        items: [
          ['Support bots', 'Customers ask the same fifty questions all day. Answer the repeats instantly, without another model call.'],
          ['Copilots & dev tools', 'A team asks its coding assistant the same things. Reuse the answers across everyone.'],
          ['RAG & docs search', 'Same lookups over the same documents. Cache the finished answer, not just the chunks.'],
          ['AI agents', 'Long-term memory per agent and user, plus reasoning reuse for tasks they have solved before.'],
          ['Voice assistants', 'Sub-millisecond hits inside a one-second voice budget, so replies start before the user notices.'],
        ],
      },
      // Commands and code as published on crowkis.com/docker and /docs (PyPI crowkis 0.5.0, npm @crowkis/client 0.5.0, Docker crowkis/crowkis 0.5.1).
      install: {
        docker: {
          pull: 'docker pull crowkis/crowkis:latest',
          run: 'docker run -d --name crowkis \\\n  -p 127.0.0.1:6379:6379 \\\n  -p 127.0.0.1:6380:6380 \\\n  -p 127.0.0.1:6381:6381 \\\n  -v crowkis-data:/data \\\n  crowkis/crowkis:latest',
          check: 'curl 127.0.0.1:6380/health',
          ports: [['6379', 'RESP3: the Crowkis CLI or any RESP3 client'], ['6380', 'HTTP: dashboard, REST API, health'], ['6381', 'gRPC']],
          url: 'https://hub.docker.com/r/crowkis/crowkis',
          docs: 'https://www.crowkis.com/docker',
        },
        python: {
          cmd: 'pip install crowkis',
          code: 'from crowkis import Crowkis\n\ncache = Crowkis(host="127.0.0.1", port=6379, tenant="my-app")\n\n@cache.cached(ttl=3600)\ndef answer(prompt: str) -> str:\n    return my_model(prompt)\n\nanswer("How do refunds work?")        # miss → model runs, cached\nanswer("What\'s the refund process?")  # semantic HIT → served from cache',
          url: 'https://pypi.org/project/crowkis/',
          docs: 'https://www.crowkis.com/docs/sdk-python',
        },
        node: {
          cmd: 'npm install @crowkis/client',
          code: 'import { Crowkis } from "@crowkis/client";\n\nconst cache = new Crowkis({ host: "127.0.0.1", port: 6379, tenant: "my-app" });\n\nconst answer = await cache.ask(\n  "How do refunds work?",\n  async (prompt) => myModel(prompt),\n  { ttl: 3600 },\n);',
          url: 'https://www.npmjs.com/package/@crowkis/client',
          docs: 'https://www.crowkis.com/docs/sdk-node',
        },
        mcp: 'claude mcp add crowkis -- crowkis mcp',
      },
      play: { url: 'https://www.crowkis.com/murder' },
      problem: {
        title: 'Your LLM bill is mostly *déjà vu*.',
        intro:
          'Support bots, copilots, RAG apps and agents answer the same questions again and again, just phrased differently. Every rephrasing is a fresh, full-price model call, and a multi-second wait for your user.',
        items: [
          ['You pay for reruns', 'A paraphrased question triggers a brand-new model call, even though you already paid for that exact answer.'],
          ['Exact caches miss everything', 'Classic key-value caches match bytes, not meaning. Change one word and the cache is useless.'],
          ['Similarity alone is unsafe', 'Vector-only caches serve "close enough" answers. "Cancel my plan" and "pause my plan" look alike, and serving one for the other is a real mistake.'],
          ['Bad answers spread', 'Cache a hallucination once and it gets served to every similar question after it.'],
          ['Model upgrades reset you', 'Switch models and most caches go cold, throwing away everything you already paid to learn.'],
        ],
      },
      what: {
        title: 'Meaning, structure, confidence, *trust*.',
        text:
          'Crowkis sits between exact-match caches that miss paraphrases and similarity caches that serve the wrong thing. It matches a question by what it means and by its structure, scores its confidence, and checks the answer is trustworthy before it ever reuses it.',
        compare: [
          ['Exact-match cache', 'Matches identical text only', 'Misses every rephrasing'],
          ['Vector-only cache', 'Matches anything similar', 'Serves unsafe near-misses'],
          ['Crowkis', 'Matches meaning and structure', 'Reuses only when it is safe'],
        ],
      },
      how: [
        ['Ask', 'Your app sends the question to Crowkis over the protocol you already use: RESP3, gRPC, REST or MCP.'],
        ['Understand', 'It embeds the question for meaning and matches its intent structure across 12 intent classes.'],
        ['Check', 'Five signals are scored before anything is reused: similarity, structure, confidence, trust and freshness.'],
        ['Answer', 'A safe hit returns in about 0.4 ms. A miss goes to your model once, and Crowkis learns the answer for next time.'],
      ],
      forYou: [
        ['Cut your LLM bill', 'On repetitive workloads a semantic cache can cut model spend by up to 60–70%. Stop paying twice for the same answer.'],
        ['Answer instantly', 'Cache hits return in under a millisecond instead of a multi-second model round-trip.'],
        ['Keep answers safe', 'An anti-poisoning pipeline, confidence gates, guardrails for prompt injection and PII, and human-pinned answers.'],
        ['Give agents memory', 'Long-term memory scoped to each agent and user, plus reasoning reuse that replays a chain of thought for about 15% of the token cost.'],
        ['Adopt it in minutes', 'Your existing clients connect unmodified. One Docker image, every feature compiled in, zero external API calls.'],
        ['Run it your way', 'Self-hosted and free to run as the Community edition, with Enterprise features such as SSO, audit chains and per-tenant chargeback.'],
      ],
      code: {
        title: 'three commands, any RESP3 client',
        body: 'CSET "how do refunds work?" "Refunds take 5-7 business days."\nCGET "what\'s the refund timeline?"   # a paraphrase, still a hit\nCSIM "how do refunds work?" "refund process?"   # -> similarity score',
      },
    },
  },
  {
    id: 'curva',
    name: 'Curva',
    status: 'Coming soon',
    url: null, // ponytail: no domain yet; set it here and every page picks it up.
    logo: '/products/curva.png',
    logoAlt: 'Curva logo: a halftone letter C in white on deep blue',
    wordmark: ['/products/curva-wordmark-white.png', 1200, 305], // white on transparent
    color: '#1800ad',
    tagline: 'Next from the Tarkova studio.',
    // TODO(tarkova): replace with Curva's real one-liner once it's announced.
    summary: 'Curva is the next product from Tarkova. It is in the works now, and details land here first.',
    facts: [],
    links: [],
    page: {
      title: 'Curva: coming soon from Tarkova',
      description: 'Curva is the next product from Tarkova, the studio behind Crowkis. It is in the works now, and details land here first.',
      hero: 'Curva is the next product from the Tarkova studio. We are building it now, and this page is where it will be introduced first.',
      // TODO(tarkova): fill problem / what / how / forYou like Crowkis once Curva is announced.
    },
  },
]
