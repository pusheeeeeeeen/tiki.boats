class Game {
  constructor() {

  }

  // LOADING

  loaded = false

  isPointerLocked = false
  mouseSpeed = 0.5

  start() {
    this.loaded = true

    updateSize()
    onresize = updateSize

    onkeydown = e => {
      if (!e.repeat && !e.metaKey)
        this.keyDown(e.code)
    }
    onkeyup = e => {
      this.keyUp(e.code)
    }
    document.onpointerlockchange = () => {
      this.isPointerLocked = !!document.pointerLockElement

      if (!this.isPointerLocked)
        document.getElementById("resume-wrapper").classList.add("show")
    }
    onmousemove = e => {
      if (this.isPointerLocked)
        this.level?.mouseMove(e.movementX * this.mouseSpeed, e.movementY * this.mouseSpeed)
    }

    this.blockTex = setupTexture(blockSpritesheetCanvas)

    this.level = new Level()

    setInterval(() => {
      this.tick()
      this.draw()
      this.postRenderTick()
    }, 1000 / 60)
  }

  // KEYS

  keysDown = {}

  keyDown(key) {
    this.keysDown[key] = true
  }

  keyUp(key) {
    this.keysDown[key] = false
  }

  // TICKING

  tick() {
    this.level.tick()
  }

  postRenderTick() {
    this.level.postRenderTick()
  }

  // RENDERING

  lastFrames = []

  draw() {
    let start = performance.now()

    this.level.draw()

    while (this.lastFrames.length && this.lastFrames[0].time + 1000 <= start)
      this.lastFrames.shift()

    this.lastFrames.push({
      time : start,
      duration : performance.now() - start
    })

    let msPerFrame = this.lastFrames.reduce((acc, x) => acc + x.duration, 0) / this.lastFrames.length

    fpsElem.innerText = `fps: ${this.lastFrames.length}, ms/f: ${msPerFrame.toFixed(2)}`
  }
}

const game = new Game()

const fpsElem = document.getElementById("fps")
