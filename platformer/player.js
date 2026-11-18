let jumpSound = new Howl({
  src : ["./assets/audio/player-jump.mp3"],
  volume : soundVolume
})

let deathSound = new Howl({
  src : ["./assets/audio/splat.wav"],
  volume : soundVolume
})

let fallDeathSound = new Howl({
  src : ["./assets/audio/fall-splat.wav"],
  volume : soundVolume
})

const modes = {
  regular : {
    jumpVel : -12,
    speed : 6,
    groundAccel : 0.1,
    airAccel : 0.03,
    doubleJumpVelBonus : 3
  },
  acceleration : {
    jumpVel : -14,
    speed : 100,
    groundAccel : 0.0003,
    airAccel : 0.0001,
    doubleJumpVelBonus : 1
  }
}

class Player extends Entity {
  constructor(level, x, y) {
    super(level, x, y, 32, 50)

    Object.assign(this, modes.regular)
  }

  /*
  jumpVel = -12

  speed = 6

  groundAccel = 0.1
  airAccel = 0.03

  doubleJumpVelBonus = 3
  */

  canDoubleJump = true

  isOnGround() {
    let platform = this.overlaps(0, this.smallestMovement)

    if (platform)
      platform.landedOn = true

    return !!platform
  }

  attemptJump(fromHold = false) {
    if (!this.alive) return
    
    if (this.onGround)
      this.jump(fromHold)
    else if (this.canDoubleJump) {
      this.canDoubleJump = false
      
      this.xVel += this.doubleJumpVelBonus * this.doubleJumpBoostFactor
      
      this.jump()
    }
  }

  jump(fromHold = false) {
    if (sfx) jumpSound.play()

    this.level.jumps++
    
    this.yVel = this.jumpVel

    if (!this.canDoubleJump)
      this.level.createDoubleJumpEffect(this.x + this.w / 2, this.y + this.h, this.xVel, this.yVel, Math.sqrt(this.doubleJumpBoostFactor))

    if (!this.level.setSeed && this.onGround && !fromHold && !this.onGroundLastTick)
      achieve("instantJump")
  }

  alive = true

  deathX = null

  die(cause) {
    this.alive = false

    this.deathX = this.x

    this.level.death(cause)
    
    if (sfx && cause !== "fall")
      deathSound.play()
  }

  onGroundLastTick = false
  onGround = false
  doubleJumpBoostFactor = 0

  ticksAlive = 0

  jumpPressed = false

  tick() {
    if (this.alive) {
      if (this.y > this.level.height + 100)
        this.die("fall")
      else if (this.level.platforms.some(x => x.overlapsDeadly(this.x, this.y, this.w, this.h)))
        this.die("spike")

      this.xVel = (this.xVel - this.speed) * (1 - (this.onGround ? this.groundAccel : this.airAccel)) + this.speed
    } else
      this.xVel *= 1 - (this.onGround ? this.groundAccel : this.airAccel)
    
    super.tick()

    this.onGroundLastTick = this.onGround
    
    this.onGround = this.isOnGround()
    this.canDoubleJump ||= this.onGround

    if (this.jumpPressed) {
      this.attemptJump()

      this.jumpPressed = false
    }

    if (this.onGround) {
      this.doubleJumpBoostFactor = 0

      if (game.keysDown.Space || game.keysDown.ArrowUp || game.keysDown.KeyI  || game.keysDown.KeyK)
        this.attemptJump(true)
    } else if (this.doubleJumpBoostFactor < 1)
      this.doubleJumpBoostFactor += 0.1

    this.ticksAlive++
  }

  draw() {
    let {onGround} = this,
        trueFrame = Math.trunc(this.ticksAlive / 4) % 4,
        data = skins[currentSkin]
    
    let img = data.image ? "player" + capitalize(skins[currentSkin].image) : "playerDefault"
    
    let frame

    if (onGround) {
      if (this.alive)
        frame = trueFrame
      else if (data.idleAnim) {
        img += "Idle"
        frame = trueFrame
      } else frame = 1
    } else {
      if (data.idleAnim) {
        img += "Idle"
        frame = trueFrame
      } else frame = 0
    }

    let horizOutset = (data.horizontalOutset || 0) * 2
    
    skin(
      ...this.level.screenPos(this.x - horizOutset, this.y + (data.yOffset || 0) * 2),
      this.w + horizOutset * 4, (data.height || images[img].height) * 2,
      data.color || [255, 255, 255],
      images[img],
      frame
    )
  }
}
