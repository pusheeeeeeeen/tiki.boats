for (let [name, hexList] of Object.entries(colors)) {
  var group = elem("div.color-group")
  
  for (let i in hexList) {
    var color = hexList[i],
        [red, green, blue] = [...color.slice(1).matchAll(/../g)].flatMap(x => parseInt(x, 16)),
        lightness = 0.21 * red + 0.72 * green + 0.07 * blue
    
    group.append(
      elem("div.color").css({background : color, color : lightness > 160 ? "black" : "white"}).addEnd(
        elem("span").text(`${name[0].toUpperCase() + name.slice(1)} ${i} – ${color}`)
      )
    )
  }

  id("colors").append(group)
}
