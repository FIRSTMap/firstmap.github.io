# FIRSTMap
> An interactive online map of [FRC](https://www.firstinspires.org/robotics/frc) teams and events.

![Screenshot of FIRSTMap](meta/screenshot.png)

# Custom Team Icons
Custom team icons are updated periodically from the FIRST avatar system. The old system of manually submitting icons to FIRSTMap is being phased out in favor of this approach.

# Customizing Team Position
Team positions are downloaded from The Blue Alliance API using [FIRSTMap-scraper](https://github.com/FIRSTMap/FIRSTMap-scraper). While the scraper may find the location of the city where a team resides, it cannot necessarily find the exact location of the team's workspace. Customizing your team's position allows your team's marker to show up at the exact location of your workspace.

### Instructions for customizing team position:
1. Fork the repository.
2. Open `data/custom_locations.json` and add your team's latitude and longitude to the array within the file. This data entry should follow the syntax:
```json
"team_number": {
    "lat": latitude,
    "lng": longitude
}
```
3. Push these changes to your fork of FIRSTMap.
4. Open a pull-request with the main FIRSTMap repository to merge your fork back to the origin.
5. Enjoy the updated location of your team's marker!

Note: Any team that has not competed in the current season (including the offseason, but excluding events not listed on The Blue Alliance) will not be found by the scraper and will not show up on the map. If your team has competed in the current season (according to The Blue Alliance), but is not on the map, the scraper likely needs to be run again to update the team list. You may wish to open an issue if your team is in this situation.

--------------------------------------------------------------------------------

This software is protected under the [MIT License](LICENSE).
