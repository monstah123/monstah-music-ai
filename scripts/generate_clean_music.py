import math
import struct
import wave
import subprocess
import os

SAMPLE_RATE = 44100

def note_to_freq(note_name):
    # Note to frequency mapping
    notes = {
        'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
        'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
        'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00,
    }
    return notes.get(note_name, 440.0)

def synth_note(freq, duration, sample_rate=44100, instrument='piano'):
    num_samples = int(duration * sample_rate)
    samples = []
    
    for i in range(num_samples):
        t = i / sample_rate
        
        # ADSR Envelope
        attack = 0.05
        decay = 0.2
        sustain_level = 0.6
        release = 0.2
        
        if t < attack:
            env = t / attack
        elif t < attack + decay:
            env = 1.0 - (1.0 - sustain_level) * ((t - attack) / decay)
        elif t < duration - release:
            env = sustain_level
        else:
            env = sustain_level * (1.0 - (t - (duration - release)) / release)
        env = max(0.0, env)
        
        # Instrument Harmonics
        if instrument == 'piano':
            val = (math.sin(2 * math.pi * freq * t) * 0.6 +
                   math.sin(2 * math.pi * freq * 2 * t) * 0.25 +
                   math.sin(2 * math.pi * freq * 3 * t) * 0.1 +
                   math.sin(2 * math.pi * freq * 4 * t) * 0.05)
        elif instrument == 'synth':
            val = (math.sin(2 * math.pi * freq * t) * 0.5 +
                   math.sin(2 * math.pi * freq * 1.005 * t) * 0.3 +
                   math.sin(2 * math.pi * freq * 0.995 * t) * 0.2)
        elif instrument == 'vocal':
            vibrato = 1.0 + 0.008 * math.sin(2 * math.pi * 5.5 * t)
            f = freq * vibrato
            # Formant simulation (vowel sound 'Ah')
            val = (math.sin(2 * math.pi * f * t) * 0.5 +
                   math.sin(2 * math.pi * f * 2 * t) * 0.3 +
                   math.sin(2 * math.pi * f * 3 * t) * 0.15 +
                   math.sin(2 * math.pi * f * 4 * t) * 0.05)
        elif instrument == 'strings':
            val = (math.sin(2 * math.pi * freq * t) * 0.4 +
                   math.sin(2 * math.pi * freq * 2 * t) * 0.3 +
                   math.sin(2 * math.pi * freq * 3 * t) * 0.2 +
                   math.sin(2 * math.pi * freq * 5 * t) * 0.1)
        else: # bass
            val = math.sin(2 * math.pi * freq * t) * 0.8 + math.sin(2 * math.pi * freq * 2 * t) * 0.2
            
        samples.append(val * env)
    return samples

def build_track(progression, duration_sec=20, instrument='piano', include_drums=True):
    total_samples = int(duration_sec * SAMPLE_RATE)
    audio = [0.0] * total_samples
    
    chord_duration = 2.5 # seconds per chord
    num_chords = len(progression)
    
    # 1. Add Chords & Bassline
    t_cursor = 0.0
    while t_cursor < duration_sec:
        chord_idx = int((t_cursor / chord_duration) % num_chords)
        chord_notes = progression[chord_idx]
        
        # Chord notes
        for note in chord_notes:
            freq = note_to_freq(note)
            note_samples = synth_note(freq, chord_duration, SAMPLE_RATE, instrument=instrument)
            start_sample = int(t_cursor * SAMPLE_RATE)
            for i, s in enumerate(note_samples):
                if start_sample + i < total_samples:
                    audio[start_sample + i] += s * 0.22
                    
        # Bass note (first note of chord, 1 octave down)
        bass_note = chord_notes[0]
        bass_freq = note_to_freq(bass_note) / 2.0
        bass_samples = synth_note(bass_freq, chord_duration, SAMPLE_RATE, instrument='bass')
        start_sample = int(t_cursor * SAMPLE_RATE)
        for i, s in enumerate(bass_samples):
            if start_sample + i < total_samples:
                audio[start_sample + i] += s * 0.35
                
        t_cursor += chord_duration

    # 2. Add Drum Beat (Kick on beat 1 & 3, Snare on beat 2 & 4, HiHat on eighth notes)
    if include_drums:
        bpm = 110
        beat_duration = 60.0 / bpm
        t = 0.0
        beat_count = 0
        while t < duration_sec:
            sample_pos = int(t * SAMPLE_RATE)
            # Kick drum (low frequency sweep)
            if beat_count % 2 == 0:
                kick_len = int(0.12 * SAMPLE_RATE)
                for i in range(kick_len):
                    if sample_pos + i < total_samples:
                        t_k = i / SAMPLE_RATE
                        freq_k = 120.0 * math.exp(-30 * t_k) + 40.0
                        env_k = max(0.0, 1.0 - t_k / 0.12)
                        audio[sample_pos + i] += math.sin(2 * math.pi * freq_k * t_k) * 0.45 * env_k
                        
            # Snare drum (noise burst + tone)
            if beat_count % 2 == 1:
                snare_len = int(0.15 * SAMPLE_RATE)
                for i in range(snare_len):
                    if sample_pos + i < total_samples:
                        t_s = i / SAMPLE_RATE
                        env_s = max(0.0, 1.0 - t_s / 0.15)
                        noise = ((i * 1103515245 + 12345) & 0x7FFFFFFF) / 0x7FFFFFFF * 2.0 - 1.0
                        audio[sample_pos + i] += (noise * 0.3 + math.sin(2 * math.pi * 180 * t_s) * 0.2) * env_s
                        
            beat_count += 1
            t += beat_duration / 2.0

    # Normalize audio
    max_val = max(abs(x) for x in audio) or 1.0
    if max_val > 0.95:
        audio = [x / max_val * 0.9 for x in audio]
        
    return audio

