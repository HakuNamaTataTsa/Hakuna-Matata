export default {
  async fetch(request) {
    const url = new URL(request.url);
    const targetUrl = 'https://jasmediaone.id/api' + url.pathname + url.search;
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }
    const resp = await fetch(targetUrl, {
      method: request.method,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: request.method === 'POST' ? await request.text() : undefined,
    });
    const data = await resp.text();
    return new Response(data, {
      status: resp.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      }
    });
  }
};
