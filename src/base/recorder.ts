import { PassThrough, TransformOptions } from 'stream';
import { TypedEmitter } from 'tiny-typed-emitter';
import { BaseEvents, BaseTranscoder } from '.';
import { PuppeteerStreamer } from '..';
import { Debugger } from '../debug';

interface RecorderFrameEvent {
  data: Buffer;
  timestamp: number;
}

export interface RecorderEvents extends BaseEvents {
  frame: (event: RecorderFrameEvent) => void;
}

export abstract class BaseRecorder<T extends BaseTranscoder> extends TypedEmitter<RecorderEvents> {
  protected debug: Debugger;
  protected _started: boolean = false;
  protected _streamer: PuppeteerStreamer;
  protected _passthrough: PassThrough;
  protected abstract _transcoder: T;

  get started(): boolean {
    return this._started;
  }

  get streamer(): PuppeteerStreamer {
    return this._streamer;
  }

  get transcoder(): T {
    return this._transcoder;
  }

  abstract get duration(): string;

  constructor(streamer: PuppeteerStreamer, debug: Debugger) {
    super();
    this.debug = debug;
    this._streamer = streamer;
    this._passthrough = new PassThrough();
  }

  public createReadableStream(opts?: TransformOptions): PassThrough {
    this.debug('Creating readable stream');
    return this._passthrough.pipe(new PassThrough(opts));
  }

  public abstract start(): Promise<this>;

  public abstract stop(): Promise<this>;
}
