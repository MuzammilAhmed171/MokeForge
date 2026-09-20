# Technical SEO Audit Checklist

Use this checklist during technical audits (`/seo:audit` or general health assessments):

## 1. Indexability & Crawlability
- [ ] **`robots.txt`**: Accessible at `/robots.txt`, no unintentional disallow directives blocking critical assets (CSS, JS, images).
- [ ] **XML Sitemap**: Accessible at `/sitemap.xml`, referenced inside `robots.txt`, valid XML syntax, only 200 OK canonical URLs listed.
- [ ] **Canonical Tags**: Self-referencing canonical on primary pages, correct absolute protocol (`https://`), consistent trailing slash policy.
- [ ] **Meta Robots**: No unwanted `noindex` or `nofollow` on production pages.
- [ ] **HTTP Status & Redirects**: Clean 301 permanent redirects (no redirect chains or loops).

## 2. On-Page & Semantic Architecture
- [ ] **Title Tag**: Unique, descriptive, 50-60 characters, primary keyword placed near beginning.
- [ ] **Meta Description**: Compelling summary, 140-160 characters, includes call-to-action / core value proposition.
- [ ] **Heading Structure**: Single `<h1>` tag per page reflecting core topic, followed by logical hierarchy (`<h2>`, `<h3>`).
- [ ] **Semantic Markup**: Proper HTML5 tags (`<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<footer>`).
- [ ] **Image Optimization**: Descriptive, non-empty `alt` attributes on all images, modern formats (WebP/AVIF), native `loading="lazy"`.

## 3. Social Metadata & Rich Snippets
- [ ] **Open Graph**: `og:title`, `og:description`, `og:image` (1200x630px), `og:url`, `og:type`, `og:site_name`.
- [ ] **Twitter Cards**: `twitter:card` (`summary_large_image`), `twitter:title`, `twitter:description`, `twitter:image`.
- [ ] **Favicon & App Icons**: `favicon.ico`, SVG favicon, `apple-touch-icon.png`, `manifest.json`.

## 4. Structured Data (Schema.org)
- [ ] **JSON-LD Schema**: Valid JSON-LD format in `<head>` or root component.
- [ ] **Required Types**: `WebSite`, `Organization` or `Person`, `BreadcrumbList`, and domain-specific schemas (e.g., `ProfilePage`, `SoftwareApplication`, `Article`).
- [ ] **Validation**: No missing required properties, valid `@context` and `@type`.

## 5. Performance & Core Web Vitals
- [ ] **Largest Contentful Paint (LCP)**: < 2.5s. Critical CSS inlined/preloaded, hero images preloaded with `<link rel="preload">`.
- [ ] **Interaction to Next Paint (INP)**: < 200ms. Non-blocking JavaScript, heavy computation deferred.
- [ ] **Cumulative Layout Shift (CLS)**: < 0.1. Explicit dimensions (`width`/`height`) or `aspect-ratio` on images, embeds, and ads.
- [ ] **HTTPS / Security**: Strict Transport Security (HSTS), valid SSL certificate, no mixed content warnings.
