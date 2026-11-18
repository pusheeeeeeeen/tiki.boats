(() => {
  var clicks = parseInt(getData("clicks") || "0")
  
  $("main").onclick = () => {
    clicks++
  
    saveData("clicks", clicks)
    
    updateNumber()
  }
  
  var linkShown = false
  function updateNumber() {
    id("number").html(clicks)
  
    if (clicks >= 500) unlockSecret("Clicks")
  
    if (linkShown && clicks % 10 === 0) {
      id("link").style.animationName = "none"
  
      void id("link").offsetWidth
  
      id("link").style.animationName = "flash"
    }
  
    if (clicks >= 800) {
      linkShown = true
      
      id("link").style.bottom = "20px"
    }
  }
  
  updateNumber()
})()
