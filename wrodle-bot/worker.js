importScripts("words/guesses-modified.js", "words/solutions.js", "shared.js")

const letters = new Set("abcdefghijklmnopqrstuvwxyz")

// TODO remove words with same letters from guess list?

let possibleLetters

function reset() {
  possibleLetters = Array(LENGTH).fill().map(() => new Set(letters))

  postMessage({possibleSolutions : solutions})
  postMessage({order : solutions})

  // console.time("CALC")
  // updateRanking()
  // console.timeEnd("CALC")
}

function guess(word, colors, letters = possibleLetters) {
  let guessLetters = [...word].filter(letter => word.replaceAll(letter, "").length === 4)

  let green = false

  letters.forEach((set, i) => {
    if (colors[i] === "green") {
      deleteNotInArr(set, guessLetters)
      green = true
    } else if (!green) {
      for (let letter of guessLetters)
        set.delete(letter)
    }
  })
}

function tempGuess(word, colors) {
  let copy = possibleLetters.map(x => new Set(x))

  guess(word, colors, copy)

  return copy
}

function deleteNotInArr(set, arr) {
  for (let i of set)
    if (!arr.includes(i))
      set.delete(i)
}

function updateRanking() {
  let scores = rankWords()

  let order = Object.entries(scores).sort((a, b) => a[1] - b[1]).map(x => x[0])

  postMessage({scores, order})
}

function rankWords() {
  let possibleSolutions = getPossibleSolutions(possibleLetters),
      solutionSet = new Set(possibleSolutions)

  postMessage({possibleSolutions})

  if (possibleSolutions.length === 1)
    return {[possibleSolutions[0]] : 0}
  else if (possibleSolutions.length === 2)
    return {
      [possibleSolutions[0]] : 0.5,
      [possibleSolutions[1]] : 0.5
    }

  let scores = {}, best = Infinity

  let guessesToTry = possibleSolutions.length <= 20
    ? possibleSolutions.concat(guesses.filter(x => !possibleSolutions.includes(x)))
    : possibleSolutions

  guessesToTry = guessesToTry.slice(0, 2000)

  let multiplier = 1 / possibleSolutions.length

  for (let guess of guessesToTry) {
    console.log(`/ ${guessesToTry.length}`)

    let score = 0

    for (let i = possibleSolutions.length - 1; i >= 0; i--) {
      let solution = possibleSolutions[i]

      if (solution === guess)
        continue
      // else if (score >= best + 10)
      //   continue outer

      let remainingLetters = tempGuess(guess, getColors(guess, solution))

      score += countPossibleSolutions(remainingLetters) * multiplier
    }

    scores[guess] = score

    if (score < best) best = score

    if (best < 1 || (!solutionSet.has(guess) && best === 1))
      break
  }

  return scores
}

function getPossibleSolutions(letters, possibleSolutions = solutions) {
  let regex = solutionRegex(letters)

  return possibleSolutions.filter(x => regex.test(x))
}

const solutionCountCache = {}

function solutionCountHashKey(letters) {
  return letters.map(x => [...x].join("")).join()
}

function countPossibleSolutions(letters) {
  let key = solutionCountHashKey(letters)

  if (key in solutionCountCache)
    return solutionCountCache[key]

  let regex = solutionRegex(letters)

  return solutionCountCache[key] = solutions.reduce((acc, x) => acc + regex.test(x), 0)
}

function solutionRegex(letters) {
  return new RegExp(
    "^" +
    letters.map(
      x => `[${[...x].join("")}]`
    ).join("")
    + "$"
  )
}

onmessage = e => {
  switch (e.data.type) {
  case "reset":
    reset()
    break
  case "guess":
    guess(e.data.word, e.data.colors)
    postMessage({remaining : possibleLetters})
    updateRanking()
    break
  default:
    throw new Error(`Unknown worker message type '${e.data.type}'`)
  }
}

postMessage({READY : true})
