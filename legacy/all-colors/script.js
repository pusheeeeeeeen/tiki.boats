console.time("Gradient finished in")

const main = $("main")

var count = 255 ** 2
for (let i = 0; i < count; i++) {
  var div = elem("div.grad"), green = i % 256, blue = ~~(i / 256) % 256

  div.style.background = `linear-gradient(to right, rgb(0, ${green}, ${blue}), rgb(255, ${green}, ${blue}))`

  main.addEnd(div)
}

console.timeEnd("Gradient finished in")
