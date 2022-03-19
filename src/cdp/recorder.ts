import { CDPSession } from 'puppeteer-core';
import { CDPTranscoder } from '.';
import { PuppeteerStreamer } from '..';
import { BaseRecorder } from '../base';
import { getDebugger } from '../debug';

interface ScreencastFrameEvent {
  data: string;
  sessionId: number;
  metadata: {
    timestamp: number;
  };
}

export class CDPRecorder extends BaseRecorder<CDPTranscoder> {
  protected _transcoder: CDPTranscoder;
  private _session?: CDPSession;
  private _lastFrame?: Buffer;
  private _interval?: NodeJS.Timeout;

  get duration(): string {
    return this._transcoder.duration;
  }

  constructor(streamer: PuppeteerStreamer) {
    super(streamer, getDebugger('cdp', 'recorder'));
    this._transcoder = new CDPTranscoder(this);
  }

  public async start(): Promise<this> {
    if (this.started) {
      return this;
    }

    this.debug('Starting recorder');
    const target = this.streamer.page.target();
    this._session = await target.createCDPSession();
    this._session.on('Page.screencastFrame', this._onScreencastFrame.bind(this));
    await this._session.send('Page.startScreencast', {
      format: 'jpeg',
      quality: 100,
      everyNthFrame: 1,
      maxWidth: this.streamer.options.frameSize.width,
      maxHeight: this.streamer.options.frameSize.height,
    });

    this._interval = setInterval(() => {
      if (!this._lastFrame) return;
      this._passthrough.write(this._lastFrame);
    }, 1000 / this.streamer.options.fps);

    await this._transcoder.start();
    this._started = true;

    return this;
  }

  private async _onScreencastFrame({ data, metadata, sessionId }: ScreencastFrameEvent) {
    if (!metadata.timestamp || !this.started) {
      this.debug('Ignoring frame');
      return;
    }

    await this._session?.send('Page.screencastFrameAck', { sessionId });
    const buffer = Buffer.from(data, 'base64');
    this._lastFrame = buffer;
    this.emit('frame', {
      data: buffer,
      timestamp: metadata.timestamp,
    });
  }

  public async stop(): Promise<this> {
    this.debug('Stopping recorder');
    if (this._interval) {
      clearTimeout(this._interval);
    }

    await this._transcoder.stop();
    await this._session?.send('Page.stopScreencast');
    await this._session?.detach();
    this._started = false;

    return this;
  }
}
