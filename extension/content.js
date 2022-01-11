const script = document.createElement('script')

script.src = chrome.extension.getURL('nova_min.js')

script.onload = () => {
  if (script.parentNode) {
    script.parentNode.removeChild(script)
  }
}

;(document.head || document.documentElement).appendChild(script)
