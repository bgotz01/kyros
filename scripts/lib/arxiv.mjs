// ─── arXiv retrieval ─────────────────────────────────────────────────────────
// arXiv has rendered most submissions to HTML since late 2023, so paper text is
// served directly and nothing has to be parsed out of a PDF. The PDF is fetched
// only as the artefact of record — it is never read by the pipeline.

import fs from 'node:fs';
import path from 'node:path';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** arXiv asks for a gap between automated requests. */
export const POLITE_MS = 3000;

export function parseId(raw) {
    const m = String(raw).match(/(\d{4}\.\d{4,5})(v\d+)?/);
    return m ? { id: m[1] + (m[2] ?? ''), bare: m[1] } : null;
}

/** 2412.09764 → 2024. The id prefix is YYMM, so the year needs no lookup. */
export function yearOf(bare) {
    return 2000 + Number(bare.slice(0, 2));
}

export function yearDir(bare) {
    return path.join(process.cwd(), 'papers', 'archive', String(yearOf(bare)));
}

/** arXiv's abstract page exposes the first-submission date as citation_date.
 *  This is the scoring cutoff; citation_online_date may describe a later version. */
async function publishedDate(id) {
    try {
        const res = await fetch(`https://arxiv.org/abs/${id}`);
        if (!res.ok) return '';
        const html = await res.text();
        return html
            .match(/<meta\s+name=["']citation_date["']\s+content=["']([^"']+)["']/i)?.[1]
            ?.replaceAll('/', '-') ?? '';
    } catch {
        return '';
    }
}

/** LaTeXML wraps the paper in <article>; scoping to it drops the arXiv banner,
 *  the issue-report form and the navigation. */
function htmlToText(html) {
    const article = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
    let s = article ? article[1] : html;
    s = s.replace(/<(script|style|math|svg|noscript)\b[\s\S]*?<\/\1>/gi, ' ');
    s = s.replace(/<h(\d)[^>]*>([\s\S]*?)<\/h\1>/gi, (_, n, inner) =>
        `\n\n${'#'.repeat(Number(n))} ${inner.replace(/<[^>]+>/g, '').trim()}\n`,
    );
    s = s.replace(/<\/p>|<\/div>|<br\s*\/?>/gi, '\n');
    // An anchor that sits between two word characters is holding them apart, so
    // removing it has to leave a space behind. LaTeXML writes bibliography notes
    // as `<a>https://github.com/owner/name</a>GitHub repository. Accessed: …`,
    // and dropping the tag with nothing in its place welds the label onto the
    // URL — `owner/nameGitHub`, a repository that does not exist.
    //
    // Only where it actually welds, and only for anchors. Spacing every anchor
    // would turn `[30]` into `[ 30]` across every citation in the corpus, and
    // spacing every tag would split `well-formatted` and `key-value` down the
    // middle — LaTeXML wraps hyphens and fragments of words in spans too.
    s = s.replace(/(?<=[A-Za-z0-9])<\/?a\b[^>]*>(?=[A-Za-z0-9])/gi, ' ');
    s = s.replace(/<[^>]+>/g, '');
    s = s
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)));
    return s.replace(/[ \t]+/g, ' ').replace(/\n[ \t]+/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

function xmlField(xml, tag) {
    return xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))?.[1].replace(/\s+/g, ' ').trim() ?? '';
}

/** Writes `<year>/<id>.md`. Returns { id, mode, tokens, path, skipped }. */
export async function fetchText(raw, { force = false } = {}) {
    const parsed = parseId(raw);
    if (!parsed) return { id: String(raw), mode: 'no arXiv id', skipped: true };
    const { id, bare } = parsed;

    const dir = yearDir(bare);
    const out = path.join(dir, `${id}.md`);
    if (fs.existsSync(out) && !force) {
        return { id, mode: 'already have it', path: out, skipped: true };
    }

    let body = '';
    let mode = '';
    // An exact date is stored for every new artefact. If this lookup is
    // temporarily unavailable, readers fall back to the honest YYYY-MM encoded
    // in the id rather than ever using the ingestion date.
    const published = await publishedDate(id);

    const res = await fetch(`https://arxiv.org/html/${id}`);
    if (res.ok) {
        const text = htmlToText(await res.text());
        // A "no HTML for this submission" stub comes back far too short to be a
        // paper; treat anything under 2k chars as unavailable rather than as text.
        if (text.length > 2000) {
            body = text;
            mode = 'full text';
        }
    }

    if (!body) {
        const api = await fetch(`http://export.arxiv.org/api/query?id_list=${bare}`);
        const entry = (await api.text()).split('<entry>').slice(1).join('<entry>');
        body = `# ${xmlField(entry, 'title')}\n\n## Abstract\n\n${xmlField(entry, 'summary')}`;
        mode = 'abstract only';
    }

    const doc = `<!-- source: https://arxiv.org/abs/${id} -->
${published ? `<!-- published: ${published} -->\n` : ''}<!-- fetched: ${new Date().toISOString().slice(0, 10)} — ${mode} -->
<!-- Not evidence on its own. The PDF in pdf/ is the artefact of record. -->

${body}
`;
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(out, doc, 'utf-8');
    return { id, mode, tokens: Math.round(doc.length / 4), path: out };
}

/** Writes `<year>/pdf/<id>.pdf`. The artefact of record — stored, never parsed. */
export async function fetchPdf(raw, { force = false } = {}) {
    const parsed = parseId(raw);
    if (!parsed) return { id: String(raw), skipped: true };
    const { id, bare } = parsed;

    const dir = path.join(yearDir(bare), 'pdf');
    const out = path.join(dir, `${id}.pdf`);
    if (fs.existsSync(out) && !force) return { id, path: out, skipped: true };

    const res = await fetch(`https://arxiv.org/pdf/${id}`);
    if (!res.ok) return { id, error: `HTTP ${res.status}` };

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.subarray(0, 4).toString() !== '%PDF') return { id, error: 'not a PDF' };

    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(out, buf);
    return { id, path: out, bytes: buf.length };
}
