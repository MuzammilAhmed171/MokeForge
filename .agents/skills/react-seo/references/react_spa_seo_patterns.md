# React & Vite SPA SEO Patterns

## 1. Zero-Dependency Dynamic SEO Component (`SEOHead.jsx`)

For Vite/React projects where you prefer not to install extra heavy libraries, this clean React component manages all meta tags, canonicals, and Open Graph directly:

```jsx
import { useEffect } from 'react';

export function SEOHead({
  title = "Default Title",
  description = "Default description...",
  canonicalUrl = "https://example.com",
  ogImage = "https://example.com/og-image.jpg",
  ogType = "website",
  twitterCard = "summary_large_image",
  schemaJson = null
}) {
  useEffect(() => {
    // 1. Update Title
    document.title = title;

    // Helper to update or create meta tags
    const setMetaTag = (attrName, attrValue, content) => {
      let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 2. Primary Meta Tags
    setMetaTag('name', 'description', description);

    // 3. Open Graph
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:type', ogType);
    if (ogImage) setMetaTag('property', 'og:image', ogImage);

    // 4. Twitter Card
    setMetaTag('name', 'twitter:card', twitterCard);
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    if (ogImage) setMetaTag('name', 'twitter:image', ogImage);

    // 5. Canonical Link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // 6. JSON-LD Schema
    let schemaScript = document.getElementById('json-ld-schema');
    if (schemaJson) {
      if (!schemaScript) {
        schemaScript = document.createElement('script');
        schemaScript.id = 'json-ld-schema';
        schemaScript.type = 'application/ld+json';
        document.head.appendChild(schemaScript);
      }
      schemaScript.textContent = JSON.stringify(schemaJson);
    }
  }, [title, description, canonicalUrl, ogImage, ogType, twitterCard, schemaJson]);

  return null;
}
```

---

## 2. Using `react-helmet-async` (Alternative)

If using `react-helmet-async`:

```bash
npm install react-helmet-async
```

**Setup in App root (`App.jsx`):**
```jsx
import { HelmetProvider } from 'react-helmet-async';

export function App() {
  return (
    <HelmetProvider>
      <MainAppRoutes />
    </HelmetProvider>
  );
}
```

**Usage in Page / Component:**
```jsx
import { Helmet } from 'react-helmet-async';

export function ProjectPage({ project }) {
  return (
    <>
      <Helmet>
        <title>{`${project.title} | Portfolio`}</title>
        <meta name="description" content={project.summary} />
        <link rel="canonical" href={`https://example.com/project/${project.slug}`} />
        <meta property="og:title" content={project.title} />
        <meta property="og:description" content={project.summary} />
        <meta property="og:image" content={project.thumbnail} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            "name": project.title,
            "description": project.summary,
            "image": project.thumbnail
          })}
        </script>
      </Helmet>
      
      <main>
        <h1>{project.title}</h1>
        {/* Project Content */}
      </main>
    </>
  );
}
```

---

## 3. Recommended `public/robots.txt`

```txt
User-agent: *
Allow: /

# Sitemaps
Sitemap: https://example.com/sitemap.xml
```

---

## 4. Recommended `public/sitemap.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2026-09-21</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```
