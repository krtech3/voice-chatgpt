# Voice-ChatGPT

## Description
Voice-ChatGPT is a fully JavaScript-based, interactive, voice-responsive application. It utilizes user voice input, transcribes it, interacts with OpenAI's advanced language model GPT, and vocalizes the generated responses, thus facilitating a dynamic conversation.

## Features
* **Voice Recognition:** Transcribes the user's spoken language into text.
* **GPT Interaction:** Sends the transcribed text to ChatGPT, then fetches and processes the response.
* **Text-to-Speech:** Converts the text-based response from ChatGPT back into spoken language, ensuring a seamless conversational experience.

## Getting Started

### Prerequisites
- A web browser that supports the SpeechRecognition and SpeechSynthesis APIs (such as Google Chrome).
- An API key from OpenAI. Please note that this key needs to be personally obtained from OpenAI's website.

### Setup
1. Clone this repository to your local environment.
2. In the `main.js` file, find the 'OPENAI_API_KEY' variable and replace its value with your personal OpenAI API key.
3. Optionally, adjust the behavior of the OpenAI model by modifying the 'OPENAI_SYSTEM_ROLE' variable. This allows you to personalize the model's 'persona'.
4. Open `index.html` in your web browser to launch the application.

## Usage
Click the "START" button and start speaking to the application. It will transcribe your speech, send it to the OpenAI GPT model for processing, and then read out the generated response. The "STOP" button can be used to cease the recording at any time.
