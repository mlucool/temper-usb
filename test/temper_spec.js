import {expect} from 'chai';
import {getTemperDevices, TemperDevice} from '../src/temper';
import * as consts from '../src/consts';
import MockDevice from './MockDevice';

describe('temper', () => {
    it('Should have a function to get all devices', () => {
        expect(getTemperDevices()).to.be.an.array;
    });

    describe('TemperDevice', () => {
        it('should give access to the device', () => {
            const md = new MockDevice();
            const td = new TemperDevice(md);
            expect(td.device).to.eql(md);
        });

        it('Should get the temperature in C', (cb) => {
            const md = new MockDevice({endpointArgs: {dataIn: [0x80, 0x02, 0x20, 0x80, 0x30, 0x40, 0x72, 0x76]}});
            const td = new TemperDevice(md);
            td.getTemperature().then(
                (data) => {
                    expect(data[0]).to.eql(32.5);
                    expect(data[1]).to.eql(48.25);
                    cb();
                }
            ).catch(cb);
        });

        it('Should get the temperature in F', (cb) => {
            const md = new MockDevice({endpointArgs: {dataIn: [0x80, 0x02, 0x20, 0x80, 0x30, 0x60, 0x72, 0x76]}});
            const td = new TemperDevice(md);
            td.getTemperature('f').then(
                (data) => {
                    expect(data[0]).to.eql(90.5);
                    expect(data[1]).to.eql(119.075);
                    cb();
                }
            ).catch(cb);
        });

        it('Should throw if it cannot open the device', () => {
            const md = new MockDevice();
            md.open = () => {
                throw 'Test Error'; // eslint-disable-line
            };
            expect(() => new TemperDevice(md)).to.throw('Test Error');
        });

        it('Should throw if it cannot claim the interface', () => {
            const md = new MockDevice();
            md.interface(consts.INTERFACE).claim = () => {
                throw 'Test Error'; // eslint-disable-line
            };
            expect(() => new TemperDevice(md)).to.throw('Test Error');
        });

        it('Should reject is control transfer rejects', (cb) => {
            const md = new MockDevice();
            md.controlTransfer = (bmRequestType, bRequest, wValue, wIndex, data_or_length, callback) => { // eslint-disable-line
                callback(new Error(''), undefined);
            };

            const td = new TemperDevice(md);
            td.getTemperature()
                .then((data) => cb(`Unexpected success with data ${data}`))
                .catch(() => cb());
        });

        it('Should reject if read rejects', (cb) => {
            const md = new MockDevice({endpointArgs: {transferErr: new Error('Test Error')}});
            const td = new TemperDevice(md);
            td.getTemperature()
                .then((data) => cb(`Unexpected success with data ${data}`))
                .catch(() => cb());
        });
    });
});
