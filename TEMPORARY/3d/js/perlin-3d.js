class Perlin3D {
  constructor(random = null) {
    this.random = random || Math.random
  }

  randCache = {}

  rand(x, y, z) {
    let key = `${x}:${y}:${z}`

    if (key in this.randCache)
      return this.randCache[key]
    else
      return this.randCache[key] = this.normalize(this.random() * 2 - 1, this.random() * 2 - 1, this.random() * 2 - 1)
  }

  normalize(x, y, z) {
    let dist = Math.hypot(x, y, z)

    return [x / dist, y / dist, z / dist]
  }

  dot(g, x, y, z) {
    return g[0] * x + g[1] * y + g[2] * z
  }

  mix(a, b, t) {
    return (1.0 - t) * a + t * b
  }

  fade(t) {
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0)
  }

  noise(x, y, z) {
    // find unit grid cell containing point
    let X = Math.floor(x),
        Y = Math.floor(y),
        Z = Math.floor(z)

    // get relative xyz coordinates of point within that cell
    x -= X
    y -= Y
    z -= Z

    // calculate noise contributions from each of the eight corners
    let n000 = this.dot(this.rand(X,     Y,     Z    ),    -x,    -y,    -z),
        n100 = this.dot(this.rand(X + 1, Y,     Z    ), 1 - x,    -y,    -z),
        n010 = this.dot(this.rand(X,     Y + 1, Z    ),    -x, 1 - y,    -z),
        n110 = this.dot(this.rand(X + 1, Y + 1, Z    ), 1 - x, 1 - y,    -z),
        n001 = this.dot(this.rand(X,     Y,     Z + 1),    -x,    -y, 1 - z),
        n101 = this.dot(this.rand(X + 1, Y,     Z + 1), 1 - x,    -y, 1 - z),
        n011 = this.dot(this.rand(X,     Y + 1, Z + 1),    -x, 1 - y, 1 - z),
        n111 = this.dot(this.rand(X + 1, Y + 1, Z + 1), 1 - x, 1 - y, 1 - z)

    // compute the fade curve value for each of x, y, z
    let u = this.fade(x),
        v = this.fade(y),
        w = this.fade(z)

    // interpolate along x the contributions from each of the corners
    let nx00 = this.mix(n000, n100, u),
        nx01 = this.mix(n001, n101, u),
        nx10 = this.mix(n010, n110, u),
        nx11 = this.mix(n011, n111, u)

    // interpolate the four results along y
    let nxy0 = this.mix(nx00, nx10, v),
        nxy1 = this.mix(nx01, nx11, v)

    // interpolate the two last results along z
    return this.mix(nxy0, nxy1, w)
  }
}
