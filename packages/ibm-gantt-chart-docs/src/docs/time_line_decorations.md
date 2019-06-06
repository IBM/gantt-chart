# Add decorations and breaks to the time line

The display of timelines can be customized to add different types of visual elements to provide useful information relative to time for the user model such as:

- Show invalid time zones in which no activity can be performed. This use done by generating global decorations to the time line.
- For each resource, show time frames when the resource cannot perform any activities (breaks). This is done by generating time decorations local to a specific resource.
- Show time markers on the time axis for important dates of the schedule, such as the start date of a project. An API is provided for adding time markers.
- Show time frame markers on the time axis to highlight specific time periods. An API is provided for adding time zone markers.

### Decorations.

Decorations are gray zones displayed in the background of activities to show information such as breaks for a resource or time zones when no activity can be performed.
Decorations can be global to the time line or local to a resource. They have to predefined types:

- Invalid, displayed by default as an hatched area:

![alt text](/images/doc/decoration-invalid.png 'Invalid zone')

- Break, displayed by default a solid gray area:

![alt text](/images/doc/decoration-break.png 'Break zone')
