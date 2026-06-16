export const UPSTREAM_URL = 'https://data.17500.cn/kl8_desc.txt'

export async function proxyKl8Upstream() {
  const upstream = await fetch(UPSTREAM_URL, {
    headers: { 'User-Agent': 'happy8-lottery-proxy' },
  })

  if (!upstream.ok) {
    return new Response(`上游数据拉取失败: ${upstream.status}`, {
      status: 502,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  const text = await upstream.text()
  return new Response(text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
