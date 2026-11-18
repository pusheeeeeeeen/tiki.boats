function createFish(force = false) {
  if (!force && Math.random() < 0.5) return

  let duration = innerWidth / 80

  let fish = createElem("img.fish")

  fish.src = "tiki-fish.png"
  fish.style.animation = `swim-${Math.random() < 0.5 ? "right" : "left"} ${duration}s linear forwards`
  let height = fish.offsetHeight
  fish.style.top = `${Math.random() * (innerHeight + height) - height}px`

  id("fish-container").append(fish)

  setTimeout(() => {
    fish.remove()
  }, duration * 1000)
}

onload = () => {
  id("fish-container").style.transition = "opacity 0.8s ease-in-out, filter 0.8s ease-in-out"
  id("scroll").style.transition = "opacity 0.4s ease-in-out, filter 0.4s ease-in-out"
  id("article-container").style.transition = "opacity 0.4s ease-in-out, filter 0.4s ease-in-out, transform 0.6s ease"

  createFish(true)
  createFish()
  setInterval(createFish, 1000)
}

query("main").onscroll = e => {
  if (e.target.scrollTop > 0) {
    id("fish-container").classList.add("hidden")
    id("scroll").classList.add("hidden")
    id("article-container").classList.remove("hidden")
  } else {
    id("fish-container").classList.remove("hidden")
    id("scroll").classList.remove("hidden")
    id("article-container").classList.add("hidden")
  }
}

id("scroll").onclick = () => {
  query("main").scrollTo(0, 30)
}
