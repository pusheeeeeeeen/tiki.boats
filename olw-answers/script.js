const ONE_HOUR = 1000 * 60 * 60,
      ONE_DAY = ONE_HOUR * 24

const MONTHS = "January February March April May June July August September October November December".split(" "),
      DAYS_LONG = "Sunday Monday Tuesday Wednesday Thursday Friday Saturday".split(" "),
      DAYS_MEDIUM = "Sun Mon Tue Wed Thu Fri Sat Sun".split(" "),
      DAYS_SHORT = "SMTWTFS".split("")

const container = id("output")

////////////////////////////////

let today = new Date()
today.setMilliseconds(0)
today.setSeconds(0)
today.setMinutes(0)
today.setHours(0)

// let date = new Date("March 18 2024")
let date = new Date(today)
date.setDate(1)

function showYear() {
  let year = date.getFullYear()

  let wrapper = createElem("div.year-wrapper"),
      elem = createElem("h1.year-header")
  
  elem.innerText = year
  wrapper.append(elem)
  
  while (date.getFullYear() === year)
    wrapper.append(getMonth())

  container.append(wrapper)
}

function getMonth() {
  let month = date.getMonth()

  let wrapper = createElem("div.month-wrapper"),
      header = createElem("h2.month-header"),
      days = createElem("div.month")
  
  header.innerText = MONTHS[month]

  days.innerHTML = DAYS_LONG.map((day, i) => `
    <div class = "day-label">
      <div class = "day-long">${day}</div>
      <div class = "day-medium">${DAYS_MEDIUM[i]}</div>
      <div class = "day-short">${DAYS_SHORT[i]}</div>
    </div>
  `).join("")

  while (date.getMonth() === month)
    days.append(...getWeek(month))

  wrapper.append(header, days)

  return wrapper
}

function getWeek(month) {
  let days = []

  let day = date.getDay()
  for (let i = 0; i < day; i++)
    days.push(createDayElem("", ""))

  do
    days.push(createDay())
  while (date.getDay() && date.getMonth() === month)

  if (date.getDay()) {
    let remaining = 7 - date.getDay()
  
    for (let i = 0; i < remaining; i++)
      days.push(createDayElem("", ""))
  }

  return days
}

function createDay() {
  let elem = createDayElem(getLetter(date))

  let dateNum = date.getDate()
  date.setTime(date.getTime() + ONE_DAY)

  // time change
  if (date.getDate() === dateNum)
    date.setTime(date.getTime() + ONE_HOUR)
  else
    date.setHours(0)

  return elem
}

function createDayElem(text, dateNum = date.getDate()) {
  let elem = createElem(`div.day${text === "" ? ".empty" : ""}`)

  elem.innerHTML = `
    <div class = "day-date">
      ${dateNum}
    </div>
    <div class = "day-letter">
      ${text ?? "<div class = 'broken'></div>"}
    </div>
  `

  return elem
}

////////////////////////////////

const LETTERS = "QWERTYUIOPASDFGHJKLZXCVBNM"

function getLetter(date) {
  let seed = Math.round(date.getFullYear() * (date.getMonth() + 1) / date.getDate())
  
  return LETTERS[seed % LETTERS.length]
}

////////////////////////////////

let shown = false
id("more").onclick = () => {
  showYear()
  
  if (!shown) {
    shown = true
    
    id("more").innerText = "show more"
  }
}
