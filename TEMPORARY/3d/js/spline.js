class Spline {
  constructor(points) {
    if (!(0 in points) || !(1 in points))
      throw new TypeError("Spline points must include points at x=0 and x=1")

    this.points = points
    this.pointsX = Object.keys(points).map(Number)
  }

  x = new Set()

  get(x) {
    x = Math.max(0, Math.min(1, x))

    let min = this.pointsX.reduce((best, num) => num <= x && num > best ? num : best, 0),
        max = this.pointsX.reduceRight((best, num) => num >= x && num < best ? num : best, 1)

    if (x === min) return this.points[min]
    if (x === max) return this.points[max]

    return this.smooth(x, min, this.points[min], max, this.points[max])
  }

  smooth(x, x1, y1, x2, y2) {
    let w = x2 - x1,
        h = y2 - y1

    return this.smoothstep((x - x1) / w) * h + y1
  }

  smoothstep(x) {
    return x * x * (3 - 2 * x)
  }
}
