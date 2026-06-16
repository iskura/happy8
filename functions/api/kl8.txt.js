import { syncLotteryData } from '../_lotterySync.js'

/** 按条件同步乐彩网数据并写入 KV（相当于更新服务器上的内置 txt） */
export async function onRequestGet(context) {
  const { env, request } = context
  const force = new URL(request.url).searchParams.get('force') === '1'

  try {
    const result = await syncLotteryData(env, request, { force })
    if (!result.text) {
      return new Response('没有可用的开奖数据', {
        status: 404,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }

    return new Response(result.text, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Happy8-Refreshed': result.refreshed ? '1' : '0',
      },
    })
  } catch (error) {
    return new Response(error.message || '数据同步失败', {
      status: 502,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}
