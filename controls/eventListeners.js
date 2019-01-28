function stopPropagation(e) {
  if (e.preventDefault) { e.preventDefault() }
  if (e.stopPropagation) { e.stopPropagation() }
}

function addPoint(offsetX, offsetY, timeStamp) {
  stroke.unshift({
    offsetX: offsetX,
    offsetY: offsetY,
    timeStamp: timeStamp
  })
  if (stroke.length > max_stroke_length) {
    stroke.pop()
  }
}

function addPredictions(point, e) {
  point.defaultPred = {}
  point.none = { prediction: [] }

  if (e.getPredictedEvents) {
    point.defaultPred.prediction = e.getPredictedEvents().map(function (e) {
      return {
        offsetX: e.offsetX,
        offsetY: e.offsetY,
        timeStamp: e.timeStamp
      }
    })
  } else {
    point.defaultPred.prediction = []
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

function makeDataFileUrl(object) {
  var data = new Blob([JSON.stringify(object, null, 2)], { type: 'application/json' });

  // If we are replacing a previously generated file we need to
  // manually revoke the object URL to avoid memory leaks.
  if (dataFileUrl !== null) {
    window.URL.revokeObjectURL(dataFileUrl);
  }

  dataFileUrl = window.URL.createObjectURL(data);

  return dataFileUrl;
}

function showTable() {
  let comparison = document.querySelector('.comparison')
  let table = document.querySelector('.table')
  let predTypeSelect = document.querySelector('[name="predType"]')
  comparison.classList.remove('hidden')
  table.innerHTML = '<div class="cell"></div>' +
    '<div class="cell title timePredCol">Avg. Time Predicted</div>' +
    '<div class="cell title posCol">Avg. Position Error</div>' +
    '<div class="cell title timeCol">Avg. Time Error</div>' +
    '<div class="cell title lineCol">Avg. Line Error</div>' +
    '<div class="cell title angleCol">Avg. Angle Error</div>'

  for (var i = 0; i < predTypeSelect.options.length; i++) {
    const option = predTypeSelect.options[i]
    let predTime = posError = timeError = lineError = angleError = 0
    for (let j = 0; j < recordedFrames.length; j++) {
      const frame = recordedFrames[j];
      if (frame.stroke[0][option.value].prediction.length) {
        predTime += (
          frame.stroke[0][option.value].prediction.get(-1).timeStamp -
          frame.stroke[0].timeStamp
        )
      }
      posError += frame[option.value].avgPosError
      timeError += frame[option.value].avgTimeError
      lineError += frame[option.value].avgLineError
      angleError += frame[option.value].avgAngleError
    }

    predTime /= recordedFrames.length
    posError /= recordedFrames.length
    timeError /= recordedFrames.length
    lineError /= recordedFrames.length
    angleError /= recordedFrames.length

    table.innerHTML += '<div class="cell predCol">' + option.textContent + '</div>' +
      '<div class="cell timePredCol">' + predTime + '</div>' +
      '<div class="cell posCol">' + posError + '</div>' +
      '<div class="cell timeCol">' + timeError + '</div>' +
      '<div class="cell lineCol">' + lineError + '</div>' +
      '<div class="cell angleCol">' + angleError + '</div>'
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
    case "save":
      let element = document.createElement('a')
      element.setAttribute('href', makeDataFileUrl(recordedFrames))
      element.setAttribute('download', "data.json")
      element.style.display = 'none'
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
      break
    case "load":
      document.querySelector("#file").click()
      break
    case "comparison":
      showTable()
      break
  }

  if (input.type == "button" || input.type == "file") {
    input.parentNode.classList.add("selected")
    input.checked = false
    setTimeout(function () {
      input.parentNode.classList.remove("selected")
    }, 100)
  }
}

window.addEventListener("load", function () {
  paintCanvas.addEventListener("pointerdown", function (e) {
    inking = true
    stroke = []
    addPoint(e.offsetX, e.offsetY, e.timeStamp)
    stroke[0].defaultPred = { prediction: [] }
    stroke[0].none = { prediction: [] }
    stopPropagation(e)
  }, false)
  paintCanvas.addEventListener("pointerup", function (e) {
    inking = false
    stopPropagation(e)
  }, false)
  paintCanvas.addEventListener("pointerleave", function (e) {
    inking = false
    stopPropagation(e)
  }, false)

  paintCanvas.addEventListener("pointermove", function (e) {
    if (inking) {
      if (coalescedEnabled && e.getCoalescedEvents) {
        e.getCoalescedEvents().forEach(function (e) {
          addPoint(e.offsetX, e.offsetY, e.timeStamp)
        })
      } else {
        addPoint(e.offsetX, e.offsetY, e.timeStamp)
      }

      addPredictions(stroke[0], e)
    }
    stopPropagation(e)
  }, false)

  document.querySelectorAll(".option").forEach(function (option) {
    option.addEventListener("click", function (e) {
      let input = e.target.querySelector("input")
      if (input) {
        document.querySelectorAll("[name=" + input.name + "]").forEach(function (elem) {
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
    if (analyzing) {
      displayError()
    }
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

  reader.onload = function (e) {
    console.log(reader.result)
    recordedFrames = JSON.parse(reader.result)
    recordedFrameIndex = 0
    displayError()
  };

  document.querySelector("#file").addEventListener('input', function (e) {
    if (e.target.files && e.target.files.length) {
      reader.readAsText(e.target.files[0])
    }
  })

  document.querySelector('.comparison').addEventListener('click', function (e) {
    e.target.classList.add('hidden')
    stopPropagation(e)
  })

  document.querySelector('.table').addEventListener('click', function (e) {
    stopPropagation(e)
  })
})