# Data accessors

Anywhere in the Gantt configuration that a configuration property can be computed, a data accessor is used to provide greater flexibility in defining how this value is computed.
For example, in the data configuration, the `start` property of activities is dynamically computed from a user object representing the activity.
Using a data accessor, the start property can be computed with a call to a function or by looking for a specified object property.

Data accessors can be declared with different signatures:

<a id="data_accessor_string"></a>

### string

The string is a list of property names separated by periods. The first property name is a direct property of the accessed object, the second property name is the name of a property of the property object accessed with the first property name and so on...
<br />

Example:

```
   var dataConfig = {
       activities : {
           start : "SCHEDULE.START", // Data accessor declared as a string. The start property is provided with the START property of the SCHEDULE property object of a task.
           ...
       },
       ...
    };
```

<a id="data_accessor_function"></a>

### function

The function is called to compute a value for a configuration property. The first parameter of the function is the contextual object to get the value from.
This contextual object will vary depending on where the data accessor is used in the Gantt configuration. If it is used in the data configuration, the contextual object will be the user object returned from the data fetcher.
<br />

Example:

```
   function computeEnd(task) {
     return task.SCHEDULE.START + (task.SCHEDULE.DURATION * 60 * 60 * 1000);
   }
   var dataConfig = {
       activities : {
           end : computeEnd, // Data accessor declared as a function. The end property is computed by the function, given a task as the parameter.
           ...
       },
       ...
    };
```
