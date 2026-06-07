import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from './components/ThemeProvider';
import Navbar from './components/Navbar';
import SubNavbar from './components/SubNavbar';
import CouncilSidebar from './components/CouncilSidebar';
import Interface from './components/Interface';
import { CouncilSidebarProvider } from './lib/council-sidebar-context';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Panteon — Market Intelligence Chamber',
  description: 'A council of specialized AI agents interpreting markets through ancient-futuristic intelligence.',
};

// Runs before React hydrates — no flash, no layout shift.
// Dark is the default; only adds "light" if the user previously chose it.
const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('panteon-theme');
    if (stored === 'light') {
      document.documentElement.classList.add('light');
    }
  } catch (_) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Blocking script: sets theme class before first paint to avoid flash */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <ThemeProvider>
          <CouncilSidebarProvider>
            <Navbar />
            <SubNavbar />
            {/* pt-[60px] for fixed navbar; SubNavbar adds itself only when relevant */}
            <div className="pt-[60px] flex flex-col flex-1">
              {children}
            </div>
            {/* Right-side Interface chat — available on every page */}
            <Interface />
          </CouncilSidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
