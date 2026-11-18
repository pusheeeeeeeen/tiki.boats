onload = () => {
  setTimeout(() => {
    classAll("part").forEach(x => {
      x.style.width = x.children[0].offsetWidth + "px"

      void x.offsetWidth
  
      x.style.transition = "width 1.5s, transform 1.5s, opacity 1s"
      x.style.width = x.children[1].offsetWidth + "px"
    })
    
    $(".start").css({
      transition : "opacity 1.5s ease-in",
      opacity : "0"
    })
    $(".end").css({
      transition : "opacity 2s ease-out",
      opacity : "1"
    })

    setTimeout(() => {
      var bin = id("bin"), cara = id("cara"), er = id("er")
      
      bin.style.transform = `translateX(-${cara.offsetWidth}px)`
      cara.style.transform = `translateX(${cara.offsetWidth + 10}px)`

      cara.style.opacity = "0.6"
      er.style.opacity = "0.6"

      setTimeout(() => {
        id("beans").style.transform = "none"
        
        $(".mini-bean").css({
          transition : "opacity 0.8s",
          opacity : "1"
        })
      }, 1000)
    }, 2000)
  }, 500)
}
