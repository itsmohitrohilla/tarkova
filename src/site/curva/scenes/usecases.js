// Scene "usecases" (BLUE): six use cases as a radio list beside one decision card: the input, the question in
// plain words, and what Curva returns. CSS-only (radios + :has), so it works without JS; init adds an auto tour
// and counts the numbers up. Every case is in the server HTML; inactive cards are visibility-hidden.
// Sources, all in curva/Content Box/3 Use cases/ (numbers appear only where a file gives one):
//   support-triage.md (ticket, options, abstains below 0.8) + ai-agents.md (billing 0.97 ... refund 0.93)
//   phishing.md (the :2096 login link counted as suspicious_link, the returned keys, 80.8% n = 100)
//   content-moderation.md (the policy question and labels, 0.85, 8 images, image hash)
//   llm-output-qa.md (request/answer/context, the returned keys, 0.8, council)
//   document-extraction.md (the ACME invoice, total 14.3 at 0.94, po_number None)
//   incident-triage.md (the three stages, rollback 0.78 at stage 2)
export const id = 'usecases'

// in: the input (k label, t trusted HTML). head: pick (+pk label) and/or say, then a pixel number (k, v).
// rows: what comes back: k key, v value text, p probability (bar + pixel number), pick highlights the answer.
const CASES = [
  {
    name: 'Support triage', line: 'Send every ticket to the team that should handle it.',
    in: { k: 'ticket', t: '“Charged twice, refund please”' },
    q: 'Which team should handle this ticket?',
    head: { pk: 'team', pick: 'billing', k: 'confidence', v: 0.97 },
    rows: [{ k: 'billing', p: 0.97, pick: 1 }, { k: 'technical', p: 0.02 }, { k: 'sales', p: 0.01 }, { k: 'none_of_these', p: 0 }, { k: 'refund', v: 'P(yes)', p: 0.93, sep: 1 }],
    foot: 'Under 0.8 Curva abstains. A person picks the team, and that answer calibrates the question.',
  },
  {
    name: 'Phishing checks', line: 'Flag suspicious emails, with how sure Curva is.',
    in: { k: 'email', t: 'Its link opens a webmail login page on port <code>:2096</code>, on a domain that has nothing to do with the sender.' },
    q: 'Is this email phishing?',
    head: { pk: 'tactic found', pick: 'suspicious_link' },
    rows: [{ k: 'phishing', v: 'P(phishing)' }, { k: 'tactics', v: 'each tactic found, with a probability' }, { k: 'risk', v: 'Safe · Low · Medium · High' }, { k: 'sender_mismatch', v: 'P(yes)' }],
    foot: 'With Gemini flash-lite it got 80.8% right on a public phishing set (n = 100). Smaller models did worse, so test yours first.',
  },
  {
    name: 'Content moderation', line: 'A policy call on every post, text and images together.',
    in: { k: 'post', t: '<span class="cv-uc-img" aria-hidden="true"></span><span>A caption and an image, from an account 3 days old.</span>' },
    q: 'Does the image break the content policy?',
    head: { say: 'Not sure enough? A moderator decides.', k: 'abstains below', v: '0.85' },
    rows: [{ k: 'ok', v: 'nothing wrong' }, { k: 'nudity' }, { k: 'violence' }, { k: 'spam', v: 'ads or scams' }],
    foot: 'Up to 8 images per decision. The audit log keeps a hash of each image, never the image.',
  },
  {
    name: 'LLM output QA', line: 'Check an AI answer before your user sees it.',
    in: { k: 'draft', t: '<span><b>request</b> the user’s message</span><span><b>answer</b> your model’s draft</span><span><b>context</b> the source documents</span>' },
    q: 'Pass, revise or block this answer?',
    head: { say: 'Unsure? The draft waits for a person.', k: 'abstains below', v: '0.8' },
    rows: [{ k: 'verdict', v: 'pass · revise · block' }, { k: 'answers_question', v: 'Not at all · Partly · Mostly · Fully' }, { k: 'grounded', v: 'P(every claim is supported)' }, { k: 'unsafe', v: 'P(yes)' }, { k: 'leaks_data', v: 'P(yes)' }],
    foot: 'Ask two or three models at once. Where they disagree, confidence drops: your cue to look closer.',
  },
  {
    name: 'Document extraction', line: 'Pull values out of invoices and receipts, each with its own confidence.',
    in: { k: 'invoice', t: '<mark>ACME Inc.</mark> / Invoice <mark>2291</mark> / 3 x Widget @ 4.10 / Shipping 2.00 / Total due <mark>14.30</mark> EUR' },
    q: 'What are the vendor, invoice number, total and PO number?',
    head: { pk: 'total', pick: '14.3', k: 'confidence', v: 0.94 },
    rows: [{ k: 'vendor', v: 'ACME Inc.' }, { k: 'invoice_no', v: '2291' }, { k: 'total', v: '14.3', p: 0.94, pick: 1 }, { k: 'po_number', v: 'null' }],
    foot: 'The invoice has no PO number, so Curva returns null instead of inventing one.',
  },
  {
    name: 'Incident triage', line: 'Linked questions about one alert, answered in one request.',
    in: { k: 'alert', t: '<span><b>stage 0</b> which system is failing</span><span><b>stage 1</b> how severe, and did a deploy cause it</span><span><b>stage 2</b> roll back or not</span>' },
    q: 'Should the last deployment be rolled back now?',
    head: { pk: 'answered at', pick: 'stage 2', k: 'P(yes)', v: 0.78 },
    rows: [{ k: 'system', v: 'database · api · network' }, { k: 'severity', v: 'minor · major · critical' }, { k: 'deployment_related', v: 'yes or no' }, { k: 'rollback', p: 0.78, pick: 1 }],
    foot: 'Each question sees the earlier answers and how sure they were. The decision is logged once.',
  },
]

