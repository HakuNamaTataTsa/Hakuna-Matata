// ===== worker-generate.js =====
// Deploy ke Cloudflare Workers dengan nama generate.akinostore.workers.dev
// atau sesuaikan dengan domain worker kamu.

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const GROQ_API_KEY = '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'
  const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

  try {
    const { theme, category } = await request.json()
    if (!theme) {
      return new Response(JSON.stringify({ error: 'Tema tidak boleh kosong' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const prompt = `Buat judul wallpaper yang menarik dan deskripsi singkat dalam bahasa Indonesia untuk tema: "${theme}" dengan kategori "${category}". 
    Judul maksimal 5 kata, deskripsi maksimal 20 kata. 
    Berikan dalam format JSON valid dengan properti "title" dan "description". 
    Contoh: {"title": "Senja di Pantai", "description": "Pemandangan matahari terbenam yang menenangkan dengan gradasi warna oranye dan biru."}
    Hanya keluarkan JSON, tanpa teks tambahan.`

    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [
          { role: 'system', content: 'Kamu adalah asisten yang membantu membuat judul dan deskripsi wallpaper.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 150,
        response_format: { type: 'json_object' }
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      return new Response(JSON.stringify({ error: `Groq API error: ${response.status} - ${errText}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const data = await response.json()
    const content = data.choices[0].message.content
    const parsed = JSON.parse(content)

    return new Response(JSON.stringify({
      title: parsed.title || 'Wallpaper Keren',
      description: parsed.description || 'Wallpaper berkualitas tinggi untuk perangkat Anda.'
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
