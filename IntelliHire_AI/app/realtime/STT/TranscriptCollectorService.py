"""
TimedTranscriptCollectorService - 4-MIN SESSION WITH DUAL FINALIZATION

Two finalization triggers for each question (4 minute max):

1. ⭐ EARLY FINALIZATION (Candidate finishes < 4 min)
   - Candidate stops speaking (2s silence detected)
   - Transcript immediately finalized
   - Example: Answer complete at T=1:30 → finalize at T=3:32 (with 2min silence)

2. ⭐ HARD TIMEOUT (Candidate still speaking at 4 min)
   - If candidate not finalized by 4:00
   - Whatever transcript exists at T=4:00 is FORCED to finalize
   - Audio after 4:00 is IGNORED
   - Example: Still speaking at T=4:00 → force finalize at T=4:00

Usage (per question):
    collector = TranscriptCollector(
        max_answer_time_sec=240,        # 4 minutes per question
        silence_timeout_ms=2000,         # 2 seconds of silence to auto-finalize
        on_complete=callback,            # Called on silence finalization
        on_interim=callback,             # Called on interim transcript
        on_timeout=callback              # Called on hard 4-min timeout
    )
    
    # Start the 4-minute timer
    await collector.start_timer()
    
    # Feed chunks as they arrive
    await collector.add_chunk(text, is_final, confidence)
    
    # Get the answer (waits for finalization)
    answer, reason = await collector.wait_for_complete()
    
    # Cleanup for next question
    await collector.stop()
"""

import asyncio
import logging
from typing import Callable, Optional, List
from enum import Enum
import string
from difflib import SequenceMatcher
import time

logger = logging.getLogger(__name__)


class TranscriptState(Enum):
    """State of transcript collection"""
    IDLE = "idle"
    COLLECTING = "collecting"
    FINALIZING = "finalizing"
    COMPLETE = "complete"
    TIMEOUT = "timeout"


