let loaded = false

const sampler = new Tone.Sampler({
	urls : {
		A0 : "A0v8.mp3",
		A1 : "A1v8.mp3",
		A2 : "A2v8.mp3",
		A3 : "A3v8.mp3",
		A4 : "A4v8.mp3",
		A5 : "A5v8.mp3",
		A6 : "A6v8.mp3",
		A7 : "A7v8.mp3",
	},
	baseUrl : "samples/",
	onload() { loaded = true }
}).toDestination()

let bottomOffset = 4 * 12, topOffset = 5 * 12,
    currentKeymap = "major"

document.body.addEventListener("keydown", e => {
  if (e.repeat || e.metaKey || !loaded) return
  
  let key = e.code

  if (key in specialKeys)
    specialKeys[key]()
  else if (key in chordKeys)
    chordKeys[key].down = chordKeys[key].active = true
  else {
    let row = keyboardLayout.findIndex(x => x.includes(key))
    if (row === -1) return
  
    let col = keyboardLayout[row].indexOf(key)
  
    let offset = row >= 2 ? bottomOffset : topOffset,
        note = keymaps[currentKeymap][row][col]
  
    if (note === null) return

    let activeChords = Object.values(chordKeys).filter(x => x.active),
        chord

    if (row >= 2 && activeChords.length)
      chord = activeChords.flatMap(x => {
        if (!x.down)
          x.active = x.used = false
        else
          x.used = true
        
        return x.chord
      })
    else
      chord = [0]
  
    sampler.triggerAttackRelease(chord.map(x => pitchToString(x + note + offset)))
  }

  e.stopPropagation()
  e.preventDefault()

  return false
})

onkeyup = e => {
  if (!loaded) return

  let key = e.code

  if (key in chordKeys) {
    chordKeys[key].down = false
    
    if (chordKeys[key].used)
      chordKeys[key].active = chordKeys[key].used = false
  }
}

const notes = "C C# D D# E F F# G G# A A# B".split(" ")

function pitchToString(pitch) {
  let octave = Math.floor(pitch / 12)

  pitch %= 12
  if (pitch < 0) pitch += 12

  return notes[pitch] + octave
}
