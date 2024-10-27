let isAnalyzing = false;
let audioContext;
let analyser;
let microphone;

// Start/Stop button event listener
startStopButton.addEventListener("click", async () => {
    if (isPlaying) {
        stopFlashing(); // Stop if already playing
    } else {
        startFlashing(); // Start flashing if not playing
        await startMicrophoneAnalysis(); // Start analyzing the microphone input
    }
});

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
    detectBeats(dataArray); // Implement this function based on your needs

    requestAnimationFrame(analyzeAudio); // Repeat the analysis
}

function detectBeats(dataArray) {
    // Simple beat detection logic (this is just a placeholder)
    // Analyze the audio data in `dataArray` to detect beats

    // You could check for peaks in the dataArray that match your BPM
    // This logic will require fine-tuning

    // Example: If you detect a beat, you can compare it with the metronome BPM
    // if (detectedBeat) {
    //     compareTempo(currentBPM); // Implement this function to compare with metronome
    // }
}

function stopFlashing() {
    isPlaying = false;
    isAnalyzing = false; // Stop analyzing audio
    startStopButton.textContent = "Start"; // Reset button text
    clearInterval(interval); // Stop flashing
    flashingCircle.classList.remove("active"); // Ensure circle is not active
    audioContext.close(); // Close the audio context
}
