import { join } from 'path';
import puppeteer from 'puppeteer';
import { PuppeteerStreamer, Page } from '../src';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // https://github.com/puppeteer/puppeteer/issues/6904
  const streamer = new PuppeteerStreamer(page as unknown as Page, {
    // ffmpegPath: '/path/to/ffmpeg',
    recorder: 'cdp',
    output: {
      format: 'mp4',
      path: join(process.cwd(), 'output.mp4'),
    },
    frameSize: {
      width: 1920,
      height: 1080,
    },
    fps: 60,
  });

  await page.goto('https://www.testufo.com/');
  await streamer.start();
  await page.waitForSelector('#display_jitter');
  await delay(5 * 1000);
  await page.reload();
  await delay(5 * 1000);
  await page.goto('https://www.w3schools.com/tags/tryit.asp?filename=tryhtml5_audio_autoplay');
  await delay(5 * 1000);
  await streamer.stop();
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
