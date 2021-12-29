declare global {
  interface Window {
    send: (data: any) => void
    walletExtension: {
      onAppResponse: (msgType: string, response: any, error: Error) => void
    }
  }
}

export type MessageData = {
  id: string
  message?: string
  msgType?: string
  request: object
  origin?: string
  url?: string
}

export type Handler = {
  resolve: (value: any) => void
  reject: (reason?: any) => void
}
