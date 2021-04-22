# File Watch Time Tracker

## Features

- Uses node-watch to track project files
- Logs git branch names.
- Outputs YAML grouped by week then day.

## Example Config:

**projects.yaml**

```YAML
/Users/multipolygon/projects/project1/: project1
/Users/multipolygon/projects/project1/: project2
```

## Example YAML output:

**log.yaml**

````YAML
active: project-name
branch: master
start: '2021-04-16T14:54:27+10:00'
end: '2021-04-16T18:41:24+10:00'
log:
  year 2021:
    week 15:
      12 April Monday:
        times:
          09:04-09:04: project1@master
          09:04-10:04: project2@master
          10:04-14:04: project2@feature/thing
          14:04-14:04: project1@master
          15:04-15:04: project2@feature/thing
          15:04-18:04: project1@master
          # ...
        totals:
          project1:
            master:
              minutes: 0
              hours: '04:22'
          project2:
            feature/thing:
              minutes: 51
              hours: '03:51'
      13 April Tuesday:
        # ...
```
````
