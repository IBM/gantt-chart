# Complex mappings

For some user models, objects that need to be mapped as resources, activities, constraints or reservations might not always be simply accessible from separate requests, as illustrated in [Data configuration format](./?path=/story/guides-data--overview).
For example, the user model might only be accessible through one entry point from the server, only returning one _big chunk_ of data.
You do not want to fetch the same data several times and have the post processing callbacks of each request generate different [Gantt model](./?path=/story/guides-data--overview) objects.

Instead, the data configuration provides a mechanism to:

1. First fetch the user model at one with the `all` data configuration entry which configures a [data fetcher](./?path=/story/guides-data--data-fetcher).
   Typically, a `success` callback is declared along with the data fetcher for processing the user model and to `prepare` the user objects to be mapped as [Gantt model](./?path=/story/guides-data--overview) objects.
2. Then enable the data fetchers for each type of Gantt model objects (resources, activities, etc...) to collect its set of objects from the processed model.

Here are two examples that illustrate different ways of fetching and processing the user model as one chunk of data:

1. The following is schematic code for fetching the user model from an http request and processing it in a way to easily collect the Gantt model objects :

```
   var dataConfig = {
       all : {
          url : "/examples/all.json",
          success : function(data) {
                var result = {
                   resources: [],
                   activities: [],
                   reservations: []
                }
                // Process the data user model and fill the result.resources, result.activites and result.reservations arrays.
                ...
                return result; // Return the processed model
          }
       }
       activities : {
           data : 'activities', // Get the activities from the "activities" property of the model(result) returned by the "all" data fetcher
           start : "...",
           ...
       },
       resources : {
           data : 'resources', // Get the resources from the "resources" property of the model(result) returned by the "all" data fetcher
           parent : "...",
           ...
       },
       resources : {
           data : 'reservations', // Get the reservations from the "reservations" property of the model(result) returned by the "all" data fetcher
           parent : "...",
           ...
       },
    };
    new Gantt( 'gantt', { data : dataConfig } );
```

2. The following code is extracted from the more advanced [Activity chart](/examples/activitychart.html) example.
   Data is fetched from a function that creates its own XmlHttpRequest and returns the user model as an XML document from a promise.
   Each data fetcher (resources, activities, etc...) collects its user object from callbacks taking the user model resolved by the promise as the parameter.

```
   // Read resources from an XML node
   function processResources(xmlDoc) {
       var resources = [];
       function readResources(xmlNode) {
           ...
       }
       readResources(xmlDoc.getElementsByTagName("resources")[0]);
       return resources;
   }

   // Read activities from an XML node
   function processActivities(xmlDoc) {
       var actsNode = xmlDoc.getElementsByTagName("activities")[0];
       function createDateParser(format) {
           ....
       }
       readActivities(...);
       return activities;
   }

   // Read reservations from an XML node
   function processReservations(xmlDoc) {
       var resas = [], node;
       function readReservations(xmlNode) {
          ....
       }
       readReservations(xmlDoc.getElementsByTagName("reservations")[0]);
       return resas;
   }

   // Read constraints from an XML node
   function processConstraints(xmlDoc) {
       var consts = [], node;
       ....
       return consts;
   }
   var dataConfig = {
        all : function() {
            return new Promise(function(resolve, reject) {
                var xhr = new XMLHttpRequest();
                xhr.open('GET', xmlPath, true);

                // If specified, responseType must be empty string or "document"
                //xhr.responseType = 'document';

                // overrideMimeType() can be used to force the response to be parsed as XML
                xhr.overrideMimeType('text/xml');

                xhr.onload = function () {
                    if (xhr.readyState === xhr.DONE) {
                        if (xhr.status === 200) {
                            resolve(xhr.response);
                        }
                    }
                };
                xhr.onload = function () {
                    if (this.status >= 200 && this.status < 300) {
                        resolve(xhr.responseXML);
                    } else {
                        reject({
                            status: this.status,
                            statusText: xhr.statusText
                        });
                    }
                };
                xhr.onerror = function () {
                    reject({
                        status: this.status,
                        statusText: xhr.statusText
                    });
                };
                xhr.send();
            });
        },
        resources : {
            data : processResources,
            parent : "parent",
            name : "name",
            id : 'id'
        },
        reservations : {
            data : processReservations,
            activity : 'activity',
            resource : 'resource'
        },
        activities : {
            data : processActivities,
                start : 'start',
                end : 'end',
                name : 'name',
                parent : 'parent'
        },
        constraints : {
            data : processConstraints,
            from : 'from',
            to : 'to',
            type : 'type'
        }
    };
    new Gantt( 'gantt', { data : dataConfig } );
```
