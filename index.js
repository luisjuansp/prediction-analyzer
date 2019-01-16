// STROKE VARIABLES AND PROPERTIES
let stroke = []
let max_stroke_length = 30

// PAINTING VARIABLES
let inking = false
let coalescedEnabled = false
let predictionType = false
let inkColor = false
let predColor = false
let futureColor = false
let lineType = false


// ANALYZING VARIABLES
let analyzing = false
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
    document.querySelectorAll(".canvasView.analyzing canvas").forEach(function (canvas) {
      replay = canvas.getContext('2d')
      correctRatio(replay)
      if (zoomEnabled) {
        doZoom(replay)
      }
      drawBackground(replay)
      drawFrame(replay)
      if (zoomEnabled) {
        unzoom(replay, zoomX, zoomY, zoomWidth, zoomHeight)
      }
      revertRatio(replay)
    })
  } else {
    drawBackground(paintCtx)
    drawFrame(paintCtx)
  }

  if (window.RECORDING) {
    recordedFrames.push({
      stroke: JSON.parse(JSON.stringify(stroke))
    })

    // CLONE PATCH
    if (stroke.length) {
      recordedFrames.get(-1).stroke[0].prediction = stroke[0].prediction
    }
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

  let analyzeCanvas = document.querySelector('.canvasView.analyzing canvas')

  analyzeCanvas.width = paintCanvas.width
  analyzeCanvas.height = paintCanvas.height

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