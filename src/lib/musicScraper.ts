'use server';

export async function fetchAppleMusicArt(url: string) {
  try {
    const res = await fetch(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EnMusubiBot/1.0)' }
    });
    const html = await res.text();
    
    // Scrape the OpenGraph image tag that Apple automatically generates for links
    const match = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
    
    return match ? match[1] : null;
  } catch (error) {
    console.error('Failed to fetch album art:', error);
    return null;
  }
}