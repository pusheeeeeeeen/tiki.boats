const categoryNames = {
  a11y : "Accessibility",
  misc : "Miscellaneous"
}

let settings = parent.getAllSettings()

let categories = [...new Set(Object.values(settings).map(x => x.category))],
    categoryElems = Object.fromEntries(
      categories.map(name => {
        let elem = createElem("div.category"),
            header = createElem("h1")
  
        header.innerText = categoryNames[name]
        elem.append(header)

        id("settings").append(elem)
  
        return [name, elem]
      })
    )

for (let name in settings)
  displaySetting(name, settings[name])

function displaySetting(settingName, data) {  
  let {type, name, options} = data,
      value = parent.getSetting(settingName)

  let elem = createElem(`${type === "select" ? "div" : "button"}.setting.reset`),
      nameElem = `<span class = "setting-name">${name}</span>`,
      descElem = data.desc ? `<div class = "setting-desc">${data.desc}</div>` : ""

  if (type === "boolean") {
    elem.innerHTML = `
      <div class = "checkbox${value ? " checked" : ""}">
        <icon image = "check"></icon>
      </div>
      <div>
        ${nameElem}
        ${descElem}
      </div>
    `

    elem.classList.add("flex")

    let checkbox = elem.querySelector(".checkbox")

    elem.onclick = e => {
      checkbox.classList.toggle("checked")
      
      parent.setSetting(settingName, checkbox.classList.contains("checked"))
    }
  } else if (type === "select") {
    elem.innerHTML = `
      ${nameElem}
      <select>
        ${Object.entries(options).map(x => `<option value = "${x[0]}">${x[1]}</option>`)}
      </select>
      ${descElem}
    `

    let select = elem.querySelector("select")
    
    select.oninput = e => {
      parent.setSetting(settingName, e.target.value)
    }
  }

  categoryElems[data.category].append(elem)
}
