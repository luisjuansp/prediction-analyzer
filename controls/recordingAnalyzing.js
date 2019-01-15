function trimRecording() {
  if (recordedFrames.length) {

    // Remove the frames that don't contain a trace
    while (recordedFrames[0].stroke.length == 0) {
      recordedFrames.shift()
    }

    while (recordedFrames[0].recentPointerEvents.length == 0) {
      recordedFrames.shift()
    }

    // Remove the frames after the trace
    while (recordedFrames.length > 1 &&
      (recordedFrames[recordedFrames.length - 1].stroke[0].offsetX ==
        recordedFrames[recordedFrames.length - 2].stroke[0].offsetX) &&
      (recordedFrames[recordedFrames.length - 1].stroke[0].offsetY ==
        recordedFrames[recordedFrames.length - 2].stroke[0].offsetY)
    ) {
      recordedFrames.pop()
    }
  }
}

function correctRatio(context) {
  // ERASE STUFF PAINTED OUTSIDE OF THE RATIO
  context.fillStyle = 'white'
  context.fillRect(0, 0, paintCanvas.width, paintCanvas.height)

  let w = parseInt(getComputedStyle(context.canvas).width)
  let h = parseInt(getComputedStyle(context.canvas).height)
  let ratio = w / h

  if (paintRatio > ratio) {
    context.scale(1, ratio / paintRatio)
    context.translate(0, (paintCanvas.height * (1 - ratio / paintRatio)) / 2)
  } else {
    context.scale(paintRatio / ratio, 1)
    context.translate((paintCanvas.width * (1 - paintRatio / ratio)) / 2, 0)
  }
}

function revertRatio(context) {
  let w = parseInt(getComputedStyle(context.canvas).width)
  let h = parseInt(getComputedStyle(context.canvas).height)
  let ratio = w / h

  if (paintRatio > ratio) {
    context.translate(0, -(paintCanvas.height * (1 - ratio / paintRatio)) / 2)
    context.scale(1, paintRatio / ratio)
  } else {
    context.translate((paintCanvas.width * (1 - paintRatio / ratio)) / 2, 0)
    context.scale(ratio / paintRatio, 1)
  }
}

function zoom(context, x_min, y_min, width, height) {
  let w = context.canvas.width
  let h = context.canvas.height
  let r = w / h
  let newR = width / height

  if (r > newR) {
    context.translate((w - width * h / height) / 2, 0);
    context.scale(h / height, h / height);
  } else {
    context.translate(0, (h - height * w / width) / 2);
    context.scale(w / width, w / width);
  }

  context.translate(-x_min, -y_min);
}

function unzoom(context, x_min, y_min, width, height) {
  let w = context.canvas.width
  let h = context.canvas.height
  let r = w / h
  let newR = width / height

  context.translate(x_min, y_min);

  if (r > newR) {
    context.scale(height / h, height / h);
    context.translate(-(w - width * h / height) / 2, 0);
  } else {
    context.scale(width / w, width / w);
    context.translate(0, -(h - height * w / width) / 2);
  }

}

function doZoom() {
  let x_min = Infinity, y_min = Infinity, width, height, x_max = 0, y_max = 0
  getOffsetCoordinates(recordedFrames[Math.floor(recordedFrameIndex)].recentPointerEvents)
  recordedFrames[Math.floor(recordedFrameIndex)].recentPointerEvents.forEach(point => {
    x_max = Math.max(x_max, point.offsetX)
    y_max = Math.max(y_max, point.offsetY)
    x_min = Math.min(x_min, point.offsetX)
    y_min = Math.min(y_min, point.offsetY)
  })
  recordedFrames[Math.floor(recordedFrameIndex)].stroke[0].prediction.forEach(point => {
    x_max = Math.max(x_max, point.offsetX)
    y_max = Math.max(y_max, point.offsetY)
    x_min = Math.min(x_min, point.offsetX)
    y_min = Math.min(y_min, point.offsetY)
  })
  zoomX = x_min - 50
  zoomY = y_min - 50
  zoomWidth = x_max - zoomX + 50
  zoomHeight = y_max - zoomY + 50
  zoom(replay, zoomX, zoomY, zoomWidth, zoomHeight)
}

// Get a prediction using a Cubic Bezier representation of the recent events
function getReparametizedCPs(pointerEvents, controlPoints, frames) {

  // Get the total distance between the points
  let totalDistance = 0
  pointerEvents[0].distance = 0
  for (let i = 1; i < pointerEvents.length; i++) {
    let point = pointerEvents[i], past = pointerEvents[i - 1]
    point.distance = getPointDistance(point, past)
    totalDistance += point.distance
  }

  // Assign a t value to all the points relative to their distance from cp0
  pointerEvents[0].t = 0
  for (let i = 1; i < pointerEvents.length; i++) {
    let point = pointerEvents[i], past = pointerEvents[i - 1]
    point.t = past.t + point.distance / totalDistance
  }

  // Evaluate the average speed of the trace
  let time = pointerEvents[pointerEvents.length - 1].time - pointerEvents[0].time
  let speed = totalDistance / time

  // Used the fitted model to predict the pointer by frame
  let lastPredicted = pointerEvents[pointerEvents.length - 1]
  let prediction = []
  let targetDistance = window.MS_PER_FRAME * frames * speed
  targetDistance = Math.min(totalDistance, targetDistance)
  let acumDistance = 0
  let tIncrement = 1 / pointerEvents.length
  let avgDistance = totalDistance / pointerEvents.length



  while (acumDistance + avgDistance <= targetDistance) {
    stack_count = 0
    let point = LookUpT(tIncrement, controlPoints, lastPredicted, avgDistance)
    if (!point) break
    point.time = point.distance / speed + lastPredicted.time

    acumDistance += point.distance

    prediction.push(point)
    lastPredicted = point
  }

  return {
    prediction: prediction,
    reparamcps: bezierReparameterized(1, lastPredicted.t, controlPoints)
  }
}