import asyncio
import fractions
import numpy as np
from aiortc import MediaStreamTrack
from av import AudioFrame
from av.audio.resampler import AudioResampler
import time

class QueueAudioTrack(MediaStreamTrack):
    kind = "audio"

    def __init__(self, queue: asyncio.Queue):
        super().__init__()
        self.queue = queue
        self.resampler = AudioResampler(format="s16", layout="mono", rate=48000)
        self.sample_rate = 48000
        self.samples_per_frame = 960
        self.buffer = np.zeros(0, dtype=np.int16)
        self.timestamp = 0
        self.time_base = fractions.Fraction(1, self.sample_rate)
        self.frame_duration = 0.02
        self.next_time = time.perf_counter()

    async def recv(self):
        now = time.perf_counter()
        sleep_time = self.next_time - now
        if sleep_time > 0:
            await asyncio.sleep(sleep_time)
        self.next_time += self.frame_duration

        while len(self.buffer) < self.samples_per_frame:
            try:
                pcm = self.queue.get_nowait()
            except asyncio.QueueEmpty:
                break

            if pcm is None:
                return await asyncio.sleep(0)

            self._append_resampled(pcm)

        if len(self.buffer) < self.samples_per_frame:
            missing = self.samples_per_frame - len(self.buffer)
            silence = np.zeros(missing, dtype=np.int16)
            self.buffer = np.concatenate((self.buffer, silence))

        chunk = self.buffer[:self.samples_per_frame]
        self.buffer = self.buffer[self.samples_per_frame:]

        frame = AudioFrame(format="s16", layout="mono", samples=len(chunk))
        frame.sample_rate = self.sample_rate
        frame.planes[0].update(chunk.tobytes())
        frame.pts = self.timestamp
        frame.time_base = self.time_base
        self.timestamp += len(chunk)

        return frame

    def _append_resampled(self, pcm):
        frame = AudioFrame(format="s16", layout="mono", samples=len(pcm)//2)
        frame.sample_rate = 24000
        frame.planes[0].update(pcm)
        for f in self.resampler.resample(frame):
            arr = f.to_ndarray()
            if arr.ndim > 1:
                arr = arr[0]
            self.buffer = np.concatenate((self.buffer, arr.astype(np.int16)))