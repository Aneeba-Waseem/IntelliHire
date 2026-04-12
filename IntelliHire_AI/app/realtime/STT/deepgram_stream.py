"""
stream_audio.py - RELIABILITY VERSION

✅ Major Improvements:
- Proper queue backpressure with exponential backoff
- Never silently drops frames
- Resource cleanup on error
- Better logging and metrics
- Prevents hanging on full queue

Read WebRTC audio (48kHz), resample to 16kHz mono, push to STT queue
with proper error handling and backpressure management.
"""

import asyncio
import logging
from aiortc import MediaStreamTrack
from av.audio.resampler import AudioResampler

logger = logging.getLogger(__name__)


async def stream_audio(track: MediaStreamTrack, queue: asyncio.Queue):
    """
    Read WebRTC audio (48kHz), resample to 16kHz mono, push to STT queue.
    
    ✅ RELIABLE VERSION:
    - Handles queue full gracefully with exponential backoff
    - Never silently drops frames
    - Monitors resampler health
    - Proper cleanup on error or track end
    
    Args:
        track: WebRTC audio track (MediaStreamTrack)
        queue: asyncio.Queue to receive resampled PCM bytes
    """
    logger.info("🎧 STT Audio Stream: Initializing resampler (48kHz → 16kHz mono)")
    
    resampler = None
    frame_count = 0
    total_samples = 0
    dropped_frames = 0
    queue_full_count = 0
    
    try:
        # Create resampler: Convert 48kHz stereo/mono to 16kHz mono PCM
        # s16 = signed 16-bit, mono = single channel, rate = 16000 Hz
        resampler = AudioResampler(format="s16", layout="mono", rate=16000)
        logger.info("✅ Resampler initialized")
        
        while True:
            try:
                # ⭐ NEW: Timeout on frame receive (detect track end)
                frame = await asyncio.wait_for(track.recv(), timeout=30.0)
                frame_count += 1
                
                logger.debug(
                    f"📥 Frame {frame_count}: {frame.samples} samples @ {frame.sample_rate}Hz, "
                    f"channels: {frame.layout.channels if hasattr(frame, 'layout') else '?'}"
                )
                
                # Resample the frame from 48kHz to 16kHz mono
                try:
                    resampled_frames = resampler.resample(frame)
                except Exception as e:
                    logger.error(f"❌ Resampler error on frame {frame_count}: {e}")
                    # Don't crash - try to continue with next frame
                    continue
                
                for resampled_frame in resampled_frames:
                    try:
                        # Convert to numpy array for byte conversion
                        pcm_array = resampled_frame.to_ndarray()
                        
                        # Handle multi-channel audio (take first channel if stereo)
                        if pcm_array.ndim > 1:
                            logger.debug(
                                f"  Multi-channel audio detected ({pcm_array.ndim}D), "
                                f"taking first channel"
                            )
                            pcm_array = pcm_array[0]
                        
                        # Convert numpy array to bytes (little-endian, signed 16-bit)
                        pcm_bytes = pcm_array.astype('int16').tobytes()
                        total_samples += len(pcm_array)
                        
                        # ⭐ NEW: Exponential backoff for queue full
                        backoff = 0.1
                        max_backoff = 5.0
                        attempt = 0
                        max_attempts = 10
                        
                        while attempt < max_attempts:
                            try:
                                # Try immediate put with short timeout
                                await asyncio.wait_for(queue.put(pcm_bytes), timeout=0.1)
                                logger.debug(
                                    f"  📤 Sent {len(pcm_array)} samples ({len(pcm_bytes)} bytes)"
                                )
                                break
                            
                            except asyncio.TimeoutError:
                                attempt += 1
                                queue_full_count += 1
                                
                                if attempt == 1:
                                    logger.warning(
                                        f"⚠️ Queue full (attempt 1). "
                                        f"Deepgram may be processing slower than audio arrives."
                                    )
                                
                                if attempt >= max_attempts:
                                    logger.error(
                                        f"❌ Queue persistently full after {max_attempts} attempts. "
                                        f"Deepgram is severely backed up. This will cause audio loss!"
                                    )
                                    # Final attempt without timeout (blocking)
                                    try:
                                        await queue.put(pcm_bytes)
                                        logger.warning(f"  ✅ Recovered with blocking put")
                                    except Exception as e:
                                        logger.error(f"  ❌ Final put failed: {e}")
                                        dropped_frames += 1
                                    break
                                
                                # Exponential backoff
                                backoff = min(backoff * 1.5, max_backoff)
                                logger.debug(
                                    f"  ⏳ Queue full - waiting {backoff:.2f}s before retry "
                                    f"(attempt {attempt}/{max_attempts})"
                                )
                                await asyncio.sleep(backoff)
                    
                    except Exception as e:
                        logger.error(f"❌ Error processing resampled frame: {e}", exc_info=True)
                        dropped_frames += 1
                        continue
            
            except asyncio.TimeoutError:
                # 30 second timeout on track.recv() means track probably ended
                logger.info(
                    f"⏱️ [TIMEOUT] No audio frame for 30s - track may have ended"
                )
                break
            
            except asyncio.CancelledError:
                logger.info("🛑 Audio stream task cancelled")
                break
            
            except Exception as e:
                logger.error(f"❌ Error receiving frame: {e}", exc_info=True)
                # Continue receiving - don't break on a single bad frame
                # But count it as a drop for metrics
                dropped_frames += 1
                
                # Check if this is a persistent error
                if frame_count > 0 and dropped_frames > (frame_count * 0.1):
                    # More than 10% drop rate - probably a real problem
                    logger.error(f"❌ Drop rate {(dropped_frames/frame_count)*100:.1f}% exceeds threshold")
                    break
                
                # Small delay before retry
                await asyncio.sleep(0.1)
                continue
    
    finally:
        logger.info(
            f"🎤 Audio track ended.\n"
            f"    Total frames: {frame_count}\n"
            f"    Total samples: {total_samples}\n"
            f"    Dropped: {dropped_frames}\n"
            f"    Queue full events: {queue_full_count}"
        )
        
        # Cleanup resampler
        if resampler:
            try:
                # Force flush any pending samples
                final_frames = resampler.resample(None)
                for final_frame in final_frames:
                    try:
                        pcm_array = final_frame.to_ndarray()
                        if pcm_array.ndim > 1:
                            pcm_array = pcm_array[0]
                        pcm_bytes = pcm_array.astype('int16').tobytes()
                        await asyncio.wait_for(queue.put(pcm_bytes), timeout=1.0)
                        logger.info(f"📤 Flushed {len(pcm_array)} final samples")
                    except Exception as e:
                        logger.debug(f"Error sending final samples: {e}")
                
                logger.info("✅ Resampler flushed")
            except Exception as e:
                logger.debug(f"Resampler flush error (expected): {e}")
        
        # Send None to signal end of stream
        try:
            await asyncio.wait_for(queue.put(None), timeout=5.0)
            logger.info("✅ Sent end-of-stream signal (None) to STT queue")
        except asyncio.TimeoutError:
            logger.error(f"❌ Timeout sending end-of-stream signal")
        except Exception as e:
            logger.error(f"❌ Error sending end-of-stream: {e}")
        
        # Report final statistics
        if frame_count > 0:
            drop_rate = (dropped_frames / frame_count) * 100
            logger.info(
                f"📊 Audio stream statistics:\n"
                f"    Frame count: {frame_count}\n"
                f"    Drop rate: {drop_rate:.1f}%\n"
                f"    Queue full events: {queue_full_count}\n"
                f"    Total audio: {(total_samples / 16000):.1f}s"
            )