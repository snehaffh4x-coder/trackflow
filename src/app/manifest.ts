import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TrackFlow',
    short_name: 'TrackFlow',
    description: 'Universal Package Tracking Infrastructure',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#ffffff',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      // You would typically add 192x192 and 512x512 PNG icons here
    ],
  }
}
