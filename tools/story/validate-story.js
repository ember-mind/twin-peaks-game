#!/usr/bin/env node
/* tools/story/validate-story.js
 *
 * Deterministic validator for the Story Truth Layer (docs/story/). No LLM
 * calls, no network, no mutation of any source file. Parses every .md under
 * docs/story/ (recursively, skipping README.md and CHANGELOG.md files) as a
 * "--- key: value ---" frontmatter block + body, and runs a set of named
 * checks against it.
 *
 * Usage: node tools/story/validate-story.js [--json]
 * Exports: lint() -> { errors, warnings, checksRun }
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const STORY_DIR = path.join(ROOT, 'docs', 'story');

const VALID_SOURCE = new Set(['canon', 'adaptation', 'project-fact', 'new-proposal', 'interpretation', 'uncertain']);
const OBJECTIVE_SOURCE = new Set(['canon', 'adaptation', 'project-fact']);
const VALID_STATUS = new Set(['locked', 'open', 'deprecated']);
const ID_SCOPED_DIRS = new Set(['characters', 'facts', 'revelations', 'relationships']);
const KNOWLEDGE_HEADINGS = ['Knows', 'Suspects', 'Falsely believes', 'Withholds'];

function listMarkdownFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listMarkdownFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md' && entry.name !== 'CHANGELOG.md') {
      out.push(full);
    }
  }
  return out;
}

// Parses a leading "---\nkey: value\n...\n---\n" block. Returns
// { frontmatter, body, ok } — ok is false if the block is missing/malformed.
function parseFrontmatter(text) {
  const lines = text.split('\n');
  if (lines[0].trim() !== '---') return { frontmatter: {}, body: text, ok: false };
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') { end = i; break; }
  }
  if (end === -1) return { frontmatter: {}, body: text, ok: false };
  const fm = {};
  for (const line of lines.slice(1, end)) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (m) fm[m[1]] = m[2].trim();
  }
  const body = lines.slice(end + 1).join('\n');
  return { frontmatter: fm, body, ok: true };
}

function lint(opts) {
  opts = opts || {};
  const errors = [];
  const warnings = [];
  let checksRun = 0;
  const check = () => { checksRun += 1; };
  const rel = (p) => path.relative(ROOT, p);
  const err = (checkName, file, message) => errors.push({ check: checkName, file: rel(file), message });
  const warn = (checkName, file, message) => warnings.push({ check: checkName, file: rel(file), message });

  if (!fs.existsSync(STORY_DIR)) {
    err('story-dir', STORY_DIR, 'docs/story/ does not exist');
    return { errors, warnings, checksRun: 1 };
  }

  const files = listMarkdownFiles(STORY_DIR).sort();
  const parsed = new Map(); // file -> { frontmatter, body, ok, dirTop }
  const idToFile = new Map(); // id -> file (for uniqueness + cross-refs)
  const knownIds = new Set();

  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const { frontmatter, body, ok } = parseFrontmatter(text);
    const dirTop = path.relative(STORY_DIR, path.dirname(file)).split(path.sep)[0];
    parsed.set(file, { frontmatter, body, ok, dirTop });

    check(); // frontmatter present
    if (!ok) {
      err('frontmatter-present', file, 'missing or malformed --- key: value --- frontmatter block');
      continue;
    }
    for (const req of ['id', 'source', 'status', 'owner', 'since']) {
      check();
      if (!frontmatter[req]) err('frontmatter-present', file, `missing required frontmatter field "${req}"`);
    }

    if (frontmatter.id) {
      knownIds.add(frontmatter.id);
      check(); // id uniqueness
      if (idToFile.has(frontmatter.id)) {
        err('id-unique', file, `id "${frontmatter.id}" duplicates ${rel(idToFile.get(frontmatter.id))}`);
      } else {
        idToFile.set(frontmatter.id, file);
      }
    }

    if (ID_SCOPED_DIRS.has(dirTop) && frontmatter.id) {
      check(); // id equals filename stem
      const stem = path.basename(file, '.md');
      if (frontmatter.id !== stem) {
        err('id-matches-filename', file, `frontmatter id "${frontmatter.id}" does not match filename stem "${stem}"`);
      }
    }

    if (frontmatter.source) {
      check(); // source enum
      if (!VALID_SOURCE.has(frontmatter.source)) {
        err('source-enum', file, `source "${frontmatter.source}" is not one of ${[...VALID_SOURCE].join(', ')}`);
      }
    }
    if (frontmatter.status) {
      check(); // status enum
      if (!VALID_STATUS.has(frontmatter.status)) {
        err('status-enum', file, `status "${frontmatter.status}" is not one of ${[...VALID_STATUS].join(', ')}`);
      }
    }

    check(); // deprecated requires replaced_by
    if (frontmatter.status === 'deprecated' && !frontmatter.replaced_by) {
      err('deprecated-replaced-by', file, 'status: deprecated but frontmatter has no replaced_by');
    }
  }

  // Objective-truth-only-from-canon/adaptation/project-fact.
  for (const [file, { frontmatter, body, dirTop }] of parsed) {
    if (dirTop !== 'facts') continue;
    check();
    const bodyLines = body.split('\n');
    const declaresObjectiveLine = bodyLines.some((l) => l.trim().startsWith('Objective truth:'));
    const declaresObjectiveFm = frontmatter.truth === 'objective';
    const declaresObjective = declaresObjectiveLine || declaresObjectiveFm;
    if (declaresObjective && frontmatter.source && !OBJECTIVE_SOURCE.has(frontmatter.source)) {
      err('objective-truth-source', file, `declares objective truth but source is "${frontmatter.source}" (must be canon, adaptation or project-fact)`);
    }
    if (declaresObjectiveFm && frontmatter.source && (frontmatter.source === 'interpretation' || frontmatter.source === 'uncertain')) {
      err('objective-truth-source', file, `truth: objective is not allowed with source "${frontmatter.source}"`);
    }
  }

  // Cross-references.
  const REF_RE = /\[\[([^\]]+)\]\]|\b((?:facts|characters|revelations|relationships)\/[A-Za-z0-9_-]+)\b/g;
  for (const [file, { body }] of parsed) {
    check();
    let m;
    REF_RE.lastIndex = 0;
    while ((m = REF_RE.exec(body))) {
      if (m[1]) {
        // [[wiki]] link -> WARN if unresolved
        if (!knownIds.has(m[1])) {
          warn('wiki-link-resolves', file, `[[${m[1]}]] does not resolve to a known id`);
        }
      } else if (m[2]) {
        const [dir, id] = m[2].split('/');
        const target = path.join(STORY_DIR, dir, `${id}.md`);
        if (!fs.existsSync(target)) {
          err('path-ref-resolves', file, `reference "${m[2]}" does not resolve to an existing file`);
        }
      }
    }
  }

  // revelations/ must cite at least one facts/ reference.
  for (const [file, { body, dirTop }] of parsed) {
    if (dirTop !== 'revelations') continue;
    check();
    const hasFactRef = /\bfacts\/[A-Za-z0-9_-]+\b/.test(body);
    if (!hasFactRef) err('revelation-cites-fact', file, 'no facts/<id> reference found in body');
  }

  // relationships/ must reference two characters/ files.
  for (const [file, { body, dirTop }] of parsed) {
    if (dirTop !== 'relationships') continue;
    check();
    const refs = new Set((body.match(/\bcharacters\/[A-Za-z0-9_-]+\b/g) || []));
    if (refs.size < 2) {
      err('relationship-cites-two-characters', file, `found ${refs.size} distinct characters/<id> reference(s), need at least 2`);
    }
  }

  // timeline.md ordering.
  const timelinePath = path.join(STORY_DIR, 'timeline.md');
  if (fs.existsSync(timelinePath) && parsed.has(timelinePath)) {
    check();
    const { body } = parsed.get(timelinePath);
    const lines = body.split('\n');
    let section = null;
    let lastNum = -Infinity;
    const tRow = /\|\s*T(\d+)\s*\|/;
    const headingRe = /^#{1,6}\s*([A-D])\b/;
    const tIndex = new Map(); // T-id -> { num, section, line }
    const rows = [];
    lines.forEach((line, i) => {
      const h = line.match(headingRe);
      if (h) { section = h[1]; lastNum = -Infinity; }
      const r = line.match(tRow);
      if (r) {
        const num = parseInt(r[1], 10);
        const tid = `T${num}`;
        tIndex.set(tid, { num, section, line: i });
        rows.push({ tid, num, section, line, lineNo: i });
        if (num <= lastNum) {
          err('timeline-order', timelinePath, `row ${tid} (section ${section || '?'}, line ${i + 1}) is not strictly increasing after T${lastNum}`);
        }
        lastNum = num;
      }
    });
    for (const row of rows) {
      const afterM = row.line.match(/after:\s*T(\d+)/);
      if (afterM) {
        const constraintId = `T${afterM[1]}`;
        const target = tIndex.get(constraintId);
        if (target && target.lineNo > row.lineNo) {
          err('timeline-after-constraint', timelinePath, `${row.tid} declares after: ${constraintId} but ${constraintId} appears later in the file`);
        }
      }
    }
  }

  // Knowledge claims sourced.
  for (const [file, { body, dirTop }] of parsed) {
    if (dirTop !== 'characters') continue;
    const lines = body.split('\n');
    let currentHeading = null;
    lines.forEach((line) => {
      const h = line.match(/^#{1,6}\s*(.+?)\s*$/);
      if (h && KNOWLEDGE_HEADINGS.includes(h[1].trim())) {
        currentHeading = h[1].trim();
        return;
      }
      if (h) { currentHeading = null; return; }
      const bullet = line.match(/^\s*[-*]\s+(.*\S)\s*$/);
      if (bullet && currentHeading) {
        check();
        if (!/\(src:[^)]*\)\s*$/.test(bullet[1])) {
          err('knowledge-claim-sourced', file, `unsupported knowledge claim under "${currentHeading}": "${bullet[1].slice(0, 60)}"`);
        }
      }
    });
  }

  // README / CLAUDE.md contract pointers.
  const storyReadme = path.join(STORY_DIR, 'README.md');
  check();
  if (fs.existsSync(storyReadme)) {
    const text = fs.readFileSync(storyReadme, 'utf8');
    if (!/^##\s+Story truth update contract\s*$/m.test(text)) {
      err('readme-update-contract', storyReadme, 'missing "## Story truth update contract" heading');
    }
  } else {
    err('readme-update-contract', storyReadme, 'docs/story/README.md does not exist');
  }

  const narrativeReadme = path.join(ROOT, 'docs', 'narrative', 'README.md');
  check();
  if (fs.existsSync(narrativeReadme)) {
    const text = fs.readFileSync(narrativeReadme, 'utf8');
    if (!text.includes('docs/story/README.md')) {
      err('narrative-readme-points-to-story', narrativeReadme, 'does not reference docs/story/README.md');
    }
  } else {
    err('narrative-readme-points-to-story', narrativeReadme, 'docs/narrative/README.md does not exist');
  }

  const claudeMd = path.join(ROOT, 'CLAUDE.md');
  check();
  if (fs.existsSync(claudeMd)) {
    const text = fs.readFileSync(claudeMd, 'utf8');
    if (!text.includes('docs/story/')) {
      err('claude-md-points-to-story', claudeMd, 'does not reference docs/story/');
    }
  } else {
    err('claude-md-points-to-story', claudeMd, 'CLAUDE.md does not exist');
  }

  // setup-payoff-overview.md, if present.
  const spPath = path.join(STORY_DIR, 'setup-payoff-overview.md');
  if (fs.existsSync(spPath)) {
    check();
    const text = fs.readFileSync(spPath, 'utf8');
    const lines = text.split('\n');
    const validClasses = new Set(['PAID', 'INTENTIONAL-UNRESOLVED', 'UNPAID']);
    const tableLines = lines.filter((l) => l.trim().startsWith('|'));
    if (tableLines.length >= 2) {
      const header = tableLines[0].split('|').map((c) => c.trim()).filter(Boolean);
      const classIdx = header.findIndex((h) => /^class$/i.test(h));
      const ownerIdx = header.findIndex((h) => /^owner$/i.test(h));
      for (let i = 1; i < tableLines.length; i++) {
        if (/^\s*\|?\s*-+/.test(tableLines[i])) continue;
        const cells = tableLines[i].split('|').map((c) => c.trim());
        const rowCells = cells.slice(1, cells.length - (cells[cells.length - 1] === '' ? 1 : 0));
        if (classIdx < 0 || !rowCells[classIdx]) continue;
        const cls = rowCells[classIdx];
        if (!validClasses.has(cls)) {
          err('setup-payoff-class', spPath, `row ${i + 1}: class "${cls}" is not one of ${[...validClasses].join(', ')}`);
          continue;
        }
        if (cls === 'UNPAID') {
          const owner = ownerIdx >= 0 ? rowCells[ownerIdx] : '';
          if (!owner) {
            err('setup-payoff-unpaid-owner', spPath, `row ${i + 1}: UNPAID row has empty OWNER cell`);
          }
        }
      }
    }
  }

  return { errors, warnings, checksRun };
}

if (require.main === module) {
  const asJson = process.argv.includes('--json');
  const result = lint();
  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    result.warnings.forEach((w) => console.log(`WARN  [${w.check}] ${w.file}: ${w.message}`));
    result.errors.forEach((e) => console.log(`ERROR [${e.check}] ${e.file}: ${e.message}`));
    if (result.errors.length) {
      console.log(`\nstory-lint: FAIL (${result.checksRun} checks, ${result.errors.length} errors, ${result.warnings.length} warnings)`);
    } else {
      console.log(`story-lint: PASS (${result.checksRun} checks, ${result.warnings.length} warnings)`);
    }
  }
  process.exit(result.errors.length ? 1 : 0);
}

module.exports = { lint };
