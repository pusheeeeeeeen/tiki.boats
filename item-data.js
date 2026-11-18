// use() returns `true` if item was "used" and should be removed from item collection

const itemData = {
  confetti : {
    name : "Party Popper",
    desc : "A short burst of colorful fun!",
    image : "party-popper",
    width : 25,
    cost : 20,
    use() {
      confetti()
      return true
    }
  },
  spear : {
    name : "Spear",
    desc : "The best kind of fishing",
    image : "spear-vertical",
    width : 34,
    cost : 200,
    once : true,
    condition() {
      return parent.getCurrentPage() === "home"
    },
    use() {
      innerIframe.contentWindow?.toggleSpear?.()
    }
  },
  fish : {
    name : "Pet Fish",
    desc : "Just don't think about it too hard… it's only here for testing.",
    image : "tiki-fish",
    width : 140,
    cost : 100,
    condition() { return false },
    hide : true
  }
}
