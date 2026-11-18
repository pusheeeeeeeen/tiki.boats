class Block {
  constructor(chunk, x, y, z, data) {
    this.chunk = chunk
    this.level = chunk.level

    this.x = x
    this.y = y
    this.z = z

    this.type = data.block

    this.shownFaces = data.shownFaces
    this.scheduleFaceUpdate()
  }

  // PROPERTIES

  isInvisible()  {
    return blockData[this.type].invisible
  }

  isFullBlock() {
    return !blockData[this.type].transparent
  }

  hideFaces() {
    return !blockData[this.type].showFaces
  }

  drawAsTransparent() {
    return blockData[this.type].partialTransparent
  }

  // TICKING

  scheduleFaceUpdate() {
    if (!this.isInvisible())
      this.chunk.scheduleFaceUpdate(this)
  }

  static modelSides = [
    "-y", "+y",
    "-x", "+x",
    "-z", "+z"
  ]

  getShownFaces(model, hideFaces = true) {
    return hideFaces
      ? this.shownFaces.map((x, i) => x && model[Block.modelSides[i]])
      : Block.modelSides.map(x => model[x])
  }

  updateFaceData() {
    let {x, y, z} = this

    let modelElements = blockData[this.type].model,
        hideFaces = this.hideFaces()

    this.texPosVertices = []
    this.posVertices = []

    for (let model of modelElements) {
      let [negY, posY, negX, posX, negZ, posZ] = this.getShownFaces(model, hideFaces)

      if (!(negY || posY || negX || posX || negZ || posZ))
        continue

      Array.prototype.push.apply(
        this.posVertices,
        cube(
          negY, posY,
          negX, posX,
          negZ, posZ,
          x + model.x1,
          y + model.y1,
          z + model.z1,
          x + model.x2,
          y + model.y2,
          z + model.z2
        )
      )

      if (negY) this.texPosSide(model["-y"])
      if (posY) this.texPosSide(model["+y"])
      if (negX) this.texPosSide(model["-x"])
      if (posX) this.texPosSide(model["+x"])
      if (negZ) this.texPosSide(model["-z"])
      if (posZ) this.texPosSide(model["+z"])
    }
  }

  texPosSide(img) {
    let texPos = spritesheetPosns[img]

    this.texPosVertices.push(
      texPos,                      1,
      texPos + BLOCK_TEXTURE_SIZE, 1,
      texPos,                      0,
      texPos + BLOCK_TEXTURE_SIZE, 0
    )
  }
}
