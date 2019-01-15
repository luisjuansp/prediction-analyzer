// STROKE VARIABLES AND PROPERTIES
let stroke = []
let max_stroke_length = 30

// PAINTING VARIABLES
let inking = false
let coalescedEnabled = false
let predictionType = false
let inkColor = false
let inkPredColor = false

// ANALYZING VARIABLES
let analyzing = false
let inkColorReplay = false
let predColorReplay = false
let futureColorReplay = false
let predLine = false
let predFitting = false
let recordedFrames = []
let recordedFrameIndex = 0
let recordedFrameIndexMod = 1
let isPlaying = false

// ZOOMING VARIABLES
let zoomEnabled = false
let zoomX = Infinity
let zoomY = Infinity
let zoomWidth = 0
let zoomHeight = 0

function paint(timestamp) {

  if (analyzing) {
    correctRatio(replay)
    if (zoomEnabled) {
      doZoom()
    }
    drawBackground(replay)
    drawFrame(replay)
    if (zoomEnabled) {
      unzoom(replay, zoomX, zoomY, zoomWidth, zoomHeight)
    }
    revertRatio(replay)
  } else {
    drawBackground(paintCtx)
    drawFrame(paintCtx)
  }

  if (window.RECORDING) {
    recordedFrames.push({
      recentPointerEvents: JSON.parse(JSON.stringify(window.recentPointerEvents)),
      predictedPointerEvents: JSON.parse(JSON.stringify(window.predictedPointerEvents)),
      predictedControlPoints: JSON.parse(JSON.stringify(window.predictedControlPoints)),
      type: window.type,
      avgError: window.avgError,
      maxError: window.maxError,
      controlPoints: JSON.parse(JSON.stringify(window.controlPoints)),
      slope: window.slope,// != undefined ? window.slope + 0 : undefined,
      yOn0: window.yOn0,// != undefined ? window.yOn0 + 0 : undefined,
      xSign: window.xSign,
      ySign: window.ySign,
      speed: window.speed,
      stroke: JSON.parse(JSON.stringify(stroke))
    })
  }

  requestAnimationFrame(paint)
}

window.addEventListener("load", function () {
  // DOM RELATED VARIABLES
  window.paintCanvas = document.querySelector('#drawingCanvas')
  window.menu = document.querySelector("#menu")
  window.paintCtx = paintCanvas.getContext("2d")
  paintCanvas.width = parseInt(getComputedStyle(paintCanvas).width)
  paintCanvas.height = parseInt(getComputedStyle(paintCanvas).height)
  window.paintRatio = paintCanvas.width / paintCanvas.height
  window.offsetLeft = paintCanvas.offsetLeft
  window.offsetTop = paintCanvas.offsetTop

  requestAnimationFrame(paint)
})

// Function to shorten the code when accessing arrays from the end. When a
//    negative value is provided, it starts counting from the back.
//    Using this as a standard instead of [] to be consistent
Array.prototype.get = function (index = 0) {
  return (index >= 0) ?
    this[index] :
    this[this.length + index]
}