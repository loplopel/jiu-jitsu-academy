import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Jiu-Jitsu Academy',
  description: 'Gestão profissional para academias de Jiu-Jitsu'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
