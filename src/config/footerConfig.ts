// Footer & Credits Configuration
// All values can be overridden via environment variables

export interface FooterConfig {
  // Company/Brand Info
  companyName: string;
  tagline: string;
  description: string;
  logo?: string;
  
  // Contact Info
  email?: string;
  phone?: string;
  address?: string;
  
  // Social Links
  github?: string;
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  youtube?: string;
  portfolio?: string;
  website?: string;
  
  // Team/Creator Info
  creatorName?: string;
  creatorRole?: string;
  creatorPortfolio?: string;
  
  // Legal
  privacyPolicy?: string;
  termsOfService?: string;
  cookiePolicy?: string;
  
  // Additional Links
  blog?: string;
  careers?: string;
  support?: string;
  documentation?: string;
  
  // Copyright
  copyrightText?: string;
  showBuiltWith?: boolean;
}

import { siteConfig } from './siteConfig';

// Get environment variable with fallback
const getEnvVar = (key: string, fallback: string = ''): string => {
  return import.meta.env[key] || fallback;
};

// Check if value should be shown (not empty, not placeholder)
const shouldShow = (value: string | undefined): boolean => {
  if (!value) return false;
  if (value.trim() === '') return false;
  if (value.toLowerCase() === 'none') return false;
  if (value.toLowerCase() === 'null') return false;
  if (value.toLowerCase() === 'undefined') return false;
  if (value.toLowerCase() === 'hide') return false;
  if (value.toLowerCase() === 'hidden') return false;
  return true;
};

// Load configuration from siteConfig and environment variables
export const loadFooterConfig = (): FooterConfig => {
  return {
    // Company/Brand Info
    companyName: getEnvVar('VITE_FOOTER_COMPANY_NAME', siteConfig.name),
    tagline: getEnvVar('VITE_FOOTER_TAGLINE', siteConfig.tagline),
    description: getEnvVar('VITE_FOOTER_DESCRIPTION', siteConfig.description),
    logo: getEnvVar('VITE_FOOTER_LOGO', ''),
    
    // Contact Info
    email: getEnvVar('VITE_FOOTER_EMAIL', siteConfig.contact.email),
    phone: getEnvVar('VITE_FOOTER_PHONE', siteConfig.contact.phone),
    address: getEnvVar('VITE_FOOTER_ADDRESS', siteConfig.contact.address),
    
    // Social Links
    github: getEnvVar('VITE_FOOTER_GITHUB', siteConfig.social.github),
    linkedin: getEnvVar('VITE_FOOTER_LINKEDIN', siteConfig.social.linkedin),
    twitter: getEnvVar('VITE_FOOTER_TWITTER', siteConfig.social.twitter),
    instagram: getEnvVar('VITE_FOOTER_INSTAGRAM', siteConfig.social.instagram),
    youtube: getEnvVar('VITE_FOOTER_YOUTUBE', siteConfig.social.youtube),
    portfolio: getEnvVar('VITE_FOOTER_PORTFOLIO', siteConfig.social.portfolio),
    website: getEnvVar('VITE_FOOTER_WEBSITE', siteConfig.social.website),
    
    // Team/Creator Info
    creatorName: getEnvVar('VITE_FOOTER_CREATOR_NAME', siteConfig.creator.name),
    creatorRole: getEnvVar('VITE_FOOTER_CREATOR_ROLE', siteConfig.creator.role),
    creatorPortfolio: getEnvVar('VITE_FOOTER_CREATOR_PORTFOLIO', siteConfig.creator.portfolio),
    
    // Legal
    privacyPolicy: getEnvVar('VITE_FOOTER_PRIVACY_POLICY', siteConfig.legal.privacyPolicy),
    termsOfService: getEnvVar('VITE_FOOTER_TERMS_OF_SERVICE', siteConfig.legal.termsOfService),
    cookiePolicy: getEnvVar('VITE_FOOTER_COOKIE_POLICY', siteConfig.legal.cookiePolicy),
    
    // Additional Links
    blog: getEnvVar('VITE_FOOTER_BLOG', siteConfig.links.blog),
    careers: getEnvVar('VITE_FOOTER_CAREERS', siteConfig.links.careers),
    support: getEnvVar('VITE_FOOTER_SUPPORT', siteConfig.links.support),
    documentation: getEnvVar('VITE_FOOTER_DOCUMENTATION', siteConfig.links.documentation),
    
    // Copyright
    copyrightText: getEnvVar('VITE_FOOTER_COPYRIGHT_TEXT', siteConfig.footer.copyrightText),
    showBuiltWith: getEnvVar('VITE_FOOTER_SHOW_BUILT_WITH', String(siteConfig.footer.showBuiltWith)) === 'true',
  };
};

// Helper function to check if a field should be displayed
export const isFieldVisible = (value: string | undefined): boolean => {
  return shouldShow(value);
};

// Get current year for copyright
export const getCurrentYear = (): number => {
  return new Date().getFullYear();
};

// Format phone number for display
export const formatPhone = (phone: string): string => {
  if (!phone) return '';
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  // Format as +X (XXX) XXX-XXXX or similar
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11) {
    return `+${cleaned[0]} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
};

// Get social links as array
export const getSocialLinks = (config: FooterConfig) => {
  const links = [];
  
  if (shouldShow(config.github)) {
    links.push({
      name: 'GitHub',
      url: config.github!,
      icon: 'github',
    });
  }
  
  if (shouldShow(config.linkedin)) {
    links.push({
      name: 'LinkedIn',
      url: config.linkedin!,
      icon: 'linkedin',
    });
  }
  
  if (shouldShow(config.twitter)) {
    links.push({
      name: 'Twitter',
      url: config.twitter!,
      icon: 'twitter',
    });
  }
  
  if (shouldShow(config.instagram)) {
    links.push({
      name: 'Instagram',
      url: config.instagram!,
      icon: 'instagram',
    });
  }
  
  if (shouldShow(config.youtube)) {
    links.push({
      name: 'YouTube',
      url: config.youtube!,
      icon: 'youtube',
    });
  }
  
  if (shouldShow(config.portfolio)) {
    links.push({
      name: 'Portfolio',
      url: config.portfolio!,
      icon: 'portfolio',
    });
  }
  
  if (shouldShow(config.website)) {
    links.push({
      name: 'Website',
      url: config.website!,
      icon: 'website',
    });
  }
  
  return links;
};

// Get quick links
export const getQuickLinks = (config: FooterConfig) => {
  const links = [];
  
  if (shouldShow(config.documentation)) {
    links.push({ name: 'Documentation', url: config.documentation! });
  }
  
  if (shouldShow(config.blog)) {
    links.push({ name: 'Blog', url: config.blog! });
  }
  
  if (shouldShow(config.support)) {
    links.push({ name: 'Support', url: config.support! });
  }
  
  if (shouldShow(config.careers)) {
    links.push({ name: 'Careers', url: config.careers! });
  }
  
  return links;
};

// Get legal links
export const getLegalLinks = (config: FooterConfig) => {
  const links = [];
  
  if (shouldShow(config.privacyPolicy)) {
    links.push({ name: 'Privacy Policy', url: config.privacyPolicy! });
  }
  
  if (shouldShow(config.termsOfService)) {
    links.push({ name: 'Terms of Service', url: config.termsOfService! });
  }
  
  if (shouldShow(config.cookiePolicy)) {
    links.push({ name: 'Cookie Policy', url: config.cookiePolicy! });
  }
  
  return links;
};
