# Voice-ChatGPT

## Description
This application, Voice-ChatGPT, is an interactive, voice-responsive system developed entirely using JavaScript. It transcribes voice input, sends the transcriptions to OpenAI's advanced language model, and speaks the model's responses back to the user.

## Features
* Voice Recognition:
  Transcribes user's spoken language into written text.
* GPT Interaction:
  Sends the transcribed text-based message from user's spoken language to the ChatGPT and receives a response.
* Text-to-Speech:
  The text-based response from ChatGPT is converted back to spoken language, providing a seamless and dynamic conversational experience.

## Getting Started

### Requirements
- A web browser supporting SpeechRecognition and SpeechSynthesis APIs (such as Google Chrome).
- An API key from OpenAI. Please note, you need to obtain this key yourself from OpenAI.

### Setup
1. Clone this repository to your local machine.
2. Locate the variable named 'OPENAI_API_KEY' in the `main.js` file and replace 'sk-xxxxx' with your personal OpenAI API key.
3. You can customize the behavior of the OpenAI model by modifying the content of 'OPENAI_SYSTEM_ROLE'. This allows you to define the model's 'persona' to suit your needs.
4. Open `index.html` in your web browser to start the application.

## Usage
Speak to the application after clicking the "Start Recording" button. The application will transcribe your speech, send it to the OpenAI GPT model, and read out the model's response. You can stop the recording anytime by clicking the "Stop Recording" button.

