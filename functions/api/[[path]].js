export async function onRequest(context) {
  const url = new URL(context.request.url);
  const targetUrl = 'https://jasmediaone.id/api' + url.pathname.replace('/api', '') + url.search;

  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  const resp = await fetch(targetUrl, {
    method: context.request.method,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: context.request.method === 'POST' ? await context.request.text() : undefined,
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
