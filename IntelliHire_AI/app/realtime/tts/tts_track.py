import asyncio
import fractions
import numpy as np
from aiortc import MediaStreamTrack
from av import AudioFrame
import time
from logging import getLogger

logger = getLogger(__name__)

class QueueAudioTrack(MediaStreamTrack):
    kind = "audio"

    def __init__(self, queue: asyncio.Queue):
        super().__init__()
        self.queue = queue
        # No resampler needed; assume Deepgram TTS outputs 48kHz PCM
        self.sample_rate = 48000  # Match Deepgram TTS output
        self.samples_per_frame = 960  # 20ms at 48kHz
        self.buffer = np.zeros(0, dtype=np.int16)
        self.timestamp = 0
        self.time_base = fractions.Fraction(1, self.sample_rate)
        self.frame_duration = 0.02  # 20ms
        self.next_time = time.perf_counter()

    async def recv(self):
        now = time.perf_counter()
        sleep_time = self.next_time - now
        if sleep_time > 0:
            await asyncio.sleep(sleep_time)
        self.next_time += self.frame_duration

        # Process all available PCM chunks in the queue
        while True:
            try:
                pcm = self.queue.get_nowait()
                if pcm is not None:
                    logger.info(f"Processing PCM chunk from queue: {len(pcm)} bytes")
                    self._append_pcm(pcm)
                else:
                    break
            except asyncio.QueueEmpty:
                break

        # If buffer is empty, return a silent frame
        if len(self.buffer) == 0:
            silence = np.zeros(self.samples_per_frame, dtype=np.int16)
            frame = AudioFrame(format="s16", layout="mono", samples=len(silence))
            frame.sample_rate = self.sample_rate
            frame.planes[0].update(silence.tobytes())
            frame.pts = self.timestamp
            frame.time_base = self.time_base
            self.timestamp += len(silence)
            # logger.info("Yielding silent audio frame")
            return frame

        # If buffer has enough samples, create a frame
        if len(self.buffer) >= self.samples_per_frame:
            chunk = self.buffer[:self.samples_per_frame]
            self.buffer = self.buffer[self.samples_per_frame:]
            frame = AudioFrame(format="s16", layout="mono", samples=len(chunk))
            frame.sample_rate = self.sample_rate
            frame.planes[0].update(chunk.tobytes())
            frame.pts = self.timestamp
            frame.time_base = self.time_base
            self.timestamp += len(chunk)
            logger.info(f"Yielding audio frame with {len(chunk)} samples")
            return frame
        else:
            # If not enough samples, pad with silence
            missing = self.samples_per_frame - len(self.buffer)
            silence = np.zeros(missing, dtype=np.int16)
            chunk = np.concatenate((self.buffer, silence))
            self.buffer = np.zeros(0, dtype=np.int16)  # Clear buffer
            frame = AudioFrame(format="s16", layout="mono", samples=len(chunk))
            frame.sample_rate = self.sample_rate
            frame.planes[0].update(chunk.tobytes())
            frame.pts = self.timestamp
            frame.time_base = self.time_base
            self.timestamp += len(chunk)
            logger.info(f"Yielding padded audio frame with {len(chunk)} samples")
            return frame

    def _append_pcm(self, pcm):
        logger.info(f"Received PCM chunk: {len(pcm)} bytes")
        if pcm is None or len(pcm) == 0:
            return
        try:
            if len(pcm) % 2 != 0:
                logger.warning(f"Odd PCM buffer length: {len(pcm)}")
                pcm = pcm[:-(len(pcm) % 2)]  # Trim to even length
            arr = np.frombuffer(pcm, dtype=np.int16)
            self.buffer = np.concatenate((self.buffer, arr))
        except Exception as e:
            logger.error(f"Error in _append_pcm: {e}")




# import asyncio
# import fractions
# import numpy as np
# from aiortc import MediaStreamTrack
# from av import AudioFrame
# from av.audio.resampler import AudioResampler
# import time

# class QueueAudioTrack(MediaStreamTrack):
#     kind = "audio"

#     def __init__(self, queue: asyncio.Queue):
#         super().__init__()
#         self.queue = queue
#         self.resampler = AudioResampler(format="s16", layout="mono", rate=48000)
#         self.sample_rate = 48000
#         self.samples_per_frame = 960  # 20ms at 48kHz
#         self.buffer = np.zeros(0, dtype=np.int16)
#         self.timestamp = 0
#         self.time_base = fractions.Fraction(1, self.sample_rate)
#         self.frame_duration = 0.02  # 20ms
#         self.next_time = time.perf_counter()

#     async def recv(self):
#         now = time.perf_counter()
#         sleep_time = self.next_time - now
#         if sleep_time > 0:
#             await asyncio.sleep(sleep_time)
#         self.next_time += self.frame_duration

#         # Process all available PCM chunks in the queue
#         while True:
#             try:
#                 pcm = self.queue.get_nowait()
#                 if pcm is not None:
#                     self._append_resampled(pcm)
#                 else:
#                     # If pcm is None, treat it as a signal to stop or ignore
#                     break
#             except asyncio.QueueEmpty:
#                 break

#         # If buffer is empty, return a silent frame
#         if len(self.buffer) == 0:
#             silence = np.zeros(self.samples_per_frame, dtype=np.int16)
#             frame = AudioFrame(format="s16", layout="mono", samples=len(silence))
#             frame.sample_rate = self.sample_rate
#             frame.planes[0].update(silence.tobytes())
#             frame.pts = self.timestamp
#             frame.time_base = self.time_base
#             self.timestamp += len(silence)
#             return frame

#         # If buffer has enough samples, create a frame
#         if len(self.buffer) >= self.samples_per_frame:
#             chunk = self.buffer[:self.samples_per_frame]
#             self.buffer = self.buffer[self.samples_per_frame:]
#             frame = AudioFrame(format="s16", layout="mono", samples=len(chunk))
#             frame.sample_rate = self.sample_rate
#             frame.planes[0].update(chunk.tobytes())
#             frame.pts = self.timestamp
#             frame.time_base = self.time_base
#             self.timestamp += len(chunk)
#             return frame
#         else:
#             # If not enough samples, pad with silence
#             missing = self.samples_per_frame - len(self.buffer)
#             silence = np.zeros(missing, dtype=np.int16)
#             chunk = np.concatenate((self.buffer, silence))
#             self.buffer = np.zeros(0, dtype=np.int16)  # Clear buffer
#             frame = AudioFrame(format="s16", layout="mono", samples=len(chunk))
#             frame.sample_rate = self.sample_rate
#             frame.planes[0].update(chunk.tobytes())
#             frame.pts = self.timestamp
#             frame.time_base = self.time_base
#             self.timestamp += len(chunk)
#             return frame

#     def _append_resampled(self, pcm):
#         if pcm is None or len(pcm) == 0:
#             return
#         try:
#             frame = AudioFrame(format="s16", layout="mono", samples=len(pcm)//2)
#             frame.sample_rate = 24000
#             frame.planes[0].update(pcm)
#             for f in self.resampler.resample(frame):
#                 arr = f.to_ndarray()
#                 if arr.ndim > 1:
#                     arr = arr[0]
#                 self.buffer = np.concatenate((self.buffer, arr.astype(np.int16)))
#         except Exception as e:
#             print(f"Error in _append_resampled: {e}")
