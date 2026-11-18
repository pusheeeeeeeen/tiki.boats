let iframe = document.getElementById("iframe")

let worker = new Worker("calculate.js")

worker.onmessage = ({data}) => {
  if (data.noSolutions)
    onNoSolutions?.()
  else
    onSolution?.(data.solution)
}

let onSolution, onNoSolutions

function getSolution(layout, max = 4) {
  worker.postMessage({layout, max})

  return new Promise((resolve, reject) => {
    onSolution = resolve
    onNoSolutions = reject
  })
}

function executeSolution(data) {
  if (data.previous)
    executeSolution(data.previous)

  setTimeout(() => {
    iframe.contentWindow.postMessage({type : "move", move : data.move}, "https://shnebir.com/")
  }, data.moves * 100)
}

iframe.onload = () => {
  iframe.contentWindow.postMessage({type : "get"}, "https://shnebir.com/")
}

onmessage = ({data}) => {
  if (data === "back") {
    history.back()
    return
  }
  
  if (data.layout) {
    getSolution(data.layout, data.max)
      .then(executeSolution)
      .catch(() => console.log("NO SOLUTIONS :("))
  }
}

let params = new URLSearchParams(location.search),
    layout = params.get("p")

iframe.src = `//shnebir.com/ball-thing/?embed&noRobot${layout ? `&p=${encodeURIComponent(layout)}` : ""}`
