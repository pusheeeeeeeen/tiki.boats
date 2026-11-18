const commands = {
  goto : {
    run(tokens) {
      location = tokens[0] || ""
    },
    autofill : [
      [
        ...Object.keys(pages),
        ...Object.values(legacyPages).map(x => `legacy/${x.link}`)
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

        if (value === "true" || value === "yes") value = true
        else if (value === "false" || value === "no") value = false
        
        if (!attemptSetSetting(setting, value))
          notification(`Could not set setting '${setting}' to '${value}'`, "short")
      }
    },
    autofill : [
      Object.keys(settings),
      tokens => {
        let setting = settings[tokens[0]]

        if (!setting) return []

        return setting.type === "boolean"
          ? ["true", "false", "yes", "no", "get"]
          : Object.keys(setting.options).concat("get")
      }
    ]
  },
  actiontext : {
    run(tokens) {
      actionText(clientMouseX, clientMouseY, tokens.join(" "))
    }
  },
  sparkle : {
    run(tokens) {
      parent.sparkle(tokens[0] !== "off")
    },
    autofill : [
      ["on", "off"]
    ]
  },
  confetti : {
    run(tokens) {
      let density = parseFloat(tokens[0] || "1")
      confetti(density > 0 && density <= 1000 ? density : 1)
    }
  },
  fish : {
    run() {
      if (currentPage !== "home") return
      showHamburger = false
      toggleHamburger(false)
      innerIframe.contentWindow.id("logo-text").animate(
        [{ opacity: 0 }],
        { duration: 1000, fill: "forwards" }
      )
    }
  },
  storage : {
    run(tokens) {
      if (!tokens[0]) {
        notification(`${localStorage.length} keys in local storage${localStorage.getItem("backup") ? "<br>Has backup" : ""}`, "short")
      } else if (tokens[0] === "save") {
        let storage = {}
  
        for (let i = 0; i < localStorage.length; i++) {
          let key = localStorage.key(i)
          storage[key] = localStorage.getItem(key)
        }
  
        localStorage.clear()
        localStorage.setItem("backup", JSON.stringify(storage))

        
        parent.location = addURLParam(
          parent.location.href,
          "backup",
          `${Object.keys(storage).length}C${storage.backup ? "N" : ""}`
        )
      } else if (tokens[0] === "load") {
        let storage = localStorage.getItem("backup")
        if (!storage) {
          notification("No storage backup to load", "short")
          return
        }

        localStorage.clear()

        try {
          storage = JSON.parse(storage)
        } catch {
          notification("Invalid storage backup - failed to parse JSON", "short")
          return
        }

        for (let key in storage) {
          localStorage.setItem(key, storage[key])
        }

        parent.location = addURLParam(
          parent.location.href,
          "backup",
          Object.keys(storage).length + (storage.backup ? "N" : "")
        )
      }
    },
    autofill : [
      ["save", "load"]
    ]
  }
}

let backupData = urlParams.get("backup")
if (backupData) {
  let created = backupData.includes("C"),
      count = parseInt(backupData),
      nested = backupData.endsWith("N")
  
  notification(`Storage backup ${created ? "created" : "loaded"}<br>${count} keys${nested ? ", has nested backup" : ""}`, "short")
}

if (window["\u0000dev"]) {
  Object.assign(commands, {
    exp : {
      run(tokens) {
        if (tokens[0] === "get") {
          notification(`Current EXP: <span style = "font-family: var(--exp-font); font-weight: bold;">${getExp()}</span>`, "short")
        } else {
          let amount = parseInt(tokens[1])
          if (isNaN(amount) || amount < 0) return

          if (tokens[0] === "add") {
            addExp(amount)
          } else if (tokens[0] === "sub") {
            addExp(-amount)
          } else if (tokens[0] === "set") {
            addExp(amount - getExp())
          }
        }
      },
      autofill : [
        ["get", "set", "add", "sub"]
      ]
    },
    item : {
      run(tokens) {
        let [action, name, count] = tokens

        if (!(name in itemData)) {
          if (name === "*") {
            let itemList = ["use", "del"].includes(action) ? items : itemData
            for (let i in itemList)
              commands.item.run([action, i, count || "all"])
          } else {
            notification(`Invalid item '${name}'`, "short")
          }
          return
        }

        if (count === "all" && ["buy", "use", "del"].includes(action)) {
          count = Infinity
        } else {
          count = parseInt(count)
          if (isNaN(count) || count < 1 || count > 100) {
            count = 1
          }
        }

        if (action === "get") {
          for (let i = 0; i < count; i++)
            purchaseItem(name, true)
        } else if (action === "buy") {
          if (!itemData[name].cost && count === Infinity) {
            notification(`Cannot buy 'all' of '${itemData[name].name}' because it does not cost any EXP`)
          } else {
            for (let i = 0; i < count; i++) {
              if (!purchaseItem(name)) {
                notification(i ? `Purchased ${i} '${itemData[name].name}' for ${itemData[name].cost * i} EXP` : `Not enough EXP (need ${itemData[name].cost}, have ${getExp()})`)
                break
              }
            }
          }
        } else if (action === "run") {
          for (let i = 0; i < count; i++)
            useItem(name, null, true)
        } else if (action === "use") {
          count = Math.min(count, items[name])
          for (let i = 0; i < count; i++)
            if (!useItem(name)) break
        } else if (action === "del") {
          for (let i = 0; i < count; i++)
            if (!deleteItem(name)) break
        }
      },
      autofill : [
        ["get", "run", "del", "buy", "use"],
        Object.keys(itemData).concat("*"),
        tokens => ["buy", "use", "del"].includes(tokens[0]) ? ["all"] : []
      ]
    }
  })
}

// pls dont hack
const DEV_LINK = "f7decadb-bf65-49f9-a237-32155b0dc62b-00-2zd82xa5yg7wt.kirk.replit.dev"

if (window.DEV) {
  commands.prod = {
    run() {
      location.href = location.href.replace(DEV_LINK, "tiki.boats")
    }
  }
} else if (window["\u0000dev"]) {
  commands.dev = {
    run() {
      location.href = location.href.replace("tiki.boats", DEV_LINK)
    }
  }
}

commands.g = commands.goto
commands.p = commands.page
commands.re = commands.reload
commands.ow = commands.overlaywindow
commands.n = commands.notif
commands.s = commands.setting
commands.i = commands.item
commands.at = commands.actiontext

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
