import { PassThrough, Readable } from 'stream';
import ffmpeg, { FfmpegCommand } from 'fluent-ffmpeg';
import { TypedEmitter } from 'tiny-typed-emitter';
import { BaseEvents, BaseRecorder } from '.';
import { PuppeteerStreamer } from '..';
import { Debugger } from '../debug';

export interface FFmpegProgressEvent {
  timemark: string;
}

export interface TranscoderEvents extends BaseEvents {
  end: () => void;
}

export abstract class BaseTranscoder extends TypedEmitter<TranscoderEvents> {
  protected debug: Debugger;
  protected _passthrough: PassThrough;
  protected _command: FfmpegCommand;
  private _recorder: BaseRecorder<BaseTranscoder>;
  private _duration: string = '00:00:00.00';
  private _started: boolean = false;
  private _promise?: Promise<void>;

  get streamer(): PuppeteerStreamer {
    return this.recorder.streamer;
  }

  get recorder(): BaseRecorder<BaseTranscoder> {
    return this._recorder;
  }

  get duration(): string {
    return this._duration;
  }

  get started(): boolean {
    return this._started;
  }

  get promise(): Promise<void> | undefined {
    return this._promise;
  }

  constructor(recorder: BaseRecorder<BaseTranscoder>, debug: Debugger) {
    super();
    this.debug = debug;
    this._recorder = recorder;
    this._passthrough = recorder.createReadableStream();
    this._command = ffmpeg(undefined);
    this._command.on('error', (error: Error) => this.emit('error', error));
    this._command.on('start', (cmdline) => this.debug(`Started ffmpeg with command:\n${cmdline}`));
    this._command.on('end', () => {
      this.debug('Transcoding ended');
      this._started = false;
      this.emit('end');
    });

    this._command.on('progress', (progress: FFmpegProgressEvent) => {
      this._duration = progress.timemark;
      this.debug(`Transcoding progress: ${progress.timemark}`);
    });
  }

  public async start(): Promise<this> {
    if (this._started) {
      return this;
    }

    this.debug('Starting transcoding');
    if (this.streamer.options.ffmpegPath) {
      this.debug(`Using ffmpeg from ${this.streamer.options.ffmpegPath}`);
      ffmpeg.setFfmpegPath(this.streamer.options.ffmpegPath);
    }

    this._command.input(this.getInput()).inputFormat(this.getInputFormat());
    this.prepareCommand();

    this._command.outputOptions(...this.getExtraOutputOptions(), ...this.getOutputOptions());

    const { output } = this.streamer.options;
    if (typeof output === 'function') {
      this.debug('Using custom output function');
      await output(this._command);
    } else {
      this.debug('Using default output formats');
      this._command.outputFormat(output.format).output(output.path);

      if (output.format === 'mp4') {
        // this._command.outputOptions('-movflags', 'faststart');
      }
    }

    this._promise = new Promise((resolve) => {
      this._command.on('end', resolve).run();
    });

    return this;
  }

  protected getOutputOptions(): string[] {
    return ['-threads', this.streamer.options.threads.toString()];
  }

  protected abstract getInput(): string | Readable;

  protected abstract getInputFPS(): number;

  protected abstract getInputFormat(): string;

  protected abstract getExtraOutputOptions(): string[];

  protected abstract prepareCommand(): void;

  protected getVideoCodec(): string {
    return 'libx264';
  }

  protected getFrameSize(): string {
    const { width, height } = this.streamer.options.frameSize;
    return `${width}x${height}`;
  }

  public async stop(): Promise<this> {
    this.debug('Stopping transcoding');
    await new Promise((resolve) => {
      this._passthrough.end(resolve);
    });

    await this._promise;
    return this;
  }
}