// A pixel numeral; probabilities carry data-v so init can count them up.
const num = (v) => (typeof v === 'number' ? `<em data-v="${v}">${v.toFixed(2)}</em>` : `<em>${v}</em>`)

const row = ({ k, v, p, pick, sep }) => `<li class="cv-uc-r${pick ? ' is-pick' : ''}${sep ? ' is-sep' : ''}${p === undefined ? '' : ' has-p'}">
            <code>${k}</code>${p === undefined ? (v ? `<span>${v}</span>` : '') : `<span class="cv-uc-meter">${v ? `<b>${v}</b>` : ''}<span class="cv-uc-bar" aria-hidden="true"><i style="--p:${p}"></i></span></span>${num(p)}`}
          </li>`

const panel = (c, i) => `<article class="cv-uc-panel" id="cv-uc-p${i}" aria-label="${c.name}: what Curva returns">
        <div class="cv-uc-in"><span class="cv-uc-k">${c.in.k}</span><p>${c.in.t}</p></div>
        <p class="cv-uc-q">${c.q}</p>
        <div class="cv-uc-head">
          <div>${c.head.pick ? `<span class="cv-uc-k">${c.head.pk}</span><b class="cv-uc-ans">${c.head.pick}</b>` : `<p class="cv-uc-say">${c.head.say}</p>`}</div>
          ${c.head.v === undefined ? '' : `<div class="cv-uc-big"><span class="cv-uc-k">${c.head.k}</span>${num(c.head.v)}</div>`}
        </div>
        <ul class="cv-uc-rows">
          ${c.rows.map(row).join('\n          ')}
        </ul>
        <p class="cv-uc-foot">${c.foot}</p>
      </article>`

export const html = () => `<section class="cv-scene cv-usecases" data-scene="usecases" aria-labelledby="cv-uc-title">
  <div class="cv-uc-wrap">
    <h2 id="cv-uc-title">What you can build with Curva.</h2>
    <p class="cv-uc-sub">Pick one to see what Curva sends back.</p>
    <div class="cv-uc-pick">
      <div class="cv-uc-list" role="radiogroup" aria-label="Use cases">
${CASES.map((c, i) => `        <div class="cv-uc-row">
          <input type="radio" name="cv-uc" id="cv-uc-${i}" aria-describedby="cv-uc-l${i}"${i ? '' : ' checked'} />
          <span class="cv-uc-n" aria-hidden="true">${i + 1}</span>
          <h3><label for="cv-uc-${i}">${c.name}</label></h3>
          <p id="cv-uc-l${i}">${c.line}</p>
          <i class="cv-uc-prog" aria-hidden="true"></i>
        </div>`).join('\n')}
      </div>
      <div class="cv-uc-card">
      ${CASES.map(panel).join('\n      ')}
      </div>
    </div>
  </div>
</section>`

// ---------- browser ----------
// The tour: while the section is on screen, the active row's progress line runs (a 5s CSS animation, paused on
// hover or focus); when it ends, the next case is selected. Any choice by the reader ends the tour for good.
export function init(el, { gsap, ScrollTrigger }) {
  const radios = [...el.querySelectorAll('.cv-uc-list input')]
  const count = (i) => el.querySelectorAll(`#cv-uc-p${i} [data-v]`).forEach((n) => {
    const o = { v: 0 }
    gsap.fromTo(o, { v: 0 }, { v: +n.dataset.v, duration: 0.9, delay: 0.15, ease: 'power2.out', overwrite: true, onUpdate: () => { n.textContent = o.v.toFixed(2) } })
  })
  const active = () => radios.findIndex((r) => r.checked)

  el.addEventListener('change', (e) => { el.classList.add('is-user'); count(radios.indexOf(e.target)) })
  el.addEventListener('animationend', (e) => {
    if (e.animationName !== 'cv-uc-prog') return
    const i = (active() + 1) % radios.length
    radios[i].checked = true
    count(i)
  })
  ScrollTrigger.create({
    trigger: el.querySelector('.cv-uc-pick'), start: 'top 70%', end: 'bottom 30%',
    onToggle: ({ isActive }) => {
      el.classList.toggle('is-on', isActive)
      if (isActive && !el.classList.contains('is-seen')) { el.classList.add('is-seen'); count(active()) }
    },
  })
}
