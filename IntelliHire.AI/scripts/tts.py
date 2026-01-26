import os
import requests
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("ELEVENLABS_API_KEY")

def text_to_speech(text, voice_id="9J08XLaVNO9dwqz7kWR7", output_file="output.mp3"):
    if not API_KEY:
        print("Error: ELEVENLABS_API_KEY not found. Please set it in your .env file.")
        return

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = {
        "xi-api-key": API_KEY,
        "Content-Type": "application/json"
    }
    data = {
        "text": text,
        "model_id": "eleven_multilingual_v2"
    }

    response = requests.post(url, headers=headers, json=data)

    if response.status_code == 200:
        with open(output_file, "wb") as f:
            f.write(response.content)
        print(f"Saved audio as: {output_file}")
    else:
        print(f"Error {response.status_code}: {response.text}")


if __name__ == "__main__":
    text = input("Enter the text you want to convert to speech:\n> ").strip()

    if text:
        text_to_speech(text)
    else:
        print("No text entered. Exiting.")
