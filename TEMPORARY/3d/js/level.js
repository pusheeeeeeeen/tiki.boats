class Level {
  constructor() {
    generationWorker.postMessage({
      type : "setup",
      chunkHeight : this.height,
      chunkSize : this.chunkSize,
      blockData
    })
  }

  // GENERATION

  chunks = {}

  chunkSize = 16
  subchunkSize = 32
  verticalSubchunks = 2

  height = this.subchunkSize * this.verticalSubchunks

  getChunkPos(x, z) {
    return [Math.floor(x / 16), Math.floor(z / 16)]
  }

  chunkKey(x, z) {
    return `${x}:${z}`
  }

  generateChunk(x, z, force = false) {
    let key = this.chunkKey(x, z)

    if (x in this.chunks && !force)
      console.warn(`Attempted to generate already-generated chunk ${x}:${z}`)

    this.chunks[key] = new Chunk(this, x, z)

    let prevGen = this.prevGeneratedChunks

    prevGen.push(key)

    if (prevGen.length > 500) {
      if (!this.loadedChunks.has(prevGen[0]))
        delete this.chunks[prevGen.shift()]
      else
        for (let i = 1; i < prevGen.length; i++) {
          if (!this.loadedChunks.has(prevGen[i])) {
            delete this.chunks[prevGen.splice(i, 1)[0]]

            break
          }
        }
    }

    console.log(Object.keys(this.chunks).length)
  }

  prevGeneratedChunks = []
  loadedChunks = new Set()

  loadChunk(x, z, generate = true) {
    let key = this.chunkKey(x, z)

    if (this.loadedChunks.has(key))
      return

    if (!(key in this.chunks)) {
      if (!generate) return

      this.generateChunk(x, z)
    }

    this.loadedChunks.add(key)
  }

  loadChunksAround(x, z, dist) {
    dist--

    for (let xPos = x - dist; xPos <= x + dist; xPos++)
      for (let zPos = z - dist; zPos <= z + dist; zPos++)
        this.loadChunk(xPos, zPos)
  }

  getChunk(x, z, generate = false) {
    let key = this.chunkKey(x, z)

    if (!(key in this.chunks)) {
      if (!generate) return null

      this.generateChunk(x, z)
    }

    return this.chunks[key]
  }

  chunkLoaded({location, layout}) {
    let chunk = this.getChunk(location.x, location.z)

    if (!chunk) {
      console.warn(`Received generation data for nonexistent chunk ${location.x}:${location.z}`)
      return
    }

    chunk.layoutLoaded(layout)
  }

  scheduleChunkGeneration(x, z) {
    generationWorker.postMessage({
      type : "generate",
      x, z
    })
  }

  // BLOCKS

  getBlock(x, y, z, generate = false) {
    let chunk = this.getChunk(...this.getChunkPos(x, z), generate)

    return chunk?.loaded ? chunk.getBlock(x, y, z) : null
  }

  fullBlockAt(x, y, z, countEmpty = true, generate = false) {
    let block = this.getBlock(x, y, z, generate)

    return block ? block.isFullBlock() : countEmpty
  }

  // TICKING

  cameraX = 0
  cameraY = 45
  cameraZ = 0

  cameraPitch = 0
  cameraYaw = 0

  mouseMove(dx, dy) {
    this.cameraPitch += dy
    this.cameraYaw += dx
  }

  tick() {
    // camera (temporary)

    let speed = 0.2, x = 0, z = 0

    let radians = glMatrix.toRadian(this.cameraYaw),
        sin = Math.sin(radians), cos = Math.cos(radians)

    if (game.keysDown.KeyW) {
      x += sin
      z -= cos
    }
    if (game.keysDown.KeyS) {
      x -= sin
      z += cos
    }
    if (game.keysDown.KeyA) {
      x -= cos
      z -= sin
    }
    if (game.keysDown.KeyD) {
      x += cos
      z += sin
    }
    if (game.keysDown.Space)
      this.cameraY += speed
    if (game.keysDown.ShiftLeft)
      this.cameraY -= speed

    this.cameraX += x * speed
    this.cameraZ += z * speed

    // load chunks around camera (temporary)

    this.loadedChunks.clear()

    this.loadChunksAround(...this.getChunkPos(this.cameraX, this.cameraZ), 8)

    // tick loaded chunks

    for (let i of this.loadedChunks)
      this.chunks[i].tick()
  }

  subchunkCreationQueue = []

  scheduleSubchunkCreation(x, z, subchunk) {
    this.subchunkCreationQueue.push({x, z, subchunk})
  }

  totalSubchunks = 0
  totalVertexRecalcs = 0

  postRenderTick() {
    if (this.subchunkCreationQueue.length) {
      let item = this.subchunkCreationQueue.shift()

      // TODO debug timer
      let start = performance.now()

      this.getChunk(item.x, item.z).generateSubchunk(item.subchunk)

      blockGenTimes.push(performance.now() - start)
      this.totalSubchunks++
    }
  }

  // RENDERING

  draw() {
    this.drawBlocks()
  }

  drawBlocks() {
    clearCanvas()

    useProgram(shaders.block)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, game.blockTex)
    gl.uniform1i(shaders.block.uniform.u_tex, 0)

    gl.uniform1f(shaders.block.uniform.u_texWidth, blockSpritesheetCanvas.width)

    let projectionMat = mat4.create(),
        viewMat = mat4.create()

    mat4.perspective(projectionMat, glMatrix.toRadian(70), width / height, 0.1, null)

    mat4.fromXRotation(viewMat, glMatrix.toRadian(this.cameraPitch))
    mat4.rotateY(viewMat, viewMat, glMatrix.toRadian(this.cameraYaw))
    mat4.translate(viewMat, viewMat, [-this.cameraX, -this.cameraY, -this.cameraZ])

    gl.uniformMatrix4fv(shaders.block.uniform.u_projectionMat, false, projectionMat)
    gl.uniformMatrix4fv(shaders.block.uniform.u_viewMat, false, viewMat)

    for (let i of this.loadedChunks)
      this.chunks[i].drawSolid()

    for (let i of this.loadedChunks)
      this.chunks[i].drawTransparent()
  }
}
