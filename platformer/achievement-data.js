const achievements = {
  // COMPLETE __ RUNS
  runCount0 : {
    group : "runCount",
    title : "First time's the charm",
    desc : "Complete your first run",
    skin : "green",
    condition : () => game.stats.totalDeaths >= 1
  },
  runCount1 : {
    group : "runCount",
    title : "Morning Jog",
    desc : "Complete 10 runs",
    skin : "blue",
    condition : () => game.stats.totalDeaths >= 10
  },
  runCount2 : {
    group : "runCount",
    title : "The answer to life",
    desc : "Complete 42 runs",
    condition : () => game.stats.totalDeaths >= 42
  },
  runCount3 : {
    group : "runCount",
    title : "Practice makes perfect",
    desc : "Complete 100 runs",
    condition : () => game.stats.totalDeaths >= 100,
    skin : "purple"
  },
  runCount4 : {
    group : "runCount",
    title : "Consistency is key",
    desc : "Complete 500 runs",
    condition : () => game.stats.totalDeaths >= 500
  },
  runCount5 : {
    group : "runCount",
    title : "Just to annoy anyone who makes it this far:",
    desc : "Complete 1,001 runs",
    condition : () => game.stats.totalDeaths >= 1_001,
    skin : "pink"
  },
  runCount4200 : {
    group : "runCount",
    title : "The answer to life is Pusheen",
    desc : "Complete 4,200 runs",
    condition : () => game.stats.totalDeaths >= 4_200,
    skin : "pusheen"
  },
  runCount6 : {
    group : "runCount",
    title : "Back on track",
    desc : "Complete 5,000 runs",
    condition : () => game.stats.totalDeaths >= 5_000
  },
  runCount7 : {
    group : "runCount",
    title : "It's over 9000",
    desc : "Complete 9,001 runs",
    condition : () => game.stats.totalDeaths >= 9_001
  },
  runCount8 : {
    group : "runCount",
    title : "I think it might be time to stop",
    desc : "Complete 10,000 runs",
    condition : () => game.stats.totalDeaths >= 10_000
  },
  // REACH SCORE __
  minScore0 : {
    group : "minScore",
    title : "Better than nothing...",
    desc : "Reach a score of 10",
    condition : () => game.level?.score >= 10
  },
  minScore1 : {
    group : "minScore",
    title : "A handful of points",
    desc : "Reach a score of 25",
    condition : () => game.level?.score >= 25,
    skin : "red"
  },
  minScore2 : {
    group : "minScore",
    title : "Getting good",
    desc : "Reach a score of 50",
    condition : () => game.level?.score >= 50,
    skin : "orange"
  },
  minScore3 : {
    group : "minScore",
    title : "Got good",
    desc : "Reach a score of 100",
    condition : () => game.level?.score >= 100,
    skin : "yellow"
  },
  minScore4 : {
    group : "minScore",
    title : "Slow and steady",
    desc : "Reach a score of 250",
    condition : () => game.level?.score >= 250
  },
  minScore5 : {
    group : "minScore",
    title : "When does it end?",
    desc : "Reach a score of 500",
    condition : () => game.level?.score >= 500
  },
  minScore6 : {
    group : "minScore",
    title : "You're probably cheating",
    desc : "Reach a score of 1,000",
    condition : () => game.level?.score >= 1_000
  },
  // RUN __ METERS TOTAL
  totalDist0 : {
    group : "totalDist",
    title : "Take a walk",
    desc : "Run a total of 1,000 meters",
    condition : () => game.stats.totalDistance >= 1_000
  },
  totalDist1 : {
    group : "totalDist",
    title : "Now we're getting somewhere",
    desc : "Run a total of 10,000 meters",
    condition : () => game.stats.totalDistance >= 10_000
  },
  totalDist2 : {
    group : "totalDist",
    title : "Cross country champion",
    desc : "Run a total of 100,000 meters",
    condition : () => game.stats.totalDistance >= 100_000,
    skin : "fire"
  },
  totalDist3 : {
    group : "totalDist",
    title : "Millionaire Runner",
    desc : "Run a total of 1,000,000 meters",
    condition : () => game.stats.totalDistance >= 1_000_000
  },
  totalDistEarth : {
    group : "totalDist",
    title : "Run around the earth",
    desc : "Run a total of 40,074,275 meters (24,901 miles)",
    condition : () => game.stats.totalDistance >= 40_074_275,
    skin : "earth"
  },
  // SURVIVE __ (size) PLATFORMS
  surviveTiny0 : {
    group : "survivePlatforms",
    title : "Precision platforming",
    desc : "Survive 50 tiny platforms",
    condition : () => game.stats.platformsSurvivedBySize.s >= 50
  },
  surviveTiny1 : {
    group : "survivePlatforms",
    title : "Microscopic",
    desc : "Survive 500 tiny platforms",
    condition : () => game.stats.platformsSurvivedBySize.s >= 500,
    skin : "steve"
  },
  surviveTiny2 : {
    group : "survivePlatforms",
    title : "Superhuman",
    desc : "Survive 2,500 tiny platforms",
    condition : () => game.stats.platformsSurvivedBySize.s >= 2_500
  },
  surviveSmall0 : {
    group : "survivePlatforms",
    title : "Shrinking",
    desc : "Survive 100 small platforms",
    condition : () => game.stats.platformsSurvivedBySize.m >= 100
  },
  surviveSmall1 : {
    group : "survivePlatforms",
    title : "Tight squeeze",
    desc : "Survive 1,000 small platforms",
    condition : () => game.stats.platformsSurvivedBySize.m >= 1_000
  },
  surviveSmall2 : {
    group : "survivePlatforms",
    title : "Strength in numbers",
    desc : "Survive 5,000 small platforms",
    condition : () => game.stats.platformsSurvivedBySize.m >= 5_000
  },
  surviveNormal0 : {
    group : "survivePlatforms",
    title : "Business as usual",
    desc : "Survive 100 normal-sized platforms",
    condition : () => game.stats.platformsSurvivedBySize.l >= 100
  },
  surviveNormal1 : {
    group : "survivePlatforms",
    title : "Another one down",
    desc : "Survive 1,000 normal-sized platforms",
    condition : () => game.stats.platformsSurvivedBySize.l >= 1_000
  },
  surviveNormal2 : {
    group : "survivePlatforms",
    title : "Golden standard",
    desc : "Survive 5,000 normal-sized platforms",
    condition : () => game.stats.platformsSurvivedBySize.l >= 5_000
  },
  surviveLarge0 : {
    group : "survivePlatforms",
    title : "The bigger the better",
    desc : "Survive 100 large platforms",
    condition : () => game.stats.platformsSurvivedBySize.x >= 100
  },
  surviveLarge1 : {
    group : "survivePlatforms",
    title : "Breathing room",
    desc : "Survive 1,000 large platforms",
    condition : () => game.stats.platformsSurvivedBySize.x >= 1_000
  },
  surviveLarge2 : {
    group : "survivePlatforms",
    title : "The biggest the bestest",
    desc : "Survive 5,000 large platforms",
    condition : () => game.stats.platformsSurvivedBySize.x >= 5_000
  },
  surviveAll : {
    group : "survivePlatforms",
    title : "All forms of platforms",
    desc : "Survive 20,000 platforms",
    condition : () => game.stats.platformsSurvived >= 20_000
  },
  // SKIP __ PLATFORMS
  skip0 : {
    group : "skipPlatforms",
    title : "Shortcut",
    desc : "Skip a platform",
    condition : () => game.stats.platformsSkipped >= 1
  },
  skip1 : {
    group : "skipPlatforms",
    title : "Cutting corners",
    desc : "Skip 50 platforms",
    condition : () => game.stats.platformsSkipped >= 50
  },
  skip2 : {
    group : "skipPlatforms",
    title : "Peak efficiency",
    desc : "Skip 200 platforms",
    condition : () => game.stats.platformsSkipped >= 200
  },
  // HAVE __ COINS
  coins0 : {
    group : "coins",
    title : "Got some money",
    desc : "Obtain a coin",
    condition : () => game.stats.totalCoins >= 1
  },
  coins1 : {
    group : "coins",
    title : "Got some cash",
    desc : "Obtain 50 coins",
    condition : () => game.stats.totalCoins >= 50
  },
  coins2 : {
    group : "coins",
    title : "Inflation",
    desc : "Obtain 500 coins",
    condition : () => game.stats.totalCoins >= 500
  },
  coins3 : {
    group : "coins",
    title : "I'm rich and now I'm sad",
    desc : "Obtain 5000 coins",
    condition : () => game.stats.totalCoins >= 5000
  },
  totalCoins0 : {
    group : "coins",
    title : "Oo, shiny!",
    desc : "Have 100 coins at one time",
    condition : () => game.stats.coins >= 100
  },
  // DIE WITH EXACTLY __ METERS RAN
  dist100Exact : {
    group : "exactMeters",
    title : "Benjamin Franklin",
    desc : "Die with exactly 100 meters of distance ran",
    condition : () => game.level.distance === 100
  },
  // GET __ SCORE BEFORE __ METERS
  scoreInDist : {
    group : "scoreInDist",
    title : "We're really not sure how hard this is, but if it's possible it's pure luck",
    desc : "Get to 50 score before reaching 250 meters",
    skin : "rainbow",
    condition : () => game.level.score >= 50 && game.level.distance < 250
  },
  // MISC
  midairCoin : {
    title : "Fly-by",
    desc : "Collect a coin from the top of a platform, without touching the platform"
  },
  instantJump : {
    title : "Touch and go",
    desc : "Jump off of a platform as soon as you land, without holding down the jump key"
  }
}
