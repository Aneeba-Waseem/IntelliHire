"""
TranscriptCollectorService - FIXED VERSION

Key Fixes:
1. Handle both sync and async callbacks
2. Don't duplicate chunks
3. Properly await async callbacks
"""

import asyncio
import logging
from typing import Callable, Optional, List
from enum import Enum
import inspect

logger = logging.getLogger(__name__)


class TranscriptState(Enum):
    """State of transcript collection"""
    IDLE = "idle"
    COLLECTING = "collecting"
    FINALIZING = "finalizing"
    COMPLETE = "complete"


class TranscriptChunk:
    """Represents a single transcript chunk from Deepgram"""
    
    def __init__(self, text: str, is_final: bool, confidence: float = 0.0):
        self.text = text.strip()
        self.is_final = is_final
        self.confidence = confidence
        self.timestamp = asyncio.get_event_loop().time()
    
    def __repr__(self):
        return f"TranscriptChunk(text='{self.text[:30]}...', final={self.is_final})"


class TranscriptCollector:
    """
    Collects transcript chunks until speech is finalized.
    
    ⭐ FIXED VERSION:
    - Handles both sync and async callbacks
    - Doesn't duplicate chunks
    - Properly awaits async operations
    """
    
    def __init__(
        self, 
        on_complete: Optional[Callable[[str], None]] = None,
        on_interim: Optional[Callable[[str], None]] = None,
        max_silence_ms: int = 2000,
    ):
        """
        Initialize TranscriptCollector.
        
        Args:
            on_complete: Callback when complete utterance is ready (can be async)
            on_interim: Callback for interim results (optional)
            max_silence_ms: Time to wait for more chunks after final
        """
        self.on_complete = on_complete
        self.on_interim = on_interim
        self.max_silence_ms = max_silence_ms
        
        self.state = TranscriptState.IDLE
        self.current_chunks: List[TranscriptChunk] = []
        self.all_utterances: List[str] = []
        
        self.interim_text = ""
        self.final_text = ""
        
        self.finalize_timeout_task: Optional[asyncio.Task] = None
        
        logger.info(
            f"🎙️ TranscriptCollector initialized\n"
            f"    max_silence: {max_silence_ms}ms\n"
            f"    on_complete: {on_complete is not None}\n"
            f"    on_interim: {on_interim is not None}"
        )
    
    async def add_chunk(self, text: str, is_final: bool, confidence: float = 0.0):
        """
        Add a transcript chunk from Deepgram.
        
        ⭐ FIXED: Don't add duplicate chunks
        """
        if not text or not text.strip():
            logger.debug("⊘ Empty chunk received, skipping")
            return
        
        chunk = TranscriptChunk(text, is_final, confidence)
        
        # Transition: IDLE → COLLECTING
        if self.state == TranscriptState.IDLE:
            logger.info(f"🎤 Starting transcript collection")
            self.state = TranscriptState.COLLECTING
            self.current_chunks = []
            self.interim_text = ""
            self.final_text = ""
        
        # ⭐ FIX: Don't add chunk if we already have it
        # (Deepgram sometimes sends the same final result multiple times)
        if self.current_chunks:
            last_chunk = self.current_chunks[-1]
            if last_chunk.text == chunk.text and last_chunk.is_final:
                logger.debug(f"  ⊘ Duplicate chunk detected, skipping: {chunk.text[:50]}...")
                return
        
        # Add chunk (only once)
        self.current_chunks.append(chunk)
        logger.debug(f"  ➕ Added chunk #{len(self.current_chunks)}: {chunk}")
        
        if not is_final:
            # 🟡 INTERIM RESULT
            self.interim_text = text
            logger.debug(f"  🟡 Interim: '{text}'")
            
            if self.on_interim:
                try:
                    self.on_interim(text)
                except Exception as e:
                    logger.error(f"  ❌ on_interim callback error: {e}")
        
        else:
            # 🟢 FINAL RESULT
            logger.info(f"  🟢 Final result received: '{text}'")
            self.state = TranscriptState.FINALIZING
            
            # Cancel any pending finalization
            if self.finalize_timeout_task and not self.finalize_timeout_task.done():
                self.finalize_timeout_task.cancel()
            
            # Start finalization timeout
            self.finalize_timeout_task = asyncio.create_task(
                self._finalize_after_delay()
            )
    
    async def _finalize_after_delay(self):
        """
        Wait for max_silence_ms, then finalize the utterance.
        """
        try:
            await asyncio.sleep(self.max_silence_ms / 1000.0)
            logger.info(f"⏱️ Finalization timeout triggered after {self.max_silence_ms}ms")
            await self._finalize()
        
        except asyncio.CancelledError:
            logger.debug("  ⚡ Finalization timeout cancelled")
    
    async def _finalize(self):
        """
        Complete the current utterance and call on_complete callback.
        
        ⭐ FIXED: Properly handle async callbacks
        """
        if self.state == TranscriptState.COMPLETE:
            logger.debug("⊘ Already finalized, skipping")
            return
        
        if not self.current_chunks:
            logger.debug("⊘ No chunks to finalize")
            return
        
        # ⭐ FIX: Build final text WITHOUT duplicates
        # Use only unique chunk texts (Deepgram sends duplicates)
        seen_texts = set()
        unique_texts = []
        
        for chunk in self.current_chunks:
            if chunk.text not in seen_texts:
                unique_texts.append(chunk.text)
                seen_texts.add(chunk.text)
        
        self.final_text = " ".join(unique_texts)
        self.state = TranscriptState.COMPLETE
        
        logger.info(
            f"✅ Transcript finalized:\n"
            f"    Chunks: {len(self.current_chunks)}\n"
            f"    Unique texts: {len(unique_texts)}\n"
            f"    Text: '{self.final_text}'\n"
            f"    Confidence: {self.current_chunks[-1].confidence:.2f}"
        )
        
        self.all_utterances.append(self.final_text)
        
        # ⭐ FIXED: Call completion callback
        if self.on_complete:
            try:
                # Check if callback is async
                if asyncio.iscoroutinefunction(self.on_complete):
                    # It's async - await it
                    logger.debug("  📤 Calling async on_complete callback")
                    await self.on_complete(self.final_text)
                else:
                    # It's sync - call it directly
                    logger.debug("  📤 Calling sync on_complete callback")
                    self.on_complete(self.final_text)
            except Exception as e:
                logger.error(f"  ❌ on_complete callback error: {e}", exc_info=True)
        
        # Reset for next utterance
        self._reset_for_next_utterance()
    
    def _reset_for_next_utterance(self):
        """Reset state to collect next utterance"""
        self.state = TranscriptState.IDLE
        self.current_chunks = []
        self.interim_text = ""
        self.final_text = ""
        logger.debug("  🔄 Ready for next utterance")
    
    async def force_finalize(self):
        """
        Force finalization immediately.
        """
        logger.info("🛑 Force finalize called")
        
        if self.finalize_timeout_task and not self.finalize_timeout_task.done():
            self.finalize_timeout_task.cancel()
        
        if self.state != TranscriptState.COMPLETE and self.current_chunks:
            await self._finalize()
    
    def get_full_transcript(self) -> str:
        """Get the complete transcript from all utterances"""
        return " ".join(self.all_utterances)
    
    def get_current_utterance(self) -> str:
        """Get the current (last) utterance"""
        return self.final_text if self.final_text else self.interim_text
    
    def get_utterance_count(self) -> int:
        """Get number of completed utterances"""
        return len(self.all_utterances)
    
    def reset_session(self):
        """Reset collector for a new answer collection session"""
        logger.info("🔄 Resetting collector for new session")
        
        if self.finalize_timeout_task and not self.finalize_timeout_task.done():
            self.finalize_timeout_task.cancel()
        
        self.state = TranscriptState.IDLE
        self.current_chunks = []
        self.all_utterances = []
        self.interim_text = ""
        self.final_text = ""
    
    def get_stats(self) -> dict:
        """Get collection statistics"""
        return {
            "state": self.state.value,
            "current_chunks": len(self.current_chunks),
            "total_utterances": len(self.all_utterances),
            "interim_text": self.interim_text,
            "final_text": self.final_text,
            "full_transcript": self.get_full_transcript(),
        }