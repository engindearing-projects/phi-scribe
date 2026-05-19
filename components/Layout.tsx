import Head from 'next/head';
import Link from 'next/link';
import { Stethoscope } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function Layout({ children, title = 'phi-scribe' }: LayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="Open-source AI scribe — voice dictation to SOAP note, runs fully local." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content="Open-source AI scribe — voice → SOAP note, local-LLM option. Your audio never leaves your machine." />
        <meta name="robots" content="noindex" />
      </Head>

      <div className="min-h-screen flex flex-col bg-background">
        <header className="border-b border-border px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-sm hover:opacity-80 transition-opacity">
            <Stethoscope className="w-5 h-5 text-primary" />
            phi-scribe
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/settings" className="text-muted-foreground hover:text-foreground transition-colors">Settings</Link>
            <a
              href="https://github.com/engindearing/phi-scribe"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </nav>
        </header>

        <main className="flex-1 container max-w-2xl mx-auto px-4 py-8">
          {children}
        </main>

        <footer className="border-t border-border px-4 py-3 text-xs text-muted-foreground text-center">
          phi-scribe — open source, local-first. Audio is deleted after transcription.
          &nbsp;·&nbsp;
          <a href="https://github.com/engindearing/phi-scribe" target="_blank" rel="noopener noreferrer" className="underline">
            MIT License
          </a>
        </footer>
      </div>
    </>
  );
}
