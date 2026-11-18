let choices

function showQuestion(question) {
  return new Promise(resolve => {
    id("form").innerHTML = generateQuestionHTML(question)

    updateIconElements(id("form"))
  
    for (let i of id("form").querySelectorAll(".answer-wrapper"))
      i.onclick = () => {
        id("form").querySelector(".answers").style.pointerEvents = "none"

        i.classList.add("chosen")
        
        setTimeout(() => {
          i.children[1].style.outline = "none"
        }, 50)
        setTimeout(() => {
          i.children[1].style.outline = ""
          classFirst("question").classList.add("fade")
        }, 200)

        let answerObj = question.answers[i.dataset.index]

        answerObj.onClick?.()
        
        choices[question.id] = {
          id : answerObj.id,
          text : answerObj.text
        }

        console.log(JSON.stringify(choices, null, 4))

        if (!answerObj.special)
          setTimeout(async () => {
            if (answerObj.questions)
              await showQuestionList(answerObj.questions)
            
            resolve()
          }, 700)
      }
  })
}

function generateQuestionHTML(question) {
  let subtitle

  if (question.subtitle)
    subtitle = typeof question.subtitle === "function"
      ? question.subtitle()
      : question.subtitle
  
  return `
    <div class = "question">
      <h2>${question.text}</h2>
      ${subtitle ? `<div class = "subtitle">${subtitle}</div>` : ""}
      <div class = "answers">
        ${generateAnswerHTML(question.answers, question.id)}
      </div>
    </div>
  `
}

function generateAnswerHTML(answers, questionId) {
  return answers.map((x, index) => !x.showIf || x.showIf(choices) ? `
    <button class = "reset answer-wrapper" data-index = "${index}">
      <icon image = "arrow-right" class = "answer-select-icon"></icon>
      <div class = "answer">
        <span>${x.text}</span>
      </div>
    </button>
  ` : "").join("")
}

async function showQuestionList(questions) {
  for (let i of questions) {
    if (i.showIf && !i.showIf(choices)) continue

    await showQuestion(i)
  }
}

async function start(showTitle) {
  if (showTitle)
    await showQuestion(startQuestion)
  else
    await showQuestionList(questions)

  showQuestion(restartQuestion)
}

const riceAdjectives = {
  burnt : "slightly crunchy",
  bland : "flavorless",
  saturatedMeat : "meat sauce–saturated",
  saturatedSquash : "squash water–saturated"
}
const mashedPotatoLikelihood = {
  yes : "probably",
  no : "doubtfully",
  maybe : "might"
}
const vegetableAdjectives = {
  broccoli_steamed : "steamed, disturbingly floppy, and unseasoned",
  broccoli_undercooked : "undercooked, rubbery, and unseasoned",
  brussels_moist : "weirdly moist and unseasoned",
  brussels_burnt : "slightly burnt and potentially salted",
  squash_watery : "watery and unseasoned",
  squash_extraWatery : "<i>very</i> watery and unseasoned"
}

function generateLunchText(choices) {
  if (choices.main.id === "mexican")
    return `
      <b>${choices.meat.text.replace(" (supposedly)", "")}</b><br>
      on a <b>soggy ${choices.tortilla.id === "corn" ? "corn" : "flour"} tortilla</b><br>
      with lots and <i>lots</i> of <b>beans</b>.
    `
  else {
    let meat = choices._meatless
          ? choices.meatSubstitution.text.replace(/\(also (.+)\)/, "$1").replace("??", "")
          : choices.meat.text.replace("similarly questionable", "concerningly oily"),
        vegetableAdjective = vegetableAdjectives[`${choices.vegetable.id}_${choices.vegetableStyle.id}`],
        carbs = choices.carbs.id === "rice"
          ? `${riceAdjectives[choices.riceStyle.id]} rice`
          : `powdered mashed potatoes that ${mashedPotatoLikelihood[choices.realPotato.id]} contain actual potato`
    
    return `
      <b>${meat}</b><br>
      with <b>${vegetableAdjective} ${choices.vegetable.id.replace("brussels", "brussels sprouts")}</b><br>
      and <b>${carbs}</b>
    `
  }
}

start(true)
