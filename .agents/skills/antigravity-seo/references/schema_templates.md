# Schema.org JSON-LD Templates

## 1. WebSite & Sitelinks Searchbox
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Site Name",
  "url": "https://example.com/",
  "description": "Short description of website",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://example.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
</script>
```

## 2. Person / Developer Portfolio Profile
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Full Name",
  "url": "https://example.com",
  "image": "https://example.com/profile.jpg",
  "jobTitle": "Full Stack Developer & AI Engineer",
  "worksFor": {
    "@type": "Organization",
    "name": "Company/Freelance"
  },
  "sameAs": [
    "https://github.com/username",
    "https://linkedin.com/in/username",
    "https://twitter.com/username"
  ],
  "knowsAbout": [
    "React",
    "Node.js",
    "TypeScript",
    "Artificial Intelligence",
    "SEO"
  ]
}
</script>
```

## 3. Organization / Agency
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Brand Name",
  "url": "https://example.com",
  "logo": "https://example.com/logo.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+1-000-000-0000",
    "contactType": "customer service",
    "availableLanguage": ["English"]
  },
  "sameAs": [
    "https://twitter.com/brand",
    "https://linkedin.com/company/brand"
  ]
}
</script>
```

## 4. Software Application / SaaS Product
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Application Name",
  "operatingSystem": "All",
  "applicationCategory": "DeveloperApplication",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "ratingCount": "120"
  }
}
</script>
```

## 5. BreadcrumbList
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://example.com/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Portfolio",
      "item": "https://example.com/portfolio"
    }
  ]
}
</script>
```
