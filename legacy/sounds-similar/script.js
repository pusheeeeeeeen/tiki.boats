var rawFile = new XMLHttpRequest(), data, noPlural
rawFile.overrideMimeType("application/json")
rawFile.open("GET", "./data.json", true)
rawFile.onreadystatechange = () => {
  if (rawFile.readyState === 4 && rawFile.status === 200) {
    data = JSON.parse(rawFile.responseText)

    noPlural = data.NO_PLURAL
    delete data.NO_PLURAL
    
    id("input").oninput = encode
  }
}
rawFile.send(null)

function encode() {
  var input = id("input").value, output = "",
      words = [...input.matchAll(/(\b|^)([\w']+)(\b|$)/g)].map(x => x[2])

  for (let i = 0; i < words.length; i++) {
    if (words[i + 1] && data[(words[i] + " " + words[i + 1]).toLowerCase()]) {
      words.splice(i, 2, words[i] + " " + words[i + 1])

      i--
      continue
    }
    
    var origWord = words[i].toLowerCase()
        word = data[origWord], plural = "",
        index = input.indexOf(words[i])

    if (!word && origWord.endsWith("s")) {
      if (data[origWord.slice(0, -1)] && !noPlural.includes(origWord.slice(0, -1))) {
        word = data[origWord.slice(0, -1)]

        plural = "s"
      } else if (origWord.endsWith("es") && data[origWord.slice(0, -2)] && !noPlural.includes(origWord.slice(0, -2))) {
        word = data[origWord.slice(0, -2)]

        plural = "es"
      }
    }

    if (word) output += input.slice(0, index) + capitalize(word + plural, words[i])
    else output += input.slice(0, index + origWord.length)

    input = input.slice(index + origWord.length)
  }

  id("output").text(output)
}

function capitalize(word, origWord) {
  if (origWord.toUpperCase() === origWord) return word.toUpperCase()
  else if (origWord[0].toUpperCase() === origWord[0]) return word[0].toUpperCase() + word.slice(1)
  
  return word
}
