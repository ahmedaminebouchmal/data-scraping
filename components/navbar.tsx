'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink, navigationMenuTriggerStyle } from '@/components/ui/navigation-menu';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';

export function Navbar() {
  const [copied, setCopied] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleCopyEmail = async () => {
    const email = 'bouchmalaabesp@gmail.com';
    await navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Logo />
          <NavigationMenu>
            <NavigationMenuList className="gap-2">
              <NavigationMenuItem>
                <NavigationMenuLink
                  className={`${navigationMenuTriggerStyle()} ${
                    pathname === '/static' ? 'bg-accent text-accent-foreground' : ''
                  } hover:bg-secondary/80 transition-colors`}
                  onClick={() => router.push('/static')}
                >
                  Statisches Scraping
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  className={`${navigationMenuTriggerStyle()} ${
                    pathname === '/dynamic' ? 'bg-accent text-accent-foreground' : ''
                  } hover:bg-secondary/80 transition-colors`}
                  onClick={() => router.push('/dynamic')}
                >
                  Dynamisches Scraping
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  className={`${navigationMenuTriggerStyle()} ${
                    pathname === '/pdf' ? 'bg-accent text-accent-foreground' : ''
                  } hover:bg-secondary/80 transition-colors`}
                  onClick={() => router.push('/pdf')}
                >
                  PDF-Tools
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <Button
          onClick={handleCopyEmail}
          className={`
            relative group bg-primary text-primary-foreground
            after:absolute after:inset-0 
            after:bg-primary/20 after:rounded-lg
            after:animate-pulse after:blur-xl
            hover:scale-105 transition-transform
            ${copied ? 'bg-green-500' : ''}
          `}
        >
          <span className="relative z-10">
            {copied ? 'E-Mail kopiert!' : 'Kontakt'}
          </span>
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/50 to-accent/50 blur-lg group-hover:blur-xl transition-all"></div>
        </Button>
      </div>
    </nav>
  );
}
