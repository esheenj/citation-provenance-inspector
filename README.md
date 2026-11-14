# Citation Trace Inspector

**Product identity:** **Citation Trace Inspector** is the public display name for this offline claim-to-source *structural traceability* workbench. Inspect supplied source identifiers, HTTPS URL syntax, excerpt matching, age thresholds and uncited claims through the existing browser and CLI.

**For:** AI evaluation developers, technical writers and engineering teams reviewing synthetic evidence records. This tool does not visit webpages, authenticate sources, judge whether a quote logically supports a claim or certify factual accuracy. The repository slug, package, input contracts and Pages URL are unchanged.


**Every claim needs a trail.**

An original, dependency-free offline web and CLI workbench that reviews **structural citation traceability**. It flags broken source IDs, unusable URLs, missing quoted passages, date inconsistencies, uncited claims and orphan source records. It does not fetch URLs, decide whether a citation supports a claim, or verify page authorship.

**Live demo:** https://esheenj.github.io/citation-provenance-inspector/

## Run locally

Requires Node.js 20+:

```bash
git clone https://github.com/esheenj/citation-provenance-inspector.git
cd citation-provenance-inspector
npm test
npm run demo
npm run build
```

For a synthetic source inventory:

```bash
node src/cli.mjs examples/scenario.json
```

CLI exit codes: `0` = structurally traceable (or informational notes only); `2` = broken references or source-record errors; `3` = review needed without errors; `1` = invalid input. **The included sample deliberately exits 3** because it contains an uncited claim.

## Input conventions

- `asOf` is a fixed ISO timestamp with a timezone; deterministic freshness results do not depend on the current clock.
- `maxAgeDays` is a chosen threshold from 1 to 3650 days, not a universal rule for source expiry.
- `sources[]` contains `{id,title,url,excerpt,publishedAt?,retrievedAt?}`. URLs must use HTTPS without embedded credentials; excerpts are supplied by the caller and not retrieved or authenticated.
- `claims[]` contains `{id,text,citations:[{sourceId,quote}]}`. Quoted passages are compared with supplied excerpts after whitespace normalization.

All examples are fictional, and example.org URLs are illustrative only.

## What results mean

| Result | Interpretation |
| --- | --- |
| `INVALID_REFERENCES` | Broken source identifiers, insecure or malformed URLs, or invalid source date syntax |
| `REVIEW_REQUIRED` | Uncited claim, missing or unmatched excerpt quote, unclear dates, or an age-threshold warning |
| `STRUCTURALLY_TRACEABLE` | Linked IDs and excerpt comparisons pass the supported subset; **claim truth is not verified** |
| `RETRIEVAL_NOT_RECORDED` | No collection timestamp is supplied; informational note |
| `UNUSED_SOURCE` | A source is in the record but no claim refers to it; informational note |

The browser and CLI accept up to 1 MiB; maximum 100 sources, 200 claims, 400 citations. No runtime dependencies, accounts, telemetry, network requests or recurring hosting fees.

## Provenance concept and limits

The [W3C PROV-O ontology](https://www.w3.org/TR/prov-o/) defines concepts such as `wasDerivedFrom`, `wasGeneratedBy`, and `wasAttributedTo`. These inform evidence-trail thinking, but this application is **not a PROV-O implementation** and does not generate standards-conformant RDF.

The inspector cannot establish source authenticity, webpage availability, original authorship, quote accuracy, current relevance, source credibility, factual entailment, contradictions, model hallucinations, or licensing rights. A quote appearing in an excerpt is not proof that a claim is true. Human verification and external-source research are separate.

No private customer evidence, proprietary prompts, SIGMA/Cortex control data, payment credentials or trading code is included. Use authorized synthetic data.

## Contributing and funding

Open a focused issue containing fictional input, an expected finding and a negative test. The code and sample data remain MIT licensed and free.

Optional [Esheen Labs support page](https://esheenj.github.io/compound-intelligence-starter/support.html). Check a current crypto deposit address, network and minimum before sending. Native GitHub Sponsors and fiat checkout are not claimed as active.

© 2026 Esheen Labs.
