const characterData = {
  player: {
    uuid: "player",
    name: "--player name--",
    customComponentText: "selector:'@p'",
    color: "gray",
    bold: false,
    save: false
  }
}

function addCharacter(data = null) {
  data ||= {
    uuid: crypto.randomUUID(),
    name: "",
    color: "white",
    bold: false
  }
  
  characterData[data.uuid] = data
}

function editCharacter(uuid, newData) {
  Object.assign(characterData[uuid], newData)
  updateCharacterDropdowns()
}
