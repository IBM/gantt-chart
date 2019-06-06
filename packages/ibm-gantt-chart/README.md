# ibm-gantt-chart

## Usage

Here is a simple example to illustrate how to include the Gantt into a web page.<br/>

```html
<html>
  <head>
    <title>Simple Gantt</title>
    <link href="[...]/ibm-gantt-chart.css" rel="stylesheet" />
    <script src="[...]/ibm-gantt-chart.js"></script>

    <!--  Page styles  -->
    <style>
      html {
        height: 100%;
      }
      body {
        height: 100%;
        margin: 0;
        padding: 0;
      }
      #gantt {
        height: 100%;
      }
    </style>
  </head>
  <body>
    <div id="gantt"></div>

    <script>
      var data = [
        {
          id: 'NURSES+Anne',
          name: 'Anne',
          activities: [
            {
              id: 'SHIFTS+Emergency+Monday+2+8',
              name: 'Emergency',
              start: 1474880400000,
              end: 1474902000000,
            },
          ],
        },
        {
          id: 'NURSES+Bethanie',
          name: 'Bethanie',
          activities: [],
        },
        {
          id: 'NURSES+Betsy',
          name: 'Betsy',
          activities: [
            {
              id: 'SHIFTS+Emergency+Wednesday+12+18',
              name: 'Emergency',
              start: 1475089200000,
              end: 1475110800000,
            },
            {
              id: 'SHIFTS+Emergency+Saturday+12+20',
              name: 'Emergency',
              start: 1475348400000,
              end: 1475377200000,
            },
            {
              id: 'SHIFTS+Consultation+Friday+8+12',
              name: 'Consultation',
              start: 1475247600000,
              end: 1475262000000,
            },
          ],
        },
        {
          id: 'NURSES+Cathy',
          name: 'Cathy',
          activities: [
            {
              id: 'SHIFTS+Emergency+Sunday+20+2',
              name: 'Emergency',
              start: 1475463600000,
              end: 1475485200000,
            },
            {
              id: 'SHIFTS+Emergency+Saturday+12+20',
              name: 'Emergency',
              start: 1475348400000,
              end: 1475377200000,
            },
            {
              id: 'SHIFTS+Emergency+Monday+18+2',
              name: 'Emergency',
              start: 1474938000000,
              end: 1474966800000,
            },
          ],
        },
        {
          id: 'NURSES+Cindy',
          name: 'Cindy',
          activities: [
            {
              id: 'SHIFTS+Emergency+Saturday+20+2',
              name: 'Emergency',
              start: 1475377200000,
              end: 1475398800000,
            },
            {
              id: 'SHIFTS+Consultation+Friday+8+12',
              name: 'Consultation',
              start: 1475247600000,
              end: 1475262000000,
            },
            {
              id: 'SHIFTS+Consultation+Tuesday+8+12',
              name: 'Consultation',
              start: 1474988400000,
              end: 1475002800000,
            },
          ],
        },
      ];
      var config = {
        data: {
          // Configures how to fetch resources for the Gantt
          resources: {
            data: data, // resources are provided in an array. Instead, we could configure a request to the server.
            // Activities of the resources are provided along with the 'activities' property of resource objects.
            // Alternatively, they could be listed from the 'data.activities' configuration.
            activities: 'activities',
            name: 'name', // The name of the resource is provided with the name property of the resource object.
            id: 'id', // The id of the resource is provided with the id property of the resource object.
          },
          // Configures how to fetch activities for the Gantt
          // As activities are provided along with the resources, this section only describes how to create
          // activity Gantt properties from the activity model objects.
          activities: {
            start: 'start', // The start of the activity is provided with the start property of the model object
            end: 'end', // The end of the activity is provided with the end property of the model object
            name: 'name', // The name of the activity is provided with the name property of the model object
          },
        },
        // Configure a toolbar associated with the Gantt
        toolbar: [
          'title',
          'search',
          'separator',
          {
            type: 'button',
            text: 'Refresh',
            fontIcon: 'fa fa-refresh fa-lg',
            onclick: function(ctx) {
              ctx.gantt.draw();
            },
          },
          'fitToContent',
          'zoomIn',
          'zoomOut',
        ],
        title: 'Simple Gantt', // Title for the Gantt to be displayed in the toolbar
      };
      new Gantt('gantt' /* the id of the DOM element to contain the Gantt chart */, config);
    </script>
  </body>
</html>
```

Including this Gantt chart into a Web page consists on:

- Including the Gantt library bundle files, one Javascript and one CSS file.
- Create DOM element that will contain the Gantt chart. This is done here with the declaration:
  ```
  <div id="gantt"></div>
  ```
- Create a Javascript object to configure the Gantt.
- Instantiate the Gantt chart object with this configuration object and the id of the DOM element to contain the Gantt chart.
  As explained below, the Gantt library is packaged for several frameworks (jQuery, React or as a pure Javascript component).
  Use the one that fits the need of your page.
  For this example, the Vanilla Javascript component is used.

## Data

In the first example, data is provided to the Gantt as an array of resources created on the client side to get a self contained example.
The Gantt can also be configured to fetch data from a server and map this data into a Gantt model.
The example [Activity chart](/examples/activity_chart/index.html) shows how customizable the process of fetching user data and mapping it to a Gantt model can be.

## Formatting, filtering and other features

The Gantt library is rich of features for formatting and navigating into user data.
The [Gantt examples](/examples) illustrate how to configure and use these features.

## Gantt packages

The simple Gantt chart example uses the Gantt chart as a Vanilla Javascript component.
The Gantt library also distributes the Gantt as a React component and a jQuery component.
For those packages, the configuration of the Gantt is done using the same configuration object.
Only the bundle files to include and the how the Gantt object is constructed differ.

1. The Gantt as a React component

   ```js
   import React from 'react';
   import ReactDOM from 'react-dom';
   import GanttChart from 'ibm-gantt-chart-react';

   import 'ibm-gantt-chart/dist/ibm-gantt-chart.css';

   const config = { ... }; // Same format as in the simple Gantt example.

   ReactDOM.render(<GanttChart config={config} />, document.getElementById('gantt'));
   ```

2) The Gantt as a jQuery component

   ```html
   <html>
     <head>
       <!-- Datatables.net CSS file -->
       <!-- See  https://datatables.net/download/index -->
       <link href="[...]/datatables.net-dt/css/jquery.dataTables.css" rel="stylesheet" />

       <!-- vis CSS file -->
       <!-- See  http://visjs.org/#download_install -->
       <link href="[...]/vis/dist/vis.min.css" rel="stylesheet" type="text/css" />

       <!-- Gantt CSS file -->
       <link href="[...]/dist/css/gantt-jquery.css" rel="stylesheet" type="text/css" />
     </head>
     <body>
       ...
       <!-- DOM node to contain the Gantt component. -->
       <div id="gantt"></div>
       ...
       <!-- Include jQuery, see https://jquery.com/download/ -->
       <script src="[...]/jquery/dist/jquery.min.js"></script>

       <!-- Datatables.net JS file -->
       <!-- See  https://datatables.net/download/index -->
       <script src="[...]/datatables.net/js/jquery.dataTables.js"></script>

       <!-- vis JS file -->
       <!-- See  http://visjs.org/#download_install -->
       <script src="[...]/dist/vis.min.js"></script>

       <!-- Gantt JS bundle file -->
       <script src="[...]/ibm-gantt-chart-jquery.js"></script>
       <script>
         var config = { ... }; // Same format as for the simple Gantt example
         $(document).ready(function() {
             $('#gantt').Gantt(config);
         } );
       </script>
     </body>
   </html>
   ```
