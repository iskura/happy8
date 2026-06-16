import { proxyKl8Upstream } from '../_kl8Proxy.js'

export async function onRequestGet() {
  try {
    return await proxyKl8Upstream()
  } catch (error) {
    return new Response(error.message || '数据代理失败', {
      status: 502,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}

export const onRequest = onRequestGet
