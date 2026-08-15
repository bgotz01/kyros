"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/council", label: "Council" },
  { href: "/context", label: "Context" },
];

export default function Navbar() {
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-stone-line bg-obsidian/85 backdrop-blur-md">
      <nav
        aria-label="Primary"
        className="mx-auto flex h-16 max-w-[1600px] items-center gap-10 px-6"
      >
        {/* Logotype */}
        <Link
          href="/"
          aria-label="Kyros — home"
          className="group flex items-center gap-2"
        >
          <Image
            src="/images/kyros-logo-21-roman-silver.png"
            alt="Kyros"
            width={48}
            height={48}
            className="h-12 w-12 shrink-0 object-contain"
            priority
          />
          <span className="font-serif text-[1.3rem] font-light leading-none tracking-[0.34em] text-marble transition-colors duration-700 ease-mechanical group-hover:text-bronze-bright">
            KYROS
          </span>
        </Link>

        {/* Primary nav links */}
        <div className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`px-4 py-1.5 font-sans text-[0.65rem] uppercase tracking-[0.22em] transition-colors duration-500 ease-mechanical ${active
                  ? "text-bronze-bright"
                  : "text-platinum-dim hover:text-platinum"
                  }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-6">


          <Link
            href="/analyze"
            className="hidden border border-stone-line-strong px-5 py-2 font-sans text-[0.7rem] uppercase tracking-[0.22em] text-marble-dim transition-colors duration-500 ease-mechanical hover:border-bronze hover:text-bronze-bright sm:inline-block"
          >
            Enter
          </Link>
        </div>
      </nav>
    </header>
  );
}
