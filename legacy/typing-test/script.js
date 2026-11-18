var highscore = getData("typingBest")
if (highscore === null || highscore === "null") saveData("typingBest", highscore = null)
else highscore = parseInt(highscore)

id("time-best").text(
  highscore === null
    ? "none"
    : Math.trunc(highscore / 1000) + "." + (highscore % 1000).toString().padStart(3, "0"))

var text = "abcdefghijklmnopqrstuvwxyz", progress = "", timeStart = null, timeEnd = null

id("input").onkeydown = event => {
  if (event.key === "Backspace") {
    if (event.metaKey || progress.length <= 1) {
      progress = ""

      timeStart = null
    } else progress = progress.slice(0, -1)
    
    updateVisual()
  } else if (event.key === "Escape" || event.key === "Tab") {
    progress = ""

    timeStart = null

    updateVisual()
  } else if (event.key === "Enter") {
    if (progress === text) {
      progress = ""

      timeEnd = Date.now()

      if (highscore === null || timeEnd - timeStart < highscore) {
        saveData("typingBest", highscore = timeEnd - timeStart)

        id("time-best").text(Math.trunc(highscore / 1000) + "." + (highscore % 1000).toString().padStart(3, "0"))
      }

      updateVisual()
      updateTime()
    }
  } else if (event.key.length === 1 && !event.metaKey) {
    timeEnd = null
    
    if (progress === "") timeStart = Date.now()
    
    progress += event.key

    updateVisual()
  }

  event.preventDefault()
}

function updateVisual() {
  id("typed").text(progress)
  id("input").value = progress
  id("remaining").text(text.slice(progress.length))
}

function updateTime() {
  var time
  if (timeStart) time = (timeEnd || Date.now()) - timeStart
  else time = 0

  id("time-sec").text(Math.trunc(time / 1000))
  id("time-ms").text("." + (time % 1000).toString().padStart(3, "0"))
}

updateVisual()
updateTime()
setInterval(updateTime, 50)
