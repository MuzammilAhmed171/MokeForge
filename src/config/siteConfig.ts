/**
 * Frontend Site & App Configuration
 * This file contains all the static/default configuration for the MockForge frontend.
 * Stored directly in the codebase so no frontend environment variables are required on Vercel.
 */

export const siteConfig = {
  name: 'MOCK FORGE',
  tagline: 'Professional Portfolio & Website Mockup Generator',
  description: 'Create stunning portfolio mockups from website screenshots in minutes. Professional laptop, tablet, mobile device frames, smart backgrounds, and instant high-res export.',
  url: 'https://mockforge-canvas.vercel.app',

  // Contact info
  contact: {
    email: 'support@mockforge.com',
    phone: '',
    address: '',
  },

  // Social Media Links
  social: {
    github: '',
    linkedin: '',
    twitter: '',
    instagram: '',
    youtube: '',
    portfolio: 'https://muzammilahmed25.vercel.app',
    website: 'https://mockforge-canvas.vercel.app',
  },

  // Creator / Developer Info
  creator: {
    name: 'M3H-Developers',
    role: 'Full Stack Developer & Designer',
    portfolio: 'https://muzammilahmed25.vercel.app',
  },

  // Legal & Policy Links
  legal: {
    privacyPolicy: '',
    termsOfService: '',
    cookiePolicy: '',
  },

  // Additional Nav / Links
  links: {
    blog: '',
    careers: '',
    support: '',
    documentation: '',
  },

  // Footer Options
  footer: {
    showBuiltWith: true,
    copyrightText: '© 2026 MOCK FORGE. All rights reserved.',
  }
};

export default siteConfig;
