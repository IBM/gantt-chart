# Palettes

Palettes are functions that return a color when given an index. They are used by [renderers](./?path=/story/guides-miscellaneous--renderers) to color display elements according to property values.
If the palette is defined with a finite number of colors and the provided index exceeds this number, the modulo index for the number of colors is used instead.

Palettes can be declared for each renderer or globally to the Gantt chart, with the `palette` property of the Gantt configuration.
They can be declared with different signatures:

1. Array

   The palette is provided as an array of colors

```
   var ganttConfig : {
       ...
       palette: ["#ffffd9", "#edf8b1", "#c7e9b4", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#0c2c84"]
   }
   new Gantt( 'gantt', ganttConfig );
```

2. Function

   The palette is configured as a function, taking as a parameter an index and returning a color.

```
   var ganttConfig : {
       ...
       palette: function(index) { return '...'; // Smart code for processing a color based on the given index.
   }
   new Gantt( 'gantt', ganttConfig );
```
