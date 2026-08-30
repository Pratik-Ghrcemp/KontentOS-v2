import './globals.css';
import { StateProvider } from '@/context/state-context';
import { AuthProvider } from '@/context/auth-context';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'KontentOS — The AI Creator Operating System (Studio White Edition)',
  description: 'KontentOS is the effortless AI creator operating system. Go from raw video to auto-subtitled reels, platform-tailored copy, and 1-click omni-channel publishing in seconds.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Google Fonts link backup if next/font fails, matching exact legacy fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Montserrat:wght@500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        
        {/* Material Symbols Outlined */}
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-background text-text-main font-body antialiased">
        <AuthProvider>
          <StateProvider>
            {children}
          </StateProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
