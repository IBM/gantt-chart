# Data

The Gantt chart loads its data using a data configuration object that describes how to build the Gantt model and the data that the Gantt chart must use.
The data configuration can be set when instantiating the Gantt chart in the data property of the configuration object that is given to the Gantt constructor.

```
 var dataConfig = {...};
 var gantt = new Gantt( 'gantt', { data : dataConfig });
```

Or the configuration can be set after the Gantt chart creation, invoking its load method with the data configuration as the parameter. The Gantt chart can load new data several times in its lifetime.

```
 var gantt = new Gantt( 'gantt', { ... });
 var dataConfig = {...};
 gantt.load(dataConfig);
```

<a id="ganttmodel"></a>

### Gantt model

The Gantt model consists of a set of resources, activities, reservations and constraints with following properties:

- Resources:

| Property | Type   | Description                                                                                        |
| -------- | ------ | -------------------------------------------------------------------------------------------------- |
| id       | string | A unique identifier for the resource                                                               |
| name     | string | The name of the resource, displayed in the table row representing the resource in a Schedule chart |
| parent   | string | The id of the resource parent of this resource. This property is optional if no parent.            |

- Activities

| Property | Type   | Description                                                                                                                                                                             |
| -------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| id       | string | A unique string identifier for the activity                                                                                                                                             |
| name     | string | The name of the activity, displayed in the time table row representing the resource in a Schedule chart                                                                                 |
| parent   | string | The id of the resource parent of this resource. This property is optional if no parent.                                                                                                 |
| start    | long   | Start date of the activity, date given as the number of milliseconds since Unix Epoch (January 1, 1970}. See [dates](./?path=/story/guides-data--dates) for providing dates as strings. |
| end      | long   | End date of the activity, date given as the number of milliseconds since Unix Epoch (January 1, 1970}. See [dates](./?path=/story/guides-data--dates for providing dates as strings.    |

- Reservations

| Property | Type   | Description                                           |
| -------- | ------ | ----------------------------------------------------- |
| resource | string | The id of the resource to associate with an activity. |
| activity | string | The id of the activity to assoicate with a resource.  |

- Constraints

| Property | Type   | Description                                                                                                                                                                                                     |
| -------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| from     | string | The id of the activity the constraints starts from.                                                                                                                                                             |
| to       | string | The id of the activity the constraints goes to.                                                                                                                                                                 |
| type     | string | The type of the constraint, can be one of the values: `Gantt.constraintTypes.START_TO_START`, `Gantt.constraintTypes.START_TO_END`, `Gantt.constraintTypes.END_TO_END` or `Gantt.constraintTypes.END_TO_START`. |

<br/>The Gantt chart only uses a subset of this data depending on whether it is a Schedule chart of an Activity chart ([Gantt concepts](./?path=/story/guides-introduction--concepts)).
The type of Gantt chart is specified with the **`type`** configuration property which can have one of two values:
**`Gantt.type.ACTIVITY_CHART`** or **`Gantt.type.SCHEDULE_CHART`**. If not specified, the type is set to **`Gantt.type.SCHEDULE_CHART`** to specify a Schedule chart.

Here is a schematic code for configuring an activity chart:

```
 var gantt = new Gantt( { type: 'Gantt.type.ACTIVITY_CHART', ... });
```

If a Schedule chart, the Gantt only requires:

- resources
- activities: see [Alternatives to declaring activities and reservations](#dataconfig_noreservations) for accessing activities from resources.
- reservations: see [Alternatives to declaring activities and reservations](#dataconfig_noreservations) for not declaring reservations.

If an Activity chart, the Gantt uses.

- activities
- constraints
- resources (optional)

<a id="dataconfig_format"></a>

### Data configuration format

The data configuration object has one property for each type of objects to populate for the Gantt:

```
 var dataConfig = {
   resources : ..., // specifies how to populate resources
   activities : ..., // specifies how to populate activities
   constraints : ..., // specifies how to populate constraints
   reservations : ..., // specifies how to populate reservations
 }
 var gantt = new Gantt( 'gantt', { data : dataConfig } );
```

Each property has the same format, it can be either:

- An array, providing as is the list of resources, activities, constraints or reservations. The provided objects must have the appropriate properties set as described in the [Gantt model](#ganttmodel) section.

```
    var resources = [
        {
            "id": "NURSES+Anne",
            "name": "Anne"
        },
        {
            "id": "NURSES+Betsy",
            "name": "Betsy"
        }
    ];
    var activities = [
        {
            "id": "SHIFTS+Emergency+Monday+2+8",
            "name": "Emergency",
            "start": 1474880400000,
            "end": 1474902000000
        },
        {
            "id": "SHIFTS+Emergency+Wednesday+12+18",
            "name": "Emergency",
            "start": 1475089200000,
            "end": 1475110800000
        },
        {
            "id": "SHIFTS+Emergency+Saturday+12+20",
            "name": "Emergency",
            "start": 1475348400000,
            "end": 1475377200000
        },
        {
            "id": "SHIFTS+Consultation+Friday+8+12",
            "name": "Consultation",
            "start": 1475247600000,
            "end": 1475262000000
        }
    ];
    var reservations = [
        { resource: "NURSES+Anne", activity: "SHIFTS+Emergency+Monday+2+8" },
        { resource: "NURSES+Betsy", activity: "SHIFTS+Emergency+Wednesday+12+18" },
        { resource: "NURSES+Betsy", activity: "SHIFTS+Emergency+Saturday+12+20" },
        { resource: "NURSES+Betsy", activity: "SHIFTS+Consultation+Friday+8+12" },

    ];
    new Gantt( 'gantt', {
        data : {
            resources: resources,
            activities : activities,
            reservations : reservations
        }
    });
```

- or an object for more powerful configuration, to allow data to be fetched from many **source types** and to perform a **mapping** between the fetched user object and the resource, activity, constraint or reservation object to be created.

  - Declaration of a _data fetcher_ responsible for fetching the list of user objects, from an ajax request or a function for example. Each fetched object will map to one resource, activity, constraint or reservation.
    The `data` property declares a data fetcher returning user objects from an array or a function, the `url` property declares a data fetcher fetching user objects from an Http request (other properties apply).
    See [data fetcher](./?path=/story/guides-data--data-fetchers) for configuration details of a data fetcher.
  - Other properties are mapping properties. They determine how to create a property of the resource, activity, constraint or reservation. The name of the property **is** the name of the property to be created and the value configures a _data accessor_ that will create the property value provided by the user object.
    For example, the `start` property of an activity can be configured as follows:

```
  var dataConfig = {
    activities : {
        data : function() { return [ ... ]; },
        start : function(userObject) { return new Date(userObject.startAsString).getTime(); }
    ....
```

See the [Gantt model](#ganttmodel), for the list of properties of objects of the Gantt model. See [Data accessors](./?path=/story/guides-data--data-accessors) for the configuration of a data accessor.

Example fetching data from ajax request and performing mappings on retrieved objects:

```
 function makeDate(obj, prop) { return new Date(obj.prop).getTime(); }

 var dataConfig = {
       resources: {
         url: '/data/resources.json', // Fetch resource user objects from the /data/resources.json URL
         parent: 'parentId', // The parentId property of returned users objects provides the id of the parent resource.
         id: 'id', // The id property of returned user objects provides the id of the resource
         name: 'label' // The label property of returned user objects provides the name of the resource
     },
     activities: {
         url: '/data/activities.json', // Fetch activity user objects from the /data/activities.json URL
         start: function(obj) { return makeDate(obj, 'startTime'); },
         end: function(obj) { return makeDate(obj, 'endTime'); },
         name: 'label'
     },
     reservations : {
         url: '/data/reservations.json', // Fetch reservation user objects from the /data/reservations.json URL
         resource : 'resourceId', // The id of the resource of the reservation is provided with the resourceId property of the user object.
         activity : 'activityId' // The id of the activity of the reservation is provided with the activivtyId property of the user object.
     }
 };
 new Gantt( 'gantt', { data: dataConfig });
```

Some user models might not fit well with this approach of fetching different Gantt model object types with separate requests.
For example, the user model might be accessible only in one chunk of data. The approaches discussed in [Alternatives to declaring activities and reservations](#dataconfig_noreservations) might solve this problem, but in some cases not.
For such unresolved cases, see the use of the `all` data configuration property in the [Complex mappings](./?path=/story/guides-data--complex-mappings) section.

See the [Activity chart](/examples/activitychart.html) example for how the most complicated data fetching and data mapping cases can be solved.
This sample creates its own `XmlHttpRequest` to fetch data and performs mapping from a user model fetched in one block (the Xml document).

<a id="binding"></a>

### Binding of user and Gantt data.

Gantt model objects such as resources or activities are tightly coupled with the user model object they represent. Gantt object properties are the result of mappings performed on those user model objects, as defined with the data configuration.
If the user model object changes, the mapping Gantt object must reflect this change. In the same way, whenever something is changed in the Gantt object, the related user object must react to this change.
To seal this tight relationship between the Gantt chart and the user data, Gantt objects have the user object they represent as a **prototype** object.

This way, when accessing a Gantt object, through a [renderer](./?path=/story/guides-miscellaneous--renderers) callback or an interaction callback, properties of the associated user model object can be directly accessed through the Gantt object.
Also, this makes it possible to easily define [renderer properties](./?path=/story/guides-miscellaneous--renderers) based on user model properties using [data accessors](./?path=/story/guides-data--data-accessors).

Gantt model objects have their own properties, computed from the user model object properties, as listed in [Gantt model](#ganttmodel).
Conflicts can arise between the user model properties and Gantt model properties. For example, if an activity user object has a `start` property, this property will be hidden from the Gantt activity which has its own `start` property.
To avoid conflicts, the user model object can be accessed from the Gantt object with the `getData` method. The start property conflict is resolved with the code:

```
    var ganttConfig = {
        timeTable : {
            renderer : {
                tooltipProperties : function(activity, ctx) {
                    var props = [ 'Text', activity.getData().name, 'Start', activity.getData().start, 'End', activity.getData().end];
                    return props;
                }
    ...
```

<a id="dataconfig_noreservations"></a>

### Alternatives to declaring activities and reservations

For some user models, the concept of reservation is implicit, no entities hold the association between a resource and an activity. Instead, a user resource can directly hold a list of activities performed by the resource, or an activity can hold a reference to its resource.

The data configuration supports these implicit declarations avoiding the need to declare reservations:

- A resource can list its activities
  This is done with the `activities` property of the `resources` data configuration. The property value declares a [data accessor](./?path=/story/guides-data--data-accessors) as for other mapping properties.
  Here is a code example extracted from the [House building](/examples/house_building.html) example.

```
 var dataConfig = {
    resources : {
        url : "../../data/house_building/workers.json",
        success : processHouseTimeWindows,
        parent : "PARENT_ID",
        id : "OBJECT_ID",
        activities : "ASSIGNMENTS", // The ASSIGNMENTS property of worker objects provide a list of assignments for this resource.
        name : "NAME"
    },
    activities : {
        start : function(assignment) { return makeDate(assignment.START); },
        end : function(assignment) { return makeDate(assignment.END); },
        name : "TASK.NAME"
    }
 }
```

If `activities` do not provide a data fetcher, note that the **`activities` declaration is still required** to provide property mappings between the activity user objects listed with `resources.activities` and teh Gantt activities.

- An activity can hold a reference to its resource.
  This can be specified with the `resource` property of the `activities` data configuration. The property value declares a [data accessor](./?path=/story/guides-data--data-accessors) as for other mapping properties.
  The resource property provides the id of the resource performing the activity.

Example:

```
  var dataConfig = {
      resources : {
          url : "/data/resources.json",
          id : "id",
          name : "NAME"
      },
      activities : {
          url: "/data/tasks.json", // URL to tasks that will be activities of the Gantt chart
          resource: 'resourceId', // The resourceId property of task object provide the id of the resource performing the task(activity)
          start : "startTime",
          end : "endTime",
          name : "NAME"
      }
   }
```
