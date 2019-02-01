// STROKE VARIABLES AND PROPERTIES
let stroke = []
let max_stroke_length = 30

// PAINTING VARIABLES
let inking = false
let coalescedEnabled = false
let predictionType = false
let predictionTypeArray = []
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
let dataFileUrl = null
let reader = new FileReader()

// ZOOMING VARIABLES
let zoomEnabled = false
let zoomX = Infinity
let zoomY = Infinity
let zoomWidth = 0
let zoomHeight = 0

function paint(timestamp) {

  if (analyzing) {
    document.querySelectorAll(".analyzing .canvasView canvas").forEach(function (canvas) {
      let context = canvas.getContext('2d')
      // let view = canvas.parentElement

      tick()

      correctRatio(context)
      if (zoomEnabled && recordedFrames.length) {
        doZoom(context)
      }

      drawBackground(context)
      drawFrame(context)

      if (zoomEnabled && recordedFrames.length) {
        unzoom(context, zoomX, zoomY, zoomWidth, zoomHeight)
      }
      revertRatio(context)
    })
  } else {
    drawBackground(paintCtx)
    drawFrame(paintCtx)
  }

  if (window.RECORDING) {
    recordedFrames.push({
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

  let analyzeCanvas = document.querySelector('.analyzing .canvasView canvas')

  analyzeCanvas.width = paintCanvas.width
  analyzeCanvas.height = paintCanvas.height

  for (var i = 0; i < document.querySelector('select[name="predType"]').options.length; i++) {
    predictionTypeArray.push(document.querySelector('select[name="predType"]').options[i].value)
  }
  let layout = { width: 10, height: 10 }

  Plotly.newPlot('avgPosErrorPlot', [[]], layout, { displayModeBar: false });
  Plotly.newPlot('avgTimeErrorPlot', [[]], layout, { displayModeBar: false });
  Plotly.newPlot('avgLineErrorPlot', [[]], layout, { displayModeBar: false });
  Plotly.newPlot('avgAngleErrorPlot', [[]], layout, { displayModeBar: false });

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