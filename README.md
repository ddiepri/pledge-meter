# Pledge Meter

Live Kickstarter campaign stats on [BUSY Bar](https://busy.app), with a pixel Flipper One.
Set up for the [Flipper One](https://www.kickstarter.com/projects/flipper-devices/flipper-one) campaign, works with any Kickstarter project.

![Pledge Meter on BUSY Bar](media/pledge-meter.gif)

## Pages

| | |
|---|---|
| ![](screenshots/1.png) | Total raised, next to a pixel Flipper One |
| ![](screenshots/2.png) | Exact total. It rolls up when new pledges come in |
| ![](screenshots/3.png) | Raised today, and a 24-hour chart with one bar per hour |
| ![](screenshots/4.png) | Days to go |
| ![](screenshots/5.png) | Backers, and new backers today |
| ![](screenshots/6.png) | Percent funded and the goal |
| ![](screenshots/7.png) | Pledges over the last hour |
| ![](screenshots/8.png) | Average pledge per backer |
| ![](screenshots/9.png) | Celebration when the total crosses a milestone |

The Flipper One's own screen changes with the page: a picture, an hourglass, a rising chart.

## Controls

- **Dial**: switch pages
- **OK**: refresh now
- **Start**: pause or resume auto-rotation
- **Back**: exit

## Settings

Kickstarter project (`creator/project` from the URL), short name, end date, funding goal, milestone,
update interval (5 seconds to 5 minutes), auto-rotation and seconds per page.

Data comes from the public `stats.json` of the project page. Kickstarter refreshes it about every 5 seconds.
The BUSY Bar needs Wi-Fi with access to kickstarter.com.

## Build

```
npm install
npm run build          # dist/io.github.ddiepri.pledge_meter.tgz
npm run app:install    # to a BUSY Bar connected over USB
```

Screenshots are exact 72×16 captures from the official BUSY Bar Emulator (firmware 1.4.1).

## License

MIT
