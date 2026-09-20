---
name: react-seo
description: >-
  Specialized SEO skill for React, Single Page Applications (SPA), and Vite projects. Use when the user requests SEO optimization for React apps, dynamic document head and metadata management (react-helmet-async or native React hooks), Open Graph & Twitter Cards per route, dynamic JSON-LD injection, canonical link tags, sitemap/robots generation in Vite, or resolving SPA client-side rendering SEO and Core Web Vitals issues.
---

# React & SPA SEO Skill

This skill provides best practices, code patterns, and automated approaches for optimizing React Single Page Applications (SPAs), Vite frontend setups, and dynamic client-rendered applications for maximum search visibility and social shareability.

---

## Key Challenges in React / SPA SEO & Solutions

1. **Client-Side Rendering (CSR) Indexing**
   - Search crawlers execute JavaScript, but critical metadata must be available early in the initial HTML or injected seamlessly upon route transition.
   - Solution: Configure static metadata in `index.html` as the solid fallback base, and dynamically mutate `document.title`, `<meta name="description">`, `<link rel="canonical">`, Open Graph, and JSON-LD schema using a lightweight head component or `react-helmet-async`.

2. **Route-Specific Metadata & Social Previews**
   - Social platforms (WhatsApp, Twitter/X, LinkedIn, Facebook) do **not** run client-side JavaScript when scraping link previews.
   - Solution: Ensure `index.html` has comprehensive global Open Graph tags, and implement dynamic per-route head management for in-browser navigation.

3. **Dynamic JSON-LD Schema in React**
   - In React apps, inject structured data cleanly via a reusable SEO component:
   ```jsx
   <script type="application/ld+json">
     {JSON.stringify(schemaData)}
   </script>
   ```

4. **Sitemap & Robots.txt for Vite / React**
   - Place static `robots.txt` and `sitemap.xml` in the `public/` directory so Vite copies them directly into the root of `dist/` upon build.

---

## Reusable React SEO Component Patterns

See detailed implementation patterns in [React SPA SEO Patterns](./references/react_spa_seo_patterns.md):
- Lightweight zero-dependency `SEOHead` component using React `useEffect` / `document.head`
- `react-helmet-async` integration pattern
- JSON-LD Structured Data component
- Image optimization with responsive loading for React
- Core Web Vitals (CLS/LCP/INP) component-level best practices
