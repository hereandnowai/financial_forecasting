import React from 'react';
import { COMPANY_NAME } from '../../constants';
import { Link as LinkIcon, Linkedin, Instagram, Github, Twitter, Youtube, ExternalLink } from 'lucide-react';

interface FooterProps {
  appName: string;
}

const brandSocialMedia = {
  blog: "https://hereandnowai.com/blog",
  linkedin: "https://www.linkedin.com/company/hereandnowai/",
  instagram: "https://instagram.com/hereandnow_ai",
  github: "https://github.com/hereandnowai",
  x: "https://x.com/hereandnow_ai",
  youtube: "https://youtube.com/@hereandnow_ai",
  website: "https://hereandnowai.com"
};

const socialLinks = [
  { name: 'Website', href: brandSocialMedia.website, icon: <ExternalLink size={18} /> },
  { name: 'Blog', href: brandSocialMedia.blog, icon: <LinkIcon size={18} /> },
  { name: 'LinkedIn', href: brandSocialMedia.linkedin, icon: <Linkedin size={18} /> },
  { name: 'Instagram', href: brandSocialMedia.instagram, icon: <Instagram size={18} /> },
  { name: 'GitHub', href: brandSocialMedia.github, icon: <Github size={18} /> },
  { name: 'X', href: brandSocialMedia.x, icon: <Twitter size={18} /> },
  { name: 'YouTube', href: brandSocialMedia.youtube, icon: <Youtube size={18} /> },
];

const Footer: React.FC<FooterProps> = ({ appName }) => {
  return (
    <footer className="bg-[var(--color-background-secondary)] py-8 text-center text-[var(--color-text-secondary)] text-sm">
      <div className="container mx-auto px-4">
        <div className="mb-4 flex justify-center space-x-4">
          {socialLinks.map(link => (
            <a 
              key={link.name} 
              href={link.href} 
              target="_blank" 
              rel="noopener noreferrer" 
              title={link.name}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-accent)] transition-colors"
              aria-label={`Visit ${COMPANY_NAME} on ${link.name}`}
            >
              {link.icon}
            </a>
          ))}
        </div>
        <p>&copy; {new Date().getFullYear()} {appName} by {COMPANY_NAME}. All rights reserved.</p>
        <p className="mt-1 italic">designed with passion for innovation</p>
      </div>
    </footer>
  );
};

export default Footer;