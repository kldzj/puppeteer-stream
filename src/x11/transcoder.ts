import { X11Recorder } from '.';
import { BaseTranscoder } from '../base';
import { getDebugger } from '../debug';

export class X11Transcoder extends BaseTranscoder {
  protected _screen: string | number;

  get screen(): string | number {
    return this._screen;
  }

  constructor(screenId: string | number, recorder: X11Recorder) {
    super(recorder, getDebugger('x11', 'transcoder'));
    this._screen = screenId;
  }

  protected getInput(): string {
    return `:${this.screen}`;
  }

  protected getInputFPS(): number {
    return this.streamer.options.fps;
  }

  protected getInputFormat(): string {
    return 'x11grab';
  }

  protected getExtraOutputOptions(): string[] {
    return ['-preset', 'ultrafast', '-draw_mouse', '0', '-pix_fmt', 'yuv420p'];
  }

  protected prepareCommand(): void {
    this._command
      .size(this.getFrameSize())
      .aspectRatio(this.streamer.options.aspectRatio)
      .inputFPS(this.getInputFPS())
      .outputFPS(this.getInputFPS())
      .videoCodec(this.getVideoCodec())
      .aspectRatio(this.streamer.options.aspectRatio);
  }

  public async stop(): Promise<this> {
    this.debug('Stopping x11grab');
    (this._command as any).ffmpegProc.stdin.write('q');
    await new Promise((r) => setTimeout(r, 1000));
    return super.stop();
  }
}
