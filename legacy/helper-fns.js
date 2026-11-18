(e => {
  function typeErr(msg) { throw new TypeError(msg) }

  // ELEMENT GETTING FUNCTIONS

  class ElementArray extends Array {
    constructor() {
      super(...arguments)
    }

    toArray() { return [...this] }

    set id(id) { this.setId(id) }

    setId(id) {
      this.forEach(x => x.setId(id))

      return this
    }

    set className(newClass) { this.setClass(newClass) }

    setClass(newClass) {
      this.forEach(x => x.setClass(newClass))

      return this
    }

    addClass(newClass) { return this.addClasses(newClass) }

    addClasses(...newClasses) {
      this.forEach(x => x.addClasses(...newClasses))

      return this
    }

    removeClass(removedClass) { return this.removeClasses(removedClass) }

    removeClasses(...removedClasses) {
      this.forEach(x => x.removeClasses(...removedClasses))

      return this
    }

    html(str = null) {
      var res = this.map(x => x.html(str))

      return str === null ? res : this
    }

    text(str = null) {
      var res = this.map(x => x.text(str))

      return str === null ? res : this
    }

    css(styles = null) {
      var res = this.map(x => x.css(styles))

      return styles === null ? res : this
    }

    addStart(elem) {
      this.forEach(x => x.addStart(elem instanceof Node ? elem.cloneNode(true) : elem))

      return this
    }

    addEnd(elem) {
      this.forEach(x => x.addEnd(elem instanceof Node ? elem.cloneNode(true) : elem))

      return this
    }

    drag(val = true) {
      this.forEach(x => x.drag(val))

      return this
    }

    get isDraggable() { return this.map(x => x.isDraggable) }
  }

  // id

  e.id = elem => id(elem)

  function id(elem) {
    if (typeof elem !== "string") typeErr("Element id is not a string")

    return document.getElementById(elem)
  }

  // className

  e.classFirst = elem => classFirst(elem)

  function classFirst(elem) {
    if (typeof elem !== "string") typeErr("Class name is not a string")

    return document.getElementsByClassName(elem)[0]
  }

  e.classAll = elem => classAll(elem)

  function classAll(elem) {
    if (typeof elem !== "string") typeErr("Class name is not a string")

    return new ElementArray(...document.getElementsByClassName(elem))
  }

  // tagName

  e.tagFirst = elem => tagFirst(elem)

  function tagFirst(elem) {
    if (typeof elem !== "string") typeErr("Tag name is not a string")

    return document.getElementsByTagName(elem)[0]
  }

  e.tagName = e.tagAll = elem => tagAll(elem)

  function tagAll(elem) {
    if (typeof elem !== "string") typeErr("Tag name is not a string")

    return new ElementArray(...document.getElementsByTagName(elem))
  }

  // query

  e.queryFirst = elem => queryFirst(elem)

  function queryFirst(elem) {
    if (typeof elem !== "string") typeErr("Element query is not a string")

    return document.querySelector(elem)
  }

  e.query = e.queryAll = elem => queryAll(elem)

  function queryAll(elem) {
    if (typeof elem !== "string") typeErr("Element query is not a string")

    return new ElementArray(...document.querySelectorAll(elem))
  }

  // $

  e.$ = (elem, multiple = false) => $(elem, multiple)

  function $(elem, multiple) {
    if (typeof elem !== "string") typeErr("Element query is not a string")

    if (elem.startsWith(".") || multiple) return queryAll(elem)
    else return queryFirst(elem)
  }

  // ELEMENT MODIFYING

  class HTMLTemplate {
    #elem
    constructor(htmlStr, wrapper) {
      this.#elem = elem(wrapper).html(htmlStr)
    }

    get wrapper() { return this.#elem }

    get elements() { return new ElementArray(...this.wrapper.children) }
  }

  Object.defineProperty(Element.prototype, "setId", {
    value(newId) { return setId(this, newId) }
  })

  function setId(elem, newId) {
    elem.id = String(newId)

    return elem
  }

  Object.defineProperty(Element.prototype, "setClass", {
    value(newClass) { return setClass(this, newClass) }
  })

  function setClass(elem, newClass) {
    elem.className = String(newClass)

    return elem
  }

  Object.defineProperty(Element.prototype, "addClass", {
    value(newClass) { return setClasses(this, [newClass], true) }
  })

  Object.defineProperty(Element.prototype, "addClasses", {
    value(...newClasses) { return setClasses(this, newClasses) }
  })

  function setClasses(elem, newClasses, singleClass) {
    if (!newClasses.length) typeErr(`No new class${singleClass ? "" : "(es)"} specified`)

    elem.classList.add(...newClasses.map(x => String(x)))

    return elem
  }

  Object.defineProperty(Element.prototype, "removeClass", {
    value(removedClass) { return removeClasses(this, [removedClass]) }
  })

  Object.defineProperty(Element.prototype, "removeClasses", {
    value(...removedClasses) { return removeClasses(this, removedClasses) }
  })

  function removeClasses(elem, removedClasses) {
    if (!removedClasses.length)
      elem.className = ""
    else
      elem.classList.remove(...removedClasses.map(x => String(x)))

    return elem
  }

  Object.defineProperty(Element.prototype, "html", {
    value(str = null) { return html(this, str) }
  })

  function html(elem, str) {
    if (str === null) return elem.innerHTML

    elem.innerHTML = String(str)

    return elem
  }

  // delete default 'text' property
  delete HTMLOptionElement.prototype.text;

  // extra closure due to other function also being named 'text'
  (() => {
    Object.defineProperty(Element.prototype, "text", {
      value(str = null) { return text(this, str) }
    })

    function text(elem, str) {
      if (str === null) return elem.innerText

      elem.innerText = String(str)

      return elem
    }
  })()

  Object.defineProperty(Element.prototype, "css", {
    value(styles = null) { return css(this, styles) }
  })

  function css(elem, styles) {
    if (styles === null) {
      var res = Object.fromEntries(
        Object.entries(elem.style).filter(x => x[1] && !/^\d+$/.test(x[0]))
      ), str = min => Object.entries(res).map(
        x => `${x[0].replace(/[A-Z]/g, char => `-${char.toLowerCase()}`)}:${min ? "" : " "}${x[1]};`
      ).join(min ? "" : " ")

      Object.defineProperty(res, "str", {
        value(min = false) { return str(min) }
      })

      return res
    }

    for (let [name, val] of Object.entries(styles))
      elem.style[name] = val

    return elem
  }

  e.elem = str => elem(str)

  function elem(str) {
    if (typeof str !== "string") typeErr("Element tag name is not a string")

    var parts = str.replace(/[#.]/g, " $&").trim().split(/\s+/),
      name = parts.findIndex(x => !x.startsWith("#") && !x.startsWith(".")),
      id = parts.findIndex(x => x.startsWith("#")),
      classes = parts.filter(x => x.startsWith("."))

    name = name === -1 ? "div" : parts.splice(name, 1, null)[0]
    id = id === -1 ? null : parts.splice(id, 1, null)[0].slice(1)

    if (parts.some(x => x !== null && !x.startsWith("."))) typeErr(`Invalid element string '${str}'`)

    var elem = document.createElement(name)

    if (id !== null) elem.id = id
    if (classes.length) elem.addClasses(...classes.map(x => x.slice(1)))

    return elem
  }

  e.text = str => text(str)

  function text(str) {
    return document.createTextNode(String(str))
  }

  Object.defineProperty(Element.prototype, "addStart", {
    value(elem) { return addStart(this, elem) }
  })

  function addStart(outer, elem) {
    if (Array.isArray(elem))
      for (let i = elem.length - 1; i >= 0; i--) addStart(outer, elem[i])
    else if (elem instanceof HTMLTemplate)
      for (let i = elem.elements.length - 1; i >= 0; i--) addStart(outer, elem.elements[i].cloneNode(true))
    else {
      if (!(elem instanceof Node)) elem = String(elem)

      outer.prepend(elem)
    }

    return outer
  }

  Object.defineProperty(Element.prototype, "addEnd", {
    value(elem) { return addEnd(this, elem) }
  })

  function addEnd(outer, elem) {
    if (Array.isArray(elem))
      for (let i of elem) addEnd(outer, i)
    else if (elem instanceof HTMLTemplate)
      for (let i of elem.elements) addEnd(outer, i.cloneNode(true))
    else {
      if (!(elem instanceof Node)) elem = String(elem)

      outer.append(elem)
    }

    return outer
  }

  e.htmlTemplate = (html, wrapperName = "wrapper") => htmlTemplate(html, wrapperName)

  function htmlTemplate(html, wrapperName) {
    if (html instanceof Node) html = html.outerHTML
    else html = String(html)

    return new HTMLTemplate(html, wrapperName)
  }

  // ELEMENT PROPERTY BINDING

  Object.defineProperty(Element.prototype, "bindProperty", {
    value(propName, obj, key) { bindProperty(this, propName, obj, key) }
  })

  function bindProperty(elem, propName, obj, key) {
    propName = String(propName)

    var splitName = propName.split("."),
      innerPropObj = elem

    for (let i = 0; i < splitName.length - 1; i++) {
      if (typeof innerPropObj !== "object" || innerPropObj === null)
        break

      innerPropObj = innerPropObj[splitName[i]]
    }

    var propVal = obj[key],
      get = () => propVal,
      set = x => {
        propVal = x
        // for (let i of Object.values(obj.__setters__)) i(x)
        for (let i of obj.__setters__) i(x)
      }

    if (!obj.__setters__) {
      var setterObj = []

      Object.defineProperty(obj, "__setters__", {
        get() { return setterObj },
        // property should never be set
        configurable: true // allow to be deleted
      })
    }

    obj.__setters__.push(() => {
      // propVal = x

      innerPropObj[splitName.last] = propVal
    })

    Object.defineProperty(obj, key, {
      get: () => get(),
      set: x => set(x)
    })

    innerPropObj[splitName.last] = propVal

    elem.__boundProperties__ ??= {}

    elem.__boundProperties__[propName] = [obj, key, set]
  }

  Object.defineProperty(Element.prototype, "updateBindings", {
    value() { updateBindings(this) }
  })

  function updateBindings(elem) {
    var props = elem.__boundProperties__

    if (props !== null)
      for (let i of Object.keys(props))
        elem[i] = props[i][0][props[i][1]]
  }

  Element.prototype.__boundProperties__ = null
  Element.prototype.__oninput__ = null

  Object.defineProperty(Element.prototype, "unbindProperty", {
    value(propName) { unbindProperty(this, propName) }
  })

  function unbindProperty(elem, propName, fromUnbindText = false) {
    propName = String(propName)

    // in case propName is "constructor", "__lookupGetter__", etc.
    if (elem.__boundProperties__ && Array.isArray(elem.__boundProperties__[propName])) {
      var [obj, key] = elem.__boundProperties__[propName],
        val = obj[key]

      // delete obj.__setters__[propName]
      obj.__setters__.splice(obj.__setters__.indexOf(elem.__boundProperties__[propName][2]), 1)

      if (!obj.__setters__.length) {
        delete obj[key]
        delete obj.__setters__

        obj[key] = val
      }

      delete elem.__boundProperties__[propName]
    } else typeErr(fromUnbindText ? "Cannot unbind text because no text is bound" : `Cannot unbind property '${propName}' because it is not bound`)
  }

  Object.defineProperty(Element.prototype, "bindText", {
    value(obj, key, twoWay = true) { bindText(this, obj, key, twoWay) }
  })

  function bindText(elem, obj, key, twoWay) {
    var textKey = typeof elem.value === "string" ? "value" : "innerText"

    elem.bindProperty(textKey, obj, key)

    if (twoWay) {
      var oninput = () => { obj[key] = elem[textKey] }

      elem.addEventListener("input", elem.__oninput__ = () => { oninput() })
    }
  }

  Object.defineProperty(Element.prototype, "unbindText", {
    value() { unbindText(this) }
  })

  function unbindText(elem) {
    unbindProperty(elem, typeof elem.value === "string" ? "value" : "innerText", true)

    elem.removeEventListener("input", elem.__oninput__)

    elem.__oninput__ = null
  }

  // SELECTED ELEMENT

  Object.defineProperty(Element.prototype, "selectable", {
    value(val = true) { return selectable(this, val) }
  })

  function selectable(elem, val) {
    if (val) elem.classList.add("_selectable")
    else elem.classList.remove("_selectable")

    return elem
  }

  function selectionEvent(elem, eventName, origEvent) {
    var event = new MouseEvent(eventName, {
      // MouseEvent
      screenX: origEvent.screenX,
      screenY: origEvent.screenY,
      clientX: origEvent.clientX,
      clientY: origEvent.clientY,
      ctrlKey: origEvent.ctrlKey,
      shiftKey: origEvent.shiftKey,
      altKey: origEvent.altKey,
      metaKey: origEvent.metaKey,
      button: origEvent.button,
      buttons: origEvent.buttons,
      // UIEvent
      detail: origEvent.detail,
      view: origEvent.view
    })

    elem.dispatchEvent(event)
    elem[`on${eventName}`]?.(event)

    if (eventName.includes("deselect"))
      e.elemDeselected?.({ isClick: eventName.includes("click"), elem })
    else
      e.elemSelected?.({ isClick: eventName.includes("click"), elem })
  }

  e.elemSelected = null
  e.elemDeselected = null

  function getSelectedElem(elem) {
    while (!elem.classList.contains("_selectable")) {
      elem = elem.parentElement

      if (!(elem instanceof Element)) return null
    }

    return elem
  }

  var selectedElem = null, hoveredElem = null

  document.addEventListener("mousemove", event => {
    var e = getSelectedElem(event.target)

    if (e !== hoveredElem) {
      if (hoveredElem && hoveredElem !== selectedElem) {
        hoveredElem.classList.remove("_selected")

        selectionEvent(hoveredElem, "hoverdeselect", event)
      }

      if (e) {
        e.classList.add("_selected")

        hoveredElem = e

        selectionEvent(hoveredElem, "hoverselect", event)
      } else hoveredElem = null
    }
  })

  document.addEventListener("click", event => {
    if (getSelectedElem(event.target) === selectedElem) return

    if (selectedElem) {
      selectedElem.classList.remove("_select", "_selected")

      selectionEvent(selectedElem, "clickdeselect", event)
      selectionEvent(selectedElem, "hoverdeselect", event)
    }

    selectedElem = hoveredElem

    if (selectedElem) {
      selectedElem.classList.add("_select")

      selectionEvent(selectedElem, "clickselect", event)
    }
  })

  Object.defineProperties(EventTarget.prototype, {
    onhoverselect: {
      value: null,
      configurable: true,
      writable: true
    },
    onhoverdeselect: {
      value: null,
      configurable: true,
      writable: true
    },
    onclickselect: {
      value: null,
      configurable: true,
      writable: true
    },
    onclickdeselect: {
      value: null,
      configurable: true,
      writable: true
    }
  })

  // ELEMENT DRAGGING

  Object.defineProperty(Element.prototype, "pagePos", {
    value() { return pagePos(this) }
  })

  function pagePos(elem) {
    var box = elem.getBoundingClientRect(),
      scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop,
      scrollLeft = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft,
      clientTop = document.documentElement.clientTop || document.body.clientTop || 0,
      clientLeft = document.documentElement.clientLeft || document.body.clientLeft || 0

    return {
      top: Math.round(box.top + scrollTop - clientTop),
      left: Math.round(box.left + scrollLeft - clientLeft)
    }
  }

  Object.defineProperty(Element.prototype, "isDraggable", {
    get() { return this.classList.contains("_draggable") }
  })

  Object.defineProperty(Element.prototype, "isDragging", {
    get() { return this.classList.contains("_dragging") }
  })

  Object.defineProperty(Element.prototype, "drag", {
    value(val = true, resetPos = true) { return drag(this, val, resetPos) }
  })

  function drag(elem, val, resetPos) {
    if (val) {
      if (elem.classList.contains("_draggable")) {
        elem.style.top = "0"
        elem.style.left = "0"
      } else
        elem.classList.add("_draggable")
    } else {
      elem.classList.remove("_draggable")

      if (resetPos) {
        elem.style.top = "0"
        elem.style.left = "0"
      }
    }

    return elem
  }

  var draggingElem = null

  document.addEventListener("mousedown", event => {
    var e = event.target

    if (e.classList.contains("_draggable")) {
      e.classList.add("_dragging")

      var { top, left } = pagePos(e)

      e.__dragData__ ??= { top, left }

      e.__dragData__.offsetX = event.pageX - left
      e.__dragData__.offsetY = event.pageY - top

      draggingElem = e
    }
  })

  document.addEventListener("mouseup", () => {
    if (draggingElem) {
      draggingElem.classList.remove("_dragging")

      draggingElem = null
    }
  })

  document.addEventListener("mousemove", event => {
    if (draggingElem) {
      var e = event.target,
        mouseX = event.pageX, mouseY = event.pageY,
        data = draggingElem.__dragData__,
        parentPos = e.parentNode === document ? { top: 0, left: 0 } : pagePos(e.parentNode),
        elemX = mouseX - data.left - data.offsetX,
        elemY = mouseY - data.top - data.offsetY,
        result = e.dragging?.({
          mouseX, mouseY,
          mouseOffsetX: data.offsetX,
          mouseOffsetY: data.offsetY,
          pageX: 0,
          pageY: 0,
          pageWidth: innerWidth,
          pageHeight: innerHeight,
          elem: e,
          elemX, elemY,
          elemRight: elemX + e.offsetWidth,
          elemBottom: elemY + e.offsetHeight,
          elemWidth: e.offsetWidth,
          elemHeight: e.offsetHeight,
          elemOrigX: data.left,
          elemOrigY: data.top,
          parent: e.parentNode,
          parentX: parentPos.left,
          parentY: parentPos.top,
          parentRight: parentPos.left + (e.parentNode.offsetWidth || innerWidth),
          parentBottom: parentPos.top + (e.parentNode.offsetHeight || innerHeight),
          parentWidth: e.parentNode.offsetWidth || innerWidth,
          parentHeight: e.parentNode.offsetHeight || innerHeight
        }) ?? null

      if (result === null)
        result = {
          left: mouseX - data.left - data.offsetX,
          top: mouseY - data.top - data.offsetY
        }
      else if (typeof result !== "object" || typeof result.top !== "number" || typeof result.left !== "number")
        typeErr("Invalid return object from Element.dragging(); must contain 'top' and 'left' properties which must both be numbers, or return nothing for default behavior")

      draggingElem.css({
        position: "relative",
        left: `${result.left}px`,
        top: `${result.top}px`
      })

      event.preventDefault()
    }
  })

  Element.prototype.__dragData__ = null

  // MATH FUNCTIONS

  function cleanupMinMax(min = null, max = null) {
    if (min === null && max === null) {
      min = 0
      max = 1
    } else if (min === null) min = 0
    else if (max === null) {
      max = min
      min = 0
    }

    if (typeof min !== "number" || typeof max !== "number") typeErr("Invalid min and max values")

    return max < min ? [max, min] : [min, max]
  }

  e.randInt = (min = null, max = null) => randInt(min, max)

  function randInt(min, max) {
    [min, max] = cleanupMinMax(min, max)

    return Math.floor(Math.random() * (max - min) + min)
  }

  e.randFloat = (min = null, max = null) => randFloat(min, max)

  function randFloat(min, max) {
    [min, max] = cleanupMinMax(min, max)

    return Math.random() * (max - min) + min
  }

  e.randBool = (chance = 0.5) => randBool(chance)

  function randBool(chance) {
    if (typeof chance !== "number") typeErr("Chance value is not a number")

    return Math.random() < chance
  }

  e.clamp = (num, min = null, max = null) => clamp(num, min, max)

  function clamp(num, min, max) {
    if (typeof num !== "number") typeErr("Clamped value is not a number")

    if ((typeof min !== "number" && min !== null) || (typeof max !== "number" && max !== null)) typeErr("Invalid min and max values")

    if (min !== null) num = Math.max(num, min)
    if (max !== null) num = Math.min(num, max)

    return num
  }

  e.clampMin = (num, minimum) => clampMin(num, minimum)

  function clampMin(num, minimum) {
    if (typeof num !== "number") typeErr("Clamped value is not a number")

    if (typeof minimum !== "number") typeErr("Min value is not a number")

    return Math.max(num, minimum)
  }

  e.clampMax = (num, maximum) => clampMax(num, maximum)

  function clampMax(num, maximum) {
    if (typeof num !== "number") typeErr("Clamped value is not a number")

    if (typeof maximum !== "number") typeErr("Max value is not a number")

    return Math.min(num, maximum)
  }

  // ARRAY STUFF

  Object.defineProperty(Array.prototype, "first", {
    get() { return first(this) }
  })

  function first(arr) { return arr[0] }

  Object.defineProperty(Array.prototype, "last", {
    get() { return last(this) }
  })

  function last(arr) { return arr[arr.length - 1] }

  Object.defineProperty(Array.prototype, "apply", {
    value(func, ...params) { return apply(this, func, params) }
  })

  function apply(arr, func, params) {
    if (typeof func === "string")
      return arr.map(x => x[func]?.(...params))
    else if (typeof func === "function")
      return params.length
        ? arr.map(x => func.call(x, params))
        : arr.map(x => func.call(x))
    else
      typeErr("Function is not a function or string (function name)")
  }

  Object.defineProperty(Array.prototype, "min", {
    value() { return min(this) }
  })

  function min(arr) { return Math.min(...arr) }

  Object.defineProperty(Array.prototype, "max", {
    value() { return max(this) }
  })

  function max(arr) { return Math.max(...arr) }

  Object.defineProperty(Array.prototype, "sum", {
    value() { return sum(this) }
  })

  function sum(arr, fromAvg) {
    return arr.reduce((acc, val) => {
      if (typeof val !== "number") typeErr((fromAvg ? "Array to be reduced" : "Summed array") + " contains non-number values")

      return acc + val
    }, 0)
  }

  Object.defineProperty(Array.prototype, "average", {
    value() { return average(this) }
  })

  function average(arr) {
    return sum(arr, true) / arr.length
  }

  Object.defineProperty(Array.prototype, "random", {
    value() { return random(this) }
  })

  Object.defineProperty(String.prototype, "random", {
    value() { return random(this) }
  })

  function random(arr) { return arr[randInt(arr.length)] }
})(globalThis)
