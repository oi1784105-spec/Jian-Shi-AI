// 演示模式的 axios 适配器。
//
// 拦截层级选在 axios adapter 而不是视图内部，好处是 9 个视图与 5 个 api 模块
// 一行都不用改：请求照常发出、拦截器照常运行、响应照常解包，
// 只是数据来自本地内存库而不是真实后端。
//
// 响应统一使用后端约定的信封格式 { code, message, data }，
// 这样 request.js 里的响应拦截器无需任何特殊处理。

import * as db from './store.js'

/** 模拟网络往返耗时，让加载态、按钮禁用态等交互看起来真实。 */
const LATENCY = 180

function delay (value, ms = LATENCY) {
  return new Promise(resolve => setTimeout(() => resolve(value), ms))
}

function envelope (payload) {
  return { code: 200, message: 'success', data: payload }
}

function errorEnvelope (message, code = 400) {
  return { code, message: message || '请求失败', data: null }
}

/** 读取请求体：普通对象被 axios 序列化成字符串，表单则是 FormData。 */
function readBody (config) {
  const data = config?.data
  if (!data) return {}
  if (typeof FormData !== 'undefined' && data instanceof FormData) {
    const result = {}
    data.forEach((value, key) => { result[key] = value })
    return result
  }
  if (typeof data === 'string') {
    try {
      return JSON.parse(data)
    } catch (_) {
      return {}
    }
  }
  return data
}

function readParams (config) {
  const params = config?.params
  if (!params) return {}
  if (typeof params === 'string') {
    return Object.fromEntries(new URLSearchParams(params))
  }
  return params
}

/**
 * 路由表。顺序有意义：静态路径必须排在带参数的路径之前，
 * 例如 /interviews/start 要排在 /interviews/:id 之前。
 * 每个处理器返回「信封对象」，抛出的异常会被转成错误信封。
 */
const ROUTES = [
  // --- 账号 ---
  ['post', /^\/auth\/register$/, (_, config) => db.register(readBody(config))],
  ['post', /^\/auth\/login$/, (_, config) => db.login(readBody(config))],
  ['get', /^\/auth\/me$/, () => db.getProfile()],
  ['put', /^\/auth\/me$/, (_, config) => db.updateProfile(readBody(config))],
  ['post', /^\/auth\/me\/avatar$/, () => db.uploadAvatar()],
  ['post', /^\/auth\/me\/change-password$/, () => db.changePassword()],

  // --- Provider ---
  ['get', /^\/ai-providers\/presets$/, () => db.providerPresets()],
  ['get', /^\/ai-providers\/status$/, () => db.providerStatus()],
  ['post', /^\/ai-providers\/discover-models$/, (_, config) => db.discoverModels(readBody(config))],
  ['get', /^\/ai-providers$/, () => db.listProviders()],
  ['post', /^\/ai-providers$/, (_, config) => db.createProvider(readBody(config))],
  ['put', /^\/ai-providers\/([^/]+)$/, (m, config) => db.updateProvider(m[1], readBody(config))],
  ['delete', /^\/ai-providers\/([^/]+)$/, m => db.deleteProvider(m[1])],
  ['post', /^\/ai-providers\/([^/]+)\/test$/, m => db.testProvider(m[1])],
  ['post', /^\/ai-providers\/([^/]+)\/activate$/, m => db.activateProvider(m[1])],
  ['get', /^\/ai-providers\/([^/]+)\/models$/, m => {
    const provider = db.listProviders().find(item => String(item.id) === String(m[1]))
    return { models: provider?.models || [] }
  }],

  // --- 简历 ---
  ['post', /^\/resumes\/upload$/, (_, config) => {
    const body = readBody(config)
    return db.uploadResume({ filename: body.file?.name, targetPosition: body.target_position })
  }],
  ['get', /^\/resumes$/, () => db.listResumes()],
  ['get', /^\/resumes\/([^/]+)$/, m => db.getResume(m[1])],

  // --- 面试 ---
  ['post', /^\/interviews\/start$/, (_, config) => db.startInterview(readBody(config))],
  ['get', /^\/interviews$/, () => db.listInterviews()],
  ['get', /^\/interviews\/([^/]+)\/messages$/, m => db.getMessages(m[1])],
  ['get', /^\/interviews\/([^/]+)\/report$/, m => db.getReport(m[1])],
  ['post', /^\/interviews\/([^/]+)\/answer$/, (m, config) => {
    const body = readBody(config)
    const prepared = db.prepareAnswer(m[1], body.answer)
    db.commitAnswer(m[1], body.answer, prepared)
    return prepared.done
  }],
  ['delete', /^\/interviews\/([^/]+)$/, m => db.deleteInterview(m[1])]
]

function match (method, url) {
  for (const [routeMethod, pattern, handler] of ROUTES) {
    if (routeMethod !== method) continue
    const matched = pattern.exec(url)
    if (matched) return { handler, matched }
  }
  return null
}

/**
 * axios 适配器：签名与官方适配器一致，返回 AxiosResponse 结构。
 */
export function demoAdapter (config) {
  const method = (config.method || 'get').toLowerCase()
  const url = String(config.url || '').split('?')[0]

  const route = match(method, url)
  if (!route) {
    return delay({
      data: errorEnvelope(`演示模式未实现该接口：${method.toUpperCase()} ${url}`, 404),
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      config,
      request: {}
    })
  }

  let body
  try {
    body = envelope(route.handler(route.matched, config, readParams(config)))
  } catch (error) {
    body = errorEnvelope(error?.message)
  }

  return delay({
    data: body,
    status: 200,
    statusText: 'OK',
    headers: { 'content-type': 'application/json' },
    config,
    request: {}
  })
}
