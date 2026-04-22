import requests

API_KEY = "sk_d22a8dce6acf94559d128d7b3223ae119476c03caf0f2c4d"
VOICE_ID = "fugSRYLwCEjXVKA8lbpP"
TEXT = "Hello, this is a test."
URL = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"

headers = {
    "Accept": "audio/mpeg",
    "Content-Type": "application/json",
    "xi-api-key": API_KEY
}
data = {"text": TEXT}

response = requests.post(URL, json=data, headers=headers)

# Save the audio to a file
with open("output.mp3", "wb") as f:
    f.write(response.content)
print("Audio saved as output.mp3")