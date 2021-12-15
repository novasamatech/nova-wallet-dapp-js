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
webView.configuration.userContentController.add(self, "_nova")
...

extension DappViewController: WKScriptMessageHandler {
  func userContentController(_ userContentController: WKUserContentController,
      didReceive message: WKScriptMessage) {
    if self.nativeMethods.keys.contains(message.name) {
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
    else {
      print("Could not find native method `\(message.name)`")
    }
  }
}
```
