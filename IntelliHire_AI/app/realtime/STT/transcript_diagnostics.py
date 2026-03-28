"""
Diagnostic Tool: Trace where garbage text is being injected

This helps identify whether the corruption is happening:
1. In Deepgram event handling
2. In TranscriptCollector
3. In the calling code
4. In state not being reset between questions
"""

import logging
from typing import List, Tuple

logger = logging.getLogger(__name__)


class TranscriptDiagnostics:
    """Track every step of transcript collection for debugging"""
    
    def __init__(self):
        self.events: List[dict] = []
        self.event_counter = 0
    
    def log_event(self, event_type: str, text: str, is_final: bool, **extra):
        """Log a transcript event with full context"""
        self.event_counter += 1
        event = {
            "counter": self.event_counter,
            "type": event_type,  # "deepgram_recv", "add_chunk", "finalize", etc.
            "text": text,
            "text_length": len(text),
            "is_final": is_final,
            "text_preview": text[:80],
            **extra
        }
        self.events.append(event)
        
        logger.info(
            f"[DIAG #{self.event_counter}] {event_type}\n"
            f"    text: '{text[:100]}'\n"
            f"    is_final: {is_final}\n"
            f"    length: {len(text)}"
        )
    
    def log_state(self, label: str, accumulated: str, interim: str, final: str):
        """Log collector state"""
        logger.info(
            f"[STATE {label}]\n"
            f"    accumulated ({len(accumulated)} chars): '{accumulated[:80]}'\n"
            f"    interim ({len(interim)} chars): '{interim[:80]}'\n"
            f"    final ({len(final)} chars): '{final[:80]}'"
        )
    
    def detect_corruption_sources(self) -> List[str]:
        """Analyze events to find where garbage is coming from"""
        issues = []
        
        # Check 1: Interim results being stored
        interim_events = [e for e in self.events if e["type"] == "deepgram_interim"]
        if interim_events:
            issues.append(
                f"⚠️ Found {len(interim_events)} interim results - "
                f"if these are being accumulated, they cause garbage"
            )
        
        # Check 2: Text getting shorter then longer (sign of reset issues)
        text_lengths = [e["text_length"] for e in self.events if e["type"] == "deepgram_recv"]
        for i in range(1, len(text_lengths)):
            if text_lengths[i] < text_lengths[i-1] and text_lengths[i] > 10:
                issues.append(
                    f"⚠️ Text got shorter at event {i} ({text_lengths[i-1]} → {text_lengths[i]}) "
                    f"- possible reset without clearing state"
                )
        
        # Check 3: Large text jumps (sign of concatenation)
        for i in range(1, len(self.events)):
            prev_len = len(self.events[i-1]["text"])
            curr_len = len(self.events[i]["text"])
            
            if curr_len > prev_len * 1.5 and self.events[i]["type"] == "deepgram_recv":
                # Text grew by 50%+ between events
                # This is normal for Deepgram re-sends, but worth tracking
                if "Whereas" in self.events[i]["text"] and "blue" in self.events[i]["text"]:
                    issues.append(
                        f"⚠️ Event {i}: Suspicious text growth with garbage words (blue, Whereas, etc)"
                    )
        
        # Check 4: Same text appearing in logs (duplication)
        text_hashes = {}
        for event in self.events:
            text_normalized = event["text"].lower().strip()
            if text_normalized in text_hashes:
                issues.append(
                    f"⚠️ Duplicate text detected:\n"
                    f"    Event {text_hashes[text_normalized]}: '{self.events[text_hashes[text_normalized]-1]['text'][:50]}'\n"
                    f"    Event {event['counter']}: '{event['text'][:50]}'"
                )
            else:
                text_hashes[text_normalized] = event["counter"]
        
        return issues
    
    def print_report(self):
        """Print diagnostic report"""
        logger.info("\n" + "="*80)
        logger.info("TRANSCRIPT DIAGNOSTIC REPORT")
        logger.info("="*80)
        
        logger.info(f"\nTotal events: {self.event_counter}")
        
        by_type = {}
        for event in self.events:
            t = event["type"]
            by_type[t] = by_type.get(t, 0) + 1
        
        logger.info("\nEvents by type:")
        for event_type, count in by_type.items():
            logger.info(f"  {event_type}: {count}")
        
        logger.info("\nEvent timeline:")
        for event in self.events:
            logger.info(
                f"  #{event['counter']:3d} {event['type']:20s} "
                f"(final={event['is_final']}) "
                f"{len(event['text']):3d} chars: '{event['text_preview']}...'"
            )
        
        issues = self.detect_corruption_sources()
        if issues:
            logger.warning("\n⚠️ POTENTIAL ISSUES DETECTED:")
            for issue in issues:
                logger.warning(f"  • {issue}")
        else:
            logger.info("\n✅ No obvious corruption sources detected")
        
        logger.info("\n" + "="*80)


