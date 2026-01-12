import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Form Schema Builder | Senpiper',
  description: 'Build and edit V1 form schemas with AI assistance',
};

export default function AIFormHelperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
