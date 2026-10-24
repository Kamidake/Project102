export default {
  // 1. Cron Trigger: Runs the scraper on a schedule
  async scheduled(event, env, ctx) {
    ctx.waitUntil(this.updatePlaylists(env));
  },

  // 2. Fetch Handler: Serves the generated files to media players
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    if (url.pathname === '/playlist.m3u') {
      const m3u = await env.ROXIE_STORAGE.get('playlist.m3u');
      return new Response(m3u || "#EXTM3U", { 
        headers: { 'Content-Type': 'application/vnd.apple.mpegurl' } 
      });
    }

    if (url.pathname === '/epg.xml') {
      const epg = await env.ROXIE_STORAGE.get('epg.xml');
      return new Response(epg || "", { 
        headers: { 'Content-Type': 'application/xml' } 
      });
    }

    return new Response("Not Found", { status: 404 });
  },

  // 3. Core Scraping Logic (Asynchronous Translation)
  async updatePlaylists(env) {
    const baseUrl = env.SOURCE_URL || 'https://roxiestreams.info/';
    
    try {
      // Fetch main page asynchronously
      const response = await fetch(baseUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LivePlaylist/1.0)' }
      });
      const html = await response.text();

      // Example: Extract URLs using Regex (replaces HTMLParser)
      const streamUrls = this.extractSources(html);
      
      // Concurrently check live media (replaces ThreadPoolExecutor)
      const liveStreams = await Promise.all(
        streamUrls.map(url => this.checkLiveMedia(url))
      );

      // Filter successful checks and format
      const validStreams = liveStreams.filter(stream => stream.isLive);
      const playlistContent = this.renderM3U(validStreams);
      const epgContent = this.renderEPG(validStreams);

      // Save to Cloudflare KV (replaces pathlib file writes)
      await env.ROXIE_STORAGE.put('playlist.m3u', playlistContent);
      await env.ROXIE_STORAGE.put('epg.xml', epgContent);
      await env.ROXIE_STORAGE.put('status.json', JSON.stringify({ updated: new Date() }));

    } catch (error) {
      console.error("Scraping failed:", error);
    }
  },

  extractSources(html) {
    // Port your Python regex logic here
    const sources = [];
    const matches = html.matchAll(/https?:\/\/[^\s'"<>`]+\.m3u8/g);
    for (const match of matches) {
      sources.push(match[0]);
    }
    return sources;
  },

  async checkLiveMedia(url) {
    // Port your live_media check using fetch()
    try {
      const res = await fetch(url, { method: 'HEAD' });
      return { url, isLive: res.ok };
    } catch {
      return { url, isLive: false };
    }
  },

  renderM3U(entries) {
    // Port your render() string concatenation here
    let m3u = "#EXTM3U\n";
    entries.forEach(entry => {
      m3u += `#EXTINF:-1,${entry.url}\n${entry.url}\n`;
    });
    return m3u;
  },
  
  renderEPG(entries) {
      // Port your render_epg() logic here
      return '<?xml version="1.0" encoding="UTF-8"?>\n<tv></tv>';
  }
};