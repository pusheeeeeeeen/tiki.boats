var Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    Composite = Matter.Composite

// create an engine
var engine = Engine.create()

// create a renderer
var container = id("canvas-wrapper"),
    render = Render.create({
      element : container,
      engine : engine,
      options : {
        background : "rgba(0, 0, 0, 0)"
      }
    })

render.options.wireframes = false

var c = $("canvas"), ctx = c.getContext("2d")

var width = 0, height = 0
function updateFullscreen() {
  width = container.offsetWidth
  height = container.offsetHeight

  c.style.width = width + "px"
  c.style.height = height + "px"

  c.width = ~~(width * devicePixelRatio)
  c.height = ~~(height * devicePixelRatio)

  ctx.scale(devicePixelRatio, devicePixelRatio)
}

updateFullscreen()

Composite.add(engine.world, [
  Bodies.rectangle(width * 0.5, height - 40, width - 40, 40, {isStatic : true}),
  Bodies.rectangle(40, height * 0.5, 40, height - 40, {isStatic : true}),
  Bodies.rectangle(width - 40, height * 0.5, 40, height - 40, {isStatic : true})
])

// add all of the bodies to the world
// Composite.add(engine.world, [ground]);
var items = [], lastItems = [],
    prices = ["$0 - $50", "$50 - $100", "$100 - $150", "$150 - $200", ">$200"],
    gemIndexes = ["Amethyst", "Emerald", "Ruby", "Sapphire", "Topaz"],
    gems = {
      Ruby : "#ff4f4f",
      Emerald : "#71f577",
      Sapphire : "#4e67d4",
      Amethyst : "#af71de",
      Topaz : "#8fb8bf"
    },
    colors = ["#436fb5", "#43b552", "#dbcd4d", "#e67935", "#eb4c46", "#f794a8", "#cc47c1", "#7e39a3", "#54c0c4", "#cdd4d4"],
    types = [...new Set(data.map(x => x.Type))],
    dataLookup = {
      Cost : prices,
      Gem : gemIndexes,
      Type : types
    }

function update() {    
  var options = {
    color : id("color").value,
    size : id("size").value,
    sides : id("sides").value
  }
  
  items = []
  for (let i of data) {
    var color = options.color === "Gem" ? gems[i.Gem] : colors[dataLookup[options.color].indexOf(i[options.color])],
        size = (dataLookup[options.size].indexOf(i[options.size]) + 2) * 5.5,
        sides = dataLookup[options.sides].indexOf(i[options.sides]) + 3

    var body = Bodies.polygon(innerWidth * (Math.random() * 0.6 + 0.2), Math.random() * innerHeight - 300, sides, size, { render : {
      fillStyle : color
    }})

    body.__data = i
    
    items.push(body)
  }

  Composite.remove(engine.world, lastItems)
  
  lastItems = items
  
  Composite.add(engine.world, items)
}

tagAll("select").forEach(x => x.oninput = update)

update()

// run the renderer
Render.run(render);

// create runner
var runner = Runner.create();

// run the engine
Runner.run(runner, engine);

onresize = updateFullscreen

var mConstraint;
mConstraint = Matter.MouseConstraint.create(engine, options);
Matter.World.add(engine.world, mConstraint);

var mouseX = 0, mouseY = 0, canvas = $("canvas")
onmousemove = event => {
  if (event.target === canvas) {
    mouseX = event.offsetX
    mouseY = event.offsetY
  }
}

// Add event with 'mousemove'
Matter.Events.on(mConstraint, 'mousemove', event => {
  // For Matter.Query.point pass "array of bodies" and "mouse position"
  event.mouse.position.y -= $("canvas").pagePos().top
  
  var body = Matter.Query.point(engine.world.bodies, event.mouse.position)[0];

  if (!body?.__data)
    id("item-info").text("")
  else
    id("item-info").text(`Item: ${body.__data.Item} (${body.__data.Type}), ${body.__data.Cost} made in ${body.__data.Country}, ${body.__data.Gem}`)
});
