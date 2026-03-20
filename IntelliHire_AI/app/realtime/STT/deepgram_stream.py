import asyncio
import logging
from aiortc import MediaStreamTrack
from av.audio.resampler import AudioResampler

logger = logging.getLogger(__name__)


async def stream_audio(track: MediaStreamTrack, queue: asyncio.Queue):
    """
    Read WebRTC audio (48kHz), resample to 16kHz mono, push to STT queue.
    
    This task runs for the lifetime of the audio track and handles:
    - Audio frame reception from WebRTC
    - Resampling from 48kHz to 16kHz mono PCM
    - Queue management with backpressure handling
    
    Args:
        track: WebRTC audio track (MediaStreamTrack)
        queue: asyncio.Queue to receive resampled PCM bytes
    """
    logger.info("🎧 STT Audio Stream: Initializing resampler (48kHz → 16kHz mono)")
    
    resampler = None
    frame_count = 0
    total_samples = 0
    dropped_frames = 0
    
    try:
        # Create resampler: Convert 48kHz stereo/mono to 16kHz mono PCM
        # s16 = signed 16-bit, mono = single channel, rate = 16000 Hz
        resampler = AudioResampler(format="s16", layout="mono", rate=16000)
        
        while True:
            try:
                # Receive frame from WebRTC track
                frame = await track.recv()
                frame_count += 1
                
                logger.debug(
                    f"📥 Frame {frame_count}: {frame.samples} samples @ {frame.sample_rate}Hz, "
                    f"channels: {frame.layout.channels if hasattr(frame, 'layout') else '?'}"
                )
                
                # Resample the frame from 48kHz to 16kHz mono
                resampled_frames = resampler.resample(frame)
                
                for resampled_frame in resampled_frames:
                    # Convert to numpy array for byte conversion
                    pcm_array = resampled_frame.to_ndarray()
                    
                    # Handle multi-channel audio (take first channel if stereo)
                    if pcm_array.ndim > 1:
                        logger.debug(
                            f"  Multi-channel audio detected ({pcm_array.ndim}D array), "
                            f"taking first channel"
                        )
                        pcm_array = pcm_array[0]
                    
                    # Convert numpy array to bytes (little-endian, signed 16-bit)
                    pcm_bytes = pcm_array.astype('int16').tobytes()
                    total_samples += len(pcm_array)
                    
                    # Put into STT queue with timeout to avoid hanging
                    try:
                        # Use wait_for to timeout if queue is full and consumer is blocked
                        await asyncio.wait_for(queue.put(pcm_bytes), timeout=2.0)
                        logger.debug(
                            f"  📤 Sent {len(pcm_array)} samples ({len(pcm_bytes)} bytes) to STT queue"
                        )
                    except asyncio.TimeoutError:
                        # Queue is full - the consumer (Deepgram) is not keeping up
                        dropped_frames += 1
                        logger.warning(
                            f"  ⚠️ STT queue full (timeout), dropping frame. "
                            f"Total dropped: {dropped_frames}"
                        )
                    except asyncio.CancelledError:
                        logger.info("  🛑 Audio stream task cancelled")
                        raise
                    except Exception as e:
                        logger.error(f"  ❌ Queue error: {e}", exc_info=True)
                        raise
            
            except asyncio.CancelledError:
                logger.info("🛑 Audio stream task cancelled (outer)")
                break
            
            except Exception as e:
                logger.error(f"❌ Error receiving frame: {e}", exc_info=True)
                # Continue receiving - don't break on a single bad frame
                continue
    
    finally:
        logger.info(
            f"🎤 Audio track ended. "
            f"Total frames: {frame_count}, "
            f"Total samples: {total_samples}, "
            f"Dropped: {dropped_frames}"
        )
        
        # Send None to signal end of stream
        try:
            await queue.put(None)
            logger.info("✅ Sent end-of-stream signal (None) to STT queue")
        except Exception as e:
            logger.error(f"❌ Error sending end-of-stream: {e}")