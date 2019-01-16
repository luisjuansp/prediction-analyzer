function trimRecording() {
  if (recordedFrames.length) {

    // Remove the frames that don't contain a trace
    while (recordedFrames[0].stroke.length == 0) {
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

function doZoom(replay) {
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
  zoom(replay, zoomX, zoomY, zoomWidth, zoomHeight)
}