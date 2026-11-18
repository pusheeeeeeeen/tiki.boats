const boom = new Audio("boom.mp3")

let boomLoaded = false

boom.oncanplaythrough = () => {
  boomLoaded = true
}

id("load").onclick = () => {
  const start = performance.now()

  id("load").classList.add("hidden")
  id("loading").classList.remove("hidden")

  setPageTitle("Butterbar loading...")

  // 5-20 seconds
  let wait = 1000 * (Math.random() * 15 + 5)

  if (boomLoaded)
    setTimeout(showButterbar, wait)
  else
    boom.oncanplaythrough = () => {
      let elapsed = performance.now() - start
      
      setTimeout(showButterbar, Math.max(0, wait - elapsed))
    }
}

function showButterbar() {
  boom.play().catch(() => {
    console.warn(":(")
  })

  id("loading").classList.add("hidden")
  id("butterbar").classList.remove("hidden")

  setPageTitle("Butterbar loaded!")

  let loaded = parseInt(atob(localStorage.getItem("butterbarsLoaded")), 36)
  if (isNaN(loaded) || loaded < 0) loaded = 0
  loaded++

  localStorage.setItem("butterbarsLoaded", btoa(loaded.toString(36)))

  if (loaded > 1) {
    id("count").innerText = loaded
    id("butterbars-loaded").style.animation = "butterbar-loaded 4s ease"
  }

  // let pos = id("butterbar").getBoundingClientRect()
  // let dist = Math.min(innerWidth * 0.95, innerHeight * 0.95, 380)
  // exp(
  //   Math.floor(Math.random() * 3) + 5,
  //   pos.left + pos.width / 2 + (Math.random() - 0.5) * dist,
  //   pos.top + pos.height / 2 + (Math.random() - 0.5) * dist
  // )
}
