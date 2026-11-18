import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js"
import {
  getDatabase,
  ref,
  set,
  remove,
  get
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js"

const app = initializeApp(firebaseConfig)
const db = getDatabase(app)

/*

database structure

db : {
  documents : [
    id : [[document]]
    id : [[document]]
    ...
  ]
  documentIDCount : num
}

document : {
  documentName : "tablet name"
  documentText : "tablet content"
  version? : "document_1.0" | undefined
  cantDelete : true | false (unused) | undefined
}

*/

window.getValue = path => {
  return get(ref(db, path)).then(snapshot => snapshot.val())
}

const noSetPaths = new Set(["documents", "documents/"])

window.setValue = (path, data) => {
  if (noSetPaths.has(path)) {
    document.body.innerHTML = `
      <span style = "color: red; font-size: 20px; font-family: Menlo, monospace;">
        ERROR: tried to set server path '${path}'
      </span>
    `

    throw new Error(`Tried to set server path '${path}'`)
  }

  return set(ref(db, path), data)
}

window.removeValue = path => {
  return remove(ref(db, path))
}
