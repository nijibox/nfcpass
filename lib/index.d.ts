/// <reference types="w3c-web-usb" />
export declare class CardInfo {
    readonly spec: string;
    readonly idm: string;
    readonly pmm: string | null;
    constructor(spec: string, idm: string, pmm: string | null);
}
export declare class NFCDevice {
    readonly device: USBDevice;
    constructor(device: USBDevice);
    receive(len: number): Promise<number[]>;
    send(data: number[]): Promise<void>;
    sendCommand(cmd: number, params: number[]): Promise<number[]>;
    getType2TagInfo(): Promise<CardInfo | null>;
    getType3TagInfo(): Promise<CardInfo>;
    readCardInfo(): Promise<CardInfo | null>;
    readIDm(): Promise<string>;
}
export declare class DeviceLoader {
    static connectDevice(): Promise<NFCDevice>;
}
