var urlSearch = new URLSearchParams(location.search),
    prevPage = urlSearch.get("from"), category = urlSearch.get("category") || "normal"

if (prevPage) id("back-to-prev").href = prevPage
else id("back-to-prev").style.display = "none"

const categoryNames = {
        appearance : "Appearance",
        accessibility : "Accessibility",
        directory : "Directory",
        platformer : "Platformer",
        other : "The… <i>Other</i> Settings",
      }

var categories
if (category === "all") categories = Object.keys(categoryNames)
else if (category && Object.keys(categoryNames).includes(category)) categories = [category]
else categories = ["appearance", "accessibility", "other"]

for (let i of categories) {
  var header = elem("div.header"),
      wrapper = elem("div")

  header.innerHTML = categoryNames[i]

  wrapper.id = i + "-settings"

  id("settings-wrapper").addEnd(header).addEnd(wrapper)
}

for (let data of Object.values(settings)) {
  if (!categories.includes(data.category)) continue
  
  let setting = elem("button.setting.button-reset")

  setting.tabIndex = "0"
  
  setting.onclick = () => {
    data.current = !data.current

    setting.querySelector(".checkbox").src = `${path}icons/checkbox-${data.current ? "yes" : "no"}.svg`

    if (data.current) data.on()
    else data.off()
  }

  setting.html(`
    <img class = "checkbox" src = "${path}icons/checkbox-${data.current ? "yes" : "no"}.svg">
    <div class = "setting-name">${data.name}</div>
  `)

  id(data.category + "-settings").addEnd(setting)
}

id("reset-data").onclick = () => {
  /*query("html").style.overflow = "hidden"
  query("html").style.height = "100%"

  id("popup-background").style.opacity = "1"
  id("popup-background").style.pointerEvents = "all"

  id("data-clear-confirm").style.opacity = "1"
  id("data-clear-confirm").style.pointerEvents = "all"*/
  
  localStorage.clear()

  location.reload()
}

if (category !== "all")
  id("show-all").onclick = () => { location = `./?from=${encodeURIComponent(prevPage)}&category=all` }
else id("show-all").style.display = "none"
