const recordingElement = document.querySelector(".nav__status-bar--display");
const startRecordingButton = document.getElementById("controls__btn--start");
const stopRecordingButton = document.getElementById("controls__btn--stop");
const transcriptElement = document.getElementById("transcript");
const chatGptResponseElement = document.getElementById("chatgpt_response");

const statusParameters = {
  start: {
    statusClass: "nav__status-bar--start",
    textContent: "▶︎ Recognizing...",
    logMessage: "INFO:_Voice Recognition In Progress..",
  },
  response: {
    statusClass: "nav__status-bar--response",
    textContent: "▶︎ Answering...",
    logMessage: "INFO:_GPT Responding..",
  },
  stop: {
    statusClass: "nav__status-bar--stop",
    textContent: "■ STOP",
    logMessage: "INFO:_Process Stopped",
  },
  error: {
    statusClass: "nav__status-bar--error",
    textContent: "■ ERROR",
    logMessage: "INFO:_Error Occurred: ",
  },
};

const changeElementStatus = (status, error = null) => {
  const { statusClass, textContent, logMessage } = statusParameters[status];
  recordingElement.className = statusClass;
  recordingElement.textContent = textContent;
  const statusInfo = error ? `ERROR:_ ${error.message}` : `${logMessage}`;
  console.log(statusInfo);
};

// Replace with your actual OpenAI API Key
const OPENAI_API_KEY = "Your OpenAI API Key Here!";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
// Specify the OpenAI GPT model name here. Options are 'gpt-4', 'gpt-3.5-turbo'.
const OPENAI_MODEL_NAME = "gpt-3.5-turbo";
// Modify 'OPENAI_SYSTEM_ROLE' to customize the model's 'persona' as needed.
const OPENAI_SYSTEM_ROLE =
  "あなたは優秀なソフトウェアエンジニアです。質問に対して簡潔に回答します。";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
// Change 'ja-JP' to 'eu-US' to switch the recognition language.
recognition.lang = "ja-JP";
recognition.interimResults = true;
recognition.continuous = true;

const flags = {
  isSpeechRecognizedAndWrittenFlag: false,
  isMessageSentFlag: false,
  isSpeechSynthesizedFlag: false,
};

function setFlag(flagName) {
  if (!Object.prototype.hasOwnProperty.call(flags, flagName)) {
    console.log(`ERROR:_${flagName} is not a valid flag`);
    throw new Error(`Invalid flag name:_${flagName}`);
  }

  if (flags[flagName]) {
    console.log(`FLAG:_${flagName} is already set`);
    return;
  }

  flags[flagName] = true;
  console.log(`FLAG:_${flagName} is set`);
}

function resetFlags() {
  Object.keys(flags).forEach((key) => {
    flags[key] = false;
    console.log(`FLAG:_${key} is reset`);
  });
}

function createApiRequestOptions(message) {
  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  headers.append("Authorization", `Bearer ${OPENAI_API_KEY}`);

  const body = JSON.stringify({
    model: OPENAI_MODEL_NAME,
    messages: [
      { role: "system", content: OPENAI_SYSTEM_ROLE },
      { role: "user", content: message },
    ],
  });
  const requestOptions = {
    method: "POST",
    // eslint-disable-next-line object-shorthand
    headers: headers,
    // eslint-disable-next-line object-shorthand
    body: body,
  };
  return requestOptions;
}

function startSilenceTimer() {
  return setTimeout(() => {
    recognition.stop();
    console.log("INFO:_silenceTimer Ended");
  }, 5000);
}

function clearExistingTimeout(timeoutId) {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
}

