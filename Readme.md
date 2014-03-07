
# dashboards-helpscout

    A [Helpscout](https://www.helpscout.net/) plugin for [segmentio/dashboards](https://github.com/segmentio/dashboards).

    Use this plugin to visualize your active ticket count, and who is behind on their tickets.

![](https://f.cloud.github.com/assets/658544/2361183/33c4df78-a62e-11e3-9921-6591e787e43e.png)

## Installation

    $ npm install dashboards-helpscout

## Example

```js
var Dashboards = require('dashboards');
var helpscout = require('dashboards-helpscout');

new Dashboards()
  .use(helpscout('apiKey', 'mailbox-id'));
  .run();
```

## Metrics

The metrics exposed by this plugin are:

- `helpscout.total active tickets`
- `helpscout.total tickets yesterday trailing average` 
- `helpscout.total tickets 0-1 weeks ago`
- `helpscout.total tickets 1-2 weeks ago`
- `helpscout.total active tickets by owner` - total active tickets
- `helpscout.oldest ticket time`
- `helpscout.oldest ticket owner`
- `helpscout.oldest ticket shaming`

## Quickstart

Here's a full example of a [Geckoboard](https://github.com/segmentio/geckoboard) dashboard showing support dashboards:

```js
var Dashboards = require('dashboards');
var helpscout = require('dashboards-helpscout');
var pipe = require('parallel-ware-pipe');
var geckoboard = require('geckoboard')('api-key');

new Dashboards()
  .use(helpscout('apiKey', 'mailbox-id'))
  .use(pipe('helpscout.total tickets yesterday trailing average', widget('widget-id').number))
  .use(pipe('helpscout.total active tickets', widget('widget-id').number))
  .use(pipe('helpscout.total active tickets by owner', widget('widget-id').pie))
  .use(pipe('helpscout.oldest ticket shaming', widget('widget-id').text))
  .run();
```

## License

MIT