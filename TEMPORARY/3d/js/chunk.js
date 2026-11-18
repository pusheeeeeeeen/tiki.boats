class Chunk {
  constructor(level, x, z) {
    this.level = level

    this.x = x
    this.z = z

    this.size = this.level.chunkSize
    this.height = this.level.height

    this.blocks = Array(height)

    this.blockX = x * this.size
    this.blockZ = z * this.size

    level.scheduleChunkGeneration(x, z)
  }

  // GENERATION

  loaded = false
  topLayerGenerated = -1

  hasLayer(y) {
    return y <= this.topLayerGenerated
  }

  layoutLoaded(layout) {
    this.layout = layout

    for (let i = 0; i < this.level.verticalSubchunks; i++)
      this.level.scheduleSubchunkCreation(this.x, this.z, i)
  }

  generateSubchunk(subchunk) {
    let {size} = this

    let low = subchunk * this.level.subchunkSize,
        high = (subchunk + 1) * this.level.subchunkSize

    let chunkPosX = this.level.getChunk(this.x + 1, this.z),
        chunkNegX = this.level.getChunk(this.x - 1, this.z),
        chunkPosZ = this.level.getChunk(this.x, this.z + 1),
        chunkNegZ = this.level.getChunk(this.x, this.z - 1)

    if (!chunkPosX?.hasLayer(low)) chunkPosX = null
    if (!chunkNegX?.hasLayer(low)) chunkNegX = null
    if (!chunkPosZ?.hasLayer(low)) chunkPosZ = null
    if (!chunkNegZ?.hasLayer(low)) chunkNegZ = null

    for (let y = low; y < high; y++) {
      let layer = this.blocks[y] = Array(size),
          layoutLayer = this.layout[y]

      for (let x = 0; x < size; x++) {
        let row = layer[x] = Array(size),
            layoutRow = layoutLayer[x]

        for (let z = 0; z < size; z++) {
          let parts = layoutRow[z].split(";")

          row[z] = new Block(this, x + this.blockX, y, z + this.blockZ, {
            block : parts[0],
            shownFaces : parts[1].split("").map(x => x === "1")
          })
        }

        if (chunkPosZ) {
          let block = chunkPosZ.getRelativeBlockNoCheck(x, y, 0),
              ownBlock = this.getRelativeBlockNoCheck(x, y, size - 1)

          if (!ownBlock.isFullBlock()) {
            block.shownFaces[4] = true
            block.scheduleFaceUpdate()
          }
          if (!block.isFullBlock())
            ownBlock.shownFaces[5] = true
        }

        if (chunkNegZ) {
          let block = chunkNegZ.getRelativeBlockNoCheck(x, y, size - 1),
              ownBlock = this.getRelativeBlockNoCheck(x, y, 0)

          if (!ownBlock.isFullBlock()) {
            block.shownFaces[5] = true
            block.scheduleFaceUpdate()
          }
          if (!block.isFullBlock())
            ownBlock.shownFaces[4] = true
        }
      }

      if (chunkPosX || chunkNegX)
        for (let z = 0; z < size; z++) {
          if (chunkPosX) {
            let block = chunkPosX.getRelativeBlockNoCheck(0, y, z),
                ownBlock = this.getRelativeBlockNoCheck(size - 1, y, z)

            if (!ownBlock.isFullBlock()) {
              block.shownFaces[2] = true
              block.scheduleFaceUpdate()
            }
            if (!block.isFullBlock())
              ownBlock.shownFaces[3] = true
          }

          if (chunkNegX) {
            let block = chunkNegX.getRelativeBlockNoCheck(size - 1, y, z),
                ownBlock = this.getRelativeBlockNoCheck(0, y, z)

            if (!ownBlock.isFullBlock()) {
              block.shownFaces[3] = true
              block.scheduleFaceUpdate()
            }
            if (!block.isFullBlock())
              ownBlock.shownFaces[2] = true
          }
        }
    }

    this.topLayerGenerated = high - 1

    if (subchunk === this.level.verticalSubchunks - 1) {
      this.loaded = true
      this.redoVertices = true
    }
  }

  // BLOCKS

  getBlock(x, y, z) {
    return this.getRelativeBlock(x - this.blockX, y, z - this.blockZ)
  }

  getRelativeBlock(x, y, z) {
    if (x < 0 || x >= this.size || z < 0 || z >= this.size || y < 0 || y >= this.height)
      return null

    return this.getRelativeBlockNoCheck(x, y, z)
  }

  getRelativeBlockNoCheck(x, y, z) {
    return this.blocks[y][x][z]
  }

  // TICKING

  faceUpdatesNextTick = new Set()
  redoVertices = false

  scheduleFaceUpdate(block) {
    this.faceUpdatesNextTick.add(block)
    this.redoVertices = true
  }

  tick() {
    if (!this.loaded) return

    if (this.redoVertices) {
      for (let i of this.faceUpdatesNextTick)
        i.updateFaceData()

      // TODO debug timer
      let start = performance.now()

      this.setupVertices()

      chunkGenTimes.push(performance.now() - start)
      this.level.totalVertexRecalcs++

      this.faceUpdatesNextTick.clear()
      this.redoVertices = false
    }
  }

  // PRE-RENDERING

  setupVertices() {
    let blocks = this.blocks.flat(2).filter(x => !x.isInvisible());

    [
      this.blockDrawPoints,
      this.blockDrawTexPosns,
      this.blockDrawIndices,
      this.indexBufferLength
    ] = this.createBufferValues(blocks.filter(x => !x.drawAsTransparent()));

    [
      this.blockDrawTransparentPoints,
      this.blockDrawTransparentTexPosns,
      this.blockDrawTransparentIndices,
      this.transparentIndexBufferLength
    ] = this.createBufferValues(blocks.filter(x => x.drawAsTransparent()))
  }

  createBufferValues(blocks) {
    let blockDrawPoints = blocks.flatMap(block => block.posVertices),
        blockDrawTexPosns = blocks.flatMap(block => block.texPosVertices)

    let length = blockDrawPoints.length / 2,
        indices = new Uint16Array(length)

    for (let i = 0, vertexPos = 0; i < length; i += 6, vertexPos += 4) {
      indices[i    ] = vertexPos
      indices[i + 1] = vertexPos + 1
      indices[i + 2] = vertexPos + 2
      indices[i + 3] = vertexPos + 3
      indices[i + 4] = vertexPos + 1
      indices[i + 5] = vertexPos + 2
    }

    return [
      new Float32Array(blockDrawPoints),
      new Uint16Array(blockDrawTexPosns),
      indices,
      length
    ]
  }

  // RENDERING

  drawSolid() {
    if (!this.loaded) return

    gl.bindBuffer(gl.ARRAY_BUFFER, shaders.block.buffer.a_pos)
    gl.bufferData(gl.ARRAY_BUFFER, this.blockDrawPoints, gl.DYNAMIC_DRAW)

    gl.bindBuffer(gl.ARRAY_BUFFER, shaders.block.buffer.a_texPos)
    gl.bufferData(gl.ARRAY_BUFFER, this.blockDrawTexPosns, gl.DYNAMIC_DRAW)

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shaders.block.indexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.blockDrawIndices, gl.DYNAMIC_DRAW)

    gl.drawElements(gl.TRIANGLES, this.indexBufferLength, gl.UNSIGNED_SHORT, 0)
  }

  drawTransparent() {
    if (!this.loaded) return

    gl.bindBuffer(gl.ARRAY_BUFFER, shaders.block.buffer.a_pos)
    gl.bufferData(gl.ARRAY_BUFFER, this.blockDrawTransparentPoints, gl.DYNAMIC_DRAW)

    gl.bindBuffer(gl.ARRAY_BUFFER, shaders.block.buffer.a_texPos)
    gl.bufferData(gl.ARRAY_BUFFER, this.blockDrawTransparentTexPosns, gl.DYNAMIC_DRAW)

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shaders.block.indexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.blockDrawTransparentIndices, gl.DYNAMIC_DRAW)

    gl.drawElements(gl.TRIANGLES, this.transparentIndexBufferLength, gl.UNSIGNED_SHORT, 0)
  }
}
