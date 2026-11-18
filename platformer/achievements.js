let restartMainMusic = false

id("achievements-button").onclick = () => {
  achievementSong.volume(musicVolume)
  restartMainMusic = game.topUI.type === "pause" || game.topUI.type === "death"

  game.showUI("achievements")
  
  playSong(achievementSong)
  pauseSong(song)
  pauseSong(intro)
}

id("leave-achievements").onclick = () => {
  game.hideUI("achievements")
  
  achievementSong.fade(achievementSong.volume(), 0, fadeTime)
  setTimeout(() => stopSong(achievementSong), fadeTime)

  if (restartMainMusic) {
    setTimeout(() => { 
      playSong(song)
      song.fade(0, musicVolume, fadeTime)
    }, fadeTime / 2)
  }
}

id("clear-achievements").onclick = () => {
  if (confirm("Are you sure you want to clear all achievements, skins, and stats?\nThis cannot be undone.\n\n(This will also reload the page.)")) {
    localStorage.removeItem("platformer2SkinsUnlocked")
    localStorage.removeItem("platformer2Achievements")
    localStorage.removeItem("platformer2RevealedAchievements")
    localStorage.removeItem("platformer2Stats")

    // no longer used but clear in case it still exists
    localStorage.removeItem("platformer2Highscore")

    location.reload()
  }
}

let achieveSound = new Howl({
  src : ["./assets/audio/sparkles.wav"],
  volume : soundVolume * 2
})

const achievementNames = Object.keys(achievements)

let achievementsUnlocked = (localStorage.getItem("platformer2Achievements") || "== placeholder :D ==")
                             .split(",")
                             .filter(x => achievementNames.includes(x))

let achievementElems = []

function checkAchievementGroup(group) {
  Object.entries(achievements).forEach(([name, data]) => {
    if (data.group === group && data.condition())
      achieve(name)
  })
}

function achieve(name) {
  if (achievementsUnlocked.includes(name)) return
  
  if (sfx) achieveSound.play()

  achievementsUnlocked.push(name)
  localStorage.setItem("platformer2Achievements", achievementsUnlocked.join(","))
  
  let ach = achievements[name]

  ach.elem.classList.remove("incomplete")
  if (ach.skin)
    unlockSkin(ach.skin)

  const offset = 24
  
  let div = createElem("div.achievement")
  
  div.innerHTML = `
    <img src = "assets/images/achievement-chains.png" class = "achievement-chains">
    <div class = "achievement-inner">
      <div class = "achievement-title">${ach.title}</div>
      <div class = "achievement-desc">${ach.desc}</div>
    </div>
  `

  setTimeout(() => {
    achievementElems.splice(achievementElems.indexOf(obj), 1)
    
    div.style.opacity = "0"
    
    setTimeout(() => { div.remove() }, 500)
  }, 7000)

  let obj = {
    offset : 0,
    elem : div
  }
  
  document.body.appendChild(div)

  let height = div.offsetHeight

  for (let i of achievementElems) {
    i.offset += height + offset

    i.elem.style.transform = `translate(-50%, ${i.offset}px)`
  }

  achievementElems.push(obj)
}

function revoke(name) {
  if (!achievementsUnlocked.includes(name)) return

  achievementsUnlocked.splice(achievementsUnlocked.indexOf(name), 1)
  localStorage.setItem("platformer2Achievements", achievementsUnlocked.join(","))

  let ach = achievements[name]

  ach.elem.classList.add("incomplete")
  if (ach.skin)
    revokeSkin(ach.skin)
}

let unlockedAchievements = localStorage.getItem("platformer2Achievements")

if (unlockedAchievements)
  unlockedAchievements = unlockedAchievements.split(",")
else
  unlockedAchievements = []

let revealedAchievements = localStorage.getItem("platformer2RevealedAchievements")

if (revealedAchievements)
  revealedAchievements = revealedAchievements.split(",")
else
  revealedAchievements = []

for (let i in achievements) {
  let achievement = achievements[i]
  
  let div = createElem("div.menu-achievement")

  div.innerHTML = `
    <div class = "menu-achievement-text">
      <div class = "menu-achievement-title">${achievement.title}</div>
      <div class = "achievement-desc">${achievement.desc}</div>
      <button class = "achievement-reveal">
        ${costHTML(10)} to reveal requirement
      </button>
    </div>
  `

  if (revealedAchievements.includes(i))
    div.classList.add("reveal")
  else if (!unlockedAchievements.includes(i))
    div.querySelector(".achievement-reveal").onclick = () => {
      if (attemptPurchase(10)) {
        div.classList.add("reveal")
  
        revealedAchievements.push(i)
        localStorage.setItem("platformer2RevealedAchievements", revealedAchievements.join(","))
      }
    }

  achievement.elem = div

  if (achievement.skin) {
    let skinData = skins[achievement.skin]

    let skinWrapper = createElem("div")
    
    skinWrapper.innerHTML += generatePlayerPreview(achievement.skin)
    div.append(skinWrapper)
  }

  if (!unlockedAchievements.includes(i))
    div.classList.add("incomplete")
  
  id("achievements-inner").append(div)
}


// id("achievement-popup").onclick = () => {
//   const windowFeatures = "left=100,top=100,width=320,height=320"
//   const handle = window.open(
//     "https://tiki.boats/platformer/achievements.html",
//     "Platformer Achievements",
//     windowFeatures
//   )
// }