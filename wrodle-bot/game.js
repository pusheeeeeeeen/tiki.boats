let guessIndex, inGame = false, currentGuess, answer

function start() {
  worker.postMessage({type : "reset"})

  id("guesses-inner").innerHTML = emptyHTML

  guessIndex = 0
  inGame = true
  currentGuess = ""

  answer = solutions[Math.floor(Math.random() * solutions.length)]
}

let emptyHTML = ""

for (let i = 0; i < GUESSES; i++) {
  for (let j = 0; j < LENGTH; j++)
    emptyHTML += `<div id = "${j}-${i}" class = "letter"></div>`
}

let remainingLettersHTML = ""

for (let i = 0; i < LENGTH; i++)
  remainingLettersHTML += `<div id = "remaining-${i}" class = "remaining-col"></div>`

id("remaining").innerHTML = remainingLettersHTML

onkeydown = e => {
  if (e.metaKey || e.altKey || e.ctrlKey || e.isComposing || !e.isTrusted) return

  if (e.code === "Enter")
    guess(currentGuess)
  else if (e.code === "Backspace")
    removeLetter()

  let key = e.key

  if (key.length !== 1 || !inGame) return

  addLetter(key.toLowerCase())
}

function getElem(x, y) {
  return id(`${x}-${y}`)
}

const letters = "abcdefghijklmnopqrstuvwxyz"

function addLetter(letter) {
  if (currentGuess.length >= 5 || !letters.includes(letter)) return

  getElem(currentGuess.length, guessIndex).innerText = letter.toUpperCase()

  currentGuess += letter
}

function removeLetter() {
  currentGuess = currentGuess.slice(0, -1)

  getElem(currentGuess.length, guessIndex).innerText = ""
}

function guess(guess) {
  if (guess.length !== LENGTH || !guessSet.has(guess)) return

  let correct = guess === answer,
      colors = getColors(guess, answer)

  revealColors(colors, correct)

  id("suggestions").classList.remove("show")

  if (!correct) {
    worker.postMessage({
      type : "guess",
      word : guess,
      colors
    })
  }

  guessIndex++
  currentGuess = ""

  if (correct)
    win()
  else if (guessIndex >= GUESSES)
    lose()
}

function revealColors(colors, correct) {
  let y = guessIndex

  colors.forEach((color, i) => {
    setTimeout(() => {
      let elem = getElem(i, y)

      elem.classList.add(color)
      if (correct)
        elem.classList.add("win")
    }, i * 80)
  })
}

function win() {
  inGame = false
  hideHints()
}

function lose() {
  inGame = false
}

function formatSuggestion(word, scores) {
  if (!scores) return word

  let score = scores[word], scoreText = score.toFixed(1)

  if (!score)
    scoreText = "solution"
  else if (score < 0.999999999) // floating point moment
    scoreText = `solution [${Math.round(100 - 100 * score)}%] or next turn`
  else if (score === 1)
    scoreText = "solve on next turn"

  return `${word} (${scoreText})`
}

function formatSuggestions(order, scores) {
  let best = scores && scores[order[0]]

  return order.map(x => {
    let text = formatSuggestion(x, scores)

    return scores && scores[x] === best ? `<span style = "color: lime">${text}</span>` : text
  }).join("<br>")
}

function formatPossibleSolutions(solutions) {
  let num = `${solutions.length} possible solution${solutions.length !== 1 ? "s" : ""}`

  return solutions.length < 20 ? `<u>${num}</u><br>${solutions.join("<br>")}` : num
}

let worker = new Worker("worker.js")

worker.onmessage = ({data}) => {
  if (data.READY) {
    console.log("worker ready")
    start()
  } else if (data.order) {
    let ellipsis = data.order.length > 20 ? "<br>..." : ""
    id("suggestions").innerHTML = formatSuggestions(data.order.slice(0, 20), data.scores) + ellipsis
    id("suggestions").classList.add("show")
    console.log(data.order)
  } else if (data.remaining) {
    updateRemainingLetters(data.remaining)
  } else if (data.possibleSolutions) {
    id("possible-solutions").innerHTML = formatPossibleSolutions(data.possibleSolutions)
    id("possible-solutions").classList.add("show")
  }
}

function updateRemainingLetters(remaining) {
  remaining.forEach((set, i) => {
    let red = set.size > 13

    let remainingLetters = red
      ? letters.split("").filter(x => !set.has(x))
      : [...set]

    let elem = id(`remaining-${i}`)

    elem.classList.add("show")
    elem.innerText = remainingLetters.join("")
    elem.style.color = red ? "tomato" : (set.size === 1 ? "" : "lime")
  })
}

function hideHints() {
  for (let i = 0; i < LENGTH; i++)
    id(`remaining-${i}`).classList.remove("show")

  id("suggestions").classList.remove("show")
  id("possible-solutions").classList.remove("show")
}
