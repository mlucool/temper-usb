import _ from 'lodash';
import MockDevice from './MockDevice';
import {TemperDevice} from '../temper';

export default class MockTemperDevice extends TemperDevice {
    constructor(...deviceArgs) {
        let args = deviceArgs;
        if (_.size(deviceArgs) === 0) {
            args = [{}, {endpointArgs: {dataIn: [0x80, 0x02, 0x20, 0x80, 0x30, 0x00, 0x72, 0x76]}}];
        }
        const mock = new MockDevice(...args);
        super(mock);
    }
}
