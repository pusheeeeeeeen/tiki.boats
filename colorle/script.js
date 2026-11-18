(() => {
  const guessColors = {
    gray: "#bbb",
    yellow: "#fe4",
    green: "#5d2"
  }
  
  const input = id("input"),
        guesses = id("guesses")
  
  const VALID_HEX_DIGIT = /[0-9a-f]/i
  
  input.onkeydown = e => {
    if (e.code === "Enter" && attemptGuess(input.value)) {
      input.value = ""
      
      return
    }
  
    let isInvalid = !e.metaKey && !e.ctrlKey && e.key.length === 1 && !VALID_HEX_DIGIT.test(e.key),
        isPaste = e.metaKey && !e.ctrlKey && !e.altKey && e.code === "KeyV"
    
    if (isInvalid || isPaste)
      e.preventDefault()
  }
  
  input.oninput = () => {
    input.value = formatInput(input.value)
  }
  
  function formatInput(value) {
    return value.split("").filter(x => VALID_HEX_DIGIT.test(x)).join("").slice(0, 6).toUpperCase()
  }
  
  let data = JSON.parse(localStorage.getItem("colorle") || "{}"),
      day = new Date().toDateString()
  
  if (data.day !== day)
    data = {
      day,
      guesses : []
    }
  
  let attempts = data.guesses.length, maxAttempts = 8
  
  function attemptGuess(guess, save = true) {
    if (guess.length !== 6 || attempts >= maxAttempts) return false
  
    makeGuess(guess, save)
  
    return true
  }
  
  function makeGuess(guess, save) {
    let result = checkColor(guess)
  
    if (save) {
      attempts++
      data.guesses.push(guess)
      localStorage.setItem("colorle", JSON.stringify(data))
    }
  
    showResult(guess, result)
  
    if (result.every(x => x === "green"))
      win()
  }
  
  function showResult(guess, colors) {
    let wrapper = createElem("div.guess")
  
    wrapper.style.background = `#${guess}`
  
    wrapper.innerHTML = `
      <div class = "guess-inner">
        #<span class = "guess-color">${
          guess.split("").map((letter, i) => `<span style = "color: ${guessColors[colors[i]]}">${letter}</span>`).join("")
        }</span>
      </div>
    `
  
    guesses.append(wrapper)
  }
  
  function win() {
    parent.confetti()
  }
  
  // function bestContrast(r, g, b) {
  //   return luminance(r, g, b) < 0.5 ? "white" : "black"
  // }
  
  // function luminance(r, g, b) {
  //   return Math.sqrt(0.299 * r ** 2 + 0.587 * g ** 2 + 0.114 * b ** 2)
  // }
  
  function rand(a) {
    let func = () => {
      a |= 0
      a = a + 0x9e3779b9 | 0
      let t = a ^ a >>> 16
      t = Math.imul(t, 0x21f0aaad)
      t = t ^ t >>> 15
      t = Math.imul(t, 0x735a2d97)
      return ((t = t ^ t >>> 15) >>> 0) / 4294967296
    }
  
    for (let i = 0; i < 20; i++) func()
  
    return func()
  }
  
  let date = new Date(),
      color = rand(date.getFullYear() * (date.getMonth() + 1) * date.getDate())
  
  color = Math.floor(color * 0x1000000).toString(16).toUpperCase().padStart(6, "0")
  
  window.checkColor = guess => {
    let correct = color.split(""),
        result = Array(6).fill("gray")
  
    guess = guess.split("")
  
    guess.forEach((letter, i) => {
      if (letter === correct[i]) {
        result[i] = "green"
        correct[i] = null
      }
    })
  
    guess.forEach((letter, i) => {
      if (result[i] !== "gray") return
      
      let index = correct.indexOf(letter)
      
      if (index !== -1) {
        result[i] = "yellow"
        correct[index] = null
      }
    })
  
    return result
  }
  
  document.body.style.background = query("main").style.background = `#${color}`
  
  id("logo").innerHTML = "COLORLE".split("").map(letter => {
    let h = Math.random() * 360,
        s = Math.random() * 20 + 45,
        l = Math.random() * 20 + 45
  
    let grad = `linear-gradient(to bottom, hsl(${h}deg, ${s + 10}%, ${l + 10}%), hsl(${h}deg, ${s - 10}%, ${l - 10}%))`
      
    return `<span class = "logo-letter" style = "--grad: ${grad}">${letter}</span>`
  }).join("")
  
  for (let i of data.guesses)
    if (attempts > maxAttempts || !attemptGuess(i, false)) {
      localStorage.removeItem("colorle")
      setTimeout(() => location.reload())
      parent.notification("Invalid save data", "short")
      break
    }
  
  onload = () => {
    input.focus()
  }
})()
