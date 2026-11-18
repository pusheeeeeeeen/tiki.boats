importScripts("calc-height.js")

function generateShape(chunkX, chunkZ, layout, columnData) {
  for (let x = 0; x < chunkSize; x++)
    for (let z = 0; z < chunkSize; z++) {
      let height = Math.min(
        getTerrainHeight(chunkX + x, chunkZ + z),
        chunkHeight - 1
      )

      let data = columnData[x][z]

      data.height = height

      if (height < params.SEA_FLOOR_MID)
        data.biome = "deepOcean"
      else if (height < params.SEA_LEVEL)
        data.biome = "ocean"
      else
        data.biome = "plains"

      for (let y = 0; y <= height; y++)
        layout[y][x][z].block = "stone"
    }

  // for (let y = 0; y < chunkHeight; y++)
  //   for (let x = 0; x < chunkSize; x++)
  //     for (let z = 0; z < chunkSize; z++) {
  //       if (Math.abs(p.noise((x + chunkX) / 20, y / 20, (z + chunkZ) / 20)) + (0.5 - y * 0.015) > 0.2) {
  //         layout[y][x][z].block = "darkStone"
  //         groundHeights[x][z] = y
  //       }
  //     }
}
