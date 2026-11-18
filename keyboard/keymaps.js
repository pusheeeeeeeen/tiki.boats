const keyboardLayout = [
  ["Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7", "Digit8", "Digit9", "Digit0", "Minus", "Equal"],
  ["KeyQ", "KeyW", "KeyE", "KeyR", "KeyT", "KeyY", "KeyU", "KeyI", "KeyO", "KeyP", "BracketLeft", "BracketRight"],
  ["KeyA", "KeyS", "KeyD", "KeyF", "KeyG", "KeyH", "KeyJ", "KeyK", "KeyL", "Semicolon", "Quote"],
  ["KeyZ", "KeyX", "KeyC", "KeyV", "KeyB", "KeyN", "KeyM", "Comma", "Period", "Slash"]
]

const _ = null

/*
,
  name : [
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 0, -, =],
      [q, w, e, r, t, y, u, i, o, p, [, ]],
       [a, s, d, f, g, h, j, k, l, ;, '],
        [z, x, c, v, b, n, m, ,, ., /]
  ]
*/

const keymaps = {
  major : [
    [-1, 1, 3, _, 6, 8, 10, _, 13, 15, _, 18],
      [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19],
       [-1, 1, 3, _, 6, 8, 10, _, 13, 15, 17],
        [0, 2, 4, 5, 7, 9, 11, 12, 14, 16]
  ],
  minor : [
    [-1, 1, _, 4, 6, _, 9, 11, 13, _, 16, 18],
      [0, 2, 3, 5, 7, 8, 10, 12, 14, 15, 17, 19],
       [-1, 1, _, 4, 6, _, 9, 11, 13, _, 16],
        [0, 2, 3, 5, 7, 8, 10, 12, 14, 15]
  ]
}

const specialKeys = {
  Tab() {
    topOffset -= 12
  },
  Backslash() {
    topOffset += 12
  },
  ShiftLeft() {
    bottomOffset -= 12
  },
  ShiftRight() {
    bottomOffset += 12
  }
}

const chordKeys = {
  ControlLeft : [0, 4, 7], // major
  AltLeft : [0, 3, 7], // minor
  AltRight : [0, 3, 6], // diminished
  ArrowLeft : [0, 4, 7, 10] // 7
}

for (let i in chordKeys)
  chordKeys[i] = {
    chord : chordKeys[i],
    down : false,
    active : false,
    used : false
  }
