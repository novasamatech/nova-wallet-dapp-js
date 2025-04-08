import { enable, handleResponse } from '@polkadot/extension-base/page'
import { injectExtension } from '@polkadot/extension-inject'
import { MessageData } from './types'
import HandlerStore from './handlers'
import packageInfo from '../package.json'

function inject () {
  injectExtension(enable, {
    name: 'polkadot-js',
    version: packageInfo.version,
  });

  window.injectedWeb3['nova-wallet'] = window.injectedWeb3['polkadot-js']
}

class WalletExtension {
  handlers: HandlerStore

  constructor() {
    this.handlers = new HandlerStore()
    window.send = this.sendRequest    

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

    inject()

    window.walletExtension = {
      onAppResponse: this.onAppResponse.bind(this),
      onAppSubscription: this.onAppSubscription.bind(this),
      isNovaWallet: true
    }
  }

  /*
   * Send message to dapp page as extension-content
   */
  postResponse(data: any) {
    this._postMessage("content", data)
  }

  /*
   * Send message to JSChannel: assembly
   */
  sendRequest(data: any) {
    this._postMessage("dapp-request", data)
  }

  _postMessage(origin: string, data: any) {
    window.postMessage({ ...data, origin }, "*");
  }

  /*
   * Send request to host app
   */
  public async sendAppRequest({ id, message, request }: MessageData) {
    return new Promise((resolve, reject) => {
      this.handlers.addHandler(id, resolve, reject)
      this.sendRequest({
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
  public onAppResponse(id: string, response: any, error: Error) {
    const handler = this.handlers.getHandler(id)
    if (handler) {
      if (error) {
        handler.reject(error)
      } else {
        handler.resolve(response)
      }
    }
  }

  public onAppSubscription(requestId: string, subscriptionString: string) {
    this.postResponse({ id: requestId, subscription: subscriptionString })
  }  

  /*
   * Handle message from dapp page as extension-content
   */
  public async handleMessage(data: MessageData) {
    switch (data.message) {
      case 'pub(authorize.tab)':
      case 'pub(metadata.list)':
      case 'pub(metadata.provide)':
      case 'pub(accounts.list)':
      case 'pub(accounts.subscribe)':
      case 'pub(bytes.sign)':
      case 'pub(extrinsic.sign)':
        try {
          let response = await this.sendAppRequest(data)

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

export default extension
