import { Handlers, Handler } from './types'

const _messageHandlers: Handlers = {}

export const addHandler = (
  type: string,
  resolve: (value: any) => void,
  reject: (reason?: any) => void
) => {
  _messageHandlers[type] = {
    resolve,
    reject,
  }
}

export const getHandler = (type: string): Handler => {
  return _messageHandlers[type]
}
