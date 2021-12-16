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
