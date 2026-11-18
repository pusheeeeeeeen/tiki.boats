// editor

let currentlyOpen = null,
    changedSinceLastSave = false,
    tempOpen = false // currently open doc is not in the database, and therefore does not have a docId

async function openDocument(docId, update = true) {
  if (currentlyOpen)
    await closeCurrent()

  showLoading()

  showEditor()
  currentlyOpen = docId

  let originalData = documents[docId]

  getValue(`documents/${docId}`).then(data => {
    hideLoading()

    if (!data) {
      data = originalData
      id("document-deleted").classList.add("show")

      removeDocument(docId)
    } else if (!documentsMatch(data, originalData)) {
      id("document-modified").classList.add("show")

      updateDocument(docId, data)
    }

    updateEditorData(docId, data)
  })
}

function updateEditorData(docId, data) {
  id("doc-id").innerText = docId
  id("document-name").value = data.documentName
  id("document-content").value = data.documentText
  id("allow-deletion").checked = !data.cantDelete
  id("editor-version").value = data.version || ""

  updatePreview()
}

function setDefaultEditorData() {
  id("doc-id").innerText = ""
  id("document-name").value = "Untitled"
  id("document-content").value = ""
  id("allow-deletion").checked = true
  id("editor-version").value = ""
}

function documentsMatch(dataA, dataB) {
  return dataA.documentName === dataB.documentName
    && dataA.documentText === dataB.documentText
    && !!dataA.cantDelete === !!dataB.cantDelete
    && dataA.version === dataB.version
    && dataA.uneditable === dataB.uneditable
}

// new doc

id("new").onclick = newDocument

async function newDocument() {
  if (currentlyOpen)
    await closeCurrent()

  showEditor()

  setDefaultEditorData()
  id("document-name").select()

  tempOpen = true
}

// editor controls

id("close-editor").onclick = closeCurrent

function closeCurrent() {
  let promise

  if (changedSinceLastSave && confirm("Save before closing?"))
    promise = saveCurrent()

  hideEditor()

  return promise || Promise.resolve()
}

id("save").onclick = saveCurrent
id("replace").onclick = replaceCurrent
id("delete").onclick = deleteCurrent

for (let i of ["document-name", "document-content", "allow-deletion", "editor-version"])
  id(i).addEventListener("input", () => {
    changedSinceLastSave = true

    id("edited").classList.add("show")
  })

id("document-content").oninput = () => {
  updatePreview()
}

function updatePreview() {
  id("editor-preview").contentWindow.document.body.innerHTML = id("document-content").value
}

// saving

function saveCurrent() {
  changedSinceLastSave = false
  id("edited").classList.remove("show")
  hideEditorNotifs()

  if (tempOpen)
    return saveNewDocument()

  if (currentlyOpen === null) return

  return saveDocument(currentlyOpen, currentDocData())
}

function currentDocData() {
  let data = {
    documentName : id("document-name").value,
    documentText : id("document-content").value
  }

  if (!id("allow-deletion").checked)
    data.cantDelete = true

  let version = id("editor-version").value

  if (version)
    data.version = version

  return data
}

function saveDocument(docId, data) {
  showLoading()

  updateDocument(docId, data)

  return setValue(`documents/${docId}`, data).then(hideLoading)
}

function saveNewDocument() {
  showLoading()

  let data = currentDocData()

  return nextDocId().then(docId => {
    saveDocument(docId, data)

    tempOpen = false
    currentlyOpen = docId
    id("doc-id").innerText = docId
  })
}

function nextDocId() {
  return getValue("documentIDCount").then(
    val => new Promise(resolve => {
      setValue("documentIDCount", val + 1)
        .then(resolve(val))
    })
  )
}

// replacing (with server copy)

function replaceCurrent() {
  if (!currentlyOpen)
    return

  if (tempOpen) {
    alert("Cannot replace this document with server copy because it is not currently on the server.")
    return
  }

  showLoading()

  let docId = currentlyOpen

  getDocument(docId).then(data => {
    hideLoading()

    if (!data) {
      alert("Cannot replace this document with server copy because it no longer exists on the server.")

      id("document-deleted").classList.add("show")
      removeDocument(docId)

      return
    }

    if (documentsMatch(currentDocData(), data)) {
      alert("Client and server copies are already the same.")
      return
    }

    updateDocument(docId, data)

    if (!changedSinceLastSave || confirm("Are you sure you want to continue? This will override all unsaved changes."))
      updateEditorData(docId, data)
    else
      id("document-desync").classList.add("show")
  })
}

function getDocument(docId) {
  return getValue(`documents/${docId}`)
}

