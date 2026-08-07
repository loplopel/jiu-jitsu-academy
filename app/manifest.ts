import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Conexão Paulista Jiu-Jitsu',
    short_name: 'Conexão Jiu-Jitsu',
    description: 'Gestão da academia Conexão Paulista Jiu-Jitsu',
    start_url: '/',
    display: 'standalone',
    background_color: '#090b10',
    theme_color: '#f97316',
    orientation: 'portrait-primary',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
