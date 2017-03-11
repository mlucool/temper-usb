import Promise from 'bluebird';
import _ from 'lodash';
import * as consts from './consts';

const debug = require('debug')('temper-usb:temper');

let libUSB;

/**
 * For testing only!!
 * @private
 */
export function _setUSB(_libUSB) {
    libUSB = _libUSB;
}

/**
 * Get an array of TemperDevices that match the temper vendor/product ID
 * @returns {Array}
 */
export function getTemperDevices() {
    // For testing we need to inject a mock USB
    const usb = libUSB || require('usb'); // eslint-disable-line
    const devices = [];
    _.forEach(usb.getDeviceList(), (device) => {
        const descriptor = device.deviceDescriptor;
        // Find the first matching vid/pid
        const deviceType = _.find(consts.VIDPIDS, (vidpid) =>
            descriptor.idVendor === vidpid.vid &&
            descriptor.idProduct === vidpid.pid
        );
        // If found, add it
        if (deviceType) {
            debug('Adding device from bus %s at address %s with descriptor: %O',
                device.busNumber, device.deviceAddress, descriptor);
            devices.push(new TemperDevice(device));
        }
    });
    return devices;
}

/**
 * A simple class to manager a temper USB device and get the tempature
 */
export class TemperDevice {
    constructor(device) {
        this._device = device;
        // FIXME: Allow for calibration file
        this._scale = 1;
        this._offset = 0;

        try {
            this._device.open(); // This sets a default configuration
        } catch (err) {
            console.error('Error opening device. Likely due to permissions. See README'); // eslint-disable-line
            throw err;
        }

        try {
            [0, 1].forEach((interfaceID) => {
                if (this._device.interface(interfaceID).isKernelDriverActive()) {
                    this._device.interface(interfaceID).detachKernelDriver();
                }
            });
            this._device.interface(consts.INTERFACE).claim();
        } catch (err) {
            console.error('Error claiming interface. Likely due to permissions. See README'); // eslint-disable-line
            throw err;
        }
        // Good errors here...
    }

    /**
     * Get the underlying USB device
     * @returns {object}
     */
    get device() {
        return this._device;
    }

    _controlTransfer(cmd = consts.COMMANDS.temp) {
        return new Promise((resolve, reject) => {
            debug('Starting control transfer');
            this._device.controlTransfer(0x21, 0x09, 0x0200, 0x01, cmd, (err, data) => {
                debug('Control transfer err: %O', err);
                debug('Control transfer data: %O', data);
                if (err) {
                    reject(err);
                }
                resolve(data);
            });
        });
    }

    _interruptRead() {
        debug('Starting interrupt read');
        return new Promise((resolve, reject) => {
            this._device.interface(consts.INTERFACE)
                .endpoint(consts.ENDPOINT)
                .transfer(consts.REQ_INT_LEN, (err, data) => {
                    debug('Interrupt read err: %O', err);
                    debug('Interrupt read data: %O', data);
                    if (err) {
                        reject(err);
                    }
                    resolve(data);
                });
        });
    }

    _getAllSensors() {
        return [0, 1]; // TODO: Make this more generic
    }

    _getSensorOffset(sensor) {
        // TODO: This doesn't work with 1.3, but in the future we can make this generic
        // FIXME: - check in range first
        return (sensor + 1) * 2;
    }

    /**
     * Read the current temperature from the UBS TEMPer device
     * @param {string} [format='c'] Format: 'c' or 'f'
     * @param {number[]} [sensors] Which sensors to get data from? Defaults to all.
     * @returns {Promise.<{}>} An object for sensor->tempature
     */
    getTemperature(format = 'c', sensors = undefined) {
        debug('Starting get temperature');

        // Check range here
        const that = this;
        // Better as async await
        return that._controlTransfer()
            .then((data) => that._interruptRead()).then((data) => {
                const date = Date.now();
                let _sensors = _.castArray(sensors || []);
                if (_.size(_sensors) === 0) {
                    _sensors = this._getAllSensors();
                }
                const temps = {};
                _sensors.forEach((sensorID) => {
                    const offset = this._getSensorOffset(sensorID);
                    let tempC = data[offset] + (data[offset + 1] / 256.0);
                    tempC = (tempC * this._scale) + this._offset;
                    let temp;
                    switch (format) {
                        case 'F':
                        case 'f': {
                            temp = (tempC * (9.0 / 5.0)) + 32;
                            break;
                        }
                        case 'C':
                        case 'c':
                        default: {
                            temp = tempC;
                            break;
                        }
                    }
                    temps[sensorID] = temp;
                });

                return {data: temps, date};
            });
    }
}
