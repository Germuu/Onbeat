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

const clickSound = new Audio('/static/metronome/click.mp3'); // Adjust the path if necessary

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

        // Play click sound on beat
        playClickSound();
    }, (60000 / bpm) / 2); // Calculate interval time based on BPM
}

async function startMicrophoneAnalysis() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        microphone = await navigator.mediaDevices.getUserMedia({ audio: true });
        const source = audioContext.createMediaStreamSource(microphone);
        analyser = audioContext.createAnalyser();
        
        // Create a GainNode for amplification (optional)
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 1; // You can adjust this value if needed
        
        source.connect(gainNode);
        gainNode.connect(analyser);

        isAnalyzing = true;
        analyzeAudio(); // Start analyzing the audio
    } catch (error) {
        console.error('Error accessing the microphone:', error);
        alert('Could not access the microphone. Please check your settings.');
    }
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

const beatWindow = 100; // 100 ms window for detecting near beats
let expectedBeatTime = 0; // Expected time for the next beat based on BPM

function detectBeats(dataArray) {
    let maxAmplitude = 0;

    for (let i = 0; i < dataArray.length; i++) {
        const amplitude = (dataArray[i] - 128) / 128; // Normalize amplitude
        if (Math.abs(amplitude) > maxAmplitude) {
            maxAmplitude = Math.abs(amplitude);
        }
    }

    const currentTime = audioContext.currentTime * 1000; // Convert to milliseconds

    // Calculate the next expected beat time
    expectedBeatTime += beatInterval; // Update for the next expected beat based on current BPM

    // Check if the maximum amplitude exceeds the threshold
    if (maxAmplitude > amplitudeThreshold) {
        // Check if clap is on beat
        if (Math.abs(currentTime - expectedBeatTime) < beatWindow) {
            // Clap is on beat
            flashingCircle.style.backgroundColor = "green"; // Set to green for a detected beat
            playClickSound(); // Play click sound on beat detection
        } else if (Math.abs(currentTime - expectedBeatTime) < beatWindow + 50) {
            // Clap is almost on beat (within 50 ms of the expected beat)
            flashingCircle.style.backgroundColor = "yellow"; // Set to yellow if near the beat
        } else {
            // Off beat, you can set it back to default or do nothing
            flashingCircle.style.backgroundColor = "red"; // Or keep it the default color
        }
    }
}

function playClickSound() {
    clickSound.currentTime = 0; // Reset sound to start
    clickSound.play(); // Play the click sound
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
