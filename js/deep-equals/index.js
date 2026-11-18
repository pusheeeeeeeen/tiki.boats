(() => {
  const primitiveTypes = new Set([
    "undefined",
    "boolean",
    "number",
    "bigint",
    "string",
    "symbol"
  ])

  function isPrimitive(val) {
    return val === null || primitiveTypes.has(typeof val)
  }

  function objectType(val) {
    if (val instanceof Map) return "map"
    else if (val instanceof Set) return "set"
    else return "object"
  }

  const objectCompareFns = {
    map(a, b, compare, checked) {
      let keysA = [...a.keys()],
          keysB = [...b.keys()]

      if (keysA.length !== keysB.length) return false

      for (let key of keysA)
        if (!b.has(key) || !deepEquals(a.get(key), b.get(key), compare, checked))
          return false

      return true
    },
    set(a, b) {
      if (a.size !== b.size) return false

      for (let i of a)
        if (!b.has(a))
          return false

      return true
    },
    object(a, b, compare, checked) {
      let keysA = Object.keys(a),
          keysB = Object.keys(b)

      if (keysA.length !== keysB.length) return false

      for (let key of keysA)
        if (!(key in b) || !deepEquals(a[key], b[key], compare, checked))
          return false

      return deepEquals(Object.getPrototypeOf(a), Object.getPrototypeOf(b), compare, checked)
    }
  }

  function objectsEqual(a, b, compare, checked) {
    let typeA = objectType(a),
        typeB = objectType(b)

    return typeA === typeB && objectCompareFns[typeA](a, b, compare, checked)
  }

  function deepEquals(a, b, compare, checked) {
    if (a === b) return true

    let aIsPrimitive = isPrimitive(a),
        bIsPrimitive = isPrimitive(b)

    if (aIsPrimitive !== bIsPrimitive) return false

    if (aIsPrimitive)
      return !!compare?.(a, b)
    else if (checked.get(a)?.has(b) || checked.get(b)?.has(a))
      return true
    else {
      let set = checked.get(a) || checked.get(b)
      if (!set) {
        set = new Set()
        checked.set(a, set)
      }
      set.add(b)

      return objectsEqual(a, b, compare, checked)
    }
  }

  window.deepEquals = (a, b, primitiveCompare = null) => deepEquals(a, b, primitiveCompare, new Map())
})()