class TranscriptCollector:
    """
    Collects transcript chunks with TWO finalization triggers:
    1. Silence timeout (2s of no speech = natural pause)
    2. Hard time limit (4 min per question)
    
    ⭐ Key features:
    - Dual finalization: silence OR hard timeout, whichever comes first
    - Resets silence timer on every final chunk
    - Fuzzy word overlap detection (handles STT chunk overlap)
    - Tracks which finalization triggered (important for logging)
    """
    
    def __init__(
        self, 
        max_answer_time_sec: int = 240,  # 4 minutes per question
        silence_timeout_ms: int = 2000,    # 2 seconds of silence
        on_complete: Optional[Callable[[str], None]] = None,
        on_interim: Optional[Callable[[str], None]] = None,
        on_timeout: Optional[Callable[[str], None]] = None,
    ):
        """
        Initialize TranscriptCollector for a question session.
        
        Args:
            max_answer_time_sec: Hard time limit (240s = 4 min)
            silence_timeout_ms: Silence detection threshold (2000ms = 2s)
            on_complete: Callback when utterance finalized (silence)
            on_interim: Callback for live transcripts
            on_timeout: Callback specifically for hard timeout
        """
        self.max_answer_time_sec = max_answer_time_sec
        self.silence_timeout_ms = silence_timeout_ms
        self.on_complete = on_complete
        self.on_interim = on_interim
        self.on_timeout = on_timeout
        
        # State
        self.state = TranscriptState.IDLE
        self.accumulated_text = ""
        self.interim_text = ""
        self.final_text = ""
        self.all_utterances: List[str] = []
        
        # Timing
        self.start_time: Optional[float] = None
        self.end_time: Optional[float] = None
        self.silence_timeout_task: Optional[asyncio.Task] = None
        self.hard_timeout_task: Optional[asyncio.Task] = None
        
        # Finalization tracking
        self.finalization_reason: Optional[str] = None  # "silence" or "timeout"
        self.in_final_sequence = False
        
        # Completion event
        self.complete_event = asyncio.Event()
        
        logger.info(
            f"⏱️  TranscriptCollector initialized\n"
            f"    max_answer_time: {max_answer_time_sec}s (4 min per question)\n"
            f"    silence_timeout: {silence_timeout_ms}ms\n"
            f"    on_complete: {on_complete is not None}\n"
            f"    on_interim: {on_interim is not None}\n"
            f"    on_timeout: {on_timeout is not None}"
        )
    
    async def start_timer(self):
        """
        START THE ANSWER TIMER
        Call this when question is displayed to candidate.
        Begins the 4-minute countdown.
        """
        if self.state != TranscriptState.IDLE:
            logger.warning(f"⚠️ Timer already started (state: {self.state})")
            return
        
        self.start_time = time.time()
        self.state = TranscriptState.COLLECTING
        logger.info(f"🕐 [TIMER] Starting 4-minute answer window")
        logger.info(f"   Question presented at T=0")
        
        # Start hard timeout task (4 minutes)
        self.hard_timeout_task = asyncio.create_task(self._hard_timeout_handler())
        logger.info(f"✅ Hard timeout task started (4 min)")
    
    async def add_chunk(self, text: str, is_final: bool, confidence: float = 0.0):
        """
        Feed Deepgram transcript chunks.
        Resets silence timer on every final chunk
        """
        if not text or not text.strip():
            logger.debug("⊘ Empty chunk received")
            return
        
        text = text.strip()
        
        # Check if we've exceeded hard timeout
        if self.start_time:
            elapsed = time.time() - self.start_time
            if elapsed > self.max_answer_time_sec:
                logger.warning(
                    f"⚠️ Hard timeout already passed ({elapsed:.1f}s > {self.max_answer_time_sec}s). "
                    f"Ignoring chunk: '{text[:50]}'"
                )
                return
        
        # Transition: IDLE → COLLECTING
        if self.state == TranscriptState.IDLE:
            logger.info(f"🎤 Starting transcript collection")
            self.state = TranscriptState.COLLECTING
        
        # Extract only NEW content (fuzzy overlap detection)
        new_content = self._extract_new_content_word_based(text)
        
        if not new_content or not new_content.strip():
            logger.debug(f"⊘ No new content in: '{text[:50]}'")
            return
        
        # Calculate elapsed time
        elapsed = time.time() - self.start_time if self.start_time else 0
        
        if not is_final:
            # 🟡 INTERIM RESULT
            self.interim_text = new_content
            logger.debug(
                f"  🟡 Interim [{elapsed:.1f}s]: '{new_content[:60]}'"
            )
            
            if self.on_interim:
                try:
                    if asyncio.iscoroutinefunction(self.on_interim):
                        await self.on_interim(self.interim_text)
                    else:
                        self.on_interim(self.interim_text)
                except Exception as e:
                    logger.error(f"❌ on_interim callback error: {e}")
        
        else:
            # 🟢 FINAL RESULT - Accumulate and restart silence timer
            logger.info(
                f"  🟢 Final chunk [{elapsed:.1f}s]: '{text[:60]}'"
            )
            
            # Accumulate
            if self.accumulated_text:
                self.accumulated_text += " " + new_content
            else:
                self.accumulated_text = new_content
            
            self.in_final_sequence = True
            self.state = TranscriptState.FINALIZING
            logger.info(f"    📝 Accumulated: '{self.accumulated_text[:80]}'")
            
            # ⭐ RESTART silence timer (resets on every final chunk)
            await self._restart_silence_timer()
    
    async def _restart_silence_timer(self):
        """
        RESTART SILENCE TIMER after each final chunk
        
        This implements the "reset on final" logic:
        - When final chunk arrives, start waiting for silence_timeout_ms
        - If another final chunk arrives, cancel and restart
        - If silence_timeout expires without another chunk, finalize
        """
        # Cancel existing silence timeout
        if self.silence_timeout_task and not self.silence_timeout_task.done():
            self.silence_timeout_task.cancel()
            try:
                await self.silence_timeout_task
            except asyncio.CancelledError:
                pass
        
        # Start new silence timeout
        self.silence_timeout_task = asyncio.create_task(
            self._silence_timeout_handler()
        )
        logger.debug(f"  ⏱️ Silence timer restarted ({self.silence_timeout_ms}ms)")
    
    async def _silence_timeout_handler(self):
        """
        ⭐ SILENCE TIMEOUT HANDLER
        
        Waits for silence_timeout_ms. If no new final chunk arrives,
        finalizes the transcript.
        """
        try:
            await asyncio.sleep(self.silence_timeout_ms / 1000.0)
            
            # No new final chunk within timeout = finalization
            if self.in_final_sequence and self.accumulated_text:
                logger.info(f"🔇 Silence detected ({self.silence_timeout_ms}ms) → Finalizing")
                self.finalization_reason = "silence"
                await self._finalize()
        
        except asyncio.CancelledError:
            # Another final chunk arrived, silence timer was restarted
            pass
    
    async def _hard_timeout_handler(self):
        """
        ⭐ HARD TIMEOUT HANDLER
        
        4-minute hard limit. When this fires:
        - Whatever we have is immediately finalized
        - No more chunks are accepted after this
        """
        try:
            await asyncio.sleep(self.max_answer_time_sec)
            
            logger.warning(f"⏰ HARD TIMEOUT: 4 minutes reached")
            
            # Force finalization
            if self.state != TranscriptState.COMPLETE and self.state != TranscriptState.TIMEOUT:
                self.finalization_reason = "timeout"
                self.state = TranscriptState.TIMEOUT
                await self._finalize(is_timeout=True)
        
        except asyncio.CancelledError:
            pass
    
    async def _finalize(self, is_timeout: bool = False):
        """
        ⭐ FINALIZE TRANSCRIPT
        
        Called by either:
        - Silence timeout (natural pause)
        - Hard timeout (4 min limit)
        
        Triggers callback and sets completion event.
        """
        if self.state == TranscriptState.COMPLETE or self.state == TranscriptState.TIMEOUT:
            return  # Already finalized
        
        self.state = TranscriptState.COMPLETE
        self.end_time = time.time()
        elapsed = self.end_time - self.start_time if self.start_time else 0
        
        # Set final text
        self.final_text = self.accumulated_text
        self.all_utterances.append(self.final_text)
        
        logger.info(
            f"✅ FINALIZED [{self.finalization_reason}]\n"
            f"    Elapsed: {elapsed:.1f}s\n"
            f"    Text: {self.final_text[:100]}...\n"
            f"    Length: {len(self.final_text)} chars"
        )
        
        # Trigger callback
        if is_timeout and self.on_timeout:
            try:
                if asyncio.iscoroutinefunction(self.on_timeout):
                    await self.on_timeout(self.final_text)
                else:
                    self.on_timeout(self.final_text)
            except Exception as e:
                logger.error(f"❌ on_timeout callback error: {e}", exc_info=True)
        elif not is_timeout and self.on_complete:
            try:
                if asyncio.iscoroutinefunction(self.on_complete):
                    await self.on_complete(self.final_text)
                else:
                    self.on_complete(self.final_text)
            except Exception as e:
                logger.error(f"❌ on_complete callback error: {e}", exc_info=True)
        
        # Signal completion
        self.complete_event.set()
    
    async def wait_for_complete(self, timeout: Optional[float] = None) -> str:
        """
        ⭐ BLOCKING WAIT for transcript to finalize
        
        Returns the complete transcript when either:
        - Silence is detected (2s pause)
        - Hard timeout reached (4 min)
        
        Returns:
            The finalized transcript text
        """
        logger.info(f"⏳ Waiting for transcript completion...")
        
        try:
            await asyncio.wait_for(self.complete_event.wait(), timeout=timeout)
            logger.info(f"✅ Transcript ready. Reason: {self.finalization_reason}")
            return self.final_text
        except asyncio.TimeoutError:
            logger.error(f"❌ Timeout waiting for transcript (additional timeout exceeded)")
            if self.state != TranscriptState.COMPLETE and self.state != TranscriptState.TIMEOUT:
                await self.force_finalize()
            return self.final_text
    
    async def force_finalize(self):
        """
        ⭐ MANUAL FORCE FINALIZE
        
        Used if you want to stop collection immediately
        (e.g., user clicks "Stop" button)
        """
        logger.info("🛑 Force finalize called")
        
        # Cancel both timers
        if self.silence_timeout_task and not self.silence_timeout_task.done():
            self.silence_timeout_task.cancel()
            try:
                await self.silence_timeout_task
            except asyncio.CancelledError:
                pass
        
        if self.hard_timeout_task and not self.hard_timeout_task.done():
            self.hard_timeout_task.cancel()
            try:
                await self.hard_timeout_task
            except asyncio.CancelledError:
                pass
        
        if self.state != TranscriptState.COMPLETE and self.accumulated_text:
            self.finalization_reason = "manual"
            await self._finalize()
    
    async def stop(self):
        """
        ⭐ CLEANUP: Stop all tasks
        
        Call this when moving to next question.
        """
        logger.info("🛑 Stopping collector")
        
        # Cancel all tasks
        for task in [self.silence_timeout_task, self.hard_timeout_task]:
            if task and not task.done():
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass
        
        self.state = TranscriptState.IDLE
        logger.info("✅ Stopped")
    
    def reset_for_next_question(self):
        """
        ⭐ RESET for new question
        
        Call between each question.
        """
        logger.info("🔄 Resetting for next question")
        
        # Reset state
        self.state = TranscriptState.IDLE
        self.accumulated_text = ""
        self.interim_text = ""
        self.final_text = ""
        self.finalization_reason = None
        self.in_final_sequence = False
        self.start_time = None
        self.end_time = None
        
        # Reset event
        self.complete_event.clear()
        
        # Cancel tasks if running
        for task in [self.silence_timeout_task, self.hard_timeout_task]:
            if task and not task.done():
                task.cancel()
        
        self.silence_timeout_task = None
        self.hard_timeout_task = None
        
        logger.info("✅ Ready for next question")
    
    # ─────────────────────────────────────────────
    # Utility methods
    # ─────────────────────────────────────────────
    
    def _extract_new_content_word_based(self, current_text: str) -> str:
        """
        Extract only NEW content using word-level fuzzy matching.
        Handles overlapping Deepgram chunks.
        """
        if not self.accumulated_text:
            return current_text
        
        current_words = current_text.split()
        accumulated_words = self.accumulated_text.split()
        
        if not current_words or not accumulated_words:
            return current_text
        
        # Try to find longest overlap
        max_overlap = min(len(accumulated_words), len(current_words))
        
        for overlap_word_count in range(max_overlap, 0, -1):
            acc_tail = accumulated_words[-overlap_word_count:]
            
            for start_pos in range(len(current_words) - overlap_word_count + 1):
                curr_slice = current_words[start_pos:start_pos + overlap_word_count]
                
                if self._fuzzy_match_words(acc_tail, curr_slice, threshold=0.8):
                    new_words = current_words[start_pos + overlap_word_count:]
                    if new_words:
                        result = " ".join(new_words)
                        logger.debug(
                            f"✅ Word overlap: {overlap_word_count} words\n"
                            f"   New: '{result}'"
                        )
                        return result
                    else:
                        logger.debug(f"✅ Complete overlap, no new content")
                        return ""
        
        logger.debug(f"⚠️ No overlap found: '{current_text[:50]}'")
        return current_text
    
    def _fuzzy_match_words(self, words1: List[str], words2: List[str], threshold: float = 0.8) -> bool:
        """Check if word lists match (fuzzy, allowing STT errors)"""
        if len(words1) != len(words2):
            return False
        
        match_count = 0
        for w1, w2 in zip(words1, words2):
            w1_norm = self._normalize_word(w1)
            w2_norm = self._normalize_word(w2)
            
            if w1_norm == w2_norm:
                match_count += 1
            else:
                ratio = SequenceMatcher(None, w1_norm, w2_norm).ratio()
                if ratio > 0.7:
                    match_count += 1
        
        match_ratio = match_count / len(words1) if words1 else 0
        return match_ratio >= threshold
    
    def _normalize_word(self, word: str) -> str:
        """Normalize word (remove punctuation, lowercase)"""
        return word.strip(string.punctuation).lower()
    
    # ─────────────────────────────────────────────
    # Getters
    # ─────────────────────────────────────────────
    
    def get_current_utterance(self) -> str:
        """Get live transcript (interim or final)"""
        return self.final_text if self.final_text else self.interim_text
    
    def get_elapsed_time(self) -> float:
        """Get seconds elapsed since timer started"""
        if not self.start_time:
            return 0
        return time.time() - self.start_time
    
    def get_remaining_time(self) -> float:
        """Get seconds remaining in answer window"""
        elapsed = self.get_elapsed_time()
        remaining = self.max_answer_time_sec - elapsed
        return max(0, remaining)
    
    def get_utterance_count(self) -> int:
        """Get number of completed utterances"""
        return len(self.all_utterances)
    
    def get_stats(self) -> dict:
        """Get detailed stats"""
        elapsed = self.get_elapsed_time()
        remaining = self.get_remaining_time()
        
        return {
            "state": self.state.value,
            "finalization_reason": self.finalization_reason,
            "accumulated_length": len(self.accumulated_text),
            "elapsed_time_sec": elapsed,
            "remaining_time_sec": remaining,
            "interim_text": self.interim_text[:100],
            "final_text": self.final_text[:100],
            "utterance_count": len(self.all_utterances),
        }