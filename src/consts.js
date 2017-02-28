export const VIDPIDS = [{vid: 0x0c45, pid: 0x7401}];
export const REQ_INT_LEN = 8;
export const ENDPOINT = 0x82;
export const INTERFACE = 1;
export const COMMANDS = {
    temp: Buffer.from([0x01, 0x80, 0x33, 0x01, 0x00, 0x00, 0x00, 0x00])
};
