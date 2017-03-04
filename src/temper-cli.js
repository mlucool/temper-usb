/* eslint-disable no-console */
import commandLineArgs from 'command-line-args';
import getUsage from 'command-line-usage';
import _ from 'lodash';
import {getTemperDevices} from './temper';

const options = [
    {name: 'celsius', alias: 'c', type: Boolean, description: 'Show data in celsius', defaultValue: true},
    {name: 'fahrenheit', alias: 'f', type: Boolean, description: 'Show data in fahrenheit', defaultValue: false},
    {
        name: 'sensor_ids',
        alias: 's',
        type: Number,
        multiple: true,
        description: 'ID of sensors to use on the device (e.g. 0, 1). Defaults to all'
    },
    {name: 'poll', alias: 'p', type: Number, description: 'How often to poll (ms)'},
    {name: 'jsonl', alias: 'j', type: Boolean, description: 'Print as JSONL', defaultValue: false},
    {name: 'help', alias: 'h', type: Boolean, description: 'Show this documentation'}
];

const args = commandLineArgs(options);
if (args.help) {
    const sections = [
        {
            header: 'A temper reader',
            content: 'Reader for a temper USB. See: https://www.npmjs.com/package/temper'
        },
        {
            header: 'Options',
            optionList: options
        }
    ];
    console.log(getUsage(sections));
    process.exit(0);
}
if (args.fahrenheit) {
    args.celsius = false;
}

const TAB = '  ';

const devices = getTemperDevices();
console.log('Found %s devices', _.size(devices));
if (args.poll) {
    setInterval(() => getAndPrintTemp(), args.poll);
} else {
    getAndPrintTemp();
}

function getAndPrintTemp() {
    const now = new Date();
    Promise.all(devices.map((td) => td.getTemperature(args.fahrenheit ? 'f' : 'c', args.sensor_ids)
        .then((data) => ({busNumber: td.device.busNumber, deviceAddress: td.device.deviceAddress, data}))
        .catch((err) => ({busNumber: td.device.busNumber, deviceAddress: td.device.deviceAddress, err}))
    ))
        .then((datum) => {
            if (args.jsonl) {
                console.log(JSON.stringify(datum.map((data) => _.merge({date: now}, data))));
            } else {
                console.log(niceDateStr(now));
                _.forEach(datum, (data) => {
                    console.log(`${TAB}Device on bus ${data.busNumber}, address ${data.deviceAddress}`);
                    _.keys(data.data).sort().forEach((key) => {
                        console.log(`${TAB}${TAB}S${key}: ${data.data[key]}`);
                    });
                    if (data.err) {
                        console.log(`${TAB}${TAB} Error: ${data.err.toString()}`);
                    }
                });
            }
        })
        // This should never happen
        .catch((err) => {
            console.error(`${niceDateStr(now)}: Error getting and printing: ${err.toString()}`);
        });
}

// See: http://stackoverflow.com/a/12550320
function niceDateStr(d) {
    function pad(n) {
        return n < 10 ? `0${n}` : n;
    }

    function padMS(n) {
        if (n < 10) {
            return `00${n}`;
        }
        if (n < 100) {
            return `0${n}`;
        }
        return n;
    }

    /* eslint-disable prefer-template */
    return d.getFullYear() + '/'
        + pad(d.getMonth() + 1) + '/'
        + pad(d.getDate()) + ' '
        + pad(d.getHours()) + ':'
        + pad(d.getMinutes()) + ':'
        + pad(d.getSeconds()) + '.'
        + padMS(d.getMilliseconds());
    /* eslint-enable prefer-template */
}
