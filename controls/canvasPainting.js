// GET THE OFFSET COORDINATES FROM THE X AND Y
function getOffsetCoordinates(points) {
  points.forEach(function (e) {
    e.offsetX = e.x - offsetLeft
    e.offsetY = e.y - offsetTop
  })
}

// DRAWS A LINE FROM (X1,Y1) TO (X2,Y2) WITH A GIVEN COLOR AND WIDTH
function drawLine(context, x_from, y_from, x_to, y_to, color, width = 1) {
  context.beginPath()
  context.moveTo(x_from, y_from)
  context.lineTo(x_to, y_to)
  context.strokeStyle = color
  context.lineWidth = width
  context.stroke()
}

// DRAWS THE GRID IN THE BACKGROUND
function drawBackground(context) {
  width = paintCanvas.width * 2
  x_start = -paintCanvas.width
  x_middle = paintCanvas.width / 2
  height = paintCanvas.height * 2
  y_start = -paintCanvas.height
  y_middle = paintCanvas.height / 2
  // PAINT THE BACK WHITE
  context.fillStyle = 'white'
  context.fillRect(x_start, y_start, width, height)

  // DO THE NORMAL GRID
  let interval = 50
  for (let x = x_middle; x < width; x += interval) {
    drawLine(context, x, y_start, x, height, "grey")
  }
  for (let x = x_middle; x >= x_start; x -= interval) {
    drawLine(context, x, y_start, x, height, "grey")
  }
  for (let y = y_middle; y < height; y += interval) {
    drawLine(context, x_start, y, width, y, "grey")
  }
  for (let y = y_middle; y >= y_start; y -= interval) {
    drawLine(context, x_start, y, width, y, "grey")
  }

  // DRAW THE X AXIS AND Y AXIS
  drawLine(context, 0, paintCanvas.height / 2, width, paintCanvas.height / 2, "black", 2)
  drawLine(context, paintCanvas.width / 2, 0, paintCanvas.width / 2, height, "black", 2)
}

// DRAWS A CIRCLE IN (X,Y) WITH A GIVEN RADIUS AND COLOR
function drawCircle(context, x, y, radius, color, s_rad = 0, e_rad = 2) {
  context.beginPath()
  context.arc(x, y, radius, s_rad * Math.PI, e_rad * Math.PI)
  context.fillStyle = color
  context.fill()
}

function drawDiamond(context, x, y, radius, color) {
  context.beginPath();
  context.moveTo(x - radius, y);
  context.lineTo(x, y - radius);
  context.lineTo(x + radius, y);
  context.lineTo(x, y + radius);
  context.fillStyle = color;
  context.fill();
}

function drawLeftHalfCircle(context, x, y, radius, color) {
  drawCircle(context, x, y, radius, color, 0.5, 1.5)
}

function drawRightHalfCircle(context, x, y, radius, color) {
  drawCircle(context, x, y, radius, color, 1.5, 0.5)
}

// DRAW A SEQUENCE OF POINTS WITH A GIVEN RADIUS AND COLOR FOR EACH POINT
function drawSequence(context, points, radius, color, pastPoint = points[0]) {
  if (lineType != "line") {
    points.forEach(point => {
      drawCircle(context, point.offsetX, point.offsetY, radius, color)
    })
  }
  if (lineType != "dots") {
    points.forEach(point => {
      drawLine(context, pastPoint.offsetX, pastPoint.offsetY, point.offsetX, point.offsetY, color, radius / 2)
      pastPoint = point
    })
  }
}

// DRAW THE CURRENT FRAME INTO THE CONTEXT
function drawFrame(context) {
  //GET THE COMMON INFORMATION FOR PAINTING AND ANALYZING
  let trace = stroke
  let frameIndex = Math.floor(recordedFrameIndex)
  let predEnabled = (predictionType != "none") && (trace[0] && trace[0].prediction && trace[0].prediction.length)

  // CHANGE THE VARIABLES IF ANALYZING
  if (analyzing && recordedFrames.length) {
    trace = recordedFrames[frameIndex].stroke
  }

  // PAINT THE TRACE IF THERE IS ANY
  if (trace.length) {

    // PAINT REAL POINTER EVENT IF ANALIZING
    // THIS SHOULD PROVIDE A REFERENCE FOR PREDICTION ERROR
    if (analyzing && predEnabled && recordedFrames.length) {
      let pastPoint = trace[0]
      for (let index = recordedFrames[frameIndex].futurePoints.length - 1; index >= 0; index--) {
        const event = recordedFrames[frameIndex].futurePoints[index];
        if (lineType != "line") {
          drawDiamond(context, event.offsetX, event.offsetY, 5, futureColor)
        }
        if (lineType != "dots") {
          drawLine(context, pastPoint.offsetX, pastPoint.offsetY, event.offsetX, event.offsetY, futureColor, 2.5)
          pastPoint = event
        }
      }

      if (pastPoint && lineType != "dots") {
        drawLine(context, pastPoint.offsetX, pastPoint.offsetY, trace[0].offsetX, trace[0].offsetY, futureColor, 2.5)
      }

    }
    // PAINT THE PREDICTION IF IT IS ENABLED
    if (predEnabled) {
      drawSequence(context, trace[0].prediction, 5, predColor, trace[0])
    }

    // PAINT THE CURRENT TRACE
    drawSequence(context, trace, 5, inkColor)
  }
}