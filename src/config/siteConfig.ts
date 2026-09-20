/**
 * Frontend Site & App Configuration
 * This file contains all the static/default configuration for the MockForge frontend.
 * Stored directly in the codebase so no frontend environment variables are required on Vercel.
 */

export const siteConfig = {
  name: 'MockForge',
  tagline: 'Professional Portfolio Mockup Studio',
  description: 'Create stunning portfolio mockups with our advanced design editor. Professional device mockups, smart backgrounds, and instant export.',
  url: 'https://mockforge.vercel.app',

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
    website: 'https://muzammilahmed25.vercel.app',
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
    copyrightText: '© 2026 MockForge. All rights reserved.',
  }
};

export default siteConfig;
