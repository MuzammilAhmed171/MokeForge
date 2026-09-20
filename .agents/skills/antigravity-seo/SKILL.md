---
name: antigravity-seo
description: >-
  Comprehensive SEO operating system for Antigravity. Use when the user requests technical SEO audits, site health analysis, Core Web Vitals optimization, JSON-LD schema & structured data generation, crawlability & indexation tuning, keyword research/clustering, or Generative Engine Optimization (GEO / AI-search readiness for Perplexity, ChatGPT Search, Gemini, and Google AI Overviews). Also use for workflows triggered by /seo:audit, /seo:auto, /seo:geo, and /seo:cluster.
---

# Antigravity SEO Operating System

Antigravity SEO is an end-to-end framework for analyzing, optimizing, and auditing websites for classical search engines (Google, Bing) and AI Answer Engines (Perplexity, ChatGPT Search, Gemini, Claude, Google AI Overviews).

---

## Capabilities & Workflows

1. **Technical SEO Auditing (`/seo:audit`)**
   - Crawl and DOM inspection for status codes, canonicals, meta tags, heading hierarchies (`h1`-`h6`), link integrity, and duplicate content.
   - Refer to [Technical Audit Checklist](./references/technical_audit_checklist.md) for full inspection items.

2. **Structured Data & Schema Engine**
   - Generation and validation of schema.org JSON-LD (Organization, Person, WebSite, BreadcrumbList, CreativeWork, ProfilePage, SoftwareApplication, Service, FAQPage).
   - Rich results compatibility and validation against Schema.org specifications.
   - Refer to [Schema Templates](./references/schema_templates.md).

3. **Generative Engine Optimization (GEO) & AI-Search Readiness (`/seo:geo`)**
   - Optimize content clarity, direct answer structure, factual density, and high-authority entity citations for LLMs and AI search engines.
   - Creation and maintenance of `/llms.txt` and `/llms-full.txt` files for AI web crawlers.
   - Refer to [GEO & AI Optimization Guide](./references/geo_ai_optimization.md).

4. **Core Web Vitals & Performance Optimization**
   - Largest Contentful Paint (LCP) < 2.5s: Hero image optimization, preloading critical fonts/CSS.
   - Interaction to Next Paint (INP) < 200ms: JavaScript execution breakdown, event listener optimization.
   - Cumulative Layout Shift (CLS) < 0.1: Explicit width/height on images and media containers, aspect-ratio CSS.
   - Time to First Byte (TTFB) < 800ms: Asset compression, CDN headers, caching policies.

5. **Indexation, Crawl Budget & Architecture**
   - `robots.txt` generation and directive tuning (Allow/Disallow, User-agent, Crawl-delay, Sitemap reference).
   - `sitemap.xml` generation with strict `<loc>`, `<lastmod>`, and canonical matching.
   - Canonical URL enforcement to eliminate split-equity across `www`/`non-www`, HTTP/HTTPS, trailing slashes, and parameter permutations.

6. **Content & Keyword Strategy (`/seo:cluster`)**
   - Search intent mapping (Informational, Commercial, Navigational, Transactional).
   - Topic cluster modeling and pillar-to-cluster internal link structures.

---

## Standard Execution Procedure

When performing an SEO task:

1. **Audit & Diagnose**:
   - Inspect the website's HTML source, React components, router setup, and build configuration.
   - Check title tags, meta descriptions, viewport, canonical links, Open Graph tags, and heading tags.
   - Verify `robots.txt` and `sitemap.xml` presence in `public/` directory.

2. **Implement Fixes**:
   - Inject required metadata (titles, descriptions, keywords, Open Graph, Twitter cards).
   - Add structured JSON-LD in `<head>` or component level.
   - Ensure clean semantic HTML structure (`<header>`, `<main>`, `<article>`, `<section>`, `<nav>`, `<footer>`).
   - Add image `alt` attributes, WebP/AVIF formatting, responsive `srcset`, and lazy loading.

3. **Verify & Validate**:
   - Run linter / build checks to ensure no broken tags or React SSR/CSR mismatch.
   - Validate JSON-LD syntax using valid JSON parsing.
   - Test accessibility and SEO performance metrics.
