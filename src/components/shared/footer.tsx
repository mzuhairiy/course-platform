import Link from "next/link";

import { Container } from "@/components/shared/container";
import { footerNav } from "@/config/nav";
import { siteConfig } from "@/config/site";

function slug(value: string) {
  return value.toLowerCase().replace(/\s+/g, "-");
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-primary text-primary-foreground" data-testid="footer">
      <Container className="py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 space-y-3 md:col-span-1">
            <Link
              href="/"
              className="text-base font-semibold"
              data-testid="footer-logo"
            >
              {siteConfig.name}
            </Link>
            <p className="max-w-xs text-sm text-primary-foreground/70">
              {siteConfig.description}
            </p>
          </div>

          {footerNav.map((column) => (
            <div key={column.title} className="space-y-3">
              <h3 className="text-sm font-semibold">{column.title}</h3>
              <ul className="space-y-2">
                {column.items.map((item) => (
                  <li key={`${column.title}-${item.href}`}>
                    <Link
                      href={item.href}
                      className="text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground hover:underline"
                      data-testid={`footer-link-${slug(column.title)}-${slug(item.title)}`}
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-primary-foreground/10 pt-6 sm:flex-row">
          <p className="text-sm text-primary-foreground/70">
            © {year} {siteConfig.name}. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm text-primary-foreground/70">
            <a
              href={siteConfig.links.twitter}
              className="transition-colors hover:text-primary-foreground hover:underline"
              target="_blank"
              rel="noreferrer"
              data-testid="footer-social-twitter"
            >
              Twitter
            </a>
            <a
              href={siteConfig.links.github}
              className="transition-colors hover:text-primary-foreground hover:underline"
              target="_blank"
              rel="noreferrer"
              data-testid="footer-social-github"
            >
              GitHub
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
