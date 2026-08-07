import './globals.css';
import type { Metadata, Viewport } from 'next';
import { PwaRegister } from '@/components/pwa-register';

export const metadata: Metadata = {
  title: { default:'Conexão Paulista Jiu-Jitsu', template:'%s | Conexão Paulista' },
  description: 'Gestão profissional da academia Conexão Paulista Jiu-Jitsu',
  applicationName: 'Conexão Paulista Jiu-Jitsu',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable:true, statusBarStyle:'black-translucent', title:'Conexão Jiu-Jitsu' },
  icons: { icon:[{url:'/icon-192.png',sizes:'192x192'},{url:'/icon-512.png',sizes:'512x512'}], apple:'/apple-touch-icon.png' },
};
export const viewport: Viewport = { themeColor:'#f97316', width:'device-width', initialScale:1, viewportFit:'cover' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}<PwaRegister/></body></html>;
}
