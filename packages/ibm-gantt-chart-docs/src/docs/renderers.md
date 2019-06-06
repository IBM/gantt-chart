# Renderers

Renderers are objects responsible for the display of all the customizable graphical elements of the Gantt chart: activities, table cells, constraint arrows, etc.

They have draw methods that generate the _DOM_ nodes of the elements that they are displaying and properties that are used by the drawing methods, such as `color` or `background`.
Renderers are powerful tools for customization:

- They can use _[palettes](#renderer_palette)_ for providing colors based on some property values.
- Values for display properties such as `color` can be **functions** to provide display based on user model properties.
- They can be _[cascaded](#renderer_cascading)_ and act as _CSS rules_, allowing you to apply a renderer conditionally based on dynamic properties, such as the selection of a combobox showing different display modes for the Gantt.

Renderers are automatically instantiated from declarations int the Gantt configuration and have different drawing methods and properties depending on the type of elements they display.
Renderers are declared in:

- `timeTable.renderer` configuration for rendering activities
- `table.columns.[column].renderer` for rendering table cells
- `constraints.renderer` for rendering constraint arrow connectors.
- `loadResourceChart.renderer' for rendering bar charts in a load resource chart.

Here is a schematic declaration of an activity renderer:

```
    var ganttConfig = {
        data : { ...},
        timeTable : {
            renderer : {
                text : function(activity) {
                    return activity.TASK.NAME;
                },
                background : {
                    getValue : 'TASK.NAME'
                },
                color : 'automatic',
                tooltipProperties : function(activity, ctx) {
                    return [ 'Start', new Date(activity.start).format(), 'End', new Date(activity.end).format()];
                }
            }
        }
    };
    new Gantt( 'gantt', ganttConfig );
```

<a id="renderer_defaultproperties"></a>

#### Common renderer properties

Some properties can be declared for all renderer types in the Gantt configuration:

| Property          | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| background        | The background of the element being rendered, for example, the background of the activity rectangle. Can be declared as:<br />a `string` for the color, for example `"#edf8b1"`;<br /> a function that returns a string color, see [callbacks](#callbacks) for details;<br />an object with `getValue` accessors for using palettes, as detailed in [Renderers](./?path=/story/guides-miscellaneous--renderers).                                                                                                                  |
| color             | The color used for displaying text. Can be declared as: <br />a`string` for the color, for example,`"#edf8b1"`;<br />an `automatic` value can be used for using a black or white color that best contrasts with the current background color of the element; <br /> a function that returns a string color, see [callbacks](#callbacks) for details.                                                                                                                                                                              |
| text              | The text of the element being rendered. For example, the text is the name of the activity by default for the activity renderer. Can be declared as: <br />a `string` to declare a [property accessor](./?path=/story/guides-data--data-accessors) to fetch the text from a property of the renderer user object.<br />a function that returns the text, see [callbacks](#callbacks) for details.                                                                                                                                  |
| icon              | The icon for the element being rendered. The icon is usually displayed left of the text. Can be declared as: <br />a `string` to declare a [property accessor](./?path=/story/guides-data--data-accessors) to fetch the icon from a property of the renderer user object;<br />a function returning the icon path, see [callbacks](#callbacks) for details.                                                                                                                                                                       |
| textOverflow      | The mode for managing text overflow. Can have one of the values: <br />`"ellipsis"`: Ellipses are shown if the text is too long to fit in the containing element.<br />`"noDisplay"`: Text is not displayed if too long.<br />`"cut"`: The text is cut to its containing element.                                                                                                                                                                                                                                                 |
| classes           | CSS class or classes for the element being rendered. Can be declared as:<br />an array of strings for the CSS classes to add;<br />a function returning an array of CSS classes. See [callbacks](#callbacks) for details                                                                                                                                                                                                                                                                                                          |
| filter            | A filter for the displayed elements. Declared as a function taking three parameters:<br />- The Gantt object to filter, an activity for an activity renderer.<br/>- A contextual parameter that depends on the type of renderer.<br />- The current search string text in the search text field if any.<br />The function returns `true` if the user model object is accepted with the specified text, `false` otherwise.                                                                                                         |
| tooltipProperties | A function that returns a list of keys or values to display in the tooltip associated with the element to renderer, see [callbacks](#callbacks) for parameter details. En example of returned array is: `[ "start", "March 1975", "end", "April 1977" ]`.                                                                                                                                                                                                                                                                         |
| tooltip           | Provides the complete HTML for the tooltip associated with the element to the renderer. This can be used as an alternative to using `tooltipProperties` if the generated HTML for this last property does not fit the user needs. <br />Declared as a function taking as the first parameter the user model object being rendered and a contextual object, depending on the type of renderer, as the second parameter. <br />The function returns a string for the generated HTML to insert in the tooltip DOM container element. |

<a id="callbacks"></a>

#### Callbacks

All renderer properties such as `text` or `color` can be defined with function callbacks.
For all type of renderers, callbacks are provided the Gantt object being rendered as the first parameter.
The second parameter provided to the callback depends on the type of the renderer. For example, activity renderers will pass the Gantt resource associated with the rendered reservation as the second parameter.

As detailed in [Binding of user and Gantt data](./?path=/story/guides-data--overview), properties of the user object associated with the Gantt object can be accessed transparently through the Gantt object.
Gantt objects have their associated user model object as **prototype**. If property names conflicts arise between both objects, the user model object can be accessed with the `getData` method of the Gantt object.

<a id="renderer_palette"></a>

#### Use of palette

When it comes to coloring a graphic element based on the a particular user model value, palettes are the perfect tool.
Palettes are only used for renderer properties associated with colors, such as properties 'color' or 'background' common to all renderers.
To use a palette for such purposes you can declare the renderer as an object with the following structure:

| Property |           | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| -------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| getValue | Mandatory | [Data accessor](./?path=/story/guides-data--data-accessors) to retrieve a value used for processing the index of the color in the palette. The contextual object used by the accessor (provided as the first parameter if the data accessor is a function) is the user model object being rendered.                                                                                                                                                                    |
| values   | Optional  | Array or function returning an array of possible values returned by the `getValue` accessor. If provided, the index of returned values in this array is the index provided to the palette for getting a color. If `values` are not provided, possible values are gathered dynamically after each call to `getValue`. The disadvantage of this last method is that the color index might vary after each Gantt display depending on occurrences of values in the model. |
| palette  | Optional  | Declares a palette to be used for this color property. See the [Palette](./?path=/story/guides-miscellaneous--palettes) for declaration of palettes. If not provided, the default Gantt palette is used.                                                                                                                                                                                                                                                               |

Here is a code extract from the [House buildig](/examples/house_building.html) example using palette colors:

```
    var ganttConfig = {
        ...
        timeTable : {
            renderer : [ ...,
            {
                selector : function(object, ctx) {
                    // Renderer only applied if the selection of the display mode combobox is 'showAll'
                    return ctx.gantt.colorMode === 'showAll'
                },
                text : function(activity) {
                    return "H" + activity.HOUSE + '-' + activity.TASK.NAME;
                },
                background : {
                    values : function(object, row) { // Function returning an array of possible values.
                        return Object.keys(row.gantt.houseTimeWindows);
                    },
                    getValue : 'HOUSE' // Value used for the background color is provided with the 'HOUSE' property of user model activity objects being rendered.
                },
                color : 'automatic'
            }]
        }
        ...
    }
    new Gantt( 'gantt', ganttConfig );
```

<a id="renderer_automatic"></a>

#### Automatic foregrounds

Providing a color for text to display on top of an unpredictable background color is tricky. This is the case when using palettes for background color.
The `automatic` string value given to the `color` property of a renderer specifies that the Gantt will choose between a white or black color for the text to get the best contrast with the background color given to the rendered element.

<a id="renderer_cascading"></a>

#### Conditional rendering

Renderers provide tools to act as _CSS rules_:

- They have an optional _selector_ property which is a function that determines whether the renderer can be applied. If no selector is provided, the renderer is always applied.
  A typical use of selectors is when a combo box provides several display modes for a Gantt chart. Each display mode is associated with one renderer and the selector of each renderer returns `true` only if the combo box selection correspond to the renderer.
- Instead of declaring one renderer object, an array of renderers can be declared.
  Renderers are applied the one after the other, in the array order.

Here is a code extract from the [House building](/examples/house_building.html) example illustrating the use of several renderers of the display of activities:

```
    var ganttConfig = {
        ...
        timeTable : {
            renderer : [{ // Array of renderers declared
                selector : function(activitiy, ctx) {
                    // Renderer only applied if the selection of the display mode combobox is 'showTasks'
                    return ctx.gantt.colorMode === 'showTasks'
                },
                text : function(activity) {
                    return activity.TASK.NAME;
                },
                textOverflow : 'noDisplay',
                background : {
                    getValue : 'TASK.NAME'
                },
                color : 'automatic',
                tooltipProperties : function(activity, ctx) {
                    ...
                    return props;
                }
            }, {
                selector : function(activity, ctx) {
                    // Renderer only applied if the selection of the display mode combobox is 'showHouses'
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
                color : 'automatic'
            }, {
                selector : function(object, ctx) {
                    // Renderer only applied if the selection of the display mode combobox is 'showAll'
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
                color : 'automatic'
            }]
        }
        ...
    }
    new Gantt( 'gantt', ganttConfig );
```
