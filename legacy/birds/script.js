var locSelect = id("loc-select")

function start() {
  for (let i of Object.keys(birds)) {
    var option = elem("option").text(birds[i].name)
  
    option.dataset.key = i
  
    if (["all", "unique", "rain"].includes(i)) locSelect.addStart(option)
    else locSelect.addEnd(option)
  }
  
  locSelect.oninput = selected

  locSelect.value = "All Birds"

  selected()
}
  
function selected() {
  viewingBirdLocationsElem.remove()
  
  var data = birds[locSelect.selectedOptions[0].dataset.key]

  id("data").html("")

  id("data").addEnd(parseBird(data))

  id("header").text(locSelect.value)

  id("subtitle").text(categoryInfo(data))
}

function categoryInfo(data) {
  var birdCount = countBirds(data)
  
  return `${birdCount} bird${birdCount === 1 ? "" : "s"}${data.birds && typeof data.birds[0] === "string" ? `, ${data.birds.length} subcategories` : ""}`
}

function countBirds(data) {
  if (!data.birds?.length) return 0
  
  if (data.birds[0].pos) return data.birds.length

  return data.birds.map(x => countBirds(birds[x])).sum()
}

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
function formatDate(date) {
  var [month, day, year] = date.split("/")

  return `${monthNames[month - 1]} ${day}, ${year}`
}

function parseBird(birdData, name = null, birdCount = null) {
  var {pos} = birdData,
      wrapper = elem("div.bird-wrapper")

  if (pos) {
    wrapper.addClasses("_selectable", "true-bird-wrapper")

    if (birdData.rainy) wrapper.addClass("rainy-bird")

    var otherBirdCount = data.filter(x => x.pos[0] === pos[0] && x.pos[1] === pos[1]).length - 1,
        preciseOtherBirdCount = data.filter(x => x.location === birdData.location).length - 1,
        otherLocations = data.filter(x => x.name === birdData.name).length - 1,
        rarityDot = birdData.rarity ? `<span class = "rarity-dot rarity-dot-${birdData.rarity.toLowerCase()}"></span>` : ""
    
    wrapper.addEnd([
      elem("div.bird-name").html(rarityDot + birdData.name),
      elem("div.bird-pos").html(`
        <span class = "line">at ${birdData.location}  &bull; </span>
        <span class = "line">${birds[locations[birdData.location]]?.name || "Unknown location"}</span>
        ${otherLocations ? `<button class = "button-reset line other-locations">and ${otherLocations} other location${otherLocations === 1 ? "" : "s"}</button>` : ""}
        <br>
        <span class = "line" style = "margin-top: 8px;">${birdData.rainy ? "<button class = 'button-reset view-rainy'>Rainy</button>  &bull;  " : ""}${formatDate(birdData.date)} at ${birdData.time} AM</span>
      `), // AM time is hard-coded, if times past noon need to be added, use 24 hr clock and update the data parsing
      elem("div.bird-info-wrapper").addEnd(
        elem(`div.bird-info${birdData.rarity ? `.bird-info-${birdData.rarity.toLowerCase()}` : ""}`).text(
          `${pos[0]}/${"ABCDEFGHIJKLM"[pos[0]]} : ${pos[1]}` +
          `\nPrecise location ${birdData.detailPos.join(":")}` +
          `\n${otherBirdCount} other bird${otherBirdCount === 1 ? "" : "s"} at this location` +
          (preciseOtherBirdCount !== otherBirdCount ? `\n(${preciseOtherBirdCount} precise)` : "") +
          (birdCount !== null ? `\n${birdCount} bird${birdCount === 1 ? "" : "s"} in this group` : "")
        )
      )
    ])

    var otherLocationsElem = wrapper.querySelector(".other-locations"),
        viewRainyElem = wrapper.querySelector(".view-rainy")

    if (otherLocationsElem)
      otherLocationsElem.onclick = () => { showBirdLocations(birdData.name) }

    if (viewRainyElem)
      viewRainyElem.onclick = () => {
        locSelect.value = "Birds in the Rain"

        selected()
      }
  } else {
    if (name) {
      var placeName = elem("div.place-name").text(birdData.name).addEnd(elem("span.bird-count").text(categoryInfo(birdData)))

      placeName.onclick = () => {
        locSelect.value = birdData.name

        selected()
      }
      
      wrapper.addEnd(placeName)
    }

    if (birdData.birds) {
      if (birdData.birds[0]?.pos) wrapper.addClass("bird-list")
      
      wrapper.addEnd(birdData.birds.map(x => parseBird(birds[x] || x, birdData.name, birds[x] ? null : birdData.birds.length)))
    }
  }

  return wrapper
}

var viewingBirdLocationsElem = elem("option").text("Viewing a specific bird")
viewingBirdLocationsElem.dataset.key = "all"

function showBirdLocations(birdName) {
  var matchingBirds = data.filter(x => x.name === birdName),
      wrapper = elem("div.bird-wrapper.bird-list")

  locSelect.addStart(viewingBirdLocationsElem)
  locSelect.value = "Viewing a specific bird"

  for (let i of matchingBirds) {
    let locName = birds[locations[i.location]]?.name,
        birdElem = elem("div.bird-wrapper").addEnd([
          elem("div.bird-name").text(i.location),
          elem("div.bird-pos").html(`<span class = "line">${locName || "Unknown location"}${locName ? "  &bull;  </span><button class = 'button-reset line other-birds'>View this location</button>" : "</span>"}`)
        ])

    if (locName)
      birdElem.querySelector(".other-birds").onclick = () => {
        locSelect.value = locName

        selected()
      }
    
    wrapper.addEnd(birdElem)
  }

  id("data").html("")

  id("data").append(wrapper)

  id("header").text(birdName)

  var otherGroups = new Set(data.filter(x => x.name === birdName).map(x => locations[x.location])).size

  id("subtitle").html(`${matchingBirds.length} locations &bull; ${otherGroups} group${otherGroups === 1 ? "" : "s"}`)
}

var useCompact = !settings.bigText.current
if (useCompact) id("use-compact").checked = true

id("use-compact").oninput = event => {
  useCompact = id("use-compact").checked

  updateCompact()
}

updateCompact()

function updateCompact() {
  if (useCompact)
    id("data").addClass("compact-layout")
  else
    id("data").removeClass("compact-layout")
}
