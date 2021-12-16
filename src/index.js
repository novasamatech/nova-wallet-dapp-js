import "@babel/polyfill";
import { enable, handleResponse } from "@polkadot/extension-base/page";
import { injectExtension } from "@polkadot/extension-inject";
import { web3Accounts, web3Enable } from "@polkadot/extension-dapp";
import handlers from "./handlers";

// send message to JSChannel: assembly
function send(path, data) {
  window.postMessage(window.postMessage({ ...data, origin: "dapp-request" }, "*"));
}

window.send = send;


// setup a response listener (events created by the loader for extension responses)
window.addEventListener("message", ({ data, source }) => {
  // only allow messages from our window, by the loader
  if (source !== window) {
    return;
  }

  if (data.origin === "content") {
    if (data.id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handleResponse(data);
    } else {
      console.error("Missing id for response.");
    }
  } else if (data.origin === "page") {
    handlers.handleMsg(data);
  }
});

injectExtension(enable, {
  name: "novawallet-extension",
  version: "1.0",
});

window.walletExtension = {
  onAppResponse: handlers.onAppResponse,
};