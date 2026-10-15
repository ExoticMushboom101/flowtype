let audio: AudioContext | null = null;
export function playErrorSound() {
  // Created only from an actual input gesture; silent failures never block typing.
  try {
    audio ??= new AudioContext();
    if (audio.state === "suspended") void audio.resume();
    const tone = audio.createOscillator(),
      gain = audio.createGain();
    tone.type = "sine";
    tone.frequency.value = 240;
    gain.gain.setValueAtTime(0.025, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.07);
    tone.connect(gain);
    gain.connect(audio.destination);
    tone.start();
    tone.stop(audio.currentTime + 0.075);
    tone.onended = () => {
      tone.disconnect();
      gain.disconnect();
    };
  } catch {
    /* Sound is optional, including in restricted browsers. */
  }
}
