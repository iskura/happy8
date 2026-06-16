import { readStoredLottery } from '../_lotterySync.js'

/** 只读：KV 已同步数据 > 打包内置 txt，不访问乐彩网 */
export async function onRequestGet(context) {
  const { env, request } = context

  try {
    const stored = await readStoredLottery(env, request)
    if (!stored.text) {
      return new Response('没有可用的开奖数据', {
        status: 404,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }

    return new Response(stored.text, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=600',
        'X-Happy8-Source': stored.source,
      },
    })
  } catch (error) {
    return new Response(error.message || '读取失败', {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}
