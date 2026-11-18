var map = L.map("map").setView([0, 0], 2)

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 6,
  attribution: "&copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>"
}).addTo(map)

var shapes = []
function drawYear() {
  data.forEach((x, i) => {
    var amount = parseInt(x[stngs.year])

    if (!amount || x[stngs.year - 1] === amount.toString()) return

    shapes[i]?.remove()

    var randDist = Math.random() * stngs.spread,
        randAngle = Math.random() * 365,
        randX = Math.sin(randAngle) * randDist,
        randY = Math.cos(randAngle) * randDist
    
    var shape = L.circle([parseInt(x.lat) + randX, parseInt(x.long) + randY], {
      radius: amount * map.getZoom() * 2 + 1,
      color : x.type === "Food" ? "blue" : "red",
      weight : 0
    })

    shapes[i] = shape
    shape.addTo(map)
  })
}

var data, yearMin = 1961, yearMax = 2013,
    stngs = {
      year : 1961,
      spread : parseInt(id("spread").value)
    }

function dataLoaded(text) {
  var header = text.split("\r\n")[0].split("\t")

  data = text.split("\r\n").slice(1).map(x => {
    x = x.split("\t")
    
    return Object.fromEntries(header.map((y, index) => [y, x[index]]))
  })

  drawYear()
}

var rawFile = new XMLHttpRequest()
rawFile.open("GET", "./data.tsv", false)

rawFile.onreadystatechange = () => {
  if (rawFile.readyState === 4 && (rawFile.status === 200 || rawFile.status === 0))
    setTimeout(() => { dataLoaded(rawFile.responseText) }, 0)
}

rawFile.send(null)

onkeydown = event => {
  if (event.code === "Space") {
    stngs.year++
    stngs.year %= yearMax + 1

    drawYear()
  }
}

id("current-year").bindText(stngs, "year")
id("year").min = yearMin
id("year").max = yearMax

id("current-spread").bindText(stngs, "spread")

id("year").oninput = event => {
  stngs.year = parseInt(event.target.value)

  drawYear()
}

id("spread").oninput = event => {
  stngs.spread = parseInt(event.target.value)

  drawYear()
}
