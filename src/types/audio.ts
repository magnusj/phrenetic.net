export interface AudioData {
  frequencyData: Uint8Array;
  timeDomainData: Uint8Array;
  bass: number;
  mid: number;
  treble: number;
  volume: number;
}
