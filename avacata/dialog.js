let dialogs = [], dialogData = {}, currentDialog = null

function newDialog() {
  let id = prompt("New dialog ID\n\n(yes I am using the browser prompt feature (no you can't stop me))")
  if (!id) return

  dialogs.push(id)
  currentDialog = dialogData[id] = {
    id,
    lines: []
  }

  let option = createElem("option")
  option.innerText = id
  id("dialog-select").append(option)

  updateDialogHTML(currentDialog)
}

function updateDialogHTML(dialog) {
  id("dialog-select").value = dialog.id

  for (let line of dialog.lines) {
    let li = createElem("li.dialog-line")

    li.innerHTML = `&lt;<select class = "character-select"></select>&gt; <div class = "line-content" contenteditable>${line.html}</div>`

    id("dialog-lines").append(li)
  }
}

id("new-dialog").onclick = newDialog

function updateCharacterDropdowns() {
  
}
