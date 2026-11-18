const settings = {
  // ACCESSIBILITY
  noScrollbars : {
    name : "Hide scrollbars",
    desc : "(May not show scrollbars when turned off)",
    type : "boolean",
    category : "a11y",
    apply() {
      if (getSetting("noScrollbars"))
        document.body.classList.remove("show-scrollbars")
      else
        document.body.classList.add("show-scrollbars")
    },
    default : "yes"
  },
  contrast : {
    name : "Increase contrast",
    type : "boolean",
    category : "a11y",
    apply() {
      updateA11yFilters()
    }
  },
  invert : {
    name : "Invert colors",
    type : "boolean",
    category : "a11y",
    apply() {
      updateA11yFilters()
    }
  },
  // MISC
  highGraphics : {
    name : "High quality graphics",
    desc : "Render the homepage background at a higher quality",
    type : "boolean",
    category : "misc",
    default : "yes"
  },
  preloading : {
    name : "Preload links on hover",
    desc : "When you hover over a link, the page is loaded in the background",
    type : "select",
    category : "misc",
    options : {
      no : "never",
      nav : "in sidebar",
      yes : "always"
    },
    default : "nav"
  }
}

for (let i in settings) {
  let value = localStorage.getItem(`setting/${i}`)

  if (value && isValidSettingValue(i, value)) {
    settings[i].value = value
    settings[i].apply?.()
  } else
    settings[i].value = defaultSettingValue(i)
}

function isValidSettingValue(name, value) {
  let type = settings[name].type

  if (type === "boolean")
    return typeof value === "boolean" || value === "yes" || value === "no"
  else if (type === "select")
    return value in settings[name].options
}

function defaultSettingValue(name) {
  if (settings[name].default)
    return settings[name].default

  let type = settings[name].type

  if (type === "boolean")
    return "no"
  else if (type === "select")
    return Object.keys(settings[name].options)[0]
}

function getSetting(name) {
  if (settings[name].type === "boolean")
    return settings[name].value === "yes"
  
  return settings[name].value
}

function setSetting(name, value, update = true) {
  if (settings[name].type === "boolean" && typeof value === "boolean")
    value = value ? "yes" : "no"

  settings[name].value = value
  localStorage.setItem(`setting/${name}`, value)

  if (update) settings[name].apply?.()
}

function attemptSetSetting(name, value, update = true) {
  if (isValidSettingValue(name, value)) {
    setSetting(name, value, update)

    return true
  }

  return false
}

function getAllSettings() {
  return settings
}

function updateA11yFilters() {
  let filters = []

  if (getSetting("contrast"))
    filters.push("contrast(150%)")

  if (getSetting("invert"))
    filters.push("invert(1)")

  document.body.style.filter = filters.join(" ")
}
