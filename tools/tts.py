"""Reads script.txt aloud into audio.wav with the Kokoro neural voice.
Run: python tools/tts.py script.txt audio.wav [voice]
Used by the publish workflow. If this fails, the workflow falls back to the Piper voice."""
import sys
import numpy as np
import soundfile as sf
from kokoro import KPipeline

src, out = sys.argv[1], sys.argv[2]
voice = sys.argv[3] if len(sys.argv) > 3 else "am_michael"
text = open(src, encoding="utf-8").read()
pipeline = KPipeline(lang_code="a")  # American English
pause = np.zeros(int(24000 * 0.45), dtype=np.float32)
parts = []
for _, _, audio in pipeline(text, voice=voice, speed=1.0, split_pattern=r"\n+"):
    parts.append(np.asarray(audio, dtype=np.float32))
    parts.append(pause)
if not parts:
    sys.exit("no audio produced")
sf.write(out, np.concatenate(parts), 24000)
print(f"wrote {out}: {sum(len(p) for p in parts) / 24000 / 60:.1f} minutes, voice {voice}")
