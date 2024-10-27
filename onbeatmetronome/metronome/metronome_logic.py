import time

def start_metronome(bpm):
    interval = 60 / bpm  # time interval in seconds for each beat
    while True:
        print("Beat")  # Replace with actual beat handling logic
        time.sleep(interval)

start_metronome(60)