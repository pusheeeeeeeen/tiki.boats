var data

function dataLoaded(text) {
  var header = text.split("\r\n")[0].split(",")

  data = text.split("\r\n").slice(1).map(x => {
    x = x.split(",")
    
    return Object.fromEntries(header.map((y, index) => [y, x[index]]))
  })

  setupData()

  start()
}

var rawFile = new XMLHttpRequest()
rawFile.open("GET", "./birds.csv", false)

rawFile.onreadystatechange = () => {
  if (rawFile.readyState === 4 && (rawFile.status === 200 || rawFile.status === 0))
    dataLoaded(rawFile.responseText)
}

rawFile.send(null)
