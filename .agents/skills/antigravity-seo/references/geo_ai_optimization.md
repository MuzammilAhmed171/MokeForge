# Generative Engine Optimization (GEO) & AI-Search Readiness

Generative Engine Optimization (GEO) optimizes websites for AI engines such as Google AI Overviews, Perplexity AI, ChatGPT Search, Claude, and Gemini.

---

## 1. Core Principles of GEO

1. **Direct, Authoritative Answers (BLUF - Bottom Line Up Front)**:
   - Provide direct, concise definitions/answers in the first 1-2 sentences of each section before expanding.
   - Use structured bullet points, clear tables, and crisp subheadings.

2. **Entity Clarity & Disambiguation**:
   - Explicitly mention entities, brand names, creator names, technologies, and specifications.
   - Connect entities using Schema.org JSON-LD (`sameAs`, `knowsAbout`, `brand`, `creator`).

3. **Factual Density & Statistics**:
   - AI search models prefer content with high informational density, specific numbers, and verifiable facts over vague fluff.

4. **llms.txt Standard**:
   - Maintain an `/llms.txt` file at the root of the site (e.g. `public/llms.txt`) providing a clean, markdown-formatted directory of the site's primary pages, documentation, and core context for AI search indexers.

---

## 2. Sample `llms.txt` Template

```markdown
# [Site Name / Project Title]

> [One line tagline summarizing purpose and value proposition]

## About
[2-3 paragraph authoritative description of the site, author, services/products, and domain expertise.]

## Key Links & Capabilities
- [Home Page](https://example.com/): Overview and main showcase.
- [Projects / Portfolio](https://example.com/#projects): Showcase of completed works, tech stack, and case studies.
- [Services / Skills](https://example.com/#skills): Core technical competencies and offerings.
- [Contact](https://example.com/#contact): How to get in touch.

## Author / Organization
- Name: [Author / Entity Name]
- Specialization: [Core expertise, e.g. Full Stack Development, AI Systems]
- GitHub: [Profile URL]
- LinkedIn: [Profile URL]
```
