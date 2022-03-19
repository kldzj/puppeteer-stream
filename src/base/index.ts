export * from './recorder';
export * from './transcoder';

export interface BaseEvents {
  error: (error: Error) => void;
}
