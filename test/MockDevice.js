import _ from 'lodash';

// Gave up on sinon...
class MockInterface {
    constructor({endpointArgs} = {}) {
        this._endpointArgs = endpointArgs;
        this.endpoints = [makeEndpoint('in', this._endpointArgs), makeEndpoint('out')];
    }

    endpoint(i) {
        if (!this.endpoints[i]) {
            this.endpoints[i] = makeEndpoint('in', this._endpointArgs);
        }
        return this.endpoints[i];
    }

    claim() {
        return true;
    }

    detachKernelDriver() {
        return true;
    }

    isKernelDriverActive() {
        return true;
    }
}

function makeEndpoint(direction, {transferErr, dataIn} = {}) {
    const ret = {direction};
    if (direction === 'in') {
        ret.transfer = function transferIn(length, callback) {
            // TODO: Actually honor buffer size for dataIn
            const buffer = dataIn ? Buffer.from(dataIn) : new Buffer(length);
            return callback(transferErr, buffer);
        };
    } else {
        ret.transfer = function transferOut(buffer, callback) {
            return callback(transferErr);
        };
    }
    return ret;
}

let busNumber = 0;
export default class MockDevice {
    // Props are directly set on this
    constructor(props, interfaceArgs = {}) {
        this.interfaces = [];
        this.busNumber = busNumber++;
        this._interfaceArgs = interfaceArgs;
        this.deviceDescriptor = {
            idVendor: 0,
            idProduct: 0
        };
        _.merge(this, props || {});
    }

    open() {
    }

    controlTransfer(bmRequestType, bRequest, wValue, wIndex, data_or_length, callback) { // eslint-disable-line
        return callback(undefined, undefined);
    }

    interface(i) {
        if (!this.interfaces[i]) {
            this.interfaces[i] = new MockInterface(this._interfaceArgs);
        }
        return this.interfaces[i];
    }
}
