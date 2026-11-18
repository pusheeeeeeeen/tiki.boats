class Perlin2D {
  constructor(random = null) {
    this.random = random || Math.random
  }

  randCache = {}

  rand(x, y) {
    let key = `${x}:${y}`

    if (key in this.randCache)
      return this.randCache[key]
    else
      return this.randCache[key] = this.normalize(this.random() * 2 - 1, this.random() * 2 - 1)
  }

  normalize(x, y) {
    let dist = Math.hypot(x, y)

    return [x / dist, y / dist]
  }

  dot(g, x, y) {
    return g[0] * x + g[1] * y
  }

  mix(a, b, t) {
    return (1.0 - t) * a + t * b
  }

  fade(t) {
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0)
  }

  noise(x, y) {
    // find unit grid cell containing point
      let X = Math.floor(x),
          Y = Math.floor(y)

    // get relative xy coordinates of point within that cell
    x -= X
    y -= Y

    // calculate noise contributions from each of the four corners
    let n00 = this.dot(this.rand(X, Y), -x, -y),
        n10 = this.dot(this.rand(X + 1, Y), 1 - x, -y),
        n01 = this.dot(this.rand(X, Y + 1), -x, 1 - y),
        n11 = this.dot(this.rand(X + 1, Y + 1), 1 - x, 1 - y)

    // compute the fade curve value for x and y
    let u = this.fade(x),
        v = this.fade(y)

    // interpolate along x the contributions from each of the corners
    let nx0 = this.mix(n00, n10, u),
        nx1 = this.mix(n01, n11, u)

    // interpolate the two results along y
    return this.mix(nx0, nx1, v)
  }
}
