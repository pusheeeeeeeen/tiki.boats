const locations = {
  "D2:5.3" : "crockerRdA",
  "F3:4.3" : "crockerRdA",
  "E3:4.5" : "crockerRdA",
  "G5:4.2" : "forts",
  "G3:4.1" : "forts",
  "G4:5.1" : "forts",
  "H3:4.2" : "forts",
  "H4:3.3" : "treasure",
  "I3:5.5" : "gully",
  "J1:5.2" : "gully",
  "K2:4.1" : "crockerRdB",
  "K5:5.1" : "crockerRdB",
  "D3:8.2" : "field",
  "D3:7.3" : "field",
  "F1:8.1" : "field",
  "E1:6.1" : "ravine",
  "B5:8.3" : "ravine",
  "G5:10.2" : "tanahana",
  "B4:8.2" : "ravine",
  "G5:8.1" : "tanahana",
  "H3:5.5" : "outdoorClassroom",
  "D1:6.5" : "ravine",
  "C1:7.5" : "ravine",
  "H1:8.2" : "tanahana",
  "H2:9.3" : "tanahana",
  "J5:3.3" : "crockerRdB",
  "J1:2.5" : "crockerRdB",
  "H4:2.5" : "crockerRdB"
}

var birds = {
  crockerRd : {
    name : "Crocker Road",
    birds : ["crockerRdA", "crockerRdB"]
  },
  crockerRdA : {
    name : "Crocker Road First Half (before E3 turn)"
  },
  crockerRdB : {
    name : "Crocker Road Second Half (after E3 turn)"
  },
  forts : {
    name : "The Forts"
  },
  treasure : {
    name : "Treasure Trail"
  },
  outdoorClassroom : {
    name : "Outdoor Classroom"
  },
  gully : {
    name : "The Gully"
  },
  ravine : {
    name : "The Ravine"
  },
  tanahana : {
    name : "Tanahana Trail"
  },
  field : {
    name : "The Field"
  },
  topHalf : {
    name : "Top Half",
    birds : ["crockerRd", "forts", "treasure", "gully", "outdoorClassroom"]
  },
  bottomHalf : {
    name : "Bottom Half",
    birds : ["ravine", "tanahana", "field"]
  }
}

function setupData() {
  data.forEach((bird, i) => {
    bird.rainy = bird.rainy.startsWith("TRUE")

    bird.pos = ["ABCDEFGHIJKLM".indexOf(bird.location[0]), parseInt(bird.location[3])]
    bird.detailPos = [parseInt(bird.location[1]), parseInt(bird.location[5])]
    
    var location = locations[bird.location]

    if (!location) {
      console.warn("Unknown location: " + bird.location)

      return
    }

    birds[location].birds ||= []

    birds[location].birds.push(bird)
  })

  birds.rain = {
    name : "Birds in the Rain",
    birds : data.filter(x => x.rainy)
  }

  birds.unique = {
    name : "Unique Birds",
    birds : [...new Set(data.map(x => x.name))].map(x => data.find(y => y.name === x))
  }

  birds.all = {
    name : "All Birds",
    birds : data
  }
}
