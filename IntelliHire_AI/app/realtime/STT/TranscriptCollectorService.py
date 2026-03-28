"""
TranscriptCollectorService - FIXED VERSION

Key Fixes:
1. ⭐ RESET silence timer on EVERY is_final=True (not just first one)
2. ⭐ Only finalize after silence timeout, not on individual finals
3. ⭐ Combine ALL consecutive FINAL results into one utterance
4. ⭐ Better overlap detection using fuzzy matching
"""

import asyncio
import logging
from typing import Callable, Optional, List
from enum import Enum
import string
from difflib import SequenceMatcher

logger = logging.getLogger(__name__)


class TranscriptState(Enum):
    """State of transcript collection"""
    IDLE = "idle"
    COLLECTING = "collecting"
    FINALIZING = "finalizing"
    COMPLETE = "complete"


class TranscriptCollector:
    """
    Collects transcript chunks until speech is finalized.
    
    ⭐ FIXED VERSION:
    - Handles MULTIPLE FINAL results from Deepgram (combines them)
    - Only finalizes after SILENCE, not on first is_final
    - Resets timer on EVERY final result
    - Better overlap detection
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
            max_silence_ms: Time to wait for more chunks after last result
        """
        self.on_complete = on_complete
        self.on_interim = on_interim
        self.max_silence_ms = max_silence_ms
        
        self.state = TranscriptState.IDLE
        self.accumulated_text = ""
        self.all_utterances: List[str] = []
        
        self.interim_text = ""
        self.final_text = ""
        
        # ⭐ KEY: Silence timeout task
        self.silence_timeout_task: Optional[asyncio.Task] = None
        
        # Track if we're collecting finals
        self.in_final_sequence = False
        
        logger.info(
            f"🎙️ TranscriptCollector initialized\n"
            f"    max_silence: {max_silence_ms}ms\n"
            f"    on_complete: {on_complete is not None}\n"
            f"    on_interim: {on_interim is not None}"
        )
    
    async def add_chunk(self, text: str, is_final: bool, confidence: float = 0.0):
        if not text or not text.strip():
            logger.debug("⊘ Empty chunk received, skipping")
            return
        
        text = text.strip()
        logger.debug(f"📥 Chunk received: is_final={is_final}, text='{text[:50]}'")
        
        # Transition: IDLE → COLLECTING
        if self.state == TranscriptState.IDLE:
            logger.info(f"🎤 Starting transcript collection")
            self.state = TranscriptState.COLLECTING
            self.accumulated_text = ""
            self.interim_text = ""
            self.final_text = ""
            self.in_final_sequence = False
        
        # Extract only NEW content
        new_content = self._extract_new_content_word_based(text)
        
        if not new_content or not new_content.strip():
            logger.debug(f"  ⊘ No new content detected in: '{text[:50]}'")
            return
        
        if not is_final:
            # 🟡 INTERIM RESULT
            self.interim_text = new_content
            logger.debug(f"  🟡 Interim: '{new_content[:60]}'")
            
            if self.on_interim:
                try:
                    if asyncio.iscoroutinefunction(self.on_interim):
                        await self.on_interim(self.interim_text)
                    else:
                        self.on_interim(self.interim_text)
                except Exception as e:
                    logger.error(f"  ❌ on_interim callback error: {e}")
        
        else:
            # 🟢 FINAL RESULT
            logger.info(f"  🟢 Final result #{self.get_utterance_count() + 1}: '{text[:60]}'")
            
            # ⭐ CRITICAL: Add to accumulated text
            if self.accumulated_text:
                self.accumulated_text += " " + new_content
            else:
                self.accumulated_text = new_content
            
            self.in_final_sequence = True
            self.state = TranscriptState.FINALIZING
            
            logger.info(f"  📝 Accumulated (total): '{self.accumulated_text[:80]}'")
            
            # ⭐ CRITICAL: Reset silence timer on EVERY final result
            # This is the key fix - don't finalize until silence is detected
            if self.silence_timeout_task and not self.silence_timeout_task.done():
                logger.debug(f"  🔄 Restarting silence timer (had {self.silence_timeout_task._coro})")
                self.silence_timeout_task.cancel()
                try:
                    await self.silence_timeout_task
                except asyncio.CancelledError:
                    pass
            
            # Start new silence timeout
            self.silence_timeout_task = asyncio.create_task(
                self._finalize_after_silence()
            )
            logger.debug(f"  ⏱️ Silence timer restarted ({self.max_silence_ms}ms)")
    
    def _extract_new_content_word_based(self, current_text: str) -> str:
        """
        Extract only NEW content using word-level fuzzy matching.
        
        Handles overlapping Deepgram chunks by finding overlap in a fuzzy way.
        """
        if not self.accumulated_text:
            return current_text
        
        current_words = current_text.split()
        accumulated_words = self.accumulated_text.split()
        
        if not current_words or not accumulated_words:
            return current_text
        
        # Try to find longest overlap using fuzzy matching
        max_overlap = min(len(accumulated_words), len(current_words))
        
        for overlap_word_count in range(max_overlap, 0, -1):
            acc_tail = accumulated_words[-overlap_word_count:]
            
            # Look for this tail in current_words
            for start_pos in range(len(current_words) - overlap_word_count + 1):
                curr_slice = current_words[start_pos:start_pos + overlap_word_count]
                
                # Fuzzy match (allow 80% similarity)
                if self._fuzzy_match_words(acc_tail, curr_slice, threshold=0.8):
                    # Found overlap! Return only words after it
                    new_words = current_words[start_pos + overlap_word_count:]
                    if new_words:
                        result = " ".join(new_words)
                        logger.debug(
                            f"    ✅ Word overlap found: {overlap_word_count} words\n"
                            f"       Accumulated tail: {' '.join(acc_tail)}\n"
                            f"       Current slice:   {' '.join(curr_slice)}\n"
                            f"       New content: '{result}'"
                        )
                        return result
                    else:
                        logger.debug(f"    ✅ Complete overlap, no new content")
                        return ""
        
        # No overlap found - might be completely new utterance
        logger.debug(f"    ⚠️ No overlap found, treating as new: '{current_text[:50]}'")
        return current_text
    
    def _fuzzy_match_words(self, words1: List[str], words2: List[str], threshold: float = 0.8) -> bool:
        """
        Check if two word lists match fuzzy (allowing for speech recognition errors).
        """
        if len(words1) != len(words2):
            return False
        
        match_count = 0
        for w1, w2 in zip(words1, words2):
            # Normalize for comparison
            w1_norm = self._normalize_word(w1)
            w2_norm = self._normalize_word(w2)
            
            # Exact match or similar
            if w1_norm == w2_norm:
                match_count += 1
            else:
                # Check similarity using difflib
                ratio = SequenceMatcher(None, w1_norm, w2_norm).ratio()
                if ratio > 0.7:  # 70% similarity is close enough
                    match_count += 1
        
        match_ratio = match_count / len(words1) if words1 else 0
        return match_ratio >= threshold
    
    def _normalize_word(self, word: str) -> str:
        """Normalize word for comparison (remove punctuation, lowercase)"""
        return word.strip(string.punctuation).lower()
    
    async def _finalize_after_silence(self):
        """
        Wait for silence, then finalize the utterance.
        
        ⭐ KEY: Only called after max_silence_ms without new chunks
        """
        try:
            logger.debug(f"  ⏱️ Waiting {self.max_silence_ms}ms for silence...")
            await asyncio.sleep(self.max_silence_ms / 1000.0)
            
            logger.info(f"✅ Silence timeout triggered - no more chunks for {self.max_silence_ms}ms")
            await self._finalize()
        
        except asyncio.CancelledError:
            logger.debug("  🔄 Silence timeout cancelled (more final chunks arriving)")
        except Exception as e:
            logger.error(f"❌ Error in silence timeout: {e}", exc_info=True)
    
    async def _finalize(self):
        """
        Finalize the utterance and call on_complete callback.
        """
        if self.state == TranscriptState.COMPLETE:
            logger.debug("⊘ Already finalized, skipping")
            return
        
        if not self.accumulated_text:
            logger.debug("⊘ No text to finalize")
            return
        
        self.final_text = self.accumulated_text
        self.state = TranscriptState.COMPLETE
        self.in_final_sequence = False
        
        logger.info(
            f"✅ Transcript finalized:\n"
            f"    Text: '{self.final_text}'\n"
            f"    Length: {len(self.final_text)} chars"
        )
        
        self.all_utterances.append(self.final_text)
        
        # Call on_complete callback
        if self.on_complete:
            try:
                if asyncio.iscoroutinefunction(self.on_complete):
                    logger.debug("  📤 Calling async on_complete callback")
                    await self.on_complete(self.final_text)
                else:
                    logger.debug("  📤 Calling sync on_complete callback")
                    self.on_complete(self.final_text)
            except Exception as e:
                logger.error(f"  ❌ on_complete callback error: {e}", exc_info=True)
        
        # Reset for next utterance
        self._reset_for_next_utterance()
    
    def _reset_for_next_utterance(self):
        """Reset state to collect next utterance"""
        self.state = TranscriptState.IDLE
        self.accumulated_text = ""
        self.interim_text = ""
        self.final_text = ""
        self.in_final_sequence = False
        logger.debug("  🔄 Ready for next utterance")
    
    async def force_finalize(self):
        """
        Force finalization immediately (e.g., when user clicks stop).
        """
        logger.info("🛑 Force finalize called")
        
        if self.silence_timeout_task and not self.silence_timeout_task.done():
            self.silence_timeout_task.cancel()
            try:
                await self.silence_timeout_task
            except asyncio.CancelledError:
                pass
        
        if self.state != TranscriptState.COMPLETE and self.accumulated_text:
            await self._finalize()
    
    def reset_session(self):
        """
        Reset collector for a new question/answer session.
        
        ⭐ CRITICAL: Call this between each new question!
        """
        logger.info("🔄 Resetting collector for new session")
        
        if self.silence_timeout_task and not self.silence_timeout_task.done():
            self.silence_timeout_task.cancel()
        
        self.state = TranscriptState.IDLE
        self.accumulated_text = ""
        self.all_utterances = []
        self.interim_text = ""
        self.final_text = ""
        self.in_final_sequence = False
        logger.info("✅ Session reset complete")
    
    def get_full_transcript(self) -> str:
        """Get the complete transcript from all utterances"""
        return " ".join(self.all_utterances)
    
    def get_current_utterance(self) -> str:
        """Get the current (last) utterance"""
        return self.final_text if self.final_text else self.interim_text
    
    def get_utterance_count(self) -> int:
        """Get number of completed utterances"""
        return len(self.all_utterances)
    
    def get_stats(self) -> dict:
        """Get collection statistics"""
        return {
            "state": self.state.value,
            "accumulated_length": len(self.accumulated_text),
            "total_utterances": len(self.all_utterances),
            "in_final_sequence": self.in_final_sequence,
            "interim_text": self.interim_text[:100],
            "final_text": self.final_text[:100],
        }