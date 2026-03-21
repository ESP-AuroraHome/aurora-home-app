import { EventEmitter } from "node:events";

const globalForEmitter = globalThis as typeof globalThis & {
  sensorEmitter: EventEmitter;
};

if (!globalForEmitter.sensorEmitter) {
  globalForEmitter.sensorEmitter = new EventEmitter();
  globalForEmitter.sensorEmitter.setMaxListeners(100);
}

export const sensorEmitter = globalForEmitter.sensorEmitter;
