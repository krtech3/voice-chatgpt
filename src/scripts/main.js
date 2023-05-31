// グローバル変数の宣言、代入。変数のスコープがややこしくなるので、ここにはできるだけ処理を書かない
const recordingElement = document.querySelector(".nav__status-bar--display");
const startRecordingButton = document.getElementById("controls__btn--start");
const stopRecordingButton = document.getElementById("controls__btn--stop");
const transcriptElement = document.getElementById("transcript");
const chatGptResponseElement = document.getElementById("chatgpt_response");

// ステータスパラメータを管理
const statusParameters = {
  start: {
    statusClass: "nav__status-bar--start",
    textContent: "▶︎ Recognizing...",
    logMessage: "INFO:_音声認識中...",
  },
  response: {
    statusClass: "nav__status-bar--response",
    textContent: "▶︎ Answering...",
    logMessage: "INFO:_GPT返答中..",
  },
  stop: {
    statusClass: "nav__status-bar--stop",
    textContent: "■ STOP",
    logMessage: "INFO:_停止中",
  },
  error: {
    statusClass: "nav__status-bar--error",
    textContent: "■ STOP",
    logMessage: "INFO:_エラー: ",
  },
};

// ステータスを変更する関数
const changeElementStatus = (status, error = null) => {
  const { statusClass, textContent, logMessage } = statusParameters[status];
  recordingElement.className = statusClass;
  recordingElement.textContent = textContent;
  const statusInfo = error
    ? `ERROR:_エラー: ${error.message}`
    : `${logMessage}`;
  console.log(statusInfo);
};

const OPENAI_API_KEY = "sk-xxxxx"; // ここにあなたのOpenAI APIキーを設定します
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL_NAME = "gpt-3.5-turbo"; // Select OpenAI GPT Model Name ['gpt-4', 'gpt-3.5-turbo']
const OPENAI_SYSTEM_ROLE =
  "あなたは世界一物知りなおじさんです。どんな問いにも懇切丁寧に回答します。";

// 音声オブジェクトの生成
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = "ja";
recognition.interimResults = true; // 音声認識途中でも結果を得る
recognition.continuous = true; // 音声認識を続ける

// 状態監視フラグのパラメータ
const flags = {
  isSpeechRecognizedAndWrittenFlag: false, // 音声認識状態管理
  isMessageSentFlag: false, // GPT送信状態管理
  isSpeechSynthesizedFlag: false, // 読み上げ状態管理
};

function setFlag(flagName) {
  flags[flagName] = true;
  console.log(`FLAG:_${flagName}_フラグが立ちました`);
}

function resetFlags() {
  Object.keys(flags).forEach((key) => {
    flags[key] = false;
    console.log(`FLAG:_${key}_フラグがリセットされました`);
  });
}

// 即時実行関数
(() => {
  console.log("INFO: Starting immediate execution process");
})();

// DOMツリーが出来上がったら実行_※画像読み込み前
document.addEventListener("DOMContentLoaded", () => {
  console.log("INFO: DOM Tree has been built");
});

// 最後に実行_※画像読み込み後
window.onload = function () {
  console.log("window.onloadが完了");
};

// APIリクエストの設定を生成する関数
function createApiRequestOptions(message) {
  // APIリクエストのヘッダーを設定
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

// 自動停止タイマー
function stopTimer() {
  console.log("INFO:_stopTimer開始");
  setTimeout(() => {
    recognition.stop();
  }, 5000);
  console.log("INFO:_stopTimer終了");
}

// 非同期に音声認識する関数
async function startSpeechRecognitionAsync() {
  return new Promise((resolve, reject) => {
    let inputVoice = "";
    recognition.start();
    changeElementStatus("start");
    recognition.onspeechend = () => {
      recognition.stop();
      console.log("INFO:_音声認識の書き起こし処理完了");
    };
    recognition.onresult = (event) => {
      inputVoice = event.results[0][0].transcript;
      transcriptElement.textContent = inputVoice;
      console.log("INFO:_音声認識の書き起こし中...");
      stopTimer();
    };
    recognition.onend = () => {
      console.log("INFO:_音声認識が終了");
      resolve(inputVoice);
    };
    recognition.onerror = (event) => {
      changeElementStatus("stop");
      setFlag("isSpeechSynthesizedFlag");
      console.log(`ERROR:_音声認識でエラーが発生: ${event.error}`);
      reject(event.error);
    };
  });
}

// Chat-GPTへの送受信処理
async function sendMessageAsync(message) {
  if (flags.isMessageSentFlag) {
    console.log("ERROR:_sendMessageAsyncは実行済みです");
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
        `認証失敗:正しいAPI KEYを設定してください - Status: ${response.status}`
      );
      throw new Error(`HTTP Error! Status: ${response.status}`);
    }
    const data = await response.json();
    console.log(
      `INFO:_ (${new Date().toISOString()}): Received response JSON from OPEN AI`
    );

    recognition.stop();
    console.log("INFO:_音声認識をSTOP");

    changeElementStatus("response");
    const chatGptResponse = data.choices[0].message.content;
    chatGptResponseElement.textContent = chatGptResponse;
    console.log("INFO:_GPTの返答をテキストに書き出し中...");

    setFlag("isMessageSentFlag");
    console.log(`INFO:_GPTの返答------->${chatGptResponse}`);
    // eslint-disable-next-line consistent-return
    return chatGptResponse;
  } catch (error) {
    console.error(`ERROR:_ChatGPTへメッセージ送信中にエラー: ${error}`);
    changeElementStatus("error", error);
    throw error;
  }
}

function synthSpeak(message) {
  if (flags.isSpeechSynthesizedFlag) {
    console.log("ERROR:_読み上げ処理中にエラー発生: ブラウザを更新して下さい");
    alert("ERROR:_読み上げ処理中にエラー発生: ブラウザを更新して下さい");
    return;
  }
  try {
    // eslint-disable-next-line consistent-return
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = "ja-JP";

      utterance.onend = () => {
        console.log("INFO:_音声合成が終了");
        resolve();
      };
      utterance.onerror = (event) => {
        console.log(`ERROR:_音声合成処理中にエラー発生: ${event.error}`);
        reject(event.error);
      };

      window.speechSynthesis.speak(utterance);
    });
  } catch (error) {
    console.error(`ERROR:_音声合成処理中にエラー発生: ${error}`);
    changeElementStatus("error", error);
    throw error;
  }
}

// メイン関数
startRecordingButton.addEventListener("click", async () => {
  resetFlags();
  console.log("INFO:_音声認識を開始");
  try {
    const message = await startSpeechRecognitionAsync();
    setFlag("isSpeechRecognizedAndWrittenFlag");

    const chatGptResponse = await sendMessageAsync(message);
    setFlag("isMessageSentFlag"); // 送信完了フラグをtrue

    await synthSpeak(chatGptResponse);
    changeElementStatus("stop");
    setFlag("isSpeechSynthesizeFlag"); // 読み上げ完了フラグをtrue
  } catch (error) {
    console.error(`ERROR:_メイン関数の処理でエラー: ${error}`);
    changeElementStatus("error", error);
  }
});

// 音声認識の停止ボタン
stopRecordingButton.addEventListener("click", () => {
  console.log("INFO:_音声認識を停止");
  recognition.stop();
  speechSynthesis.cancel();
  changeElementStatus("stop");
  setFlag("isSpeechSynthesizedFlag");
});
