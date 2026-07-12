import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NeuroLang — Spaced Repetition Language Learning',
  description: 'Learn languages faster with scientific spaced repetition (FSRS), AI pronunciation verification, and realistic audio feedback.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="bg-gradient" />
        {children}
      </body>
    </html>
  );
}
