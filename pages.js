/*

page url (folder name) : {
  name : "Name in Directory"
  title : "Tab Title (defaults to page.name)"
  info : "page info displayed in the directory"
  nav : "all" (default) | "hamburger" | "fade" | "none"
  wip : false (default) | true
  favicon : false (default) | true
}

*/

const pages = {
  home : {
    name : "Homepage",
    title : "Tiki",
    nav : "hamburger"
  },
  directory : {
    name : "Directory",
    title : "Tiki Directory",
    info : "the current page"
  },
  settings : {
    name : "Settings",
    title : "Tiki Settings",
    wip : true
  },
  about : {
    name : "About",
    title : "About Tiki"
  },
  games : {
    name : "Tiki Games",
    wip : true
  },
  platformer : {
    name : "Tiki Platformer 2.0",
    nav : "none"
  },
  "hex-chess" : {
    name : "Hexagonal Chess",
    nav : "hamburger",
    favicon : true
  },
  tetris : {
    name : "Tetris",
    title : "Tiki Tetris",
    nav : "hamburger"
  },
  puzzle : {
    name : "Puzzle",
    title : "Tiki Puzzle",
    info : "multiplayer coming soon (maybe)",
    wip : true
  },
  colorle : {
    name : "Colorle",
    info : "Wordle but colors",
    wip : true
  },
  "wrodle-bot" : {
    name : "Wrodle Bot",
    info : "based on 'Wrodle' from games.shnebir.com"
  },
  keyboard : {
    name : "Keyboard",
    info : "use your computer keyboard as a musical keyboard",
    wip : true
  },
  "olw-answers" : {
    name : "One Letter Wordle Answers",
    info : "upcoming answers to shnebir.com One Letter Wordle"
  },
  "screen-saver" : {
    name : "Screen Saver",
    info : "“drift” macos screensaver",
    nav : "fade"
  },
  "screen-saver-2" : {
    name : "Screen Saver 2",
    info : "less polished but much faster",
    nav : "fade"
  },
  butterbar : {
    name : "Butterbar",
    info : "best enjoyed by those who don’t question it",
    nav : "hamburger"
  },
  pop : {
    name : "Pop",
    title : "Pop!"
  },
  trackpad : {
    name : "Gradient",
    title : "Gradient",
    info : "only works in safari, with a trackpad"
  },
  lunch : {
    name : "Lunch picker",
    title : "Tiki lunch picker",
    info : "pick your school lunch",
    hide : true
  },
  testing : {
    name : "Tiki Testing",
    hide : true
  }
}

////////////////////////////////

const legacyPages = {
  Homepage : {
    link : "" 
  },
  About : {
    link : "about/" 
  },
  Settings : {
    link : "settings/" 
  },
  Directory : {
    link : "directory/"
  },
  "The tiki fish" : {
    link : "tiki-fish/" 
  },
  "Shnebir.com partnership" : {
    link : "partners/" 
  },
  Games : {
    link : "games/" 
  },
  "32 Dice" : {
    link : "games/dice/" 
  },
  Platformer : {
    link : "games/platformer/" 
  },
  Bananagrams : {
    link : "games/bananagrams/" 
  },
  "ZXCVBNM™ image gallery" : {
    link : "zxcvbnm/" 
  },
  "Color of the day" : {
    link : "color-of-the-day/" 
  },
  "Color of the second" : {
    link : "color-of-the-second/" 
  },
  "FishRipple" : {
    link : "fish-ripple/",
    info : "no further explanation needed" 
  },
  "Typing test but it’s just the alphabet" : {
    link : "typing-test/"
  },
  "A selection of colors" : {
    link : "colors/" 
  },
  "All of the possible RGB colors kinda" : {
    link : "all-colors/",
    info : "may or may not actually contain all RGB colors"
  },
  "A thing about carabiners" : {
    link : "carabiner/",
    info : "you have been warned" 
  },
  "Questionable attempt at a “chat”" : {
    link : "chat/",
    info : "does not—at all—work"
  },
  "Homophone translator" : {
    link : "sounds-similar/" 
  },
  "Safari no internet page" : {
    link : "no-internet/" 
  },
  "Visualization with physics" : {
    link : "visualizations/physics/" 
  },
  "Food vs. feed consumption map" : {
    link : "visualizations/map/" 
  },
  "Other visualization thingy" : {
    link : "visualizations/plot/" 
  },
  "A beautiful YouTube video" : {
    link : "cold-food/",
    info : "you have, once again, been warned" 
  },
  "Just a normal page" : {
    link : "why/",
    info : "look in the “sources” tab in the dev tools"
  }
}
