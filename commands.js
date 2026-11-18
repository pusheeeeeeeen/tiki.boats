const commands = {
  goto : {
    run(tokens) {
      location = tokens[0] || ""
    },
    autofill : [
      [
        ...Object.keys(pages),
        ...Object.values(legacyPages).map(x => `legacy/${x.link}`.slice(0, -1))
      ]
    ]
  },
  page : {
    run(tokens) {
      openPage(tokens[0] || "")
    },
    autofill : [
      Object.keys(pages)
    ]
  },
  reload : {
    run() {
      openPage(currentPage)
    }
  },
  overlaywindow : {
    run(tokens) {
      showOverlayWindow(tokens[0] || "")
    },
    autofill : [
      Object.keys(pages)
    ]
  },
  notif : {
    run(tokens) {
      if (tokens[0] === "clear")
        clearNotifications(tokens[1] === "force")
      else if (tokens[0] === "easter-egg")
        easterEggNotif()
      else {
        let noX = tokens.length > 2 && tokens[1] === "no-x"
        
        notification(tokens.slice(1 + noX).join(" "), tokens[0], !noX)
      }
    },
    autofill : [
      ["clear", "short", "long", "persistent"],
      tokens => tokens[0] === "clear"
        ? ["force", "normal"]
        : ["short", "long", "persistent"].includes(tokens[0]) ? ["no-x"] : []
    ]
  },
  setting : {
    run(tokens) {
      let setting = tokens[0]
    
      if (!(setting in settings)) {
        notification(`Unknown setting '${setting}'`, "short")
        return
      }

      if (tokens.length === 1) {
        if (settings[setting].type === "boolean")
          setSetting(setting, !getSetting(setting))
        else
          notification(`Could not toggle setting '${setting}' because it is not a boolean setting`, "short")
      } else {
        let value = tokens[1]

        if (value === "get") {
          notification(`Setting '${setting}' is set to: ${getSetting(setting)}`, "short")
          return
        }

        if (value === "true") value = true
        else if (value === "false") value = false
        
        if (!attemptSetSetting(setting, value))
          notification(`Could not set setting '${setting}' to '${value}'`, "shot")
      }
    },
    autofill : [
      () => Object.keys(settings),
      tokens => {
        let setting = settings[tokens[0]]

        if (!setting) return []

        return setting.type === "boolean"
          ? ["true", "false", "yes", "no", "get"]
          : Object.keys(setting.options).concat("get")
      }
    ]
  },
  confetti : {
    run(tokens) {
      let density = parseFloat(tokens[0] || "1")
      confetti(density > 0 && density <= 1000 ? density : 1)
    }
  }
}

commands.g = commands.goto
commands.p = commands.page
commands.re = commands.reload
commands.ow = commands.overlaywindow
commands.n = commands.notif
commands.s = commands.setting

const commandNames = Object.keys(commands)

const commandInput = id("command-input")

function showCommandLine() {
  id("command-wrapper").classList.add("show")

  commandInput.focus()

  updateAutosuggest()
}

function hideCommandLine() {
  commandInput.blur()

  id("command-wrapper").classList.remove("show")
  commandInput.value = ""
}

commandInput.onblur = () => {
  hideCommandLine()
}

commandInput.onkeydown = e => {
  if (e.code === "Escape")
    hideCommandLine()
  else if (e.code === "Enter") {
    runCommand(commandInput.value)

    hideCommandLine()
  } else if (currentAutofill) {
    let index
    
    if (e.code === "Tab" || e.code === "ArrowDown")
      index = (currentAutofill.selected + 1) % currentAutofill.options.length
    else if (e.code === "ArrowUp") {
      index = currentAutofill.selected - 1

      if (index < 0) index = currentAutofill.options.length - 1
    } else return

    selectAutofill(index)

    e.preventDefault()
  } else if (e.code === "Tab")
    e.preventDefault()
}

function selectAutofill(index) {
  let lastIndex = currentAutofill.selected
  
  currentAutofill.selected = index
  
  let lastAutofill = currentAutofill.options[lastIndex]?.innerText || "",
      inputSlice = -lastAutofill.length

  commandInput.value = (inputSlice ? commandInput.value.slice(0, inputSlice) : commandInput.value)
    + currentAutofill.options[index].innerText.slice(lastIndex === -1 ? currentAutofill.offset : 0)

  currentAutofill.options[lastIndex]?.classList.remove("selected")
  currentAutofill.options[index].classList.add("selected")

  let scrollPos = currentAutofill.options[index].offsetTop

  id("command-autofill").scrollTo(0, scrollPos - id("command-autofill").offsetHeight / 2)
}

commandInput.oninput = e => {
  updateAutosuggest()
}

function updateAutosuggest() {
  let {command, tokens, fullTokens, obj} = parseCommand(commandInput.value)

  let suggestionPool

  let tokenPos = tokens.length,
      lastTok = fullTokens[fullTokens.length - 1]

  if (tokenPos === 0)
    suggestionPool = commandNames
  else if (obj?.autofill?.[tokenPos - 1]) {
    suggestionPool = obj.autofill[tokenPos - 1]

    if (typeof suggestionPool === "function")
      suggestionPool = suggestionPool(tokens)
  } else
    suggestionPool = []
  
  displaySuggestions(suggestionPool/*.sort((a, b) => a.length - b.length)*/, lastTok)
}

let currentAutofill = null

function displaySuggestions(suggestions, lastTok) {
  id("command-autofill").innerHTML = ""
  currentAutofill = null
  
  if (!suggestions.length) return

  suggestions = suggestions.filter(x => x.startsWith(lastTok))

  if (!suggestions.length) return

  let offset = lastTok.length

  currentAutofill = {
    selected : -1,
    offset
  }

  currentAutofill.options = suggestions.map((x, i) => {
    let elem = createElem("button.command-autofill-option.reset"),
        text = escapeHTML(x)

    elem.innerHTML = offset ? `<b>${text.slice(0, offset)}</b>${text.slice(offset)}` : text

    elem.onmousedown = e => {
      e.preventDefault()
    }

    elem.onclick = e => {
      selectAutofill(i)

      commandInput.value += " "

      updateAutosuggest()

      e.preventDefault()
    }

    return elem
  })

  id("command-autofill").append(...currentAutofill.options)

  let pos = getTextWidth(lastTok ? commandInput.value.slice(0, -offset) : commandInput.value, "13px Menlo, monospace")
    + commandInput.getBoundingClientRect().left
    
  id("command-autofill").style.left = pos - 6 + "px"
}

function parseCommand(rawCommand) {
  let tokens = rawCommand.trimStart().split(/\s+/)

  return {
    command : tokens[0],
    tokens : tokens.slice(1),
    fullTokens : tokens,
    obj : commands[tokens[0]]
  }
}

function runCommand(rawCommand) {
  let {command, tokens, obj} = parseCommand(rawCommand)

  if (!obj) return

  obj.run(tokens)
}
