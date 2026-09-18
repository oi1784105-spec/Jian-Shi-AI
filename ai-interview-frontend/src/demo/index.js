// 演示模式的统一入口。
//
// 只有构建时注入 VITE_DEMO_MODE=true 才会启用，
// 因此同一个代码库既能连真实后端，也能产出纯静态的在线演示版。

import { demoAdapter } from './adapter.js'
import { installFetchMock } from './fetch.js'
import { resetDemoState, demoState, DEMO_ACCOUNT } from './store.js'

/** 是否为演示构建。 */
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

/** 演示账号信息，登录页用它做预填。 */
export const DEMO_CREDENTIALS = DEMO_ACCOUNT

/** 安装演示后端：axios 适配器在 request.js 里挂载，这里只处理流式接口。 */
export function installDemo () {
  if (!DEMO_MODE) return false
  installFetchMock()
  return true
}

/** 清空演示数据并刷新页面，用于「重置演示数据」按钮。 */
export function resetDemo () {
  resetDemoState()
  window.location.reload()
}

export { demoAdapter, resetDemoState, demoState }
