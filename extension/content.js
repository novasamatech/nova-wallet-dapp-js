const port = chrome.runtime.connect({ name: 'content' });

port.onMessage.addListener((data) => {
  window.postMessage({ ...data, origin: 'content' }, '*');
});

window.addEventListener('message', ({ data, source }) => {
  if (source !== window || data.origin !== 'content') {
    return;
  }

  port.postMessage(data);
});

const script = document.createElement('script')

script.src = chrome.extension.getURL('nova_min.js')

script.onload = () => {
  if (script.parentNode) {
    script.parentNode.removeChild(script)
  }
}

;(document.head || document.documentElement).appendChild(script)
