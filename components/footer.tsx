'use client';

import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import {
  LinkedinIcon,
  GithubIcon,
  TwitterIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
} from 'lucide-react';

export function Footer() {
  const handleContactClick = () => {
    window.location.href = 'mailto:bouchmalaabesp@gmail.com';
  };

  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container px-4 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Company Info */}
          <div className="space-y-4">
            <Logo />
            <p className="text-sm text-muted-foreground leading-relaxed">
              ConLab Solutions bietet professionelle Web-Scraping und Datenextraktionslösungen. 
              Unsere Tools ermöglichen effiziente und zuverlässige Datengewinnung für Ihr Unternehmen.
            </p>
            <div className="flex space-x-4">
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" 
                className="text-muted-foreground hover:text-foreground transition-colors">
                <LinkedinIcon className="h-5 w-5" />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors">
                <GithubIcon className="h-5 w-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors">
                <TwitterIcon className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold">Schnellzugriff</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="/static" className="text-muted-foreground hover:text-foreground transition-colors">
                  Statisches Scraping
                </a>
              </li>
              <li>
                <a href="/dynamic" className="text-muted-foreground hover:text-foreground transition-colors">
                  Dynamisches Scraping
                </a>
              </li>
              <li>
                <a href="/pdf" className="text-muted-foreground hover:text-foreground transition-colors">
                  PDF-Tools
                </a>
              </li>
              <li>
                <a href="/api-docs" className="text-muted-foreground hover:text-foreground transition-colors">
                  API-Dokumentation
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold">Ressourcen</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="/docs" className="text-muted-foreground hover:text-foreground transition-colors">
                  Dokumentation
                </a>
              </li>
              <li>
                <a href="/blog" className="text-muted-foreground hover:text-foreground transition-colors">
                  Blog & News
                </a>
              </li>
              <li>
                <a href="/tutorials" className="text-muted-foreground hover:text-foreground transition-colors">
                  Tutorials
                </a>
              </li>
              <li>
                <a href="/support" className="text-muted-foreground hover:text-foreground transition-colors">
                  Support Center
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold">Kontakt</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center space-x-2 text-muted-foreground">
                <MailIcon className="h-4 w-4" />
                <span>bouchmalaabesp@gmail.com</span>
              </li>
              <li className="flex items-center space-x-2 text-muted-foreground">
                <PhoneIcon className="h-4 w-4" />
                <span>+49 (0) XXX XXXXXXX</span>
              </li>
              <li className="flex items-center space-x-2 text-muted-foreground">
                <MapPinIcon className="h-4 w-4" />
                <span>Deutschland</span>
              </li>
            </ul>
            <Button
              onClick={handleContactClick}
              variant="outline"
              className="w-full mt-2"
            >
              Kontakt aufnehmen
            </Button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-border">
          <div className="grid gap-4 md:grid-cols-2 items-center">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} ConLab Solutions. Alle Rechte vorbehalten.
            </p>
            <div className="flex justify-start md:justify-end space-x-4 text-sm text-muted-foreground">
              <a href="/privacy" className="hover:text-foreground transition-colors">Datenschutz</a>
              <a href="/terms" className="hover:text-foreground transition-colors">Nutzungsbedingungen</a>
              <a href="/imprint" className="hover:text-foreground transition-colors">Impressum</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
