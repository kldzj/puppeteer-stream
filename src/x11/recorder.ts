import { PassThrough } from 'stream';
import { BaseRecorder } from '../base';
import { PuppeteerStreamer } from '..';
import { X11Transcoder } from './transcoder';
import { getDebugger } from '../debug';

export class X11Recorder extends BaseRecorder<X11Transcoder> {
  protected _transcoder: X11Transcoder;

  get duration(): string {
    return this._transcoder.duration;
  }

  constructor(screenId: number, streamer: PuppeteerStreamer) {
    super(streamer, getDebugger('x11', 'recorder'));
    this._passthrough = new PassThrough();
    this._transcoder = new X11Transcoder(screenId, this);
  }

  public async start(): Promise<this> {
    if (this.started) {
      return this;
    }

    this.debug('Starting recorder');
    await this._transcoder.start();
    this._started = true;

    return this;
  }

  public async stop(): Promise<this> {
    this.debug('Stopping recorder');
    await this._transcoder.stop();
    return this;
  }
}
