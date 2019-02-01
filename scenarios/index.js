let columns = 0
let recordedFrames = []
let reader = new FileReader()
let predictionTypeArray = ["defaultPred"]

window.onload = function () {
  document.querySelector('.add').addEventListener("click", function () {
    document.querySelector("#file").click()
  })

  document.querySelector("#file").addEventListener('input', function (e) {
    if (e.target.files && e.target.files.length) {
      reader.readAsText(e.target.files[0])
    }
  })
}

function remove(e) {
  e.target.classList.remove("remove")
  let column = e.target.className
  document.querySelectorAll('.' + column).forEach(function (elem) {
    elem.parentNode.removeChild(elem)
  })
}

reader.onload = function (e) {
  recordedFrames = JSON.parse(reader.result)
  addFuturePoints()
  let scenarioName =
    document.querySelector("#file").files.length ?
      document.querySelector("#file").files[0].name : "Scenario"

  let column = 'col' + columns++
  let table = document.querySelector('.table')
  table.innerHTML += '<div class="cell ' + column + ' title">' + scenarioName +
    '<div class="remove ' + column + '" onclick="remove(event)">Remove</div></div>'

  predictionTypeArray.forEach(function (type) {
    let predTime = posError = timeError = lineError = angleError = 0
    for (let j = 0; j < recordedFrames.length; j++) {
      const frame = recordedFrames[j];
      if (frame.stroke[0][type].prediction.length) {
        predTime += (
          frame.stroke[0][type].prediction.get(-1).timeStamp -
          frame.stroke[0].timeStamp
        )
      }
      posError += frame[type].avgPosError
      timeError += frame[type].avgTimeError
      lineError += frame[type].avgLineError
      angleError += frame[type].avgAngleError
    }

    predTime /= recordedFrames.length
    posError /= recordedFrames.length
    timeError /= recordedFrames.length
    lineError /= recordedFrames.length
    angleError /= recordedFrames.length

    table.innerHTML += '<div class="cell ' + column + ' ' + type + '"> ' +
      '<div class="stat">Avg. Time Predicted: ' + predTime + '</div>' +
      '<div class="stat">Avg. Position Error: ' + posError + '</div>' +
      '<div class="stat">Avg. Time Error: ' + timeError + '</div>' +
      '<div class="stat">Avg. Line Error: ' + lineError + '</div>' +
      '<div class="stat">Avg. Angle Error: ' + angleError + '</div>' +
      '</div>'
  })
};

// Function to shorten the code when accessing arrays from the end. When a
//    negative value is provided, it starts counting from the back.
//    Using this as a standard instead of [] to be consistent
Array.prototype.get = function (index = 0) {
  return (index >= 0) ?
    this[index] :
    this[this.length + index]
}