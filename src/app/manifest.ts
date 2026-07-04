import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Skedio | Intelligent School Timetable Platform',
    short_name: 'Skedio',
    description: 'Premium School Timetable Management Platform',
    start_url: '/',
    display: 'standalone',
    background_color: '#0D161A',
    theme_color: '#004E64',
    icons: [
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
  };
}