async function startSpeechRecognitionAsync() {
  return new Promise((resolve, reject) => {
    let inputVoice = "";
    let timeoutId;
    recognition.start();
    changeElementStatus("start");

    recognition.onspeechend = () => {
      recognition.stop();
      clearExistingTimeout(timeoutId);
      console.log("INFO:_Transcription process completed");
    };

    recognition.onresult = (event) => {
      inputVoice = event.results[0][0].transcript;
      transcriptElement.textContent = inputVoice;
      console.log("INFO:_Transcribing..");
      clearExistingTimeout(timeoutId);
      timeoutId = startSilenceTimer();
    };

    recognition.onend = () => {
      clearExistingTimeout(timeoutId);
      console.log("INFO:_Voice recognition ended");
      resolve(inputVoice);
    };

    recognition.onerror = (event) => {
      clearExistingTimeout(timeoutId);
      changeElementStatus("stop");
      setFlag("isSpeechSynthesizedFlag");
      console.log(`ERROR:_Error occurred in voice recognition: ${event.error}`);
      reject(event.error);
    };
  });
}

async function sendMessageAsync(message) {
  if (flags.isMessageSentFlag) {
    console.log("ERROR:_sendMessageAsync is already executed");
    return;
  }

  const requestOptions = createApiRequestOptions(message);

  try {
    const response = await fetch(OPENAI_API_URL, requestOptions);
    console.log(
      `INFO:_(${new Date().toISOString()}): Sent fetch request to OPEN AI`
    );

    if (!response.ok) {
      alert(
        `Authentication failure: please set the correct API KEY - STATUS: ${response.status}`
      );
      await Promise.reject(new Error(`HTTP Error! Status: ${response.status}`));
    }
    const data = await response.json();
    console.log(
      `INFO:_ (${new Date().toISOString()}): Received response JSON from OPEN AI`
    );

    recognition.stop();
    console.log("INFO:_Voice recognition stopped");

    changeElementStatus("response");
    const chatGptResponse = data.choices[0].message.content;
    chatGptResponseElement.textContent = chatGptResponse;
    console.log("INFO:_Writing GPT's reply to text..");

    setFlag("isMessageSentFlag");
    console.log(`INFO:_GPT's reply------->${chatGptResponse}`);
    // eslint-disable-next-line consistent-return
    return chatGptResponse;
  } catch (error) {
    console.error(`ERROR:_Error while sending message to ChatGPT: ${error}`);
    changeElementStatus("error", error);
    throw error;
  }
}

function readTextWithSynthesizedSpeech(message) {
  if (flags.isSpeechSynthesizedFlag) {
    console.log("INFO:_Speech synthesis has already been processed.");
    return;
  }

  // eslint-disable-next-line consistent-return
  return new Promise((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = "ja-JP";

    utterance.onend = () => {
      console.log("INFO:_Speech synthesis ended");
      resolve();
    };
    utterance.onerror = (event) => {
      reject(event.error);
    };
    try {
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      if (error === "interrupted" || error === "canceled") {
        console.log("INFO:_STOP button's process completed successfully");
      } else {
        console.error(
          `ERROR:_Error occurred during speech synthesis: ${error}`
        );
        changeElementStatus("error", error);
        reject(error);
      }
    }
  });
}

startRecordingButton.addEventListener("click", async () => {
  resetFlags();
  console.log("INFO:_Starting voice recognition");
  try {
    const message = await startSpeechRecognitionAsync();
    setFlag("isSpeechRecognizedAndWrittenFlag");

    const chatGptResponse = await sendMessageAsync(message);
    setFlag("isMessageSentFlag");

    await readTextWithSynthesizedSpeech(chatGptResponse);
    changeElementStatus("stop");
    setFlag("isSpeechSynthesizedFlag");
  } catch (error) {
    if (error === "interrupted" || error === "canceled") {
      console.log("INFO:_STOP button's process completed successfully");
    } else {
      console.error(`ERROR:_Error in the main function's process: ${error}`);
      changeElementStatus("error", error);
    }
  }
});

stopRecordingButton.addEventListener("click", () => {
  try {
    console.log("INFO:_STOP button's process started");
    recognition.stop();
    speechSynthesis.cancel();
    changeElementStatus("stop");
    setFlag("isSpeechSynthesizedFlag");
  } catch (error) {
    if (error === "interrupted" || error === "canceled") {
      console.log("INFO:_STOP button's process completed successfully");
    } else {
      console.error(
        `ERROR:_An unexpected error occurred in the STOP button's process: ${error}`
      );
      changeElementStatus("error", error);
    }
  }
});
