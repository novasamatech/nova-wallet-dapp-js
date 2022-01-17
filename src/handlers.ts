import { Handlers, Handler } from './types'

class HandlersStore {
  _messageHandlers: Handlers

  constructor() {
    this._messageHandlers = new Map<string, Handler>()
  }

  addHandler = (
    type: string,
    resolve: (value: any) => void,
    reject: (reason?: any) => void
  ) => {
    this._messageHandlers.set(type, {
      resolve,
      reject,
    })
  }
  
  getHandler = (type: string): Handler | undefined => {
    return this._messageHandlers.get(type)
  }
  
}

export default HandlersStore