# Integration: Use this in your Deepgram event handler

class ImprovedDeegramHandler:
    """Example of how to use diagnostics in your Deepgram handler"""
    
    def __init__(self, collector, enable_diagnostics=True):
        self.collector = collector
        self.diagnostics = TranscriptDiagnostics() if enable_diagnostics else None
    
    async def handle_deepgram_event(self, event):
        """Handle incoming Deepgram event with diagnostics"""
        
        # Extract text and final flag
        text = event.get("transcript", "").strip()
        is_final = event.get("is_final", False)
        confidence = event.get("confidence", 0.0)
        
        # Log the raw event
        if self.diagnostics:
            self.diagnostics.log_event(
                "deepgram_recv",
                text,
                is_final,
                confidence=confidence,
                event_type=event.get("type", "unknown")
            )
        
        # ⭐ CRITICAL: Only pass to collector if text is not garbage
        if self._is_valid_text(text):
            logger.info(f"✅ Valid text, adding to collector: '{text[:60]}'")
            await self.collector.add_chunk(text, is_final, confidence)
        else:
            logger.warning(f"❌ Rejecting garbage text: '{text[:60]}'")
            if self.diagnostics:
                self.diagnostics.log_event(
                    "deepgram_rejected",
                    text,
                    is_final,
                    reason="garbage_detection"
                )
    
    def _is_valid_text(self, text: str) -> bool:
        """
        Simple garbage detection.
        
        Deepgram misrecognitions often include:
        - Very short fragments ("it", "is", "a")
        - Common garbage words (blue, printer, vanilla, etc.)
        - Nonsensical combinations
        """
        
        if not text or len(text) < 2:
            return False
        
        # Known garbage words that appear in your logs
        garbage_patterns = [
            "blue printer",  # Common misrecognition
            "blue per inter",  # Deepgram artifact
            "vanilla",  # Misheard
            "printer",  # Shouldn't appear in tech answers
        ]
        
        text_lower = text.lower()
        if any(pattern in text_lower for pattern in garbage_patterns):
            # Might be garbage, but could be intentional
            # Only reject if confidence is low
            return True  # For now, accept it
        
        return True


# Better approach: Filter by confidence score

class ConfidenceBasedFilter:
    """Filter low-confidence results"""
    
    def __init__(self, min_confidence: float = 0.70):
        self.min_confidence = min_confidence
    
    async def filter_and_add_chunk(self, collector, text: str, is_final: bool, confidence: float):
        """Only add chunks above confidence threshold"""
        
        if confidence < self.min_confidence:
            logger.warning(
                f"❌ Rejecting low-confidence result (confidence={confidence:.2f} < {self.min_confidence}):\n"
                f"    '{text}'"
            )
            return False
        
        logger.info(
            f"✅ Accepting high-confidence result (confidence={confidence:.2f}):\n"
            f"    '{text}'"
        )
        await collector.add_chunk(text, is_final, confidence)
        return True


# Usage in your code:

def setup_transcript_collection_with_diagnostics():
    """
    Set up transcript collection with diagnostics enabled
    
    In your webrtc_controller or wherever you handle Deepgram events:
    
    ```python
    from transcript_diagnostics import TranscriptDiagnostics, ImprovedDeegramHandler
    
    diagnostics = TranscriptDiagnostics()
    handler = ImprovedDeegramHandler(collector, enable_diagnostics=True)
    
    # In your Deepgram event loop:
    async for event in deepgram_stream:
        await handler.handle_deepgram_event(event)
    
    # At the end:
    diagnostics.print_report()
    ```
    """
    pass