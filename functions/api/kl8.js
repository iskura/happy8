const UPSTREAM_URL = 'https://data.17500.cn/kl8_desc.txt'

export async function onRequestGet() {
  try {
    const upstream = await fetch(UPSTREAM_URL, {
      headers: { 'User-Agent': 'happy8-lottery-proxy' },
    })

    if (!upstream.ok) {
      return new Response(`上游数据拉取失败: ${upstream.status}`, {
        status: 502,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }

    return new Response(await upstream.text(), {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    return new Response(error.message || '数据代理失败', {
      status: 502,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}

export const onRequest = onRequestGet
