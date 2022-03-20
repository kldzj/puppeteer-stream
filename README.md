Using this package you are able to screen capture your puppeteer pages.

## Installation

To use this package a [ffmpeg](https://www.ffmpeg.org/) binary needs to be available. You can obtain it from [here](https://ffmpeg.org/download.html) or using the [ffmpeg-static](https://www.npmjs.com/package/ffmpeg-static) package.

Using yarn:

```sh-session
$ yarn add @kldzj/puppeteer-stream
```

Using npm:

```sh-session
$ npm i -S @kldzj/puppeteer-stream
```

## Usage

View the [examples](https://github.com/kldzj/puppeteer-stream/tree/master/examples) on how to use this package.

### Notes on using the `x11` recorder

When using the `x11` recorder it is recommended to render to a [`xvfb`](https://en.wikipedia.org/wiki/X_Window_System#Xvfb) server.

```sh-session
$ export DEBUG=puppeteer-stream:*
$ xvfb-run -s "-screen 0 1920x1080x24" yarn ts-node examples/x11.ts
```

### Code

```typescript
const browser = await puppeteer.launch();
const page = await browser.newPage();

// https://github.com/puppeteer/puppeteer/issues/6904
const streamer = new PuppeteerStreamer(page as unknown as Page, {
  // ffmpegPath: '/path/to/ffmpeg',
  output: {
    format: 'mp4',
    path: join(process.cwd(), 'output.mp4'),
  },
  frameSize: {
    width: 1280,
    height: 720,
  },
  fps: 30,
});

// navigate page
await page.goto('https://example.com');

// start recording
await streamer.start();

// do something
await page.waitFor(1000);

// stop recording
await streamer.stop();

// finish up
await browser.close();
```
