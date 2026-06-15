import { message } from 'ant-design-vue'

message.config({
  top: '72px',
  duration: 2,
  maxCount: 3,
})

export function notifySuccess(content) {
  message.success(content)
}

export function notifyError(content) {
  message.error(content)
}

export function notifyInfo(content) {
  message.info(content)
}
