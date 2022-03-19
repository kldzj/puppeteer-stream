import { Readable } from 'stream';
import { CDPRecorder } from '.';
import { BaseTranscoder } from '../base';
import { getDebugger } from '../debug';

export class CDPTranscoder extends BaseTranscoder {
  constructor(recorder: CDPRecorder) {
    super(recorder, getDebugger('cdp', 'transcoder'));
  }

  protected getInput(): Readable {
    return this._passthrough;
  }

  protected getInputFPS(): number {
    return this.streamer.options.fps;
  }

  protected getInputFormat(): string {
    return 'image2pipe';
  }

  protected getExtraOutputOptions(): string[] {
    return ['-minrate', '1000', '-maxrate', '1000', '-pix_fmt', 'yuv420p'];
  }

  protected prepareCommand(): void {
    this._command
      .size(this.getFrameSize())
      .inputFormat(this.getInputFormat())
      .inputOptions('-probesize', '200M')
      .videoCodec(this.getVideoCodec())
      .inputFPS(this.getInputFPS())
      .outputFPS(this.streamer.options.fps)
      .aspectRatio(this.streamer.options.aspectRatio);
  }
}
