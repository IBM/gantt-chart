# Dates

Dates are provided to the Gantt chart as the number of milliseconds since January 1st 1970.
In the data configuration, however, it is possible to provide dates as strings if you specify the date format to be used for parsing the date strings

The date format is provided with the `dateFormat` data configuration.

<br /> Example

```
   var dataConfig = {
       resources : {
       },
       activities : {
          url : "....",
          start : "START" // The START property of user object returned from the given URL provides dates as string with the format "yyyy-MM-dd'T'HH:mm:ss.SSSZ"
       },
       dateFormat : "yyyy-MM-dd'T'HH:mm:ss.SSSZ" // Format to parse date strings from.
    };
```
