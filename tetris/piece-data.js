const pieces = {
  // NORMAL PIECES
  i : {
    layout : [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    color : [100, 220, 230],
    spritesheetPos : [0, 0]
  },
  o : {
    layout : [
      [1, 1],
      [1, 1]
    ],
    xOffset : 1,
    color : [240, 220, 40],
    spritesheetPos : [1, 0]
  },
  l : {
    layout : [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color : [240, 160, 40],
    spritesheetPos : [2, 0]
  },
  j : {
    layout : [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color : [80, 90, 230],
    spritesheetPos : [3, 0]
  },
  t : {
    layout : [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color : [220, 90, 210],
    spritesheetPos : [4, 0]
  },
  s : {
    layout : [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ],
    color : [60, 200, 90],
    spritesheetPos : [0, 1]
  },
  z : {
    layout : [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ],
    color : [220, 70, 60],
    spritesheetPos : [1, 1]
  },
  /*
  hold : {
    color : [150, 160, 170],
    spritesheetPos : [3, 1]
  },
  garbage : {
    color : [120, 130, 140],
    spritesheetPos : [2, 1]
  },
  */
  // PENTRIS PIECES
  F : {
    layout : [
      [0, 1, 1],
      [1, 1, 0],
      [0, 1, 0]
    ],
    color : [240, 220, 40],
    spritesheetPos : [1, 0]
  },
  I : {
    layout : [
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ],
    xOffset : -1,
    color : [100, 220, 230],
    spritesheetPos : [0, 0]
  },
  L : {
    layout : [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 1, 0]
    ],
    color : [240, 160, 40],
    spritesheetPos : [2, 0]
  },
  N : {
    layout : [
      [0, 0, 0, 0],
      [1, 1, 0, 0],
      [0, 1, 1, 1],
      [0, 0, 0, 0]
    ],
    color : [80, 90, 230],
    spritesheetPos : [3, 0]
  },
  P : {
    layout : [
      [1, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color : [100, 220, 230],
    spritesheetPos : [0, 0]
  },
  T : {
    layout : [
      [0, 1, 0],
      [0, 1, 0],
      [1, 1, 1]
    ],
    color : [220, 90, 210],
    spritesheetPos : [4, 0]
  },
  U : {
    layout : [
      [1, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color : [240, 160, 40],
    spritesheetPos : [2, 0]
  },
  V : {
    layout : [
      [1, 0, 0],
      [1, 0, 0],
      [1, 1, 1]
    ],
    color : [220, 90, 210],
    spritesheetPos : [4, 0]
  },
  W : {
    layout : [
      [1, 0, 0],
      [1, 1, 0],
      [0, 1, 1]
    ],
    color : [60, 200, 90],
    spritesheetPos : [0, 1]
  },
  X : {
    layout : [
      [0, 1, 0],
      [1, 1, 1],
      [0, 1, 0]
    ],
    color : [240, 220, 40],
    spritesheetPos : [1, 0]
  },
  Y : {
    layout : [
      [0, 0, 0, 0],
      [0, 0, 1, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0]
    ],
    color : [80, 90, 230],
    spritesheetPos : [3, 0]
  },
  Z : {
    layout : [
      [0, 0, 1],
      [1, 1, 1],
      [1, 0, 0]
    ],
    color : [220, 70, 60],
    spritesheetPos : [1, 1]
  },

  // 3 SQUARES

  a : {
    layout : [
      [0, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color : [220, 70, 60],
    spritesheetPos : [1, 1]
  },
  b : {
    layout : [
      [1, 0],
      [1, 1]
    ],
    color : [220, 70, 60],
    spritesheetPos : [1, 1]
  }
}

for (let i of Object.values(pieces)) {
  let table = i.kickTable ||= {}

  if (!("cw" in table))
    table.cw = "default"
  if (!("ccw" in table))
    table.ccw = "default"
  if (!("oneEighty" in table))
    table.oneEighty = "default"
}
