declare global {
  interface Window {
    send: (path: string, data: any) => void
    walletExtension: {
      onAppResponse: (msgType: string, response: any, error: Error) => void
    }
  }
}

export type MessageData = {
  id: string
  message: string
  request: any
}

export type Handler = {
  resolve: (value: any) => void
  reject: (reason?: any) => void
}
