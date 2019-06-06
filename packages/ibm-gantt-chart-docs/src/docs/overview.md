## Overview

IBM Gantt Chart lets you visualize data in a Gantt chart on your website.
A storybook of examples illustrates powerful features that enable a rich experience when using a Gantt chart, from filtering to formatting the display according to the properties of your data.

The IBM Gantt Chart is packaged in bundles for different uses:

1. As a Vanilla Javascript component
2. As a React component
3. As a jQuery component

For each of these platforms, including a Gantt chart in a website is easy, you just:

- Load one of the Gantt libraries (Vanilla JS, React, jQuery).
- Create a Gantt Javascript object, giving it a DOM element ID and a configuration object.
  The configuration object is mainly used to feed the Gantt chart with data, declare a toolbar or configure the display of activities, resources, constraints, breaks, etc.
- Load some data into the Gantt chart if it is not already specified in the provided configuration object.
- Insert a DOM element in the HTML using the same ID that you gave to the Gantt object. The DOM element then contains the Gantt component.
  See [Getting started](./?path=/story/guides-introduction--getting-started) for creating your first Gantt visualization.
