import { join } from 'path';
import type { Page } from 'puppeteer-core';
import { TypedEmitter } from 'tiny-typed-emitter';
import type { FfmpegCommand } from 'fluent-ffmpeg';
import { CDPRecorder } from './cdp';
import { X11Recorder } from './x11';
import { BaseEvents, BaseRecorder, BaseTranscoder } from './base';
import { getDebugger } from './debug';

export type { Page };

export { ensureRequiredX11Args } from './x11';

export interface OutputOptions {
  format: 'mp4' | 'flv';
  path: string;
}

type MaybePromise<T> = T | Promise<T>;
export type OutputModifier = (command: FfmpegCommand) => MaybePromise<FfmpegCommand | void>;

export interface PuppeteerStreamerOptions {
  /**
   * Underlying recorder to be used
   *
   * - 'cdp': use the CDP Page.startScreencast recorder
   * - 'x11': use the ffmpeg x11grab recorder
   *   - requires puppeteer to be launched with specific parameters
   *
   * @default 'cdp'
   */
  recorder: 'cdp' | 'x11';
  /**
   * Screen ID to capture, only used when recorder is 'x11'
   * @default $DISPLAY or 99
   */
  screenId?: number;
  /**
   * Frames per second
   *
   * Note: This is not the same as the browser recorder FPS
   * and is only applied to the output video.
   * @default 30
   */
  fps: number;
  /**
   * Number of threads for ffmpeg to utilize
   * @default 1
   */
  threads: number;
  /**
   * Frame size
   * @default '1280x720'
   */
  frameSize: {
    width: number;
    height: number;
  };
  /**
   * Output options
   */
  output: OutputOptions | OutputModifier;
  /**
   * Optional path to ffmpeg binary
   */
  ffmpegPath?: string;
}

const defaultOptions: PuppeteerStreamerOptions = {
  recorder: 'cdp',
  fps: 30,
  threads: 1,
  frameSize: {
    width: 1280,
    height: 720,
  },
  output: {
    format: 'mp4',
    path: join(process.cwd(), 'output.mp4'),
  },
};

export interface StreamerEvents extends BaseEvents {
  start: () => void;
  stop: () => void;
}

export class PuppeteerStreamer extends TypedEmitter<StreamerEvents> {
  private debug = getDebugger('streamer');
  private _page: Page;
  private _recorder: BaseRecorder<BaseTranscoder>;
  private _options: PuppeteerStreamerOptions;

  get page(): Page {
    return this._page;
  }

  get options(): PuppeteerStreamerOptions {
    return this._options;
  }

  get started(): boolean {
    return this._recorder.started;
  }

  get duration(): string {
    return this._recorder.duration;
  }

  constructor(page: Page, options?: Partial<PuppeteerStreamerOptions>) {
    super();
    this._page = page;
    this._options = { ...defaultOptions, ...options };

    if (this._options.recorder === 'x11') {
      let screenId = options?.screenId;
      if (typeof screenId !== 'number') {
        if (process.env.DISPLAY) {
          screenId = parseInt(process.env.DISPLAY.replace(/\D/g, ''), 10);
        } else {
          screenId = 99;
        }
      }

      this.debug('Using X11Recorder with screenId: %s', screenId);
      this._recorder = new X11Recorder(screenId, this);
    } else {
      this.debug('Using CDPRecorder');
      this._recorder = new CDPRecorder(this);
    }
  }

  public async start(): Promise<this> {
    this.debug('Starting streamer');
    await this.setPageViewport();
    await this._recorder.start();
    this.emit('start');
    return this;
  }

  protected async setPageViewport() {
    this.debug('Setting page viewport');
    await this.page.setViewport({
      width: this.options.frameSize.width,
      height: this.options.frameSize.height,
    });
  }

  public async stop(): Promise<this> {
    this.debug('Stopping streamer');
    await this._recorder.stop();
    this.emit('stop');
    return this;
  }
}
