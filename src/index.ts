import { enable, handleResponse } from '@polkadot/extension-base/page'
import { injectExtension } from '@polkadot/extension-inject'
import { MessageData, Handler } from './types'

class WalletExtension {
  constructor() {
    this.initExtension()
  }

  EXTENSTION_MSG_PATH = 'extensionRequest'
  messageHandlers: {
    [key: string]: Handler
  } = {}

  initExtension() {
    injectExtension(enable, {
      name: 'novawallet-extension',
      version: '1.0',
    })

    window.send = this.send
    window.walletExtension = {
      onAppResponse: this.onAppResponse,
    }

    // setup a response listener (events created by the loader for extension responses)
    window.addEventListener('message', ({ data, source }) => {
      // only allow messages from our window, by the loader
      if (source !== window) {
        return
      }

      if (data.origin === 'content') {
        if (data.id) {
          handleResponse(data)
        } else {
          console.error('Missing id for response.')
        }
      } else if (data.origin === 'page') {
        this.handleMessage(data)
      }
    })
  }

  /*
   * Send message to JSChannel: assembly
   */
  send(path: string, data: MessageData) {
    window.postMessage({ ...data, origin: 'dapp-request' }, '*')
  }

  addHandler(
    type: string,
    resolve: (value: any) => void,
    reject: (reason?: any) => void
  ) {
    this.messageHandlers[type] = {
      resolve,
      reject,
    }
  }

  /*
   * Send message to dapp page as extension-content
   */
  postResponse(data: any) {
    window.postMessage({ ...data, origin: 'content' }, '*')
  }

  /*
   * Send request to host app
   */
  public sendAppRequest({ id, message, request }: MessageData) {
    return new Promise((resolve, reject) => {
      this.addHandler(message, resolve, reject)
      window.send(this.EXTENSTION_MSG_PATH, {
        id,
        msgType: message,
        request,
        url: window.location.href,
      })
    })
  }

  /*
   * Get response from host app
   */
  public onAppResponse(msgType: string, response: any, error: Error) {
    if (this.messageHandlers[msgType]) {
      if (error) {
        this.messageHandlers[msgType].reject(error)
      } else {
        this.messageHandlers[msgType].resolve(response)
      }
    }
  }

  /*
   * Handle message from dapp page as extension-content
   */
  public async handleMessage(data: MessageData) {
    let response
    switch (data.message) {
      case 'pub(authorize.tab)':
      case 'pub(metadata.list)':
      case 'pub(metadata.provide)':
      case 'pub(accounts.list)':
      case 'pub(accounts.subscribe)':
      case 'pub(bytes.sign)':
      case 'pub(extrinsic.sign)':
        try {
          response = await this.sendAppRequest(data)
          return this.postResponse({ id: data.id, response })
        } catch (err: any) {
          return this.postResponse({ id: data.id, error: err.message })
        }

      default:
        throw new Error(`Unable to handle message: ${data.message}`)
    }
  }
}

const extension = new WalletExtension()
