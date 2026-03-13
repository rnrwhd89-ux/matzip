import { MetadataRoute } from 'next'

// [VULN-09] robots.txt 설정: /api/, /_next/ 크롤러 접근 차단
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/_next/'],
    },
    sitemap: 'https://matzip-one.vercel.app/sitemap.xml',
  }
}
