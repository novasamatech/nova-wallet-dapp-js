const EXTENSION_MSG_PATH = "extensionRequest";

const _msgCompleters = {};

// send request to host app
async function requestApp({ id, message, request }) {
  return new Promise((resolve, reject) => {
    _msgCompleters[message] = { resolve, reject };
    window.send(EXTENSION_MSG_PATH, {
      id,
      msgType: message,
      request,
      url: window.location.href,
    });
  });
}

// get response from host app
function onAppResponse(msgType, response, error) {
  if (_msgCompleters[msgType]) {
    if (error) {
      _msgCompleters[msgType].reject(error);
    } else {
      _msgCompleters[msgType].resolve(response);
    }
  }
}

// send message to dapp page as extension-content
function _postResponse(data) {
  window.postMessage({ ...data, origin: "content" }, "*");
}

// handle message from dapp page as extension-content
async function handleMsg(data) {
  let response;
  switch (data.message) {
    case "pub(authorize.tab)":
    case "pub(metadata.list)":
    case "pub(metadata.provide)":
    case "pub(accounts.list)":
    case "pub(accounts.subscribe)":
    case "pub(bytes.sign)":
    case "pub(extrinsic.sign)":
      try {
        response = await requestApp(data);
        return _postResponse({ id: data.id, response });
      } catch (err) {
        return _postResponse({ id: data.id, error: err.message });
      }
    default:
      throw new Error(`Unable to handle message: ${data.message}`);
  }
}

function onAppSubscription(requestId, subscriptionString) {
  _postResponse({ id: requestId, subscription: subscriptionString })
}

export default {
  handleMsg,
  onAppResponse,
  onAppSubscription
};
