import { PuppeteerNodeLaunchOptions } from 'puppeteer-core';

export * from './recorder';
export * from './transcoder';

export function ensureRequiredX11Args(options?: PuppeteerNodeLaunchOptions): PuppeteerNodeLaunchOptions {
  if (options?.headless === true) {
    throw new Error('X11 recorder requires headful mode');
  }

  const ignoredArgs = ['--mute-audio'];
  return {
    ...options,
    headless: false,
    args: [...(options?.args ?? []), '--start-fullscreen', '--disable-infobars'],
    ignoreDefaultArgs:
      typeof options?.ignoreDefaultArgs === 'boolean'
        ? options.ignoreDefaultArgs
          ? true
          : ignoredArgs
        : [...(options?.ignoreDefaultArgs ?? []), ...ignoredArgs],
  };
}
