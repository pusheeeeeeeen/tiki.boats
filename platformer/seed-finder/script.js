function find(criteria, start, end, batch = 1e7) {
  let best = { best: -1 },
      done = 0,
      batches = 0
  
  for (let i = start; i < end; i += batch) {
    let worker = new Worker("worker.js")

    worker.onmessage = e => {
      if (e.data.log) {
        log(e.data.log)
        return
      }
      
      log(`Best from batch ${format(i)}–${format(i + batch)}: ${e.data.best} - ${e.data.seed}`, "font-weight: bold")
      if (e.data.best > best.best) {
        best = e.data
      }
      if (++done === batches) {
        log(`FINAL BEST: ${best.best} - ${best.seed}`, "font-weight: bold; color: green")
      }
    }

    worker.postMessage({
      start: i,
      end: i + batch,
      criteria,
      id: batches++
    })
  }
}

const formatSuffixes = "KMBTQ"
function format(num) {
  if (num < 1000) return num
  
  let suffix = -1
  while (num >= 1000) {
    num /= 1000
    suffix++
  }

  return `${num} ${formatSuffixes[suffix]}`
}

function log(msg, styles = null) {
  const elem = document.createElement("div")
  elem.append(msg)
  elem.style = styles
  document.body.append(elem)
}
