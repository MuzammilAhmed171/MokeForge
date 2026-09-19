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

// Load configuration from environment variables
export const loadFooterConfig = (): FooterConfig => {
  return {
    // Company/Brand Info
    companyName: getEnvVar('VITE_FOOTER_COMPANY_NAME', 'MockForge'),
    tagline: getEnvVar('VITE_FOOTER_TAGLINE', 'Professional Portfolio Mockup Studio'),
    description: getEnvVar(
      'VITE_FOOTER_DESCRIPTION',
      'Create stunning portfolio mockups with our advanced design editor. Professional device mockups, smart backgrounds, and instant export.'
    ),
    logo: getEnvVar('VITE_FOOTER_LOGO', ''),
    
    // Contact Info
    email: getEnvVar('VITE_FOOTER_EMAIL', ''),
    phone: getEnvVar('VITE_FOOTER_PHONE', ''),
    address: getEnvVar('VITE_FOOTER_ADDRESS', ''),
    
    // Social Links
    github: getEnvVar('VITE_FOOTER_GITHUB', ''),
    linkedin: getEnvVar('VITE_FOOTER_LINKEDIN', ''),
    twitter: getEnvVar('VITE_FOOTER_TWITTER', ''),
    instagram: getEnvVar('VITE_FOOTER_INSTAGRAM', ''),
    youtube: getEnvVar('VITE_FOOTER_YOUTUBE', ''),
    portfolio: getEnvVar('VITE_FOOTER_PORTFOLIO', ''),
    website: getEnvVar('VITE_FOOTER_WEBSITE', ''),
    
    // Team/Creator Info
    creatorName: getEnvVar('VITE_FOOTER_CREATOR_NAME', ''),
    creatorRole: getEnvVar('VITE_FOOTER_CREATOR_ROLE', ''),
    creatorPortfolio: getEnvVar('VITE_FOOTER_CREATOR_PORTFOLIO', ''),
    
    // Legal
    privacyPolicy: getEnvVar('VITE_FOOTER_PRIVACY_POLICY', ''),
    termsOfService: getEnvVar('VITE_FOOTER_TERMS_OF_SERVICE', ''),
    cookiePolicy: getEnvVar('VITE_FOOTER_COOKIE_POLICY', ''),
    
    // Additional Links
    blog: getEnvVar('VITE_FOOTER_BLOG', ''),
    careers: getEnvVar('VITE_FOOTER_CAREERS', ''),
    support: getEnvVar('VITE_FOOTER_SUPPORT', ''),
    documentation: getEnvVar('VITE_FOOTER_DOCUMENTATION', ''),
    
    // Copyright
    copyrightText: getEnvVar('VITE_FOOTER_COPYRIGHT_TEXT', ''),
    showBuiltWith: getEnvVar('VITE_FOOTER_SHOW_BUILT_WITH', 'true') === 'true',
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
