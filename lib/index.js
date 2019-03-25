"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const usb_1 = require("./usb");
const utils_1 = require("./utils");
class CardInfo {
    constructor(spec, idm, pmm) {
        this.spec = spec;
        this.idm = idm;
        this.pmm = pmm;
    }
}
class NFCDevice {
    constructor(device) {
        this.device = device;
    }
    receive(len) {
        return __awaiter(this, void 0, void 0, function* () {
            let data = yield this.device.transferIn(1, len);
            console.debug(data);
            let arr = [];
            for (let i = data.data.byteOffset; i < data.data.byteLength; i++) {
                arr.push(data.data.getUint8(i));
            }
            console.debug(arr);
            return arr;
        });
    }
    send(data) {
        return __awaiter(this, void 0, void 0, function* () {
            let uint8a = new Uint8Array(data);
            console.debug(uint8a);
            yield this.device.transferOut(2, uint8a);
        });
    }
    sendCommand(cmd, params) {
        return __awaiter(this, void 0, void 0, function* () {
            let command = [0x00, 0x00, 0xff, 0xff, 0xff];
            let data = [0xd6, cmd].concat(params);
            command = command.concat([data.length, 0, 256 - data.length]);
            command = command.concat(data);
            let sum = 0;
            for (let i = 0; i < data.length; i++) {
                sum += data[i];
            }
            let parity = (256 - sum) % 256 + 256;
            command = command.concat([parity, 0]);
            yield this.send(command);
            yield this.receive(6);
            const result = yield this.receive(40);
            return result;
        });
    }
    getType2TagInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            console.debug('SwitchRF');
            yield this.sendCommand(0x06, [0x00]);
            console.debug('InSetRF');
            yield this.sendCommand(0x00, [0x02, 0x03, 0x0f, 0x03]);
            console.debug('InSetProtocol');
            yield this.sendCommand(0x02, [0x00, 0x18, 0x01, 0x01, 0x02, 0x01, 0x03, 0x00, 0x04, 0x00, 0x05, 0x00, 0x06, 0x00, 0x07, 0x08, 0x08, 0x00, 0x09, 0x00, 0x0a, 0x00, 0x0b, 0x00, 0x0c, 0x00, 0x0e, 0x04, 0x0f, 0x00, 0x10, 0x00, 0x11, 0x00, 0x12, 0x00, 0x13, 0x06]);
            yield this.sendCommand(0x02, [0x01, 0x00, 0x02, 0x00, 0x05, 0x01, 0x00, 0x06, 0x07, 0x07]);
            console.debug('InCommRF:SENS');
            yield this.sendCommand(0x04, [0x36, 0x01, 0x26]);
            console.debug('InCommRF:SDD');
            yield this.sendCommand(0x02, [0x04, 0x01, 0x07, 0x08]);
            yield this.sendCommand(0x02, [0x01, 0x00, 0x02, 0x00]);
            const ssdRes = yield this.sendCommand(0x04, [0x36, 0x01, 0x93, 0x20]);
            const result = utils_1.arrayToHexString(ssdRes.slice(15, 19));
            return result === '00' ? null : new CardInfo('Type4', result, null);
        });
    }
    getType3TagInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sendCommand(0x2a, [0x01]);
            console.debug('SwitchRF');
            yield this.sendCommand(0x06, [0x00]);
            console.debug('InSetRF');
            yield this.sendCommand(0x00, [0x01, 0x01, 0x0f, 0x01]);
            console.debug('InSetProtocol');
            yield this.sendCommand(0x02, [0x00, 0x18, 0x01, 0x01, 0x02, 0x01, 0x03, 0x00, 0x04, 0x00, 0x05, 0x00, 0x06, 0x00, 0x07, 0x08, 0x08, 0x00, 0x09, 0x00, 0x0a, 0x00, 0x0b, 0x00, 0x0c, 0x00, 0x0e, 0x04, 0x0f, 0x00, 0x10, 0x00, 0x11, 0x00, 0x12, 0x00, 0x13, 0x06]);
            yield this.sendCommand(0x02, [0x00, 0x18]);
            console.debug('InCommRF:SENS');
            const data = yield this.sendCommand(0x04, [0x6e, 0x00, 0x06, 0x00, 0xff, 0xff, 0x01, 0x00]);
            return new CardInfo('Type3', utils_1.arrayToHexString(data.slice(17, 25)), utils_1.arrayToHexString(data.slice(25, 33)));
        });
    }
    readCardInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.send(usb_1.ACK);
            console.debug('GetProperty');
            yield this.sendCommand(0x2a, [0x01]);
            const type2 = yield this.getType2TagInfo();
            if (type2 != null) {
                return type2;
            }
            const type3 = yield this.getType3TagInfo();
            if (type3 != null) {
                return type3;
            }
            return null;
        });
    }
    readIDm() {
        return __awaiter(this, void 0, void 0, function* () {
            const card = yield this.readCardInfo();
            if (card != null && card.idm != null) {
                return card.idm;
            }
            return '';
        });
    }
}
class DeviceLoader {
    static connectDevice() {
        return __awaiter(this, void 0, void 0, function* () {
            const filter = {
                vendorId: 0x054c,
            };
            try {
                const conf = {
                    filters: [filter],
                };
                const device = yield navigator.usb.requestDevice(conf);
                yield device.open();
                yield device.selectConfiguration(1);
                yield device.claimInterface(0);
                return new NFCDevice(device);
            }
            catch (e) {
                throw e;
            }
        });
    }
}
exports.DeviceLoader = DeviceLoader;
