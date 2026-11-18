var style = document.createElement("link")
style.href = "https://tiki.boats/js/style.css"
style.rel = "stylesheet"
style.type = "text/css"

document.head.append(style)

document.body.innerHTML = `
  <div id = "code-wrapper">
    <div id = "code-outer">
      <div id = "code"></div>
    </div>
    <button id = "toggle-code"></button>
  </div>
  <div id = "canvas-wrapper">
    <canvas id = "canvas"></canvas>
  </div>
`

document.getElementById("code").innerText = code

var showingCode = false

document.getElementById("toggle-code").onclick = () => {
  if (showingCode = !showingCode)
    document.body.classList.add("show-code")
  else
    document.body.classList.remove("show-code")
}

onclick = event => {
  if (document.getElementById("canvas-wrapper").contains(event.target)) {
    showingCode = false

    document.body.classList.remove("show-code")
  }
}

const canvasElem = document.getElementById("canvas")

canvasElem.width = 800
canvasElem.height = 500

///////////////////////////////////////////////

var executor, parser, tokenizer, characterizer, ast

var stack

function run() {
  executor?.stop()

  consoleMsg("========Starting code processing========")

  var parsingTimer = false, execTimer = false
  try {
    console.time("total")

    console.time("p init")
    initializeParser()
    console.timeEnd("p init")

    console.time("parsing")
    parsingTimer = true

    ast = parser.GO()

    console.timeEnd("parsing")
    parsingTimer = false

    console.time("e init")
    executor = new Executor(ast, {
      canvas : canvasElem
    })
    console.timeEnd("e init")

    console.time("running")
    execTimer = true

    executor.GO()

    console.timeEnd("running")
    execTimer = false

    console.timeEnd("total")
  } catch (err) {
    if (parsingTimer) console.timeEnd("parsing")
    if (execTimer) console.timeEnd("running")
    console.timeEnd("total")

    consoleMsg(err, "error")

    if (err instanceof Error) problem(err.message, err.stack)

    stack = err.stack
  }
}

function initializeParser(parserCode = code) {
  parser = new Parser(
    tokenizer = new Tokenizer(
      characterizer = new Characterizer(parserCode)
    )
  )
}

function problem(msg, stack) {
  var loc = location.href.replace("index.html", ""),
      err = new Error(msg)

  err.stack = err.stack.slice(err.stack.indexOf("\n"))

  var [_, fileName, pos] = (stack ?? err.stack).match(/(\w+\.\w+):(\d+:\d+)/)

  console.error(`${(stack ?? err.stack).replaceAll(loc, "./")}\n\n====================\n\n${fileName} ${pos}\n${err.message}`)

  var consoleErr = new Error(msg)
  consoleErr.name = "PROBLEM"

  throw consoleErr
}

function consoleMsg(msg, type) {
  if (type === "error")
    console.error(msg)
  else if (type === "warn")
    console.warn(msg)
  else
    console.log(msg)
}

function formatIndent(num) { return Array(num + 1).join("  ") }

function formatMessage(message, indent = 0, processedObjects = []) {
  var result

  if (processedObjects.includes(message))
    result = `...${message != null ? `<${message._langClass ? message.getName() : message.constructor.name}> ` : ""}${message?._langClass && message.value ? message.value : message}`
  else {
    if (message?._langClass ? message.value === undefined : typeof message === "object" && message !== null)
      processedObjects = processedObjects.concat([message])

    if (message?._langClass) {
      if (message.value === undefined)
        result = `<${message.getName()}> ${message.func("toString").value}`
      else
        result = formatMessage(message.value, indent, processedObjects)
    } else if (typeof message === "string") result = `"${message}"`
    else if (typeof message === "object" && message !== null) {
      var spaces = formatIndent(indent + 1)

      if (Array.isArray(message)) {
        if (!message.length) result = "[]"
        else {

          result = `[
${message.map(x => `${spaces}${formatMessage(x, indent + 1, processedObjects)}`).join(",\n")}
${formatIndent(indent)}]`
        }
      } else {
        if (!Object.keys(message).length) result = "{}"
        else {
          result = `{
${Object.entries(message).map(([key, val]) => `${spaces}${key} : ${formatMessage(val, indent + 1, processedObjects)}`).join(",\n")}
${formatIndent(indent)}}`
        }
      }
    } else result = String(message)
  }

  return result
}

run()
