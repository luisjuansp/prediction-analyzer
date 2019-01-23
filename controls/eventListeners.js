function stopPropagation(e) {
  if (e.preventDefault) { e.preventDefault() }
  if (e.stopPropagation) { e.stopPropagation() }
}

function addPoint(offsetX, offsetY, timeStamp, prediction) {
  stroke.unshift({
    offsetX: offsetX,
    offsetY: offsetY,
    timeStamp: timeStamp,
    prediction: prediction
  })
  if (stroke.length > max_stroke_length) {
    stroke.pop()
  }
}

function switchView() {
  analyzing = !analyzing
  if (analyzing) {
    document.querySelectorAll(".painting").forEach(function (elem) {
      elem.classList.add("hidden")
    })
    document.querySelectorAll(".analyzing").forEach(function (elem) {
      elem.classList.remove("hidden")
    })
  } else {
    document.querySelectorAll(".painting").forEach(function (elem) {
      elem.classList.remove("hidden")
    })
    document.querySelectorAll(".analyzing").forEach(function (elem) {
      elem.classList.add("hidden")
    })
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
    case "analyze":
      if (window.RECORDING) {
        document.querySelector("[name=record]").parentNode.click()
      }
      recordedFrameIndex = 0
      trimRecording()
      addFuturePoints()
      switchView()
      displayError()
      break
    case "paint":
      switchView()
      stroke = []
      break
    case "firstFrame":
      recordedFrameIndex = 0
      displayError()
      break
    case "backFrame":
      recordedFrameIndex = Math.max(recordedFrameIndex - 1, 0)
      displayError()
      break
    case "frontFrame":
      recordedFrameIndex =
        Math.min(recordedFrameIndex + 1, recordedFrames.length - 1)
      displayError()
      break
    case "endFrame":
      recordedFrameIndex = recordedFrames.length - 1
      displayError()
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
    addPoint(e.offsetX, e.offsetY, e.timeStamp, [])
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
          addPoint(e.offsetX, e.offsetY, e.timeStamp)
        })
      } else {
        addPoint(e.offsetX, e.offsetY, e.timeStamp)
      }
      if (e.getPredictedEvents) {
        stroke[0].prediction = e.getPredictedEvents()
      }
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

  let lineTypeInput = document.querySelector("[name='lineType']")
  lineTypeInput.addEventListener("input", function (e) {
    lineType = e.target.value
  })
  lineType = lineTypeInput.value

  let inkColorInput = document.querySelector("[name='inkColor']")
  inkColorInput.addEventListener("input", function (e) {
    inkColor = e.target.value
  })
  inkColor = inkColorInput.value

  let predColorInput = document.querySelector("[name='predColor']")
  predColorInput.addEventListener("input", function (e) {
    predColor = e.target.value
  })
  predColor = predColorInput.value

  let futureColorInput = document.querySelector("[name='futureColor']")
  futureColorInput.addEventListener("input", function (e) {
    futureColor = e.target.value
  })
  futureColor = futureColorInput.value

  let replaySpeedInput = document.querySelector("[name='replaySpeed']")
  replaySpeedInput.addEventListener("input", function (e) {
    recordedFrameIndexMod = e.target.value / 100
    document.getElementById('replaySpeedSpan').textContent = e.target.value
  })
  recordedFrameIndexMod = replaySpeedInput.value / 100

  coalescedEnabled = document.querySelector("[name='coalesce']").value
})