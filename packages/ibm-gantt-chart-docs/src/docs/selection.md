## Selection

Selection is a feature that allows the user to select one or more activities or rows. The selection is done by clicking on the activity or row.

Selection events are fired when the selection changes. 
The configuration of the selection callbacks can be done using the `selection` property of the Gantt configuration object.

### Events

The following handlers are available:

* `selectActivities(activities, activity)` - called when an activity is selected.
* `unselectActivities(activities)` - called when an activity is unselected.
* `activitySelectionChanged(activities, activity)` - called when the selection of an activity changes.
* `selectRows(rows, row)` - called when a row is selected.
* `unselectRows(rows, row)` - called when a row is unselected.
* `rowSelectionChanged(rows, row)` - called when the selection of a row changes.

### Configuration example
```
    var ganttConfig = {
        data : { ...},
        selection: {
            selectActivities(activities, activity) {
                console.log('    -> selectActivities');
            },

            unselectActivities(activities) {
                console.log('    -> unselectActivities');
            },

            activitySelectionChanged(activities, activity) {
                console.log('    -> activitySelectionChanged');
            },

            selectRows(rows, row) {
                console.log('    -> selectRows');
            },

            unselectRows(rows, row) {
                console.log('    -> unselectRows');
            },

            rowSelectionChanged(rows, row) {
                console.log('    -> rowSelectionChanged');
            }
        }
    }
    new Gantt( 'gantt', ganttConfig );
```
    