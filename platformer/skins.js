const skins = {
  default : {
    name : "Default",
    color : [255, 255, 255]
  },
  black : {
    name : "Black",
    color : [15, 15, 21]
  },
  green : {
    name : "Green",
    color : [52, 227, 102]
  },
  blue : {
    name : "Blue",
    color : [50, 128, 230]
  },
  purple : {
    name : "Purple",
    color: [131, 78, 217]
  },
  pink : {
    name : "Pink",
    color: [237, 166, 177]
  },
  red : {
    name : "Red",
    color: [240, 53, 53]
  },
  orange : {
    name : "Orange",
    color: [242, 127, 51]
  },
  yellow : {
    name : "Yellow",
    color: [250, 196, 60]
  },
  rainbow : {
    name : "Rainbow",
    image : "rainbow"
  },
  fire : {
    name : "Fire",
    image : "fire",
    idleAnim : true,
    yOffset : -7
  },
  earth : {
    name : "Earth",
    image : "earth"
  },
  steve : {
    name : "Steve",
    image : "steve"
  },
  pusheen : {
    name : "Pusheen",
    image : "pusheen",
    yOffset : 1
  },
  pusheenbox : {
    name : "Holy Pusheen",
    image : "pusheenbox",
    yOffset : 1,
    dev : true
  },
  jacobscat : {
    name : "Jacob's Cat",
    image : "jacobscat",
    height : 20,
    horizontalOutset : 4
  }
}

let unlockedSkins = (localStorage.getItem("platformer2SkinsUnlocked") || "default,black").split(","),
    currentSkin = localStorage.getItem("platformer2SelectedSkin")

if (!(unlockedSkins.includes(currentSkin))) currentSkin = "default"

function selectSkin(skin) {
  query(".skin.selected")?.classList.remove("selected")
  
  skins[skin].elem.classList.add("selected")

  currentSkin = skin
  localStorage.setItem("platformer2SelectedSkin", skin)
}

function unlockSkin(skin) {
  if (unlockedSkins.includes(skin)) return
  
  skins[skin].elem.classList.remove("locked")

  unlockedSkins.push(skin)

  localStorage.setItem("platformer2SkinsUnlocked", unlockedSkins.join(","))
}

function revokeSkin(skin) {
  if (!unlockedSkins.includes(skin)) return
  
  skins[skin].elem.classList.add("locked")

  unlockedSkins.splice(unlockedSkins.indexOf(skin), 1)

  localStorage.setItem("platformer2SkinsUnlocked", unlockedSkins.join(","))
}

function generatePlayerPreview(skin) {
  if (skins[skin].image)
    return `<img class = "skin-preview-inner" src = "./assets/images/player-${skins[skin].image}.png" draggable = "false">`
  else {
    let maskImage = "mask-image: url('assets/images/skin-preview.png');"
    
    return `<div class = "skin-preview-inner" style = "background: rgb(${skins[skin].color.join(", ")}); ${maskImage} -webkit-${maskImage}"></div>`
  }
}

for (let i in skins) {
  let skin = createElem("button.skin")
  skins[i].elem = skin

  if (i == currentSkin) skin.classList.add("selected")
  
  let color = skins[i].color ? `rgb(${skins[i].color.join(", ")})` : "rgba(255, 255, 255, 0.7)"

  skin.innerHTML += generatePlayerPreview(i)
  
  skin.innerHTML += `
    <span style = "color: ${color};">${skins[i].name}</span>
    <img class = "lock" src = "assets/images/lock.png" draggable = "false">
  `

  if (!unlockedSkins.includes(i)) {
    skin.classList.add("locked")
    
    if (skins[i].dev) skin.classList.add("dev")
  }
  
  skin.onclick = () => {
    if (unlockedSkins.includes(i)) {
      selectSkin(i)

      return
    }
    
    let shakeSpeed = 60, shakeCounter = 0, shakes = 6, shakeStrength = 7

    let lock = skin.querySelector(".lock")
    
    skin.style.background = "rgba(255, 0, 0, 0.15)"

    function shake() {
      lock.style.transform = `rotate(${(Math.random() / 2 + 0.5) * (1 - shakeCounter / shakes) * shakeStrength * (shakeCounter % 2 ? 1 : -1)}deg)`
      
      if (shakeCounter >= shakes) {
        clearInterval(shakeInterval)
        
        setTimeout(() => {
          lock.style.transform = "rotate(0deg)"
          
          skin.style.background = ""
        }, shakeSpeed)
      }
      
      shakeCounter++
    }
    
    let shakeInterval = setInterval(shake, shakeSpeed)

    shake()
  }

  id("skins").appendChild(skin)
}

////////////////////////////////

const jacobInput = id("jacob-input")

document.addEventListener("keydown", e => {
  if (
    e.code === "KeyJ"
      && e.metaKey && e.shiftKey && e.altKey
      && game && !game.levelFocused
      && !unlockedSkins.includes("jacobsCat")
  ) {
    id("jacob-input-wrapper").classList.remove("hidden")
    
    jacobInput.value = ""
    jacobInput.focus()
  }
})

id("jacob-input").onkeydown = e => {
  if (e.code === "Escape") {
    id("jacob-input-wrapper").classList.add("hidden")
    
    jacobInput.blur()
  }
  
  if (e.code === "Enter") {
    if (jacobInput.value === "Jacob's Cat") {
      id("jacob-input-wrapper").classList.add("hidden")
      
      unlockSkin("jacobscat")
    } else
      id("jacob-input-wrapper").classList.add("red-input")

    jacobInput.blur()
  } else
    id("jacob-input-wrapper").classList.remove("red-input")
}
