const uiData = {
  start : {
    bg : ui => {
      stripeBg(colors.blueStripeDark, colors.blueStripeLight, {opacity : ui.opacity})
    },
    buttons : [
      {
        x : () => width / 2,
        y : () => height * 0.4,
        image : button => button.ui === game?.fadingUI ? "playPressed" : "play",
        tint : colors.green,
        click : ui => {
          game.start((ui.seedInputShown && id("seed-input").value) || null)
  
          game.hideUI(ui)
          playSong(intro)
        }
      },
      {
        x : () => width / 2 - 300,
        y : () => height * 0.4 - 40,
        image : button => button.pressed ? "smallBtnPressed" : "smallBtn",
        overlay : () => sfx ? "sound" : "noSound",
        tint : colors.green,
        click : toggleSfx
      },
      {
        x : () => width / 2 - 300,
        y : () => height * 0.4 + 40,
        image : button => button.pressed ? "smallBtnPressed" : "smallBtn",
        overlay : () => music ? "music" : "noMusic",
        tint : colors.green,
        click : toggleMusic
      },
      {
        x : () => width / 2 + 300,
        y : () => height * 0.4,
        image : button => button.pressed ? "smallBtnPressed" : "smallBtn",
        overlay : "ellipsis",
        drawIf : button => !button.ui.seedInputShown,
        tint : colors.green,
        click : ui => {
          id("seed-wrapper").classList.remove("hidden")

          ui.seedInputShown = true
        }
      }
    ],
    onshow : () => {
      id("skins").classList.remove("hidden")
      
      stopSong(song)
    
      id("achievements-button").classList.remove("hidden")
    },
    onhide : ui => {
      id("skins").classList.add("hidden")
      id("seed-wrapper").classList.add("hidden")
      
      ui.seedInputShown = false
      
      id("achievements-button").classList.add("hidden")
    }
  },
  pause : {
    bg : ui => {
      stripeBg(colors.greenStripeDark, colors.greenStripeLight, {opacity : ui.opacity * 0.7})

      image(...fullscreenImageCoords(images.pipeBackground), images.pipeBackground, {opacity : ui.opacity})
    },
    buttons : [
      {
        x : () => width / 2 - Math.max(200, width * 0.2),
        y : () => height / 2,
        image : button => button.pressed ? "smallBtnPressed" : "smallBtn",
        overlay : "home",
        tint : colors.blue,
        click : ui => {
          game.hideUI(ui)
          
          game.level = null
          
          hidePauseButton()
          
          setTimeout(() => {
            id("pause-button").innerText = "Pause"
            paused = false
          }, 200)
          stopSong(song)
          stopSong(intro)

          game.showUI("start")
        }
      }
    ],
    onshow : () => {
      id("skins").classList.remove("hidden")
      
      id("menu-info").classList.remove("hidden")
      game.updateMenuInfo()
      
      id("achievements-button").classList.remove("hidden")
    },
    onhide : () => {
      id("skins").classList.add("hidden")
      id("menu-info").classList.add("hidden")
      
      id("achievements-button").classList.add("hidden")
    }
  },
  death : {
    bg : ui => {
      stripeBg(colors.redStripeDark, colors.redStripeLight, {opacity : ui.opacity * 0.4})

      image(...fullscreenImageCoords(images.pipeBackground), images.pipeBackground, {opacity : ui.opacity})
    },
    buttons : [
      {
        x : () => width / 2 + Math.max(200, width * 0.2),
        y : () => height / 2,
        image : button => button.pressed ? "smallBtnPressed" : "smallBtn",
        overlay : () => "playIcon",
        tint : colors.green,
        click : ui => {
          game.start()
        
          game.hideUI(ui)
        }
      },
      {
        x : () => width / 2 + Math.max(200, width * 0.2) + 80,
        y : () => height / 2,
        image : button => button.pressed ? "smallBtnPressed" : "smallBtn",
        overlay : "retry",
        tint : colors.green,
        click : ui => {
          game.start(game.level.rawSeed)

          game.hideUI(ui)
        }
      },
      {
        x : () => width / 2 - Math.max(200, width * 0.2),
        y : () => height / 2,
        image : button => button.pressed ? "smallBtnPressed" : "smallBtn",
        overlay : "home",
        tint : colors.green,
        click : ui => {
          game.hideUI(ui)

          game.showUI("start")
        }
      }
    ],
    onshow : () => {
      id("menu-info").classList.remove("hidden")
      game.updateMenuInfo()
    
      id("achievements-button").classList.remove("hidden")
    },
    onhide : () => {
      id("menu-info").classList.add("hidden")
    
      id("achievements-button").classList.add("hidden")
    }
  },
  achievements : {
    bg : ui => {
      stripeBg(colors.blackStripeDark, colors.blackStripeLight, {opacity : ui.opacity})
    },
    buttons : [
      
    ],
    onshow : ui => {
      game.updateMenuStats()
      
      id("achievements").classList.remove("hidden")

      ui.pauseButtonShown = showingPauseButton
      hidePauseButton()
    },
    onhide : ui => {
      id("achievements").classList.add("hidden")

      if (ui.pauseButtonShown)
        showPauseButton()
    }
  }
}
