#!/usr/bin/env python3
"""Convert a light Markdown post into content/curva/posts/<slug>.json (usage: curva-md2post.py in.md out.json).

Front matter: slug, title, summary, tag, source_check (comma list).
Blocks: blank-line separated. '## ' h2, '### ' h3, '> ' quote, '- '/'1. ' list,
'|' table (first row head, second row separator), ```lang [title] [original] code,
```mermaid [title] | caption  diagram, ':::plain' / ':::callout Title' paragraphs,
'@numbers' line before a block marks it as a benchmark-numbers block.
"""
import json, re, sys

src = open(sys.argv[1]).read()
fm, body = re.match(r'^---\n(.*?)\n---\n(.*)$', src, re.S).groups()
meta = dict(l.split(': ', 1) for l in fm.splitlines() if l.strip())
blocks, lines, i = [], body.split('\n'), 0
numbers = False
example = False

def para(start):
    out = []
    j = start
    while j < len(lines) and lines[j].strip():
        out.append(lines[j].strip())
        j += 1
    return ' '.join(out), j

def add(b):
    global numbers, example
    if numbers:
        b['numbers'] = True
        numbers = False
    if example:
        b['example'] = True
        example = False
    blocks.append(b)

while i < len(lines):
    l = lines[i]
    if not l.strip():
        i += 1
        continue
    if l.strip() == '@numbers':
        numbers = True
        i += 1
        continue
    if l.strip() == '@example':
        example = True
        i += 1
        continue
    if l.startswith('```'):
        head = l[3:].strip()
        j = i + 1
        code = []
        while not lines[j].startswith('```'):
            code.append(lines[j])
            j += 1
        if head.startswith('mermaid'):
            rest = head[len('mermaid'):].strip()
            title, _, cap = rest.partition('|')
            b = {'kind': 'diagram', 'chart': '\n'.join(code)}
            if title.strip(): b['title'] = title.strip()
            if cap.strip(): b['caption'] = cap.strip()
        else:
            parts = head.split()
            original = 'original' in parts
            parts = [p for p in parts if p != 'original']
            b = {'kind': 'code', 'title': ' '.join(parts) or 'code', 'code': '\n'.join(code)}
            if original: b['original'] = True
        add(b)
        i = j + 1
        continue
    if l.startswith('## '):
        add({'kind': 'h2', 'text': l[3:].strip()}); i += 1; continue
    if l.startswith('### '):
        add({'kind': 'h3', 'text': l[4:].strip()}); i += 1; continue
    if l.startswith(':::plain'):
        t, i = para(i + 1); add({'kind': 'plain', 'text': t}); continue
    if l.startswith(':::callout'):
        title = l[len(':::callout'):].strip()
        t, i = para(i + 1)
        b = {'kind': 'callout', 'text': t}
        if title: b['title'] = title
        add(b); continue
    if l.startswith('> '):
        t, i = para(i); add({'kind': 'quote', 'text': t[2:]}); continue
    if l.startswith('|'):
        rows = []
        while i < len(lines) and lines[i].startswith('|'):
            rows.append([c.strip() for c in lines[i].strip().strip('|').split('|')])
            i += 1
        add({'kind': 'table', 'head': rows[0], 'rows': rows[2:]})
        continue
    if re.match(r'^(- |\d+\. )', l):
        ordered = bool(re.match(r'^\d+\. ', l))
        items = []
        while i < len(lines) and lines[i].strip():
            if re.match(r'^(- |\d+\. )', lines[i]):
                items.append(re.sub(r'^(- |\d+\. )', '', lines[i]).strip())
            else:
                items[-1] += ' ' + lines[i].strip()
            i += 1
        b = {'kind': 'list', 'items': items}
        if ordered: b['ordered'] = True
        add(b); continue
    t, i = para(i)
    add({'kind': 'p', 'text': t})

post = {'slug': meta['slug'], 'title': meta['title'], 'summary': meta['summary'], 'tag': meta['tag'],
        'source_check': [s.strip() for s in meta['source_check'].split(',')], 'body': blocks}
out = sys.argv[2]
json.dump(post, open(out, 'w'), indent=2, ensure_ascii=False)
open(out, 'a').write('\n')
