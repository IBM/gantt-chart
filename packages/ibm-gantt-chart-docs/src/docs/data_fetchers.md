# Data fetchers

Data fetchers are used in data configuration to fetch user objects to create resources, activities, constraints and reservations from.
Data fetchers have different declaration signatures reflecting different uses:

<a id="data_fetcher_http_request"></a>

### Http request

User objects are the result data of an Http request.
The declaration format is:

| Property         |        | Default                                                                                                                                                                                             | Description                                                                                                                                                                                                                                                                                                         |
| ---------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| url              |        | Mandatory property                                                                                                                                                                                  | URL of the Http request.                                                                                                                                                                                                                                                                                            |
| success          |        | null                                                                                                                                                                                                | Optional callback invoked when the Http request succeeds. The callback must have the signature: `function(data, settings) { return [...]; }` and return an array. The provided settings parameter are two properties: `statusText` for the status text and `req` for the details of the Http request that was sent. |
| ajaxConfig       |        | null                                                                                                                                                                                                | Optional object to configure the Http request.                                                                                                                                                                                                                                                                      |
| dataType         | 'json' | Optional parameter to specify which type of data is returned. Possible values are `"json"`, `"xml"`, `"html"` or `"text"`.                                                                          |
| params           | null   | Optional object which properties are sent along the Http request parameters. The `{ firstname: "John", lastname : "Olivier" }` params object appends `?firstname=John&lastname=Olivier` to the URL. |
| method           | 'GET'  | Optional string for Http request method. Possible values are `"POST"`, `"GET"`, `"PUT"`.                                                                                                            |
| customizeRequest | null   | Optional callback invoked to customize the XMLHttpRequest created for the request. The callback takes this object as the parameter. `function(xhr) {}`.                                             |

<br />Code extract from the [House building](/examples/house_building.html) example.

```
  function processHouseTimeWindows(workers, settings) {
      var gantt = settings.gantt;
      return [...];
  }
  var dataConfig = {
      resources : {
          url : "../../data/house_building/workers.json",
          success : processHouseTimeWindows,
          parent : "PARENT_ID",
          id : "OBJECT_ID",
          activities : "ASSIGNMENTS",
          name : "NAME"
      },
      ...
   };
```

<a id="data_fetcher_function"></a>

### Function

User objects are fetched from a function returning an array of objects or a [promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) resolving an array of objects.
The declaration format is:

| Property | Default            | Description                                                                                                                                                                                                                                                                                                                                                |
| -------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| data     | Mandatory property | Function returning an array of objects or a promise resolving an array of objects. The function takes no parameters except if an `all` data configuration entry has been declared. In this case, the function takes the user model resolved with `all` as the parameter. See [Complex mappings](./?path=/story/guides-data--complex-mappings) for details. |
| success  | null               | Optional callback invoked when the `data` callback fetches the objects, through a promise or not. The callback must have the signature: `function(data) { return [...]; }` and return an array.                                                                                                                                                            |

<br />Code extract from the [Activity chart](/examples/activitychart.html) example.

```
 function processResources(model) { // model returned from the dataConfig.all entry
     var resources = [];
     ...
     return resources;
 }

 var dataConfig = {
    all : {
       ...
    }
    resources : {
        data : processResources,
        parent : "parent",
        name : "name",
        id : 'id'
    },
    ...
 };
 new Gantt( 'gantt', { data : dataConfig });
```

### Array of objects

User objects are provided as an array.

The declaration format is:

| Property | Default            | Description          |
| -------- | ------------------ | -------------------- |
| data     | Mandatory property | An array of objects. |

<br />Code example:.

```
    var resources = [
        {
            "NurseId": "NURSES+Anne",
            "NurnseName": "Anne"
        },
        {
            "NurseId": "NURSES+Betsy",
            "NurseName": "Betsy"
        }
    ];

    var dataConfig = {
       resources : {
           data : resources,
           name : "NurseName",
           id : 'NurseId'
       },
       ...
    };
    new Gantt( 'gantt', { data : dataConfig });
```
