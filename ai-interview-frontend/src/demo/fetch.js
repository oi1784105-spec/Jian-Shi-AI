// 演示模式的流式作答。
//
// interview.js 里的 submitAnswerStream 没有走 axios，而是直接用原生 fetch
// 读取 response.body，因此这里必须补一个 fetch 垫片，用 ReadableStream
// 合成与真实后端一致的事件流：
//   data: {"type":"chunk","content":"..."}
//   data: {"type":"done","score":8.4,"is_finished":false,...}
//   data: {"type":"error","content":"..."}
//
// 分片按行切分，避免把 ```json 围栏切成两半导致前端短暂闪现残字符。

import * as db from './store.js'

const TYPING_DELAY = 22

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function sse (payload) {
  return `data: ${JSON.stringify(payload)}\n\n`
}

/** 把点评文本切成适合逐字推送的分片。 */
function splitIntoChunks (text) {
  const chunks = []
  for (const line of String(text).split('\n')) {
    if (line.length <= 32) {
      chunks.push(`${line}\n`)
      continue
    }
    for (let index = 0; index < line.length; index += 24) {
      chunks.push(line.slice(index, index + 24))
    }
    chunks.push('\n')
  }
  return chunks
}

function streamFrom (chunks, onDone) {
  const encoder = new TextEncoder()
  return new ReadableStream({
    async start (controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(sse({ type: 'chunk', content: chunk })))
        await sleep(TYPING_DELAY)
      }
      if (onDone) {
        controller.enqueue(encoder.encode(sse(onDone())))
      }
      controller.close()
    }
  })
}

async function handleAnswerStream (url, init) {
  const matched = /\/interviews\/([^/]+)\/answer\/stream/.exec(url)
  const interviewId = matched ? matched[1] : null

  let answer = ''
  try {
    answer = JSON.parse(init?.body || '{}').answer || ''
  } catch (_) {
    answer = ''
  }

  let prepared = null
  let failure = null
  try {
    prepared = db.prepareAnswer(interviewId, answer)
  } catch (error) {
    failure = error?.message || '演示模式无法处理该请求'
  }

  const stream = failure
    ? streamFrom([], () => ({ type: 'error', content: failure }))
    : streamFrom(splitIntoChunks(prepared.text), () => {
      // 流式输出结束后再落库，模拟真实链路里「生成完才写入」的顺序。
      db.commitAnswer(interviewId, answer, prepared)
      return { type: 'done', ...prepared.done }
    })

  return new Response(stream, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream; charset=utf-8' }
  })
}

/** 安装 fetch 垫片：只接管流式作答接口，其余请求原样放行。 */
export function installFetchMock () {
  if (typeof window === 'undefined' || window.__jianshiDemoFetch) return
  const originalFetch = window.fetch.bind(window)
  window.fetch = (input, init) => {
    const url = typeof input === 'string' ? input : (input?.url || '')
    if (url.includes('/answer/stream')) {
      return handleAnswerStream(url, init)
    }
    return originalFetch(input, init)
  }
  window.__jianshiDemoFetch = true
}
