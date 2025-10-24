import os
import requests
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("ELEVENLABS_API_KEY")

def speech_to_text(audio_file_path):
    """
    Converts an audio file to text using the ElevenLabs Speech-to-Text API.
    """
    if not API_KEY:
        print("Error: ELEVENLABS_API_KEY not found. Please set it in your .env file.")
        return None

    if not os.path.exists(audio_file_path):
        print(f"Error: File '{audio_file_path}' not found.")
        return None

    url = "https://api.elevenlabs.io/v1/speech-to-text"
    headers = {"xi-api-key": API_KEY}
    data = {"model_id": "scribe_v1"}

    with open(audio_file_path, "rb") as audio:
        files = {"file": audio}
        print("Transcribing audio... please wait.")
        response = requests.post(url, headers=headers, data=data, files=files)

    if response.status_code == 200:
        text = response.json().get("text", "")
        print("Transcription:")
        print(text)
        return text
    else:
        print(f"Error {response.status_code}: {response.text}")
        return None


if __name__ == "__main__":
    file_path = input("Enter the path to your audio file (e.g., sample.wav or voice.mp3):\n> ").strip()
    if file_path:
        speech_to_text(file_path)
    else:
        print("No file path provided. Exiting.")
