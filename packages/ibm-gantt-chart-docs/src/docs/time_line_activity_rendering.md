# Rendering of activities

Changing the default display of activities to reflect properties of the user model is one of the most important features of the Gantt chart.
This can be done by declaring one or several [renderers](./?path=/story/guides-miscellaneous--renderers) in the `timeTable.renderer` Gantt configuration.
See [common renderer properties](./?path=/story/guides-miscellaneous--renderers) for the list of properties that can be used.

Here is a code extract from the [House building](/examples/house_building.html) sample that combines renderer cascading and the use of palettes features:

```
    var ganttConfig = {
            ...
            timeTable : {
                renderer : [
                    {
                        selector : function(object, ctx) {
                            // Use this renderer if the display mode combobox is selected on 'Tasks'
                            return ctx.gantt.colorMode === 'showTasks'
                        },
                        text : function(activity) { // Instead of using a function, the text property could have been declared as: text : "TASK.NAME"
                            return activity.TASK.NAME;
                        },
                        textOverflow : 'noDisplay', // Hide the text if it doesn't fit the width of the activity rectangle
                        background : {
                            // Uncomment line below to fix the index order of task names and therefore ensure tasks will always be displayed with the same color.
                            //values : [ 'facade', 'ceiling', 'windows', 'moving', 'masonry', 'carpentry', 'roofing', 'plumbing', 'painting', 'garden' ],
                            // Uncomment line below for using a palette replacement from the default Gantt palette.
                            //palette : ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6", "#6a3d9a"],
                            getValue : 'TASK.NAME'
                        },
                        color : 'automatic', // Text color will be white or black depending on the background color of the activity rectangle.
                        tooltipProperties : function(activity, ctx) {
                            var props = [ 'Start', new Date(activity.start).format(), 'End', new Date(activity.end).format()];
                            // Create a large amount of tooltip properties to demonstrate how the tooltip behaves on large property numbers.
                            for(var i = 0; i < 50; i++) {
                                props.push('Property ' + (i + 1));
                                props.push('Value ' + (i + 1));
                            }
                            return props;
                        }
                    }, {
                        selector : function(object, ctx) {
                            // Use this renderer if the display mode combobox is selected on 'Houses'
                            return ctx.gantt.colorMode === 'showHouses'
                        },
                        text : function(activity) {
                            return "H" + activity.HOUSE;
                        },
                        background : {
                            values : function(object, ctx) {
                                return Object.keys(ctx.gantt.houseTimeWindows);
                            },
                            // Default palette is used
                            getValue : 'HOUSE' // Access the HOUSE field of provided activity. eq to function(act) { return act.HOUSE; }
                        },
                        color : 'automatic' // Text color will be white or black depending on the background color of the activity rectangle.
                    }, {
                        selector : function(object, ctx) {
                            // Use this renderer if the display mode combobox is selected on 'All'
                            return ctx.gantt.colorMode === 'showAll'
                        },
                        text : function(activity) {
                            return "H" + activity.HOUSE + '-' + activity.TASK.NAME;
                        },
                        background : {
                            values : function(object, row) {
                                return Object.keys(row.gantt.houseTimeWindows);
                            },
                            getValue : 'HOUSE'
                        },
                        color : 'automatic' // Text color will be white or black depending on the background color of the activity rectangle.
                    }
                 ]
            }
            ...
        }
        new Gantt( 'gantt', ganttConfig );
```

<a id="activityrenderer_callbacks"></a>

#### Callbacks

All renderer properties can be defined as function callbacks to fetch display properties according to dynamic user model properties.
Functions will be called providing as the parameters:

- The Gantt reservation or activity being rendered, depending on whether the Gantt chart is a Schedule chart or Activity chart.
  In the House building sample previously illustrated, the passed object is a Gantt reservation associated with the assignments of the user model.
- The Gantt resource or Gantt activity containing the activity being rendered, depending on whether the Gantt is a Schedule chart or Activity chart.

See [Binding of user and Gantt data](./?path=/story/guides-data--overview) for details on how to access user model object through Gantt model objects.
