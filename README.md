# FIRSTMap
> An interactive online map of [FRC](https://www.firstinspires.org/robotics/frc) teams and events.

![Screenshot of FIRSTMap](meta/screenshot.png)

# Custom Team Icons
Custom team icons are updated periodically from the FIRST avatar system. The old system of manually submitting icons to FIRSTMap is being phased out in favor of this approach.

# Customizing Team Position
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
--------------------------------------------------------------------------------

This software is protected under the [MIT License](LICENSE).
