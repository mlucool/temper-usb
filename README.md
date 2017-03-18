# Temper

[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url]  [![Coverage Status][coveralls-image]][coveralls-url] [![Dependency Status][depstat-image]][depstat-url]

> TEMPer USB reader for NodeJS

Use connect to an interact with a [temper USB](http://a.co/iwusSK8) compatible sensor.
This project has been tested to work on a raspberry pi and should be easy
to integrate into any NodeJS project. There is also a basic CLI which
outputs [JSONL](http://jsonlines.org/) optionally.

## Usage
There is both a CLI and a library:

### CLI
Get the current temp:
```bash
$ sudo temper
Found 1 devices
2017/02/27 23:52:20.793
  Device on bus 1
    S0: 32
    S1: 24.83984375

```

Get the current temp every 1s, in `F`, and and output as one JSON entry per line
```bash
$ sudo temper -f -p 1000 -j
Found 1 devices
[{"date":"2017-02-27T23:53:27.221Z","busNumber":1,"data":{"0":89.6,"1":76.71171875}}]
```

### Library
```javascript
import {getTemperDevices} from 'temper-usb'; // const getTemperDevices = require('temper-usb').getTemperDevices;
getTemperDevices().forEach((td) => td.getTemperature().then(console.log).catch(console.err));
// {"0": 89.6, "1": 76.71171875}
```

Often you want to test without have a USB pluggined in. For this, 
`MockTemperDevice`, which was used for testing has been exported.
```javascript
import {mock, TemperDevice} from 'temper-usb';
const td = new mock.MockTemperDevice();
console.log(td instanceof TemperDevice); // True
td.getTemperature().then(console.log).catch(console.err); // in C
// { '0': 32.5, '1': 48 } 
```

## Installation

Install `temper` as a dependency:

```shell
npm install --save temper-usb
```
If you want to install scripts globally, use `-g`. If you have install
issues, checkout [usb](https://www.npmjs.com/package/usb) for more info
on installing the correct usb libraries.

## Permissions
As noted [here](https://github.com/padelt/temper-python#usb-device-permissions) and
included in this project for reference. If you don't want to run this as `sudo`,
copy [etc/99-tempsensor.rules](https://github.com/mlucool/temper-usb/blob/master/etc/99-tempsensor.rules)
into `/etc/udev/rules.d/`. You will do something like:
```shell
sudo cp /path/to/my/project/node_modules/temper-usb/etc/99-tempsensor.rules /etc/udev/rules.d/
```

To test restart or reinsert the usb then you should see the following:
```shell
pi@raspberrypi:~ $ lsusb | grep "0c45:7401"
Bus 001 Device 013: ID 0c45:7401 Microdia 
pi@raspberrypi:~ $ sudo ls -l /dev/usb*
total 0
crw-rw-rw- 1 root root 180, 96 Mar  4 15:29 hiddev0
```

## Debugging
We use [debug](https://github.com/visionmedia/debug). In node set env variable `DEBUG=temper-usb:*` 
or in a browser `localStorage.debug='temper-usb:*'` to see debugging output.

## Notes and a Thank You
This project borrows heavily from [temper-python](https://github.com/padelt/temper-python/blob/master/temperusb/cli.py)
and is a vague reimplementation in another language. They have documented many
error cases in that project. It is also much more well tested and complete than this.

### Logging Temperatures to a Google Doc
Want to record temps to a Google doc? Check out this POC: [temper-logger](https://github.com/mlucool/temper-logger)

License
-------------
[Apache-2.0 License](http://www.apache.org/licenses/LICENSE-2.0)

[npm-url]: https://npmjs.org/package/temper-usb
[npm-image]: https://badge.fury.io/js/temper-usb.svg

[travis-url]: http://travis-ci.org/mlucool/temper-usb
[travis-image]: https://secure.travis-ci.org/mlucool/temper-usb.png?branch=master

[coveralls-url]: https://coveralls.io/github/mlucool/temper-usb?branch=master
[coveralls-image]: https://coveralls.io/repos/mlucool/temper-usb/badge.svg?branch=master&service=github

[depstat-url]: https://david-dm.org/mlucool/temper-usb
[depstat-image]: https://david-dm.org/mlucool/temper-usb.png

