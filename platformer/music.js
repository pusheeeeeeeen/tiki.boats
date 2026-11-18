let musicVolume = 0.7,
    ambienceVolume = 0.02,
    soundVolume = 0.3,
    fadeTime = 500

let ambience = new Howl({
  src : ["./assets/audio/factory-ambience.mp4"],
  volume : ambienceVolume,
  loop : true
})
let intro = new Howl({
  src : ["./assets/audio/intro.wav"],
  volume : musicVolume
})
let song = new Howl({
  src : ["./assets/audio/ideas.wav"],
  volume : musicVolume,
  loop : true
})
let achievementSong = new Howl({
  src : ["./assets/audio/what-have-you-achieved.wav"],
  volume : musicVolume,
  loop : true
})
let contraptionSong = new Howl({
  src : ["./assets/audio/trap-your-contemplation-intro.wav"],
  volume : musicVolume
})
contraptionSong.on("end", () => {
  contraptionSongMain.play()
})

let contraptionSongMain = new Howl({
  src : ["./assets/audio/trap-your-contemplation.wav"],
  volume : musicVolume,
  loop : true
})

intro.on("end", () => {
  song.play()
})

let songStarted = false

let sfx = localStorage.getItem("platformer2Sfx") !== "false",
    music = localStorage.getItem("platformer2Music") !== "false"

function playSong(song) {
  if (music) song.play()
}
function pauseSong(song) {
  song.pause()
}
function stopSong(song) {
  song.stop()
}

function toggleSfx() {
  sfx = !sfx
  localStorage.setItem("platformer2Sfx", sfx)
}
function toggleMusic() {
  music = !music
  localStorage.setItem("platformer2Music", music)
}
