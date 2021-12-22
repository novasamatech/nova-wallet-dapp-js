# Why do i need this?
Utility allows minimal bridge compilation that once integrated into the mobile app brings support for polkadot extension protocol. That opens posibility to provide interaction between native mobile application and web dapp keeping user's secret keys on the mobile device.

# Build

```
yarn install
yarn build
```

In result ```nova-min.js``` file will be created in the ```dist``` directory

# Usage on iOS

Copy ```nova-min.js``` file from previous step to XCode project.

Add the following variables:

```
static var providerJsUrl: URL {
    return Bundle.main.url(forResource: "nova-min", withExtension: "js")!
}

static var providerScript: WKUserScript {
    let source = try! String(contentsOf: providerJsUrl)
    let script = WKUserScript(source: source, injectionTime: .atDocumentStart, forMainFrameOnly: false)
    return script
}

static var listenerScript: WKUserScript {
    let source =
    """
    window.addEventListener("message", ({ data, source }) => {
      // only allow messages from our window, by the loader
      if (source !== window) {
        return;
      }

      if (data.origin === "dapp-request") {
        window.webkit.messageHandlers._nova_.postMessage(data);
      }
    });
    """

    let script = WKUserScript(source: source, injectionTime: .atDocumentEnd, forMainFrameOnly: false)
    return script
}
```

```providerScript``` script represents js bridge that will be injected into the begining of dapp web page and will forward messages from the DApp.
```listenerScript``` script filters messages from the dapp and forwards only relevant requests to the app.

Then create web view and add scripts to it:
```
let configuration = WKWebViewConfiguration()
let controller = WKUserContentController()
controller.addUserScript(Self.providerScript)
controller.addUserScript(Self.injectedScript)

configuration.userContentController = controller

let webView = WKWebView(frame: .zero, configuration: configuration)
// setup layout here

view.addSubview(webView)
```

Finally, add handler to web view controller and implement delegate:
```
webView.configuration.userContentController.add(self, "_nova_")
...

extension DappViewController: WKScriptMessageHandler {
  func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
   guard let dict = message as? NSDictionary, let messageType = dict["msgType"] as? String else {
      print("Warning: unsupported message format \(message)")
      return
   } 

   switch messageType {
        case "pub(authorize.tab)":
            // asks if a user wants to communicate with DApp
        case "pub(accounts.list)":
            // asks for account lists available
        case "pub(accounts.subscribe)":
            // asks the app to notify dapp if list of accounts changes
        case "pub(metadata.list)":
            // asks for metadata the app uses
        case "pub(metadata.provide)":
            // asks the app to update metadata
        case "pub(bytes.sign)":
            // asks the app to sign raw bytes
        case "pub(extrinsic.sign)":
            // asks the app to sign extrinsics
        default:
            print("Warning: unsupported request \(messageType)")
    }
  }
}
```

Each message send from Dapp has the following structure:
```
{
    id: string
    msgType: string
    origin: string
    request: object
    url: string
}
```

For example, for ```pub(accounts.list)``` one can receive the following:
```
{
    id = "1639543839750.1";
    msgType = "pub(authorize.tab)";
    origin = "dapp-request";
    request = null;
    url = "https://singular.rmrk.app/";
}
```

To send response back to the DApp ```onAppResponse``` function must be used on the bridge side:
```
extension WKWebView {
    public func sendResult(type: String, result: CustomStringConvertible) {
        let script = String(format: "window.walletExtension.onAppResponse(\"%@\", %@, null)", type, result.description)
        evaluateJavaScript(script)
    }
}
```

```type``` is the message type received in the request (for example, ```pub(account.list)```) and ```result``` is a json string representing the response. The last parameter is ```error``` but for successfull responses we just pass ```null```.

For ```pub(authorize.tab)``` one should send true/false. For example, ```webView.sendResult(type, "true")```.

For ```pub(accounts.list)``` one shoule construct a json that contains list of account objects with the following structure:
```
export interface InjectedAccount {
  address: string;
  genesisHash?: string | null;
  name?: string;
  type?: KeypairType;
}

type KeypairType = 'ed25519' | 'sr25519' | 'ecdsa' | 'ethereum';
```
This is js type took from [polkadot extension](https://github.com/polkadot-js/extension/blob/master/packages/extension-inject/src/types.ts#L14) repo. As one can see the only required field is address. For example, response can be as following:
```
webView.sendResult(type, "[{\"address\": \"HP8qJ8P4u4W2QgsJ8jzVuSsjfFTT6orQomFD6eTRSGEbiTK\"}]")
```

For ```pub(extrinsic.sign)``` one should handle the `request` field of the message which contains json with the following format:
```
interface SignerPayloadJSON {
  /**
   * @description The ss-58 encoded address
   */
  address: string;

  /**
   * @description The checkpoint hash of the block, in hex
   */
  blockHash: string;

  /**
   * @description The checkpoint block number, in hex
   */
  blockNumber: string;

  /**
   * @description The era for this transaction, in hex
   */
  era: string;

  /**
   * @description The genesis hash of the chain, in hex
   */
  genesisHash: string;

  /**
   * @description The encoded method (with arguments) in hex
   */
  method: string;

  /**
   * @description The nonce for this transaction, in hex
   */
  nonce: string;

  /**
   * @description The current spec version for the runtime
   */
  specVersion: string;

  /**
   * @description The tip for this transaction, in hex
   */
  tip: string;

  /**
   * @description The current transaction version for the runtime
   */
  transactionVersion: string;

  /**
   * @description The applicable signed extensions for this runtime
   */
  signedExtensions: string[];

  /**
   * @description The version of the extrinsic we are dealing with
   */
  version: number;
}
```

This is js type took from [polkadot api](https://github.com/polkadot-js/api/blob/f11c8f9360a956ea187a40730481e6e4552e6855/packages/types/src/types/extrinsic.ts#L30).

After user confirmation mobile app sends a json response with the following format:
```
interface SignerResult {
  /**
   * @description The id for this request
   */
  id: number;

  /**
   * @description The resulting signature in hex
   */
  signature: HexString;
}
```

This is js type took from [polkadot api](https://github.com/polkadot-js/api/blob/f11c8f9360a956ea187a40730481e6e4552e6855/packages/types/src/types/extrinsic.ts#L121).
