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
        playClickSound(); // Play click sound on metronome beat
    }, (60000 / bpm)); // Calculate interval time based on BPM
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
    detectBeats(dataArray); // Call your beat detection logic

    requestAnimationFrame(analyzeAudio); // Repeat the analysis
}

// Set the default color of the accuracy indicator to white at the start
accuracyIndicator.style.backgroundColor = "white"; // Default color

// Base window size in milliseconds for a reference BPM (e.g., 60 BPM)
const baseBeatWindow = 150; // Window size for 60 BPM
const referenceBPM = 60; // Reference BPM
let lastBeatTime = 0; // Timestamp of the last click sound played
let expectedBeatTime1 = 0; // Expected time for the last beat based on BPM
let expectedBeatTime2 = 0; // Expected time for the second last beat based on BPM

function calculateDynamicBeatWindow(bpm) {
    // Calculate the dynamic beat window based on the current BPM
    return baseBeatWindow * (bpm / referenceBPM);
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

    // Check if the maximum amplitude exceeds the threshold
    if (maxAmplitude > 0.045) { // Set a threshold to avoid false positives
        // Set the accuracy indicator to show color only after the first detection
        if (accuracyIndicator.style.backgroundColor === "white") {
            accuracyIndicator.style.backgroundColor = "transparent"; // Hide the color initially
        }

        // Calculate the average of the last two expected beat times
        const averageExpectedBeatTime = (expectedBeatTime1 + expectedBeatTime2) / 2;

        // Check if user input aligns with the expected beat
        if (Math.abs(currentTime - expectedBeatTime1) < dynamicBeatWindow) {
            // On beat detected (within the dynamic beat window)
            accuracyIndicator.style.backgroundColor = "green"; // Set accuracy to green
        } else if (Math.abs(currentTime - expectedBeatTime1) < dynamicBeatWindow + 50) {
            // Almost on beat (within a slightly wider range)
            accuracyIndicator.style.backgroundColor = "yellow"; // Set accuracy to yellow
        } else if (currentTime < expectedBeatTime1) {
            // Early input (before the expected beat time)
            accuracyIndicator.style.backgroundColor = "red"; // Set accuracy to red for early input
        } else {
            // Off beat, set accuracy to red (this includes late inputs)
            accuracyIndicator.style.backgroundColor = "red"; // Off beat
        }
    }
}


function playClickSound() {
    clickSound.currentTime = 0; // Reset sound to start
    clickSound.play(); // Play the click sound
    // Update expected beat times for the next beats
    expectedBeatTime2 = expectedBeatTime1; // Store the last expected beat time
    expectedBeatTime1 += 60000 / bpm; // Update expected time for the next beat based on current BPM
}

function stopFlashing() {
    isPlaying = false;
    isAnalyzing = false; // Stop analyzing audio
    startStopButton.textContent = "Start"; // Reset button text
    clearInterval(interval); // Stop flashing
    flashingCircle.classList.remove("active"); // Ensure circle is not active
    flashingCircle.style.backgroundColor = "red"; // Reset to red when stopped
    accuracyIndicator.style.backgroundColor = "white"; // Reset accuracy indicator
    audioContext.close(); // Close the audio context
}
