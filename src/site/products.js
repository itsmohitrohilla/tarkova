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
    color: '#C41A1A',
    tagline: 'Smarter caching, smaller bills.',
    summary:
      'A semantic cache and agent memory layer, built in Rust for LLM workloads. It understands what a question means and safely reuses answers, so you stop paying twice for the same answer.',
    facts: [
      ['0.4 ms', 'per cache hit'],
      ['5', 'safety checks per hit'],
      ['4', 'protocols: RESP3, gRPC, REST, MCP'],
      ['Free', 'Community edition'],
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
      hero: 'A cache for AI apps. When users ask the same thing in different words, Crowkis answers from cache in under a millisecond. You pay your LLM once.',
      who: {
        title: 'For apps that hear the *same questions*.',
        items: [
          ['Support bots', 'The same fifty questions, all day.'],
          ['Copilots & dev tools', 'One answer, reused by the whole team.'],
          ['RAG & docs search', 'Cache the finished answer, not the chunks.'],
          ['AI agents', 'Memory per user, and reasoning reuse.'],
          ['Voice assistants', 'Replies start before the caller notices.'],
        ],
      },
      // Commands and code as published on crowkis.com/docker and /docs (PyPI crowkis 0.5.0, npm @crowkis/client 0.5.0, Docker crowkis/crowkis 0.5.1).
      install: {
        docker: {
          pull: 'docker pull crowkis/crowkis:latest',
          run: 'docker run -d --name crowkis \\\n  -p 127.0.0.1:6379:6379 \\\n  -p 127.0.0.1:6380:6380 \\\n  -p 127.0.0.1:6381:6381 \\\n  -v crowkis-data:/data \\\n  crowkis/crowkis:latest',
          check: 'curl 127.0.0.1:6380/health',
          ports: [['6379', 'RESP3 clients and CLI'], ['6380', 'HTTP: dashboard, REST, health'], ['6381', 'gRPC']],
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
      problem: {
        title: 'Your LLM bill is mostly *déjà vu*.',
        intro: 'Users ask the same thing in different words. Your LLM bills every one as new.',
        items: [
          ['You pay for reruns', 'Reworded means a new, full-price call.'],
          ['Exact caches miss', 'Change one word and a key-value cache misses.'],
          ['Similarity alone is unsafe', '“Cancel my plan” is not “pause my plan”.'],
          ['Bad answers spread', 'Cache one hallucination, serve it to everyone.'],
          ['Upgrades reset you', 'Switch models and most caches go cold.'],
        ],
      },
      what: {
        title: 'Meaning, structure, confidence, *trust*.',
        text: 'It matches what a question means, then checks the answer is safe to reuse.',
        compare: [
          ['Exact-match cache', 'Identical text only', 'Misses every rephrasing'],
          ['Vector-only cache', 'Anything similar', 'Serves unsafe near-misses'],
          ['Crowkis', 'Meaning and structure', 'Reuses only when safe'],
        ],
      },
      how: [
        ['Ask', 'Your app asks Crowkis over RESP3, gRPC, REST or MCP.'],
        ['Understand', 'It reads the meaning and the intent of the question.'],
        ['Check', 'Five checks: similarity, structure, confidence, trust, freshness.'],
        ['Answer', 'A safe hit returns in about 0.4 ms. A miss calls your model once.'],
      ],
      forYou: [
        ['Cut your LLM bill', 'Pay for an answer once, however it is asked.'],
        ['Answer instantly', 'Under a millisecond, not a multi-second model call.'],
        ['Keep answers safe', 'Five checks before any answer is reused.'],
        ['Adopt it in minutes', 'Your existing clients connect unmodified.'],
        ['Run it your way', 'Self-hosted. Community is free.'],
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
