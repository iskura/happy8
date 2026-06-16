/** CF Pages Advanced Mode：随 dist 一起部署，接管 /api/kl8 代理 */
export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url)

    if (pathname === '/api/kl8') {
      try {
        const upstream = await fetch('https://data.17500.cn/kl8_desc.txt', {
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

    return env.ASSETS.fetch(request)
  },
}
