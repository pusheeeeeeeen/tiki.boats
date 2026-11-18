const questions = [
  {
    id : "main",
    text : "What do you want for lunch?",
    answers : [
      {
        id : "mexican",
        text : "Mexican food again??",
        questions : [
          {
            id : "tortilla",
            text : "What tortilla would you like?",
            answers : [
              {
                id : "flour",
                text : "Awkwardly creased flour tortilla covered in bean sauce"
              },
              {
                id : "corn",
                text : "Soggy corn tortilla covered in bean sauce"
              }
            ]
          },
          {
            id : "meat",
            text : "What meat would you like?",
            answers : [
              {
                id : "chicken",
                text : "Fatty chicken pieces"
              },
              {
                id : "beef",
                text : "Dry little (supposedly) beef bits"
              }
            ]
          },
          {
            id : "beans",
            text : "Would you like beans?",
            subtitle : "you cannot escape the beans",
            answers : [
              {
                id : "yes",
                text : "Yes, please!"
              }
            ]
          }
        ]
      },
      {
        id : "other",
        text : "Other",
        questions : [
          {
            id : "meat",
            text : "What meat would you like?",
            answers : [
              {
                id : "beef",
                text : "Beef cubes with concerningly oily sauce"
              },
              {
                id : "mystery",
                text : "Mystery meat cubes with similarly questionable sauce"
              }
            ]
          },
          {
            id : "meatSubstitution",
            text : "Nevermind… its ✨Meatless Monday✨! What would you like instead?",
            answers : [
              {
                id : "tofu",
                text : "Tofu (also with concerningly oily sauce)"
              },
              {
                id : "meatless",
                text : "Meatless meat?? (dry as a bone)"
              }
            ],
            showIf(choices) {
              let show = Math.random() < 0.4

              return choices._meatless = show
            }
          },
          {
            id : "vegetable",
            text : "What vegetable do you want?",
            answers : [
              {
                id : "broccoli",
                text : "Broccoli",
                questions : [
                  {
                    id : "vegetableStyle",
                    text : "How would you like your broccoli cooked?",
                    answers : [
                      {
                        id : "steamed",
                        text : "Steamed and disturbingly floppy, unseasoned"
                      },
                      {
                        id : "undercooked",
                        text : "Undercooked and rubbery, unseasoned"
                      }
                    ]
                  }
                ]
              },
              {
                id : "brussels",
                text : "Brussels Sprouts",
                questions : [
                  {
                    id : "vegetableStyle",
                    text : "How would you like your brussels sprouts cooked?",
                    answers : [
                      {
                        id : "moist",
                        text : "Weirdly moist via a state-of-the-art confidential cooking process, unseasoned"
                      },
                      {
                        id : "burnt",
                        text : "Slightly burnt, may or may not contain trace amounts of salt"
                      }
                    ]
                  }
                ]
              },
              {
                id : "squash",
                text : "Watery squash",
                questions : [
                  {
                    id : "vegetableStyle",
                    text : "How would you like your squash cooked?",
                    answers : [
                      {
                        id : "watery",
                        text : "Watery, unseasoned"
                      },
                      {
                        id : "extraWatery",
                        text : "Extra watery, unseasoned"
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            id : "carbs",
            text : "What carbs do you want?",
            answers : [
              {
                id : "rice",
                text : "Rice",
                questions : [
                  {
                    id : "riceStyle",
                    text : "How would you like your rice?",
                    answers : [
                      {
                        id : "burnt",
                        text : "Slightly crunchy in certain bites"
                      },
                      {
                        id : "bland",
                        text : "Impressively devoid of all flavor"
                      },
                      {
                        id : "saturatedMeat",
                        text : "Thoroughly saturated with concerningly oily sauce",
                        showIf(choices) {
                          return !choices._meatless || choices.meatSubstitution.id === "tofu"
                        }
                      },
                      {
                        id : "saturatedSquash",
                        text : "Thoroughly saturated with excess squash water",
                        showIf(choices) {
                          return choices.vegetable.id === "squash"
                        }
                      }
                    ]
                  }
                ]
              },
              {
                id : "potatoes",
                text : "Powdered mashed potatoes",
                questions : [
                  {
                    id : "realPotato",
                    text : "Do the mashed potatoes actually contain potato?",
                    answers : [
                      {
                        id : "yes",
                        text : "Probably"
                      },
                      {
                        id : "no",
                        text : "Doubt it"
                      },
                      {
                        id : "maybe",
                        text : "We can only hope"
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
]

const startQuestion = {
  id : "start",
  text : "Pick your school lunch",
  answers : [
    {
      id : "start",
      text : "Let's go!",
      questions : questions,
      onClick() {
        choices = {}
      }
    }
  ]
}

const restartQuestion = {
  id : "restart",
  text : "Looks yummy!",
  subtitle : () => {
    return `
      Your lunch:<br><br>
      <span style = "font-style: normal">${generateLunchText(choices)}</span>
      <hr>
    `
  },
  answers : [
    {
      id : "restart",
      text : "Play Again",
      onClick() {
        choices = {}

        // setTimeout(() => {
        //   id("form-reset").classList.add("reset")
          
        //   setTimeout(() => {
        //     id("form-reset").classList.remove("reset")
        //   }, 250)
        // }, 800)

        setTimeout(start, 1200)
      },
      special : true
    }
  ]
}
