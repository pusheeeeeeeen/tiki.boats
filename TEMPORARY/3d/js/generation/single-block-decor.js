function generateSingleBlockDecor(chunkX, chunkZ, layout, columnData) {
  for (let x = 0; x < chunkSize; x++)
    for (let z = 0; z < chunkSize; z++) {
      let data = columnData[x][z]

      if (data.biome !== "plains")
        continue

      if (Math.random() < 0.4)
        layout[data.height + 1][x][z].block = "shortGrass"
    }
}
