onclick = e => {
  if (e.target.classList.contains("copy")) {
    let output = e.target.nextElementSibling
    if (output?.classList.contains("out")) {
      navigator.clipboard.writeText(output.innerText)
    }
  }
}
