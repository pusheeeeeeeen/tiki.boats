if (localStorage.getItem("dev") != "true")
  id("open-contraption").classList.add("hidden")

const cw = id("contraption-wrapper")

let gearSwoosh = new Howl({
  src : ["./assets/audio/gear-swoosh.wav"],
  volume : soundVolume
})

let contraptionStart = new Howl({
  src : ["./assets/audio/gear.wav"],
  volume : soundVolume
})

id("open-contraption").onclick = () => {
  console.log("open-contraption")
  id("contraption-wrapper").classList.remove("hidden")
  
  dropGear(0)
  dropGear(1)
}

function startRotation() {
  for (let i of document.querySelectorAll(".gear"))
    i.style.animation = "spin 1s linear infinite"
  
  let beltImg = 1
  setInterval(() => {
    beltImg = (beltImg + 1) % 3
    id("belt").src = "./assets/images/belt" + (beltImg + 1) + ".png"
  }, 100)
}

let gearSlotID = 0
function gearSlot(x, y) {
  cw.innerHTML += `<img src = "./assets/images/gear-slot.png" id = "gear-slot-${gearSlotID}" class = "gear-slot" draggable = "false" style = "left: ${x}px; top: ${y}px;" data-x = "${x}" data-y = "${y}">`
  gearSlotID++
}

gearSlot(427, 474)
gearSlot(567, 328)

function dropGear(slot) {
  let x = id("gear-slot-" + slot).dataset.x
  let y = id("gear-slot-" + slot).dataset.y
  
  let gear = document.createElement("img")
  
  gear.src = "./assets/images/single-gear.png"
  gear.classList.add("gear")
  gear.draggable = false
  
  // gear.style.transform = `translateY(${-100 / 36 * 2}px)`
  gear.style.left = innerWidth / 2 - 50 + "px"
  gear.style.top = innerHeight / 2 - 50 + "px"
  
  cw.appendChild(gear)
  
  setTimeout(() => {
    gear.style.left = x + "px"
    gear.style.top = y - 100 / 36 * 2 + "px"
    
    setTimeout(() => {
      gearSwoosh.play()
      // gear.style.transform = "translateY(0)"
      gear.style.top = y + "px"
      
      setTimeout(() => {
        gear.classList.add("contraption-piece")
        id("gear-slot-" + slot).style.opacity = 0

        if (document.querySelectorAll(".gear").length == gearSlotID) {
          startRotation()
          contraptionStart.play()
        }
      }, 600)
    }, 700)
  }, 200)
}
