function generateDirt(chunkX, chunkZ, layout, columnData) {
  for (let x = 0; x < chunkSize; x++)
    for (let z = 0; z < chunkSize; z++) {
      let height = columnData[x][z].height

      if (height >= params.SEA_LEVEL) {
        layout[height][x][z].block = "grass"

        for (let i = 1; i < 4; i++) {
          if (i > height) break

          layout[height - i][x][z].block = "dirt"
        }
      } else {
        for (let y = height + 1; y <= params.SEA_LEVEL; y++)
          layout[y][x][z].block = "water"
      }
    }
}
