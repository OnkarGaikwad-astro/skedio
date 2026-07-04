import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  // Replace with your actual production domain when you deploy
  const baseUrl = 'https://skedio.astronkar.in'

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login', '/register'],
      disallow: [
        '/dashboard/',
        '/timetable/',
        '/teachers/',
        '/subjects/',
        '/classes/',
        '/breaks/',
        '/reports/',
        '/settings/',
        '/api/'
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