// deletion

function deleteCurrent() {
  if (tempOpen) {
    if (confirm("Are you sure you want to delete this draft? It will be lost forever."))
      hideEditor()

    return
  }

  if (currentlyOpen === null) return

  if (confirm("Are you sure you want to delete this document? It will be lost forever.")) {
    showLoading()

    deleteDocument(currentlyOpen).then(hideLoading)

    removeDocument(currentlyOpen)
    hideEditor()
  }
}

function deleteDocument(docId) {
  return removeValue(`documents/${docId}`)
}

// editor show/hide

function showEditor() {
  scrollTo({
    top : 0,
    behavior : "smooth"
  })

  id("editor").classList.add("editing")
}

function hideEditor() {
  currentlyOpen = null
  changedSinceLastSave = false
  tempOpen = false

  id("edited").classList.remove("show")
  id("editor").classList.remove("editing")

  hideEditorNotifs()

  id("editor-preview").contentDocument.body.innerHTML = ""
}

function hideEditorNotifs() {
  id("document-deleted").classList.remove("show")
  id("document-modified").classList.remove("show")
  id("document-desync").classList.remove("show")
}

// searching

const searchInput = id("search")

searchInput.oninput = () => {
  let search = searchInput.value.trim().replaceAll(/\s{2,}/g, " ")

  if (!search) {
    displayDocuments(documents)
    return
  }

  let searchByWord = new RegExp(escapeRegex(search).replaceAll(" ", ".*"))

  let scores = {}

  for (let i in documents) {
    let data = documents[i], score = 0

    let name = data.documentName ?? "undefined",
        text = data.documentText

    if (search === name)
      score += 100

    if (search === text)
      score += 50

    score += [...(name || "undefined").matchAll(search)].length ** (1 / 3) * 4

    if (name && searchByWord.test(data.documentName))
      score += 2

    if (text) {
      score += [...data.documentText.matchAll(search)].length ** (1 / 3)

      if (searchByWord.test(data.documentText))
        score += 0.5
    }

    scores[i] = score
  }

  displayDocuments(documents, scores)
}

// document list

let documents

function updateDocuments(display = true) {
  return getValue("documents").then(docs => {
    // returns array if all indexes >= 0, otherwise returns an object
    // make sure that documents variable is always an object
    if (Array.isArray(documents))
      documents = Object.assign({}, documents)
    else
      documents = docs

    if (display)
      displayDocuments(documents)
  })
}

function displayDocuments(docs, scores = null) {
  id("document-list-inner").innerHTML = ""

  let docEntries = Object.entries(docs)

  if (scores)
    docEntries = docEntries
      .filter(x => scores[x[0]])
      .sort((a, b) => scores[b[0]] - scores[a[0]])
  else
    docEntries.reverse()

  for (let [docId, data] of docEntries)
    displayDocument(docId, data)
}

function displayDocument(docId, data) {
  id("document-list-inner").append(createDocumentListItem(docId, data))
}

function updateDocument(docId, data) {
  if (!(docId in documents))
    displayDocument(docId, data)
  else
    id(`document-${docId}`).innerHTML = createRowHTML(docId, data)


  documents[docId] = data
}

function removeDocument(docId) {
  delete documents[docId]

  id(`document-${docId}`).remove()
}

function createDocumentListItem(docId, data) {
  let row = document.createElement("tr")

  row.id = `document-${docId}`
  row.tabIndex = 0

  row.innerHTML = createRowHTML(docId, data)

  row.onclick = () => {
    openDocument(docId)
  }

  return row
}

function createRowHTML(docId, data) {
  let name = htmlToText(data.documentName),
      text = htmlToText(data.documentText)

  let version = escapeHTML(data.version || "")

  return `
    <td class = "doc-id">
      ${docId}.
    </td>
    <td class = "doc-name" title = "${name}">
      ${name}
    </td>
    <td class = "doc-preview" title = "${text}">
      ${text}
    </td>
    <td class = "dot" ${version && `style = "--color: cornflowerblue" title = "version: ${version}"`}></td>
    <td class = "dot" ${data.cantDelete ? "style = '--color: red' title = 'can’t be deleted'" : ""}></td>
  `
}

// loading screen

function showLoading() {
  id("loading").classList.add("show")
}

function hideLoading() {
  id("loading").classList.remove("show")
}

// startup

showLoading()

onload = () => {
  // sometimes search text persists after reloading
  // probably a browser convenience feature
  id("search").value = ""

  id("editor-preview").contentDocument.body.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif"

  updateDocuments().then(hideLoading)
}
