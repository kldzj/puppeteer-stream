import { join } from 'path';
import puppeteer from 'puppeteer';
import { PuppeteerStreamer, Page, ensureRequiredX11Args } from '../src';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const { width, height } = { width: 1920, height: 1080 };
  const options = ensureRequiredX11Args({
    defaultViewport: { width, height },
    args: [`--window-size=${width},${height}`, '--autoplay-policy=no-user-gesture-required'],
  });

  console.log('Launching browser with options:', options);
  const browser = await puppeteer.launch(options);
  const page = await browser.newPage();
  const streamer = new PuppeteerStreamer(page as unknown as Page, {
    // ffmpegPath: '/path/to/ffmpeg',
    recorder: 'x11',
    output: (command) =>
      command
        // include audio output
        // .addInput('default')
        // .inputFormat('alsa')
        // .audioChannels(2)
        // .audioCodec('aac')
        .outputOptions('-movflags', 'faststart')
        .outputFormat('mp4')
        .output(join(process.cwd(), 'output.mp4')),
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
