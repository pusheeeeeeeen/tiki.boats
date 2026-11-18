const variants = {}

variants.None = class NoneVariant extends Board {
  constructor(optns) { super(optns, 0) }

  name = "None"

  fillTile() { return null }
}

variants.Default = class DefaultVariant extends Board {
  constructor(optns) { super(optns, 16) }

  name = "Default"
}

variants.Minimal = class MinimalVariant extends Board {
  constructor(optns) { super(optns, 4) }

  name = "Minimal"

  endFn(x, y) {
    if (x === this.size - 1 && y === this.size - 1) return "black"
    else if (!x && !y) return "white"

    return null
  }

  fillTile(x, y, tile) {
    if (x <= 1 && y <= 1) return this.die(tile, "white")
    else if (x >= this.size - 2 && y >= this.size - 2) return this.die(tile, "black")

    return null
  }
}

variants.FourPlayerBase = class FourPlayerBase extends Board {
  constructor(...args) {
    super(...args)

    if (this.constructor === variants.FourPlayerBase)
      throw new TypeError("FourPlayerBase variant must have a subclass")
  }

  name = "FourPlayerBase"

  turnOrder = ["red", "yellow", "green", "blue"]

  endFn(x, y) {
    if (x === 0) {
      if (y === 0) return "red"
      else if (y === this.size - 1) return "blue"
    } else if (x === this.size - 1) {
      if (y === 0) return "yellow"
      else if (y === this.size - 1) return "green"
    }

    return null
  }
}

variants.ClassicFourPlayer = class ClassicFourVariant extends variants.FourPlayerBase {
  constructor(optns) { super(optns, 4) }

  name = "ClassicFourPlayer"
  
  fillTile(x, y, tile) {
    if (x <= 1 && y <= 1) return this.die(tile, "red")
    else if (x >= this.size - 2 && y <= 1) return this.die(tile, "yellow")
    else if (x >= this.size - 2 && y >= this.size - 2) return this.die(tile, "green")
    else if (x <= 1 && y >= this.size - 2) return this.die(tile, "blue")

    return null
  }
}

variants.FourPlayer = class FourVariant extends variants.FourPlayerBase {
  constructor(optns) { super(optns, 12, {size : 10}) }

  name = "FourPlayer"

  cornerWinPositions = [
    [1, 1],
    [1, 0]
  ]

  corner(x, y, posns) {
    var size = this.size - 1, color

    if (x < size * 0.5) {
      if (y < size * 0.5)
        color = "red"
      else {
        y = size - y
        color = "blue"
      }
    } else {
      if (y < size * 0.5) {
        x = size - x
        color = "yellow"
      } else {
        x = size - x
        y = size - y
        color = "green"
      }
    }

    return posns[y] && posns[y][x] ? color : null
  }

  endFn(x, y) {
    return this.corner(x, y, this.cornerWinPositions)
  }
  
  fillTile(x, y, tile) {
    var color = this.corner(x, y, [
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [1, 1, 0, 0],
      [1, 1, 0, 0]
    ])

    if (!color) return null

    return this.die(tile, color)
  }
}

variants.Massive = class MassiveVariant extends Board {
  constructor(optns) { super(optns, 98, {size : 14}) }

  name = "Massive"

  fillTile(x, y, tile) {
    if (y < this.size * 0.5)
      return this.die(tile, "white")
    else
      return this.die(tile, "black")
  }
}

variants.MassiveFourPlayer = class MassiveFourPlayerVariant extends variants.FourPlayerBase {
  constructor(optns) { super(optns, 100, {size : 20}) }

  name = "MassiveFourPlayer"

  fillTile(x, y, tile) {
    if (x < this.size * 0.5) {
      if (y < this.size * 0.5) return this.die(tile, "red")
      return this.die(tile, "blue")
    }
    
    if (y < this.size * 0.5) return this.die(tile, "yellow")
    return this.die(tile, "green")
  }
}
