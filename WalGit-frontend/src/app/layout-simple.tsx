import { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WalGit',
  description: 'Decentralized version control',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}