function trimRecording() {
  if (recordedFrames.length) {

    // Remove the frames that don't contain a trace
    while (recordedFrames[0] && recordedFrames[0].stroke.length == 0) {
      recordedFrames.shift()
    }

    // Remove the frames at the beginning that have the same stroke
    while (recordedFrames.length > 1 &&
      (recordedFrames[0].stroke[0].offsetX ==
        recordedFrames[1].stroke[0].offsetX) &&
      (recordedFrames[0].stroke[0].offsetY ==
        recordedFrames[1].stroke[0].offsetY)
    ) {
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

function addFuturePoints() {
  for (let i = 0; i < recordedFrames.length; i++) {
    let frame = recordedFrames[i]

    let trace = targetFrameEvents = frame.stroke
    let predTime = trace[0].prediction.length ?
      trace[0].prediction[trace[0].prediction.length - 1].timeStamp : 0
    let lastTime = trace[0].timeStamp

    let iMod = 1
    while (predTime >= targetFrameEvents[0].timeStamp) {
      if (i + iMod >= recordedFrames.length) break
      targetFrameEvents = recordedFrames[i + iMod++].stroke
    }
    if (i + iMod < recordedFrames.length) {
      targetFrameEvents = recordedFrames[i + iMod].stroke
    }

    let futurePoints = []
    for (let j = targetFrameEvents.length - 1; j >= 0; j--) {
      const event = targetFrameEvents[j];
      if (event.timeStamp > predTime && futurePoints.length >= trace[0].prediction.length) break
      if (event.timeStamp <= lastTime) continue
      futurePoints.push(event)
    }
    frame.futurePoints = futurePoints
    calcError(frame)
  }
}

function tick() {

  let prevFrameIndex = Math.floor(recordedFrameIndex)

  // ADVANCE TO THE NEXT CYCLICAL FRAME IF PLAYING IS ON
  if (isPlaying) {
    recordedFrameIndex += 1 * recordedFrameIndexMod
  }
  if (recordedFrameIndex >= recordedFrames.length) {
    recordedFrameIndex = 0
  }

  if (prevFrameIndex != Math.floor(recordedFrameIndex)) {
    displayError()
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
    context.translate(-(paintCanvas.width * (1 - paintRatio / ratio)) / 2, 0)
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

function doZoom(context) {
  let x_min = Infinity, y_min = Infinity, width, height, x_max = 0, y_max = 0
  recordedFrames[Math.floor(recordedFrameIndex)].stroke.forEach(point => {
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
  zoom(context, zoomX, zoomY, zoomWidth, zoomHeight)
}

function calcPointDistance(a, b) {
  return Math.sqrt(Math.pow(a.offsetX - b.offsetX, 2) + Math.pow(a.offsetY - b.offsetY, 2))
}

function calcError(frame) {
  let real = frame.futurePoints
  let last = frame.stroke[0]
  let prediction = last.prediction
  let totPosError = 0
  let avgPosError = 0
  let totTimeError = 0
  let avgTimeError = 0
  let totLineError = 0
  let avgLineError = 0
  let totAngleError = 0
  let avgAngleError = 0

  if (real && prediction && real.length && prediction.length) {
    let length = Math.min(prediction.length, real.length)

    for (let i = 0; i < length; i++) {
      totPosError += calcPointDistance(prediction[i], real[i])
      totTimeError += Math.abs(prediction[i].timeStamp - real[i].timeStamp)

      let x_diff = real[i].offsetX - last.offsetX
      let y_diff = real[i].offsetY - last.offsetY

      if (x_diff == 0) { // HORIZONTAL
        totLineError += Math.abs(y_diff)
      } else if (y_diff == 0) { // VERTICAL
        totLineError += Math.abs(x_diff)
      } else {
        /**
         * Distance from a point to a line defined by two points
         *
         * distance(P1, P2, (x0, y0)) =
         *      |(y2 - y1)x0 - (x2 - x1)y0 + x2 * y1 - y2 * x1| /
         *            sqrt((y2 - y1)^2 + (x2 - x1)^2)
         */
        totLineError +=
          Math.abs(
            y_diff * prediction[i].offsetX - x_diff * prediction[i].offsetY +
            real[i].offsetX * last.offsetY - real[i].offsetY * last.offsetX) /
          Math.sqrt(Math.pow(y_diff, 2) + Math.pow(x_diff, 2))
      }

      let pred_x_diff = prediction[i].offsetX - last.offsetX
      let pred_y_diff = prediction[i].offsetY - last.offsetY

      totAngleError +=
        Math.acos(
          (
            (pred_x_diff * x_diff) + (pred_y_diff * y_diff)
          ) /
          (
            Math.sqrt(Math.pow(pred_x_diff, 2) + Math.pow(pred_y_diff, 2)) *
            Math.sqrt(Math.pow(x_diff, 2) + Math.pow(y_diff, 2))
          )
        ) * 180 / Math.PI

      last = real[i]
    }

    avgPosError = totPosError / length
    avgTimeError = totTimeError / length
    avgLineError = totLineError / length
    avgAngleError = totAngleError / length
  }

  frame.totPosError = totPosError
  frame.avgPosError = avgPosError
  frame.totTimeError = totTimeError
  frame.avgTimeError = avgTimeError
  frame.totLineError = totLineError
  frame.avgLineError = avgLineError
  frame.totAngleError = totAngleError
  frame.avgAngleError = avgAngleError
}

function displayError() {
  let frameIndex = Math.floor(recordedFrameIndex)
  let frame = recordedFrames[frameIndex]
  if (!frame) return
  document.querySelector('#totPosErrorSpan').textContent = frame.totPosError
  document.querySelector('#avgPosErrorSpan').textContent = frame.avgPosError
  document.querySelector('#totTimeErrorSpan').textContent = frame.totTimeError
  document.querySelector('#avgTimeErrorSpan').textContent = frame.avgTimeError
  document.querySelector('#totLineErrorSpan').textContent = frame.totLineError
  document.querySelector('#avgLineErrorSpan').textContent = frame.avgLineError
  document.querySelector('#totAngleErrorSpan').textContent = frame.totAngleError
  document.querySelector('#avgAngleErrorSpan').textContent = frame.avgAngleError

  let avgPosErrorAxis = []
  let avgTimeErrorAxis = []
  let avgLineErrorAxis = []
  let avgAngleErrorAxis = []
  let xAxis = []
  let extraX = 5

  for (let i = frameIndex - extraX; i <= frameIndex + extraX; i++) {
    xAxis.push(i)
  }

  xAxis.forEach(function (index) {
    if (index < 0 || index >= recordedFrames.length) {
      avgPosErrorAxis.push(0)
      avgTimeErrorAxis.push(0)
      avgLineErrorAxis.push(0)
      avgAngleErrorAxis.push(0)
    } else {
      avgPosErrorAxis.push(recordedFrames[index].avgPosError)
      avgTimeErrorAxis.push(recordedFrames[index].avgTimeError)
      avgLineErrorAxis.push(recordedFrames[index].avgLineError)
      avgAngleErrorAxis.push(recordedFrames[index].avgAngleError)
    }
  })

  let marker = {
    color:
      ['#C8A2C8', '#C8A2C8', '#C8A2C8', '#C8A2C8', '#C8A2C8',
        '#00DD00',
        '#C8A2C8', '#C8A2C8', '#C8A2C8', '#C8A2C8', '#C8A2C8'],
    line: { width: 2.5 }
  }
  let margin = { l: 30, r: 30, t: 50, b: 30 }

  let avgPosErrorData = {
    type: 'bar',
    x: xAxis,
    y: avgPosErrorAxis,
    marker: marker
  }
  let avgTimeErrorData = {
    type: 'bar',
    x: xAxis,
    y: avgTimeErrorAxis,
    marker: marker
  }
  let avgLineErrorData = {
    type: 'bar',
    x: xAxis,
    y: avgLineErrorAxis,
    marker: marker
  }
  let avgAngleErrorData = {
    type: 'bar',
    x: xAxis,
    y: avgAngleErrorAxis,
    marker: marker
  }


  let avgPosErrorLayout = {
    title: "Avg. Pos Error",
    font: { size: 18 },
    margin: margin,
    width: document.querySelector("#avgPosErrorPlot").parentElement.clientWidth,
    height: document.querySelector("#avgPosErrorPlot").parentElement.clientHeight
  }
  let avgTimeErrorLayout = {
    title: "Avg. Time Error",
    font: { size: 18 },
    margin: margin,
    width: document.querySelector("#avgTimeErrorPlot").parentElement.clientWidth,
    height: document.querySelector("#avgTimeErrorPlot").parentElement.clientHeight
  }
  let avgLineErrorLayout = {
    title: "Avg. Line Error",
    font: { size: 18 },
    margin: margin,
    width: document.querySelector("#avgLineErrorPlot").parentElement.clientWidth,
    height: document.querySelector("#avgLineErrorPlot").parentElement.clientHeight
  }
  let avgAngleErrorLayout = {
    title: "Avg. Angle Error",
    font: { size: 18 },
    margin: margin,
    width: document.querySelector("#avgAngleErrorPlot").parentElement.clientWidth,
    height: document.querySelector("#avgAngleErrorPlot").parentElement.clientHeight
  }

  Plotly.react('avgPosErrorPlot', [avgPosErrorData], avgPosErrorLayout, { displayModeBar: false });
  Plotly.react('avgTimeErrorPlot', [avgTimeErrorData], avgTimeErrorLayout, { displayModeBar: false });
  Plotly.react('avgLineErrorPlot', [avgLineErrorData], avgLineErrorLayout, { displayModeBar: false });
  Plotly.react('avgAngleErrorPlot', [avgAngleErrorData], avgAngleErrorLayout, { displayModeBar: false });
}