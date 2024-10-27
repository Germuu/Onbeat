let isPlaying = false;
let bpm = 60; // Default BPM
let audioContext;
let analyser;
let microphone;
let isAnalyzing = false;
const flashingCircle = document.getElementById("flashing-circle");
const accuracyIndicator = document.getElementById("accuracy-indicator"); // Accuracy indicator element
const bpmDisplay = document.getElementById("bpm-display");
const bpmSlider = document.getElementById("bpm-slider");
const startStopButton = document.getElementById("start-stop-button");

const clickSound = new Audio('/static/metronome/click.mp3'); // Adjust the path if necessary

// Update BPM display and recalculate expected beat time when the slider is moved
bpmSlider.addEventListener("input", () => {
    bpm = bpmSlider.value; // Get value from slider
    bpmDisplay.textContent = bpm; // Update the displayed BPM
    if (isPlaying) {
        clearInterval(interval); // Clear existing interval
        startFlashing(); // Restart flashing with new BPM
        updateExpectedBeatTime(); // Recalculate expected beat times
    }
});

// Start/Stop button event listener
startStopButton.addEventListener("click", async () => {
    if (isPlaying) {
        stopFlashing(); // Stop if already playing
    } else {
        await initializeAudio(); // Initialize audio components if necessary
        startFlashing(); // Start flashing if not playing
    }
});

// Function to initialize audio components if needed
async function initializeAudio() {
    if (!audioContext || audioContext.state === 'closed') {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        await audioContext.resume(); // Resume if suspended
    }
    if (!microphone) {
        await startMicrophoneAnalysis();
    }
}



// Start flashing function using requestAnimationFrame for improved timing
let lastFlashTime = 0;
function startFlashing() {
    isPlaying = true;
    startStopButton.textContent = "Stop";
    flashingCircle.style.backgroundColor = "red";

    function flash() {
        const currentTime = audioContext.currentTime * 1000;
        if (currentTime - lastFlashTime >= (60000 / bpm)) {
            lastFlashTime = currentTime;
            flashingCircle.classList.toggle("active");
            flashingCircle.style.backgroundColor = flashingCircle.classList.contains("active") ? "red" : "white";
            playClickSound();
        }
        if (isPlaying) requestAnimationFrame(flash);
    }

    requestAnimationFrame(flash);
}

async function startMicrophoneAnalysis() {
    try {
        const source = audioContext.createMediaStreamSource(await navigator.mediaDevices.getUserMedia({ audio: true }));
        analyser = audioContext.createAnalyser();
        
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
    detectBeats(dataArray); // Call your beat detection logic

    requestAnimationFrame(analyzeAudio); // Repeat the analysis
}

// Set the default color of the accuracy indicator to white at the start
accuracyIndicator.style.backgroundColor = "white"; // Default color

let lastBeatTime = 0; // Timestamp of the last click sound played
let expectedBeatTime1 = 0; // Expected time for the last beat based on BPM
let expectedBeatTime2 = 0; // Expected time for the second last beat based on BPM

// Function to calculate dynamic beat window
const baseBeatWindow = (60000 / 60) / 3; // Half the interval for 60 BPM, so 500 ms
const referenceBPM = 60; // Reference BPM

function calculateDynamicBeatWindow(bpm) {
    return baseBeatWindow * (referenceBPM / bpm);
}

// Function to update expected beat time whenever BPM changes
function updateExpectedBeatTime() {
    expectedBeatTime1 = audioContext.currentTime * 1000 + (60000 / bpm); // Start time plus interval
    expectedBeatTime2 = expectedBeatTime1 - (60000 / bpm); // Set expected time for two beats ago
}

function detectBeats(dataArray) {
    let maxAmplitude = 0;

    for (let i = 0; i < dataArray.length; i++) {
        const amplitude = (dataArray[i] - 128) / 128; // Normalize amplitude
        if (Math.abs(amplitude) > maxAmplitude) {
            maxAmplitude = Math.abs(amplitude);
        }
    }

    const currentTime = audioContext.currentTime * 1000; // Convert to milliseconds
    const dynamicBeatWindow = calculateDynamicBeatWindow(bpm); // Calculate the current dynamic beat window
    const halfBeatWindow = (60000 / bpm) / 2; // Set half-beat window

    // Check if the maximum amplitude exceeds the threshold
    if (maxAmplitude > 0.045) { // Set a threshold to avoid false positives
        if (accuracyIndicator.style.backgroundColor === "white") {
            accuracyIndicator.style.backgroundColor = "transparent"; // Hide the color initially
        }

        // Determine if input is within full beat or off-beat intervals
        if (Math.abs(currentTime - expectedBeatTime1) > dynamicBeatWindow) {
            accuracyIndicator.style.backgroundColor = "green"; // Perfectly on beat
        } else if (Math.abs(currentTime - expectedBeatTime1) > dynamicBeatWindow + 50) {
            accuracyIndicator.style.backgroundColor = "yellow"; // Almost on beat
        } else if (Math.abs(currentTime - expectedBeatTime1) < halfBeatWindow) {
            accuracyIndicator.style.backgroundColor = "red"; // Off beat, within silence window
        } else {
            accuracyIndicator.style.backgroundColor = "red"; // Early or late
        }
    }
}

function playClickSound() {
    clickSound.currentTime = 0;
    clickSound.play();
    updateExpectedBeatTime(); // Update expected beat times for the next beat
}

function stopFlashing() {
    isPlaying = false;
    isAnalyzing = false; // Stop analyzing audio
    startStopButton.textContent = "Start";
    flashingCircle.classList.remove("active");
    flashingCircle.style.backgroundColor = "red";
    accuracyIndicator.style.backgroundColor = "white";
    // Note: audioContext.close() is removed to allow restart after stopping
}
