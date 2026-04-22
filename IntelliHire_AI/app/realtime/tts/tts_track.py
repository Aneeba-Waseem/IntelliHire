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
    
    def __init__(self, queue: asyncio.Queue, input_sample_rate=48000, output_sample_rate=48000):
        super().__init__()
        self.queue = queue
        
        # Sample rates
        self.input_sample_rate = input_sample_rate  # Deepgram outputs 48kHz
        self.output_sample_rate = output_sample_rate  # WebRTC uses 48kHz
        
        # Frame parameters
        self.samples_per_frame = 960  # 20ms at 48kHz
        self.frame_duration = 20  # ms
        
        # Timing
        self.time_base = fractions.Fraction(1, self.output_sample_rate)
        self.timestamp = 0
        self.next_time = time.perf_counter()
        
        # Buffer for PCM samples
        self.buffer = np.zeros(0, dtype=np.int16)
        
        logger.info(f"🎵 QueueAudioTrack initialized:")
        logger.info(f"  Input sample rate: {self.input_sample_rate} Hz")
        logger.info(f"  Output sample rate: {self.output_sample_rate} Hz")
        logger.info(f"  Samples per frame: {self.samples_per_frame}")
        logger.info(f"  Frame duration: {self.frame_duration} ms")

    async def recv(self):
        """Generate audio frames from the queue."""
        
        # Timing: maintain constant frame rate
        now = time.perf_counter()
        sleep_time = self.next_time - now
        if sleep_time > 0:
            await asyncio.sleep(sleep_time)
        self.next_time += (self.frame_duration / 1000.0)
        
        # Pull all available PCM from queue
        while True:
            try:
                pcm = self.queue.get_nowait()
                if pcm is not None and len(pcm) > 0:
                    self._append_pcm(pcm)
                else:
                    break
            except asyncio.QueueEmpty:
                break
        
        # Create frame from buffer
        frame = self._create_frame()
        return frame

    def _append_pcm(self, pcm):
        """Add PCM data to buffer, handling odd-length buffers."""
        if pcm is None or len(pcm) == 0:
            return
        
        try:
            # Ensure even length (PCM is 16-bit = 2 bytes per sample)
            if len(pcm) % 2 != 0:
                logger.warning(f"⚠️ Odd PCM buffer length: {len(pcm)}, trimming")
                pcm = pcm[:-(len(pcm) % 2)]
            
            # Convert bytes to numpy int16 array
            arr = np.frombuffer(pcm, dtype=np.int16)
            self.buffer = np.concatenate((self.buffer, arr))
            
            logger.debug(f"📥 PCM added: {len(pcm)} bytes ({len(arr)} samples), buffer now: {len(self.buffer)} samples")
        except Exception as e:
            logger.error(f"❌ Error in _append_pcm: {e}")

    def _create_frame(self):
        """Create an AudioFrame from the buffer."""
        
        # If we have enough samples, take them
        if len(self.buffer) >= self.samples_per_frame:
            chunk = self.buffer[:self.samples_per_frame]
            self.buffer = self.buffer[self.samples_per_frame:]
        
        # If buffer is partially full, pad with silence
        elif len(self.buffer) > 0:
            missing = self.samples_per_frame - len(self.buffer)
            silence = np.zeros(missing, dtype=np.int16)
            chunk = np.concatenate((self.buffer, silence))
            self.buffer = np.zeros(0, dtype=np.int16)
            logger.debug(f"🔇 Padded frame with {missing} silence samples")
        
        # If buffer is empty, return silence
        else:
            chunk = np.zeros(self.samples_per_frame, dtype=np.int16)
            logger.debug(f"🔇 Returning silent frame")
        
        # Create AudioFrame
        frame = AudioFrame(format="s16", layout="mono", samples=len(chunk))
        frame.sample_rate = self.output_sample_rate
        frame.planes[0].update(chunk.tobytes())
        frame.pts = self.timestamp
        frame.time_base = self.time_base
        
        self.timestamp += len(chunk)
        
        logger.debug(f"📤 Frame created: {len(chunk)} samples, PTS: {frame.pts}")
        
        return frame