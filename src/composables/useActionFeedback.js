import { ref } from 'vue'

/** 复制/生成等操作的临时激活态反馈 */
export function useActionFeedback(timeout = 1500) {
  const activeKey = ref('')

  function trigger(key) {
    activeKey.value = key
    window.setTimeout(() => {
      if (activeKey.value === key) activeKey.value = ''
    }, timeout)
  }

  function isActive(key) {
    return activeKey.value === key
  }

  return { activeKey, trigger, isActive }
}
