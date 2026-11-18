// cursed webWorker stuff
function find(start, end, criteria) {
  let worker = new Worker("./worker.js")

  worker.onmessage = e => {
    console.log(e.data)
  }

  worker.postMessage({
    start,
    end,
    criteria
  })
}
