id("start-game").onclick = startGame

const slots = classAll("letter-box")

function startGame() {
  $("main").id = "game"
  showGamePanel()

  var slotsFilled = Array(slots.length).fill(false)

  classAll("letter").drag().forEach(letter => {
    letter.onmouseup = event => {
      var {pageX : x, pageY : y} = event
  
      for (let index in slots) {
        var i = slots[index]
        
        if (i.children.length || i.dataset.letter !== letter.dataset.letter) continue
        
        var {top : slotTop, left : slotLeft} = i.pagePos(),
            slotBottom = slotTop + i.offsetHeight,
            slotRight = slotLeft + i.offsetWidth
  
        if (x >= slotLeft && x <= slotRight &&
          y >= slotTop && y <= slotBottom) {
  
          var replacement = elem("span.replacement").html("’")
          replacement.dataset.letter = letter.dataset.letter
          
          id("message").insertBefore(replacement, letter)
          
          i.appendChild(letter)
          letter.drag(false)

          slotsFilled[index] = true

          if (slotsFilled.every(x => x)) endGame(true)
        }
      }
    }

    letter.onmousedown = () => { letter.hasBeenDragged = true }
  })

  updateTimer(Date.now())
}

function updateTimer(startTime) {
  var time = Date.now(),
      timeElapsed = time - startTime,
      timeDisplay = 60 - Math.round(timeElapsed / 1000)

  if (timeDisplay < 0) {
    endGame()

    return
  }

  id("time").html(timeDisplay)

  setTimeout(() => { updateTimer(startTime) }, 1000 - timeElapsed % 1000)
}

function endGame(win = false) {
  $("main").id = ""

  if (win) {
    classAll("letter-box").css({
      borderColor : "transparent",
      fontWeight : "bold",
      textShadow : "0 1px 5px var(--blue)"
    })
    id("letter-boxes").style.gap = "0"

    setTimeout(hideGamePanel, 1000)
    setTimeout(() => { location = "../manatee/" }, 1200)
  } else
    hideGamePanel()
}

function resetLetters() {
  classAll("letter").forEach(x => {
    if (x.hasBeenDragged) x.remove()

    delete x.hasBeenDragged
  })

  classAll("replacement")
    .addClass("letter")
    .removeClass("replacement")
    .forEach(x => { x.html(x.dataset.letter) })
}

function showGamePanel() {
  id("bogpad").removeClass("panel-active")
  id("display").addClass("panel-active")
}

function hideGamePanel() {
  id("bogpad").addClass("panel-active")
  id("display").removeClass("panel-active")

  resetLetters()
}

onload = () => {
  classAll("panel").css({transition : "transform 1s ease"})
  classFirst("important").css({transition : "color 1s ease-out"})
  classAll("letter").css({transition : "outline-color 1s ease-out"})
}