def build_vocal_track(melody_notes, duration_sec=20):
    total_samples = int(duration_sec * SAMPLE_RATE)
    audio = [0.0] * total_samples
    
    note_duration = 1.25 # seconds per vocal phrase note
    t_cursor = 0.0
    idx = 0
    while t_cursor < duration_sec:
        note_name = melody_notes[idx % len(melody_notes)]
        freq = note_to_freq(note_name)
        samples = synth_note(freq, note_duration * 0.9, SAMPLE_RATE, instrument='vocal')
        
        start_sample = int(t_cursor * SAMPLE_RATE)
        for i, s in enumerate(samples):
            if start_sample + i < total_samples:
                audio[start_sample + i] += s * 0.5
                
        t_cursor += note_duration
        idx += 1

    max_val = max(abs(x) for x in audio) or 1.0
    if max_val > 0.95:
        audio = [x / max_val * 0.85 for x in audio]
        
    return audio

def write_wav(filename, audio_samples):
    with wave.open(filename, 'w') as wav_file:
        wav_file.setnchannels(1) # Mono
        wav_file.setsampwidth(2) # 16-bit
        wav_file.setframerate(SAMPLE_RATE)
        
        packed = bytearray()
        for s in audio_samples:
            val = int(s * 32767.0)
            val = max(-32768, min(32767, val))
            packed.extend(struct.pack('<h', val))
        wav_file.writeframes(packed)

def convert_to_mp3(wav_path, mp3_path):
    subprocess.run(['ffmpeg', '-y', '-i', wav_path, '-c:a', 'mp3', '-b:a', '192k', mp3_path], check=True)
    os.remove(wav_path)

os.makedirs('public/demo-audio', exist_ok=True)
os.makedirs('tmp_audio', exist_ok=True)

print("Synthesizing clean music tracks...")

# 1. Synthwave
p1 = [['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'], ['G3', 'B3', 'D4'], ['E3', 'G3', 'B3']]
audio1 = build_track(p1, duration_sec=22, instrument='synth', include_drums=True)
write_wav('tmp_audio/synthwave.wav', audio1)
convert_to_mp3('tmp_audio/synthwave.wav', 'public/demo-audio/synthwave.mp3')

# 2. Lo-Fi Chill
p2 = [['C4', 'E4', 'G4', 'B4'], ['A3', 'C4', 'E4', 'G4'], ['D4', 'F4', 'A4', 'C5'], ['G3', 'B3', 'D4', 'F4']]
audio2 = build_track(p2, duration_sec=22, instrument='piano', include_drums=True)
write_wav('tmp_audio/lofi.wav', audio2)
convert_to_mp3('tmp_audio/lofi.wav', 'public/demo-audio/lofi.mp3')

# 3. EDM Drop
p3 = [['C3', 'G3', 'C4'], ['G3', 'D4', 'G4'], ['A3', 'E4', 'A4'], ['F3', 'C4', 'F4']]
audio3 = build_track(p3, duration_sec=22, instrument='synth', include_drums=True)
write_wav('tmp_audio/edm.wav', audio3)
convert_to_mp3('tmp_audio/edm.wav', 'public/demo-audio/edm.mp3')

# 4. Jazz Lounge
p4 = [['D4', 'F4', 'A4', 'C5'], ['G3', 'B3', 'D4', 'F4'], ['C4', 'E4', 'G4', 'B4'], ['A3', 'C4', 'E4', 'G4']]
audio4 = build_track(p4, duration_sec=22, instrument='piano', include_drums=True)
write_wav('tmp_audio/jazz.wav', audio4)
convert_to_mp3('tmp_audio/jazz.wav', 'public/demo-audio/jazz.mp3')

# 5. Indie Pop
p5 = [['G3', 'B3', 'D4'], ['D4', 'F4', 'A4'], ['E4', 'G4', 'B4'], ['C4', 'E4', 'G4']]
audio5 = build_track(p5, duration_sec=22, instrument='synth', include_drums=True)
write_wav('tmp_audio/indie.wav', audio5)
convert_to_mp3('tmp_audio/indie.wav', 'public/demo-audio/indie.mp3')

# 6. Orchestral
p6 = [['C4', 'E4', 'G4'], ['G3', 'B3', 'D4'], ['A3', 'C4', 'E4'], ['F3', 'A3', 'C4']]
audio6 = build_track(p6, duration_sec=22, instrument='strings', include_drums=False)
write_wav('tmp_audio/orchestral.wav', audio6)
convert_to_mp3('tmp_audio/orchestral.wav', 'public/demo-audio/orchestral.mp3')

# 7. AI Male Vocal
m_male = ['E4', 'G4', 'A4', 'G4', 'C5', 'B4', 'A4', 'G4']
v_male = build_vocal_track(m_male, duration_sec=22)
write_wav('tmp_audio/vocal_male.wav', v_male)
convert_to_mp3('tmp_audio/vocal_male.wav', 'public/demo-audio/vocal_male.mp3')

# 8. AI Female Vocal
m_female = ['G4', 'C5', 'D5', 'E5', 'D5', 'C5', 'B4', 'C5']
v_female = build_vocal_track(m_female, duration_sec=22)
write_wav('tmp_audio/vocal_female.wav', v_female)
convert_to_mp3('tmp_audio/vocal_female.wav', 'public/demo-audio/vocal_female.mp3')

os.rmdir('tmp_audio')
print("All clean musical demo tracks generated successfully!")
