function id(id) {
  return document.getElementById(id)
}

function escapeRegex(str) {
  return str.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function escapeHTML(html) {
  return html
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&apos;")
}

function htmlToText(html, escape = true) {
  let dom = new DOMParser().parseFromString(html, "text/html")

  for (let i of dom.querySelectorAll("img"))
    i.replaceWith(document.createTextNode("<image>"))

  let text = dom.body.innerText

  return escape ? escapeHTML(text) : text
}

// tibliobeca sanitization function
function sanitize(html) {
  return sanitizeHtml(html, {
    allowedTags : ["span", "br", "img", "p", "b", "strong", "s", "i", "em"],
    allowedAttributes : {
      "span" : ["style"],
      "img" : ["src"]
    },
    allowedSchemes: ["data", "http", "https", "blob"]
  })
}
