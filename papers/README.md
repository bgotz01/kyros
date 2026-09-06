# Papers — raw input

## Scripts

| Command | What it does |
|---|---|
| `npm run pull` | Pull the oldest week not yet held |
| `npm run pull all` | Pull the entire backlog |
| `npm run pull 4` | Pull the next four weeks |
| `npm run pull latest` | Pull the most recent week, held or not |
| `npm run pull latest pdf` | Same, also store PDFs |
| `npm run pull status` | Show what is held and what is not — fetches nothing |
| `npm run pull repos` | Rebuild `repos.json` from stored text — fetches nothing |
| `npm run week 2026 "Jan 6"` | List a specific week (the gate worksheet) |
| `npm run week 2026 "Jan 6" fetch pdf` | Pull a specific week |
| `npm run fetch 2501.04519` | Pull one or more papers by arXiv id |
| `npm run fetch 2501.04519 pdf` | Same, also store the PDF |
| `npm run candidate 2501.12948` | Scaffold a candidate record from an arXiv id |
| `npm run due` | Show what needs confirming this week |
| `npm run external` | Look up GitHub repos for every paper not yet checked |
| `npm run external all` | Re-run every paper, replacing stored data |
| `npm run external 2501.19393` | Look up one specific paper |
| `npm run external status` | Show what is stored — fetches nothing |
| `npm run external:update` | Refresh GitHub star counts for the current year |
| `npm run external:update 2026` | Refresh GitHub star counts for a specific year |
| `npm run external:update 2026 status` | Show what would be refreshed — fetches nothing |

Nothing in this folder is read by the council and nothing here is a commitment.
It is the pile. The ledger is `context/ai/candidates/`.

```
papers/
  digests/           ← weekly digest compilations, one file per year (2025.md)
  inbox/             ← drop here during the week, unsorted
  archive/
    2024/            ← filed by PUBLICATION year, from the arXiv id
      2412.21187v2.md    text — what the council reads
      pdf/
        2412.21187v2.pdf artefact of record
    2025/
    unsorted/        ← no arXiv id, or year not yet established
```

## Filed by publication year, not by digest week

`archive/<year>/` is keyed on the arXiv id prefix — `2412.09764` is December
**2024**, even though it appears in the digest's first week of 2025. The score
records `Published:`, and lag between publication and notice is the thing Kyros
measures, so the file has to sit under the date the work actually appeared.

Mechanical, derivable from the filename, no judgement required.

## Digests are an index, never evidence

`digests/2025.md` is a third-party weekly summary — roughly ten papers a week
with a paragraph each and a link. It is the fastest way to sweep a year, and it
is **not a primary artefact.**

The gate requires a primary artefact: paper, weights, code, or a reproducible
result. A digest entry is a pointer to one, and a summary of a summary is not
something to score. Follow the link before writing any number.

Treat digest prose as a claim by its author, not as a finding.

## Format — keep both, convert nothing

Each paper is stored twice — text at the year root, binary in `pdf/`:

```
archive/2024/2412.21187v2.md         ← readable text. What the council sees.
archive/2024/pdf/2412.21187v2.pdf    ← artefact of record. Never edited, never parsed.
```

The `.md` is regenerable and the `.pdf` is not, which is why they sit apart: you
can delete the whole text layer and rebuild it, but a vanished artefact makes a
score unauditable.

**There is no PDF conversion step.** arXiv has rendered most submissions to HTML
since late 2023, so the text is served directly:

```bash
npm run fetch 2412.21187v2
```

That pulls arXiv's own rendering, strips the site chrome, keeps the headings and
writes the `.md` to the year folder. It is cleaner than anything a PDF extractor
produces — no column interleaving, no ligature damage, no lost section
structure — and it needs no dependency beyond Node.

Papers with no HTML rendering (older submissions, or ones where the conversion
failed upstream) fall back automatically to the abstract, labelled as such in the
file header. For those, and for non-arXiv PDFs, read the PDF directly and write
the summary by hand. That is rare enough not to justify a parser.

**You do not have to download anything by hand.** Everything works from the id.

```bash
npm run pull                 # the oldest week not yet held — no arguments needed
npm run pull status          # what is held, what is not
npm run pull 4               # the next four weeks
npm run pull all             # the whole backlog
npm run pull latest pdf      # the most recent week, PDFs included
```

`pull` works through the digests in order and needs no week name. A week counts
as **held** when every arXiv paper in it has text in the archive, so progress is
derived from the filesystem — there is no state file to drift out of sync, and
re-running only pulls what is missing.

To name a week explicitly:

```bash
npm run week 2025 "January 6"            # list it — the gate worksheet
npm run week 2025 "January 6" fetch pdf  # pull it
npm run fetch 2501.04519 2501.04682 pdf  # or individual papers
```

Requests are spaced three seconds apart, which is what arXiv asks of automated
access — a ten-paper week takes about a minute. Anything already held is skipped,
so re-running a week is cheap and only pulls what is missing. `force` re-fetches.

Papers hosted somewhere other than arXiv — roughly one in six — are listed with
their host and left for you to file by hand.

Pulling a whole week is fine: it is ten papers and a few hundred KB. The
discipline that matters is not what sits on disk, it is what reaches the council.
Gate from the digest paragraphs, and quote only the sections that carry the
inversion.

## What reads what

| Stage | Reads |
|---|---|
| Gate | Digest entry or abstract. Never the full text. |
| Summary and inversion | The `.md` — abstract, method, results. |
| Full PDF | Only when the inversion claim is contested, or a figure matters. |

Most candidates never need the PDF opened. Watch the size: a typical paper is
5–15k tokens, but a large one runs past 45k, and pasting that into every council
turn crowds out the corpus. Quote the sections that carry the inversion instead.

## The weekly move

```bash
npm run due                     # what needs confirming
npm run candidate 2501.12948    # scaffold a record from an arXiv id
```

See `Method · The Weekly Pass`.
