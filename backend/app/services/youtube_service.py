import re
import httpx
from typing import Dict, Any, List, Optional
from youtube_transcript_api import YouTubeTranscriptApi
from app.services.logger_service import get_logger


class YouTubeService:
    """
    YouTubeService Responsibilities:
    - Extract YouTube Video ID from various URL formats
    - Fetch video metadata (Title, Author/Channel) via official YouTube oEmbed API
    - Fetch subtitles/transcripts using youtube-transcript-api
    - Group and format transcripts with timestamp anchors [MM:SS] / [HH:MM:SS]
    """

    def __init__(self):
        self.logger = get_logger("youtube_service")
        self.yt_api = YouTubeTranscriptApi()

    def extract_video_id(self, url_or_id: str) -> Optional[str]:
        """
        Extract 11-character video ID from YouTube URL or raw ID string.
        """
        if not url_or_id:
            return None

        url_or_id = url_or_id.strip()

        # Direct 11-char ID check
        if re.match(r"^[a-zA-Z0-9_-]{11}$", url_or_id):
            return url_or_id

        # Patterns for YouTube URLs
        patterns = [
            r"(?:v=|\/)([a-zA-Z0-9_-]{11})(?:[&?\/]|$)",
            r"youtu\.be\/([a-zA-Z0-9_-]{11})",
            r"youtube\.com\/embed\/([a-zA-Z0-9_-]{11})",
            r"youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})",
        ]

        for pattern in patterns:
            match = re.search(pattern, url_or_id)
            if match:
                return match.group(1)

        return None

    async def fetch_video_metadata(self, video_id: str) -> Dict[str, str]:
        """
        Fetch video title and channel name via YouTube oEmbed API.
        No API key required!
        """
        oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(oembed_url)
                if resp.status_code == 200:
                    data = resp.json()
                    return {
                        "title": data.get("title", f"YouTube Video ({video_id})"),
                        "author": data.get("author_name", "Unknown Channel"),
                    }
        except Exception as e:
            self.logger.warning(f"[YouTubeService] oEmbed fetch failed for {video_id}: {str(e)}")

        return {
            "title": f"YouTube Video ({video_id})",
            "author": "Unknown Channel"
        }

    def fetch_raw_transcript(self, video_id: str) -> List[Any]:
        """
        Fetch subtitle snippets from youtube-transcript-api.
        """
        try:
            # Try direct fetch first
            return self.yt_api.fetch(video_id)
        except Exception as e1:
            self.logger.warning(f"[YouTubeService] Direct fetch failed for {video_id}: {str(e1)}. Trying list_transcripts...")
            try:
                transcripts = self.yt_api.list(video_id)
                try:
                    t = transcripts.find_transcript(['en', 'en-US', 'en-GB'])
                except Exception:
                    t = transcripts.find_generated_transcript(['en', 'en-US', 'en-GB'])
                return t.fetch()
            except Exception as e2:
                self.logger.error(f"[YouTubeService] Could not fetch transcript for {video_id}: {str(e2)}")
                raise ValueError(f"Could not retrieve transcript for video ID '{video_id}'. The video might not have English captions enabled.")

    def format_timestamp(self, seconds: float) -> str:
        """
        Convert total seconds into [MM:SS] or [HH:MM:SS].
        """
        total_seconds = int(seconds)
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        secs = total_seconds % 60
        if hours > 0:
            return f"[{hours:02d}:{minutes:02d}:{secs:02d}]"
        return f"[{minutes:02d}:{secs:02d}]"

    def format_transcript_with_timestamps(self, raw_snippets: List[Any], chunk_interval_sec: int = 45) -> str:
        """
        Group raw snippets into paragraph blocks per ~45-60 seconds interval.
        Tag each paragraph with timestamp anchor [MM:SS].
        """
        if not raw_snippets:
            return "No transcript content available."

        blocks = []
        current_block_texts = []
        current_block_start = None

        for snippet in raw_snippets:
            if hasattr(snippet, 'text'):
                text = snippet.text
                start = snippet.start
            elif isinstance(snippet, dict):
                text = snippet.get('text', '')
                start = snippet.get('start', 0.0)
            else:
                text = str(snippet)
                start = 0.0

            text = text.replace('\n', ' ').strip()
            if not text:
                continue

            if current_block_start is None:
                current_block_start = start

            current_block_texts.append(text)

            if start - current_block_start >= chunk_interval_sec:
                ts_str = self.format_timestamp(current_block_start)
                blocks.append(f"{ts_str} {' '.join(current_block_texts)}")
                current_block_texts = []
                current_block_start = None

        if current_block_texts and current_block_start is not None:
            ts_str = self.format_timestamp(current_block_start)
            blocks.append(f"{ts_str} {' '.join(current_block_texts)}")

        return "\n\n".join(blocks)

    async def get_study_content(self, url_or_id: str) -> Dict[str, Any]:
        """
        Main entrypoint: extracts ID, gets metadata & timestamp-formatted transcript.
        """
        video_id = self.extract_video_id(url_or_id)
        if not video_id:
            raise ValueError(f"Invalid YouTube URL or Video ID: '{url_or_id}'")

        metadata = await self.fetch_video_metadata(video_id)
        raw_snippets = self.fetch_raw_transcript(video_id)
        formatted_transcript = self.format_transcript_with_timestamps(raw_snippets)

        return {
            "video_id": video_id,
            "title": metadata.get("title"),
            "author": metadata.get("author"),
            "transcript": formatted_transcript,
            "snippet_count": len(raw_snippets)
        }
