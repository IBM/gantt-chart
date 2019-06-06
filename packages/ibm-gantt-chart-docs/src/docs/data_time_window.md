# Time window

The earliest start date and latest end date which define the time scale of the Gantt chart is processed according to a _time window_ of the Gantt data model, a time frame in which all activities occur.

By default, this time window is automatically computed looking at the earliest start date and latest end date for the activities of the Gantt chart.
Alternatively, you can specify a time window for the Gantt chart as part of its data, using the `timeWindow` data configuration entry.
The `timeWindow` entry also configures one [data fetcher](./?path=/story/guides-data--data-fetchers) to fetch the time window and two [data accessors](./?path=/story/guides-data--data-accessors) for getting the `start` and `end` of the time window.

<br /> Example:

```
   var dataConfig = {
       resources : {
           ...
       },
       activities : {
           ...
       },
       timeWindow : {
          // Fetch the time window returned as an object with the format
          // {
          //     windowStart : ..., //
          //     windowEnd : ... //
          // }
          url : "/examples/timewindow.json",
          start : 'windowStart', // The start of the time window is provided with the 'windowStart' property of the returned time window object
          end : 'windowEnd', // The end of the time window is provided with the 'windowStart' property of the returned time window object
       }
    };
```
