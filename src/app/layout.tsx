import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider, themeScript } from "@/lib/theme";

/**
 * Loaded through next/font so the files are self-hosted and hashed at build
 * time. No request leaves the page for a font, which means no third-party
 * connection on first paint and no flash of a fallback face.
 */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono-face",
});

export const metadata: Metadata = {
  title: {
    default: "MatchCV.ai — Your experience. The right opportunity.",
    template: "%s — MatchCV.ai",
  },
  description:
    "Upload your resume once, paste any job posting, and get an ATS-clean " +
    "rewrite tailored to that role — with an honest report of the gaps it " +
    "could not fill.",
  applicationName: "MatchCV.ai",
};

export const viewport: Viewport = {
  // Both, so the browser chrome matches whichever theme is applied rather
  // than always framing the page in the dark one.
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#05070b" },
    { media: "(prefers-color-scheme: light)", color: "#f6f8fb" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      // Defaulted here as well as by the script below, so the markup the server
      // sends is already internally consistent and React does not warn about a
      // mismatched attribute on hydration.
      data-theme="dark"
      className={`${inter.variable} ${jetbrains.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/*
          Runs before the first paint and before React. It reads the saved
          choice and stamps it on <html>, which is the only way to avoid a
          flash of the wrong theme — by the time a component could read
          localStorage, a frame has already been drawn.
        */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col bg-canvas text-ink">
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="bottom-right"
              closeButton
              // Styled from the tokens rather than sonner's own themes, so a
              // toast belongs to this app in both light and dark.
              toastOptions={{
                style: {
                  background: "var(--surface-2)",
                  border: "1px solid var(--line-strong)",
                  color: "var(--ink)",
                  borderRadius: "0.75rem",
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
