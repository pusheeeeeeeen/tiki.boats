const GUESSES = 6

const LENGTH = 5

const guessSet = new Set(guesses)

function getColors(guess, answer) {
  let letters = new Set(guess)

  return [...answer].map(letter => {
    let green = letters.has(letter) && guess.replaceAll(letter, "").length === 4

    letters.delete(letter)

    return green ? "green" : "gray"
  })
}
