# Layout of activities

In the timetable, activities are positioned on the horizontal time axis according to the start and end property of the activity.
By default, activities fit the height of their containing row, minus a vertical padding.

This is usually fine for most user models when a resource can only perform one activity at a time.
For models with resources having parallel activities, however, activities can be partially or fully hidden as all activities in a same row have the same vertical position and a same height.

To avoid this behavior, the Gantt configuration allows you to change the activity layout to vertically display the activities differently.

Two alternative activity layouts can be used:

1. Logistic layout

   Parallel activities in a same resource are cascaded vertically. This layout does not impact the height of the resource row.

![alt text](/images/doc/logistic-layout.png 'Logistic layout')

2. Tile layout

   Parallel activities are vertically stacked on top each others. This layout does impact the height of the resource row.

![alt text](/images/doc/tile-layout.png 'Tile layout')

The activity layout is specified with the Gantt configuration `timeTable.layout.strategy` which can be given a `string` that identifies the layout to use or a function returning the same `string`.

- Use the `string` value `"logistic"` for logistic layout.
- Use the `string` value `"tile"` for tile layout.
- Use an empty `string` value for the default activity layout.

This code extract is from the [row layout](/examples/rowlayout.html) example that illustrates the change of activity layout with a function:

```
    var config {
        ...
        timeTable: {
            layout: {
                strategy: function (ctx) {
                    return ctx.gantt.rowLayoutMode; // Returns either an empty string
                }
            }
    ...
```
