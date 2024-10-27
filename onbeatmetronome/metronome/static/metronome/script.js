let isPlaying = false;
let bpm = 60; // Default BPM
let audioContext;
let analyser;
let microphone;
let isAnalyzing = false;
let lastBeatTime = 0; // Timestamp of the last detected beat
const beatInterval = 60000 / bpm; // Time between beats based on BPM
const amplitudeThreshold = 0.02; // Threshold to detect a beat
const flashingCircle = document.getElementById("flashing-circle");
const bpmDisplay = document.getElementById("bpm-display");
const bpmSlider = document.getElementById("bpm-slider");
const startStopButton = document.getElementById("start-stop-button");

// Update BPM display when the slider is moved
bpmSlider.addEventListener("input", () => {
    bpm = bpmSlider.value; // Get value from slider
    bpmDisplay.textContent = bpm; // Update the displayed BPM
    if (isPlaying) {
        clearInterval(interval); // Clear existing interval
        startFlashing(); // Restart flashing with new BPM
    }
});

// Start/Stop button event listener
startStopButton.addEventListener("click", async () => {
    if (isPlaying) {
        stopFlashing(); // Stop if already playing
    } else {
        startFlashing(); // Start flashing if not playing
        await startMicrophoneAnalysis(); // Start analyzing the microphone input
    }
});

// This function will manage the flashing behavior
let interval;
function startFlashing() {
    isPlaying = true;
    startStopButton.textContent = "Stop"; // Change button text
    flashingCircle.style.backgroundColor = "red"; // Set default color to red
    interval = setInterval(() => {
        flashingCircle.classList.toggle("active"); // Toggle active class for flashing
        flashingCircle.style.backgroundColor = flashingCircle.classList.contains("active") ? "red" : "white"; // Flash between red and white
    }, (60000 / bpm) / 2); // Calculate interval time based on BPM
}

async function startMicrophoneAnalysis() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    microphone = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = audioContext.createMediaStreamSource(microphone);
    analyser = audioContext.createAnalyser();
    source.connect(analyser);

    isAnalyzing = true;
    analyzeAudio(); // Start analyzing the audio
}

function analyzeAudio() {
    if (!isAnalyzing) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    analyser.getByteTimeDomainData(dataArray);

    // Perform beat detection here
    detectBeats(dataArray); // Call your beat detection logic

    requestAnimationFrame(analyzeAudio); // Repeat the analysis
}

function detectBeats(dataArray) {
    // Find the maximum amplitude in the current frame
    let maxAmplitude = 0;

    for (let i = 0; i < dataArray.length; i++) {
        const amplitude = (dataArray[i] - 128) / 128; // Normalize amplitude
        if (Math.abs(amplitude) > maxAmplitude) {
            maxAmplitude = Math.abs(amplitude);
        }
    }

    // Check if the maximum amplitude exceeds the threshold
    const currentTime = audioContext.currentTime * 1000; // Convert to milliseconds
    if (maxAmplitude > amplitudeThreshold) {
        // Check if enough time has passed since the last detected beat
        if (currentTime - lastBeatTime > beatInterval) {
            lastBeatTime = currentTime; // Update last beat time
            flashingCircle.style.backgroundColor = "green"; // Set to green for a detected beat
        } else {
            flashingCircle.style.backgroundColor = "yellow"; // Set to yellow if near the beat
        }
    }
}

function stopFlashing() {
    isPlaying = false;
    isAnalyzing = false; // Stop analyzing audio
    startStopButton.textContent = "Start"; // Reset button text
    clearInterval(interval); // Stop flashing
    flashingCircle.classList.remove("active"); // Ensure circle is not active
    flashingCircle.style.backgroundColor = "red"; // Reset to red when stopped
    audioContext.close(); // Close the audio context
}
