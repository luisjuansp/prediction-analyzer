# Prediction Analizer

The purpose of this tool is to analyze the quality of different prediction algorithms that try to predict a set of future `pointermove` events. These algorithms are evaluated in these different metrics:

- Time Predicted: The amount of time into the future that is being predicted.
- Position Error: The absolute error between the predicted point and the real point.
- Time Error: The error in time between the predicted point and the real point.
- Line Error: Distance between the real line that was drawn and the predicted point.
- Angle Error: Difference in the angle made by the line from real point N to real point N+1 and the line from real point N to predicted point N+1

## Features

### Drawing Canvas

The drawing canvas accepts input from mouse, touch or pen indiscriminately. The last 30 pointermove events registered while the pointer was down are painted on the screen. A prediction is also displayed; the default prediction calls getPredictedEvents on the pointerevent if it is supported. The menu on the top left corner has options for customization, such as changing the prediction algorithm or disabling and enabling the use of getCoalescedEvents.

### Recording

For a scenario to be analyzed it must be recorded first. Clicking on the recording button immediately starts logging the current state of the drawing canvas. It is later trimmed for a better analyzing experience.

### Analyzing

When analyzing a scenario, playback controls will be placed in the top of the page. Zoom is placed on the top right corner, and enabling it zooms the canvas to fit the current’s frame stroke. The Paint button navigates back to the drawing canvas.  The graphs in the right represent the evaluation metrics. The analyzing menu contains the options to modify the replay speed, save the current scenario and load a specific scenario from a local file, and view a table that contains the comparison of the different prediction algorithms have been added to the tool.

### Scenario Comparison

`./scenarios/` provides a view to compare how the different prediction algorithms fare regarding the evaluation metrics. Click Add Scenario to select a scenario file, and click Remove on the top right corner of a scenario column to remove it.