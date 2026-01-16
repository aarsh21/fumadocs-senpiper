import { RootProvider } from "fumadocs-ui/provider/next";
import Script from "next/script";
import "./global.css";
import { Inter } from "next/font/google";
import { AISearch, AISearchTrigger, AISearchPanel } from "@/components/search";

const inter = Inter({
  subsets: ["latin"],
});

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#fafafa" media="(prefers-color-scheme: light)" />
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/@react-grab/opencode/dist/client.global.js"
            strategy="lazyOnload"
          />
        )}
      </head>
      <body className="flex flex-col min-h-screen">
        <RootProvider>
          <AISearch>
            {children}
            <AISearchTrigger />
            <AISearchPanel />
          </AISearch>
        </RootProvider>
      </body>
    </html>
  );
}
