////////////////////////////////

let paused = false, showingPauseButton = false

function showPauseButton() {
  id("pause-button").classList.remove("hidden")
  
  showingPauseButton = true
}

function hidePauseButton() {
  id("pause-button").classList.add("hidden")
  
  showingPauseButton = false
}

id("pause-button").onclick = () => {
  paused = !paused

  if (paused) {
    game.showUI("pause")
    id("pause-button").innerText = "Unpause"
  } else {
    game.hideUI("pause")
    id("pause-button").innerText = "Pause"
  }
}

////////////////////////////////

class UI {
  constructor(type) {
    this.type = type

    this.data = uiData[type]

    this.elements = this.data.buttons.map(x => {
      return {
        elem : new Button(this, x.x, x.y, x.image, x.tint, x.overlay || null, x.center ?? true, {
          drawIf : x.drawIf
        }),
        click : x.click
      }
    })
  }

  opacity = 0

  hovered = null

  mouseMoved(x, y) {
    if (this.hovered) {
      this.hovered.elem.hovering = false
      
      this.hovered = null
    }
    
    for (let i of this.elements)
      if (i.elem.isInside(x, y)) {
        i.elem.hovering = true

        this.hovered = i

        break
      }

    return !!this.hovered
  }

  mousedownElem = null

  mousedown() {
    if (this.hovered) {
      this.hovered.elem.pressed = true
      this.mousedownElem = this.hovered
      
      this.hovered.click(this)
    }
  }

  mouseup() {
    if (this.mousedownElem) {
      this.mousedownElem.elem.pressed = false

      this.mousedownElem = null
    }
  }

  onshow() {
    this.data.onshow?.(this)
    
    if (this.mousedownElem) {
      this.mousedownElem.elem.pressed = false

      this.mousedownElem = null
    }
  }

  onhide() {
    this.data.onhide?.(this)

    if (this.hovered) {
      this.hovered.elem.hovering = false

      this.hovered = null
    }
  }

  tick() {
    this.elements.forEach(x => { x.elem.tick() })
  }

  draw() {
    this.data.bg?.(this)
    
    this.elements.slice().reverse().forEach(x => { x.elem.draw() })
  }
}
