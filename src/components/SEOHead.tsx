import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: string;
  schemaJson?: object | null;
}

export function SEOHead({
  title = 'MOCK FORGE — Portfolio & Website Mockup Generator',
  description = 'Create stunning portfolio mockups from website screenshots in minutes. Professional laptop, tablet, and mobile device frames, smart backgrounds, and instant high-res export.',
  canonicalUrl = 'https://mockforge-canvas.vercel.app/',
  ogImage = 'https://mockforge-canvas.vercel.app/og-image.svg',
  ogType = 'website',
  schemaJson = null,
}: SEOHeadProps) {
  useEffect(() => {
    // 1. Title
    document.title = title;

    // Helper to update or set meta
    const setMeta = (attributeName: string, attributeValue: string, content: string) => {
      let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attributeName, attributeValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 2. Standard Meta
    setMeta('name', 'description', description);

    // 3. Open Graph
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', canonicalUrl);
    setMeta('property', 'og:type', ogType);
    if (ogImage) setMeta('property', 'og:image', ogImage);

    // 4. Twitter Card
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    if (ogImage) setMeta('name', 'twitter:image', ogImage);

    // 5. Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);

    // 6. Dynamic Schema Script if provided
    let dynamicSchema = document.getElementById('dynamic-page-schema') as HTMLScriptElement | null;
    if (schemaJson) {
      if (!dynamicSchema) {
        dynamicSchema = document.createElement('script');
        dynamicSchema.id = 'dynamic-page-schema';
        dynamicSchema.type = 'application/ld+json';
        document.head.appendChild(dynamicSchema);
      }
      dynamicSchema.textContent = JSON.stringify(schemaJson);
    } else if (dynamicSchema) {
      dynamicSchema.remove();
    }
  }, [title, description, canonicalUrl, ogImage, ogType, schemaJson]);

  return null;
}
