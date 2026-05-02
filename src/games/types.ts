export interface MicroGameProps {
  duration: number;
  seed: number;
  onSuccess: () => void;
  onFail: () => void;
}
