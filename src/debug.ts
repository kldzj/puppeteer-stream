import debug from 'debug';

export function getDebugger(...parts: string[]): debug.Debugger {
  return debug(`puppeteer-streamer:${parts.join(':')}`);
}

export type Debugger = debug.Debugger;
