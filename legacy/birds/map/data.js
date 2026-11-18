var rawData, data = [],
    columns = "ABCDEFGHIJKLM",
    rowCount = 10, columnCount = columns.length,
    highestCount = 0,
    birdPoints = []

for (let i = 0; i < rowCount * 5; i++)
  data.push(Array(columnCount * 5).fill(0))

function dataLoaded(text) {
  var header = text.split("\r\n")[0].split(",")

  rawData = text.split("\r\n").slice(1).map(x => {
    x = x.split(",")
    
    return Object.fromEntries(header.map((y, index) => [y, x[index]]))
  })

  for (let i of rawData) {
    var loc = i.location,
        x = columns.indexOf(loc[0]) * 5 + parseInt(loc[1]) - 1,
        y = (parseInt(loc.slice(3, loc.indexOf("."))) - 1) * 5 + parseInt(loc.slice(-1)) - 1
    
    data[y][x]++

    highestCount = Math.max(highestCount, data[y][x])
  }

  for (let y in data)
    for (let x in data[y])
      if (data[y][x])
        birdPoints.push({x : parseInt(x), y : parseInt(y), count : data[y][x]})

  itemLoaded()
}

var rawFile = new XMLHttpRequest()
rawFile.open("GET", "../birds.csv", false)

rawFile.onreadystatechange = () => {
  if (rawFile.readyState === 4 && (rawFile.status === 200 || rawFile.status === 0))
    dataLoaded(rawFile.responseText)
}

rawFile.send(null)
