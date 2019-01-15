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
function drawSequence(context, points, radius, color) {
  points.forEach(point => {
    drawCircle(context, point.offsetX, point.offsetY, radius, color)
  })
}

// DRAW THE CURRENT FRAME INTO THE CONTEXT
function drawFrame(context) {
  //GET THE COMMON INFORMATION FOR PAINTING AND ANALYZING
  let trace = stroke
  let controlPoints = window.controlPoints
  let recentPointerEvents = window.recentPointerEvents
  let predictedControlPoints = window.predictedControlPoints
  let slope = window.slope
  let yOn0 = window.yOn0
  let frameIndex = Math.floor(recordedFrameIndex)

  // CHANGE THE VARIABLES IF ANALYZING
  if (analyzing && recordedFrames.length) {
    trace = recordedFrames[frameIndex].stroke
    recentPointerEvents = recordedFrames[frameIndex].recentPointerEvents

    // GET THE REST OF THE VALUES DEPENDING ON THE PREDICTION TYPE
    if (recentPointerEvents.length) {
      switch (recordedFrames[frameIndex].type) {
        case "Bezier":
          controlPoints = recordedFrames[frameIndex].controlPoints
          let reparam = getReparametizedCPs(recentPointerEvents, controlPoints, PREDICTED_FRAMES)
          predictedControlPoints = reparam.reparamcps
          trace[0].prediction = reparam.prediction
          slope = undefined
          yOn0 = undefined
          break
        case "Linear":
          predictedControlPoints = []
          controlPoints = []
          trace[0].prediction = []
          slope = recordedFrames[frameIndex].slope
          yOn0 = recordedFrames[frameIndex].yOn0
          speed = recordedFrames[frameIndex].speed

          // GET LAST POINT, TRANSFORM IT TO THE CLOSEST ON THE FITTED LINE AND CALCULATE SLOPE AND ANGLE
          let lastPoint = recentPointerEvents[recentPointerEvents.length - 1]
          let xNew = (slope * (lastPoint.y - yOn0) + lastPoint.x) / ((slope * slope) + 1)
          let yNew = xNew * slope + yOn0
          let theta = Math.atan2(Math.abs(slope) * recordedFrames[frameIndex].ySign, recordedFrames[frameIndex].xSign)
          let sinTheta = Math.sin(theta)
          let cosTheta = Math.cos(theta)

          // GET THE TOTAL DISTANCE TO GET THE AVERAGE DISTANCE BETWEEN POINTS
          let totalDistance = 0
          for (let i = 1; i < recentPointerEvents.length; i++) {
            totalDistance += recentPointerEvents[i].distance
          }
          let dIncrement = totalDistance / recentPointerEvents.length
          let xIncrement = cosTheta * dIncrement
          let yIncrement = sinTheta * dIncrement
          let timeIncrement = dIncrement / speed

          // GET PREDICTED DISTANCE
          let time = window.MS_PER_FRAME * window.PREDICTED_FRAMES
          let distance = time * speed

          // APPEND PREDICTION WHILE THE DISTANCE IS NOT GREATER THEN THE PREDICTED
          for (let dIndex = 1; dIndex * dIncrement <= distance; dIndex++) {
            trace[0].prediction.push({
              x: lastPoint.x + xIncrement * dIndex,
              y: lastPoint.y + yIncrement * dIndex,
              time: lastPoint.time + timeIncrement * dIndex
            })
          }

          break
      }
    }

    getOffsetCoordinates(trace[0].prediction)

    // ADVANCE TO THE NEXT CYCLICAL FRAME IF PLAYING IS ON
    if (isPlaying) {
      recordedFrameIndex += 1 / recordedFrameIndexMod
    }
    if (recordedFrameIndex >= recordedFrames.length)
      recordedFrameIndex = 0
  }

  // PAINT THE TRACE IF THERE IS ANY
  if (trace.length) {
    let shouldPaintFitting = analyzing && predFitting && recentPointerEvents.length
    // PAINT THE RECENT POINTER EVENTS FIRST SO THEY ARE BEIND THE TRACE
    if (analyzing) {
      // GET THE OFFSET COORDINATES FOR X AND Y
      getOffsetCoordinates(recentPointerEvents)
      drawSequence(context, recentPointerEvents, 5, "grey")
    }

    // PAINT THE PREDICTION IF IT IS ENABLED OR ANALYZING THE TRACE
    if (predictionType || analyzing) {
      drawSequence(context, trace[0].prediction, 5, analyzing ? window.predictionColor : inkPredColor)
    }
    // PAINT THE CURRENT TRACE, GREY IT OUT WHEN ANALYZING TO GIVE OTHER FEATURES A BETTER VIEW
    drawSequence(context, trace, 5, analyzing ? "grey" : inkColor)

    // PAINT REAL POINTER EVENT IF ANALIZING
    // THIS SHOULD PROVIDE A REFERENCE FOR PREDICTION ERROR
    if (analyzing) {
      let predTime = trace[0].prediction.length ?
        trace[0].prediction[trace[0].prediction.length - 1].time : 0
      let lastTime = recentPointerEvents[recentPointerEvents.length - 1].time

      let targetFrameEvents = recordedFrames[frameIndex].recentPointerEvents
      let indexMod = 1

      while (predTime >= targetFrameEvents[targetFrameEvents.length - 1].time) {
        if (frameIndex + indexMod >= recordedFrames.length) break
        targetFrameEvents = recordedFrames[frameIndex + indexMod++].recentPointerEvents
      }
      if (frameIndex + indexMod < recordedFrames.length) {
        targetFrameEvents = recordedFrames[frameIndex + indexMod].recentPointerEvents
      }

      getOffsetCoordinates(targetFrameEvents)

      for (let index = targetFrameEvents.length - 1; index >= 0; index--) {
        const event = targetFrameEvents[index];
        if (event.time > predTime) continue
        if (event.time < lastTime) break
        drawDiamond(context, event.offsetX, event.offsetY, 5, "grey")
      }

    }

    // PAINT THE FITTED LINE OVER THE STROKE AND RECENT POINTER EVENTS
    if (shouldPaintFitting) {
      switch (recordedFrames[frameIndex].type) {
        case "Bezier":
          getOffsetCoordinates(controlPoints)
          context.beginPath()
          context.moveTo(controlPoints[0].offsetX, controlPoints[0].offsetY)
          context.bezierCurveTo(controlPoints[1].offsetX, controlPoints[1].offsetY,
            controlPoints[2].offsetX, controlPoints[2].offsetY,
            controlPoints[3].offsetX, controlPoints[3].offsetY)
          context.strokeStyle = "green"
          context.lineWidth = 3
          context.stroke()
          // PAINT THE CONTROL POINTS FOR THE BEZIER
          drawLeftHalfCircle(context, controlPoints[0].offsetX, controlPoints[0].offsetY, 5, "orange")
          drawCircle(context, controlPoints[1].offsetX, controlPoints[1].offsetY, 5, "orange")
          drawCircle(context, controlPoints[2].offsetX, controlPoints[2].offsetY, 5, "orange")
          drawLeftHalfCircle(context, controlPoints[3].offsetX, controlPoints[3].offsetY, 5, "orange")
          break
        case "Linear":
          let first = recentPointerEvents[recentPointerEvents.length - 1]
          let last = recentPointerEvents[0]
          drawLine(context, first.offsetX, first.offsetY, last.offsetX, last.offsetY, "green", 3)
          drawLeftHalfCircle(context, first.offsetX, first.offsetY, 5, "orange")
          drawLeftHalfCircle(context, last.offsetX, last.offsetY, 5, "orange")
          break
      }
    }

    // PAINT THE PREDICTED LINE OVER THE PREDICTED POINTS
    if (analyzing && predLine && trace[0].prediction.length) {
      switch (recordedFrames[frameIndex].type) {
        case "Bezier":
          getOffsetCoordinates(predictedControlPoints)
          context.beginPath()
          context.moveTo(predictedControlPoints[0].offsetX, predictedControlPoints[0].offsetY)
          context.bezierCurveTo(predictedControlPoints[1].offsetX, predictedControlPoints[1].offsetY,
            predictedControlPoints[2].offsetX, predictedControlPoints[2].offsetY,
            predictedControlPoints[3].offsetX, predictedControlPoints[3].offsetY)
          context.strokeStyle = "red"
          context.lineWidth = 3
          context.stroke()
          // PAINT THE CONTROL POINTS FOR THE BEZIER
          drawRightHalfCircle(context, predictedControlPoints[0].offsetX, predictedControlPoints[0].offsetY, 5, "yellow")
          drawCircle(context, predictedControlPoints[1].offsetX, predictedControlPoints[1].offsetY, 5, "yellow")
          drawCircle(context, predictedControlPoints[2].offsetX, predictedControlPoints[2].offsetY, 5, "yellow")
          drawRightHalfCircle(context, predictedControlPoints[3].offsetX, predictedControlPoints[3].offsetY, 5, "yellow")
          break
        case "Linear":
          let first = trace[0]
          let last = trace[0].prediction[trace[0].prediction.length - 1]
          drawLine(context, first.offsetX, first.offsetY, last.offsetX, last.offsetY, "red", 3)
          drawRightHalfCircle(context, first.offsetX, first.offsetY, 5, "yellow")
          drawRightHalfCircle(context, last.offsetX, last.offsetY, 5, "yellow")
          break
      }
    }
  }
}