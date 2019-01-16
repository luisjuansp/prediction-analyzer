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
  height = paintCanvas.height * 2
  // PAINT THE BACK WHITE
  context.fillStyle = 'white'
  context.fillRect(-paintCanvas.width, -paintCanvas.height, width, height)

  // DO THE NORMAL GRID
  let interval = 50
  for (let x = paintCanvas.width / 2; x < width; x += interval) {
    drawLine(context, x, 0, x, height, "grey")
  }
  for (let x = paintCanvas.width / 2; x >= 0; x -= interval) {
    drawLine(context, x, 0, x, height, "grey")
  }
  for (let y = paintCanvas.height / 2; y < height; y += interval) {
    drawLine(context, 0, y, width, y, "grey")
  }
  for (let y = paintCanvas.height / 2; y >= 0; y -= interval) {
    drawLine(context, 0, y, width, y, "grey")
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
  let predEnabled = (predictionType != "none")

  // CHANGE THE VARIABLES IF ANALYZING
  if (analyzing && recordedFrames.length) {
    // ADVANCE TO THE NEXT CYCLICAL FRAME IF PLAYING IS ON
    if (isPlaying) {
      recordedFrameIndex += 1 * recordedFrameIndexMod
    }
    if (recordedFrameIndex >= recordedFrames.length) {
      recordedFrameIndex = 0
    }

    trace = recordedFrames[frameIndex].stroke
  }

  // PAINT THE TRACE IF THERE IS ANY
  if (trace.length) {

    // PAINT THE CURRENT TRACE, GREY IT OUT WHEN ANALYZING TO GIVE OTHER FEATURES A BETTER VIEW
    drawSequence(context, trace, 5, inkColor)

    // PAINT REAL POINTER EVENT IF ANALIZING
    // THIS SHOULD PROVIDE A REFERENCE FOR PREDICTION ERROR
    if (analyzing && predEnabled && recordedFrames.length) {
      let predTime = trace[0].prediction.length ?
        trace[0].prediction[trace[0].prediction.length - 1].time : 0
      let lastTime = trace[0].time

      let targetFrameEvents = recordedFrames[frameIndex].stroke
      let indexMod = 1

      while (predTime >= targetFrameEvents[targetFrameEvents.length - 1].time) {
        if (frameIndex + indexMod >= recordedFrames.length) break
        targetFrameEvents = recordedFrames[frameIndex + indexMod++].stroke
      }
      if (frameIndex + indexMod < recordedFrames.length) {
        targetFrameEvents = recordedFrames[frameIndex + indexMod].stroke
      }

      let pastPoint
      for (let index = 0; index < targetFrameEvents.length; index++) {
        const event = targetFrameEvents[index];
        if (event.time > predTime) break
        if (event.time <= lastTime) continue
        if (lineType != "line") {
          drawDiamond(context, event.offsetX, event.offsetY, 5, futureColor)
        }
        if (pastPoint && lineType != "dots") {
          drawLine(context, pastPoint.offsetX, pastPoint.offsetY, event.offsetX, event.offsetY, futureColor, 2.5)
        }
        pastPoint = event
      }

      if (pastPoint && lineType != "dots") {
        drawLine(context, pastPoint.offsetX, pastPoint.offsetY, trace[0].offsetX, trace[0].offsetY, futureColor, 2.5)
      }

    }
    // PAINT THE PREDICTION IF IT IS ENABLED
    if (predEnabled) {
      drawSequence(context, trace[0].prediction, 5, predColor, trace[0])
    }
  }
}