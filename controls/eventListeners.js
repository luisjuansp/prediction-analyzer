function stopPropagation(e) {
  if (e.preventDefault) { e.preventDefault() }
  if (e.stopPropagation) { e.stopPropagation() }
}

function addPoint(offsetX, offsetY, prediction) {
  stroke.unshift({ offsetX: offsetX, offsetY: offsetY, prediction: prediction })
  if (stroke.length > max_stroke_length) {
    stroke.pop()
  }
}

function switchView() {
  analyzing = !analyzing
  if (analyzing) {
    recordView.classList.remove("hidden")
    viewTools.classList.remove("hidden")
    paintCanvas.classList.add("hidden")
    inputTools.classList.add("hidden")
  } else {
    paintCanvas.classList.remove("hidden")
    inputTools.classList.remove("hidden")
    recordView.classList.add("hidden")
    viewTools.classList.add("hidden")
  }
}

function inputHandler(input) {
  switch (input.name) {
    case "menu":
      menu.classList.remove("invisible")
      break
    case "close":
      menu.classList.add("invisible")
      break
    case "coalesce":
      coalescedEnabled = input.checked
      break
    case "prediction":
      predictionType = input.checked
      break
    case "color":
      predColor = input.checked
      break
    case "line":
      predLine = input.checked
      break
    case "fitting":
      predFitting = input.checked
      break
    case "zoom":
      zoomEnabled = input.checked
      break
    case "play-pause":
      isPlaying = input.checked
      break
    case "record":
      if (!window.RECORDING) {
        recordedFrames = []
      }
      window.RECORDING = input.checked
      break
    case "future":
      if (input.checked) {
        window.PREDICTED_FRAMES = parseFloat(input.value)
      } else {
        window.PREDICTED_FRAMES = 0
      }
      break
    case "playSpeed":
      recordedFrameIndexMod = parseFloat(input.value)
      break
    case "analyze":
      if (window.RECORDING) {
        document.querySelector("[name=record]").parentNode.click()
      }
      recordedFrameIndex = 0
      trimRecording()
      switchView()
      break
    case "paint":
      switchView()
      stroke = []
      break
    case "firstFrame":
      recordedFrameIndex = 0
      break
    case "backFrame":
      recordedFrameIndex = Math.max(recordedFrameIndex - 1, 0)
      break
    case "frontFrame":
      recordedFrameIndex =
        Math.min(recordedFrameIndex + 1, recordedFrames.length - 1)
      break
    case "endFrame":
      recordedFrameIndex = recordedFrames.length - 1
      break
  }

  if (input.type == "button") {
    input.parentNode.classList.add("selected")
    input.checked = false
    setTimeout(() => {
      input.parentNode.classList.remove("selected")
    }, 100)
  }
}

window.addEventListener("load", function () {
  paintCanvas.addEventListener("pointerdown", (e) => {
    inking = true
    stroke = []
    addPoint(e.offsetX, e.offsetY, [])
    stopPropagation(e)
  }, false)
  paintCanvas.addEventListener("pointerup", (e) => {
    inking = false
    stopPropagation(e)
  }, false)
  paintCanvas.addEventListener("pointerleave", (e) => {
    inking = false
    stopPropagation(e)
  }, false)

  paintCanvas.addEventListener("pointermove", (e) => {
    if (inking) {
      if (coalescedEnabled && e.getCoalescedEvents) {
        e.getCoalescedEvents().forEach(e => {
          addPoint(e.offsetX, e.offsetY)
        })
      } else {
        addPoint(e.offsetX, e.offsetY)
      }
      stroke[0].prediction = e.getPredictedEvents()
    }
    stopPropagation(e)
  }, false)

  document.querySelectorAll(".option").forEach(option => {
    option.addEventListener("click", (e) => {
      let input = e.target.querySelector("input")
      if (input) {
        document.querySelectorAll("[name=" + input.name + "]").forEach(elem => {
          elem.parentNode.classList.remove("selected")
        })
        input.checked = !input.checked
        inputHandler(input)
        if (input.checked) {
          e.target.classList.add("selected")
        }
      }
      stopPropagation(e)
    })
  })

  let predType = document.querySelector("[name='predType']")
  predType.addEventListener("input", function (e) {
    predictionType = e.target.value
  })
  predictionType = predType.value

  let inkColorInput = document.querySelector("[name='inkColor']")
  inkColorInput.addEventListener("input", function (e) {
    inkColor = e.target.value
  })
  inkColor = inkColorInput.value

  let inkPredColorInput = document.querySelector("[name='predColor']")
  inkPredColorInput.addEventListener("input", function (e) {
    inkPredColor = e.target.value
  })
  inkPredColor = inkPredColorInput.value

  coalescedEnabled = document.querySelector("[name='coalesce']").value

  document.querySelector("[name='predTime']").addEventListener("input", function (e) {
    document.getElementById('predTimeSpan').textContent = e.target.value
  })
})