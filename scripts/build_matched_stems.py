import math
import struct
import wave
import subprocess
import os

SAMPLE_RATE = 44100

NOTE_FREQS = {
    'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
    'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
    'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00,
}

def get_freq(note):
    return NOTE_FREQS.get(note, 440.0)

def synth_instrument_sample(freq, t, inst_type='synth'):
    if inst_type == 'synth':
        # Rich warm analog synth pad with sub-bass
        val = (0.5 * math.sin(2 * math.pi * freq * t) +
               0.25 * math.sin(2 * math.pi * freq * 2 * t) +
               0.15 * math.sin(2 * math.pi * freq * 3 * t) +
               0.1 * math.sin(2 * math.pi * (freq / 2.0) * t))
    elif inst_type == 'piano':
        # Warm electric piano
        val = (0.6 * math.sin(2 * math.pi * freq * t) +
               0.2 * math.sin(2 * math.pi * freq * 2.002 * t) +
               0.1 * math.sin(2 * math.pi * freq * 3 * t))
    elif inst_type == 'guitar':
        # Soft acoustic guitar harmonic
        val = (0.5 * math.sin(2 * math.pi * freq * t) +
               0.3 * math.sin(2 * math.pi * freq * 2 * t) +
               0.15 * math.sin(2 * math.pi * freq * 4 * t))
    else: # bass
        val = 0.8 * math.sin(2 * math.pi * freq * t) + 0.2 * math.sin(2 * math.pi * freq * 2 * t)
    return val

def synth_vocal_sample(freq, t, vowel='ah'):
    # Singing vocal synthesis using formant harmonics & subtle natural vibrato
    vibrato = 1.0 + 0.006 * math.sin(2 * math.pi * 5.2 * t)
    f = freq * vibrato
    
    if vowel == 'ah':
        # Formant resonances for 'Ah' (F1 ~ 700Hz, F2 ~ 1200Hz)
        val = (0.5 * math.sin(2 * math.pi * f * t) +
               0.35 * math.sin(2 * math.pi * f * 2 * t) +
               0.2 * math.sin(2 * math.pi * f * 3 * t) +
               0.08 * math.sin(2 * math.pi * f * 4 * t))
    elif vowel == 'oo':
        # Formant resonances for 'Oo' (F1 ~ 300Hz, F2 ~ 800Hz)
        val = (0.7 * math.sin(2 * math.pi * f * t) +
               0.2 * math.sin(2 * math.pi * f * 2 * t) +
               0.05 * math.sin(2 * math.pi * f * 3 * t))
    else: # 'ee'
        val = (0.4 * math.sin(2 * math.pi * f * t) +
               0.4 * math.sin(2 * math.pi * f * 3 * t) +
               0.15 * math.sin(2 * math.pi * f * 4 * t))
    return val

def generate_song_pair(chords_list, vocal_melody, bpm=110, inst_type='synth', vowel='ah', duration_sec=24):
    total_samples = int(duration_sec * SAMPLE_RATE)
    inst_audio = [0.0] * total_samples
    vocal_audio = [0.0] * total_samples
    
    beat_sec = 60.0 / bpm
    bar_sec = beat_sec * 4
    num_chords = len(chords_list)
    
    # 1. Synthesize Instrumental Stem (Chords + Bass + Rhythm Beat)
    t_cursor = 0.0
    bar_count = 0
    while t_cursor < duration_sec:
        chord = chords_list[bar_count % num_chords]
        start_idx = int(t_cursor * SAMPLE_RATE)
        end_idx = min(total_samples, int((t_cursor + bar_sec) * SAMPLE_RATE))
        
        # Chord tones
        for note in chord:
            freq = get_freq(note)
            for i in range(start_idx, end_idx):
                t = i / SAMPLE_RATE
                # Smooth bar envelope
                rel_t = (i - start_idx) / (end_idx - start_idx)
                env = math.sin(math.pi * rel_t) ** 0.5
                inst_audio[i] += synth_instrument_sample(freq, t, inst_type) * 0.18 * env
                
        # Sub-bass tone (root note 1 octave down)
        bass_freq = get_freq(chord[0]) / 2.0
        for i in range(start_idx, end_idx):
            t = i / SAMPLE_RATE
            rel_t = (i - start_idx) / (end_idx - start_idx)
            env = math.sin(math.pi * rel_t) ** 0.5
            inst_audio[i] += synth_instrument_sample(bass_freq, t, 'bass') * 0.3 * env
            
        t_cursor += bar_sec
        bar_count += 1

    # Add Rhythm Beat to Instrumental
    t_beat = 0.0
    b_step = 0
    while t_beat < duration_sec:
        pos = int(t_beat * SAMPLE_RATE)
        # Kick drum on beat 1 and 3
        if b_step % 4 == 0 or b_step % 4 == 2:
            k_samples = int(0.1 * SAMPLE_RATE)
            for i in range(k_samples):
                if pos + i < total_samples:
                    t_k = i / SAMPLE_RATE
                    freq_k = 100.0 * math.exp(-35 * t_k) + 35.0
                    env_k = max(0.0, 1.0 - t_k / 0.1)
                    inst_audio[pos + i] += math.sin(2 * math.pi * freq_k * t_k) * 0.4 * env_k
                    
        # Snare drum on beat 2 and 4
        if b_step % 4 == 1 or b_step % 4 == 3:
            s_samples = int(0.12 * SAMPLE_RATE)
            for i in range(s_samples):
                if pos + i < total_samples:
                    t_s = i / SAMPLE_RATE
                    env_s = max(0.0, 1.0 - t_s / 0.12)
                    noise = (((i * 1664525 + 1013904223) & 0xFFFFFFFF) / 0xFFFFFFFF) * 2.0 - 1.0
                    inst_audio[pos + i] += (noise * 0.22 + math.sin(2 * math.pi * 160 * t_s) * 0.15) * env_s
                    
        b_step += 1
        t_beat += beat_sec

    # 2. Synthesize Vocal Stem (Target Pitch Melody in THE EXACT SAME KEY and BPM Grid!)
    note_dur = beat_sec * 2 # 2 beats per vocal note
    t_vocal = 0.0
    v_idx = 0
    while t_vocal < duration_sec:
        note = vocal_melody[v_idx % len(vocal_melody)]
        if note != 'REST':
            freq = get_freq(note)
            v_start = int(t_vocal * SAMPLE_RATE)
            v_end = min(total_samples, int((t_vocal + note_dur * 0.9) * SAMPLE_RATE))
            
            for i in range(v_start, v_end):
                t = i / SAMPLE_RATE
                rel_t = (i - v_start) / max(1, (v_end - v_start))
                # Smooth vocal attack & release
                if rel_t < 0.1:
                    env = rel_t / 0.1
                elif rel_t > 0.8:
                    env = (1.0 - rel_t) / 0.2
                else:
                    env = 1.0
                env = max(0.0, env)
                vocal_audio[i] += synth_vocal_sample(freq, t, vowel) * 0.45 * env
                
        t_vocal += note_dur
        v_idx += 1

    # Normalize audio levels
    max_inst = max(abs(x) for x in inst_audio) or 1.0
    inst_audio = [x / max_inst * 0.85 for x in inst_audio]
    
    max_voc = max(abs(x) for x in vocal_audio) or 1.0
    vocal_audio = [x / max_voc * 0.80 for x in vocal_audio]

    return inst_audio, vocal_audio

def write_wav(filename, samples):
    with wave.open(filename, 'w') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(SAMPLE_RATE)
        buf = bytearray()
        for s in samples:
            val = int(s * 32767.0)
            val = max(-32768, min(32767, val))
            buf.extend(struct.pack('<h', val))
        f.writeframes(buf)

def convert_wav_to_mp3(wav_file, mp3_file):
    subprocess.run(['ffmpeg', '-y', '-i', wav_file, '-c:a', 'mp3', '-b:a', '192k', mp3_file], check=True)
    os.remove(wav_file)

os.makedirs('public/demo-audio', exist_ok=True)
os.makedirs('tmp_stems', exist_ok=True)

print("Synthesizing key-matched instrumental and vocal stem pairs...")

# 1. Synthwave (Key: A Minor, 115 BPM)
chords_synthwave = [['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'], ['G3', 'B3', 'D4'], ['E3', 'G3', 'B3']]
vocal_synthwave = ['E4', 'A4', 'C5', 'B4', 'A4', 'G4', 'F4', 'E4']
inst1, voc1 = generate_song_pair(chords_synthwave, vocal_synthwave, bpm=115, inst_type='synth', vowel='ah')
write_wav('tmp_stems/synthwave_m.wav', inst1)
write_wav('tmp_stems/synthwave_v.wav', voc1)
convert_wav_to_mp3('tmp_stems/synthwave_m.wav', 'public/demo-audio/synthwave.mp3')
convert_wav_to_mp3('tmp_stems/synthwave_v.wav', 'public/demo-audio/vocal_male.mp3')

# 2. Lo-Fi Chill (Key: C Major 7, 85 BPM)
chords_lofi = [['C4', 'E4', 'G4', 'B4'], ['A3', 'C4', 'E4', 'G4'], ['F3', 'A3', 'C4', 'E4'], ['G3', 'B3', 'D4', 'F4']]
vocal_lofi = ['G4', 'E4', 'C4', 'D4', 'E4', 'G4', 'A4', 'G4']
inst2, voc2 = generate_song_pair(chords_lofi, vocal_lofi, bpm=85, inst_type='piano', vowel='oo')
write_wav('tmp_stems/lofi_m.wav', inst2)
write_wav('tmp_stems/lofi_v.wav', voc2)
convert_wav_to_mp3('tmp_stems/lofi_m.wav', 'public/demo-audio/lofi.mp3')
convert_wav_to_mp3('tmp_stems/lofi_v.wav', 'public/demo-audio/vocal_female.mp3')

# 3. EDM Drop (Key: E Minor, 128 BPM)
chords_edm = [['E3', 'G3', 'B3'], ['C3', 'E3', 'G3'], ['D3', 'F3', 'A3'], ['B3', 'D4', 'F4']]
vocal_edm = ['E4', 'G4', 'B4', 'A4', 'G4', 'F4', 'E4', 'B4']
inst3, voc3 = generate_song_pair(chords_edm, vocal_edm, bpm=128, inst_type='synth', vowel='ah')
write_wav('tmp_stems/edm_m.wav', inst3)
write_wav('tmp_stems/edm_v.wav', voc3)
convert_wav_to_mp3('tmp_stems/edm_m.wav', 'public/demo-audio/edm.mp3')
convert_wav_to_mp3('tmp_stems/edm_v.wav', 'public/demo-audio/vocal_expressive.mp3')

# 4. Jazz Lounge (Key: D Minor 9, 90 BPM)
chords_jazz = [['D4', 'F4', 'A4', 'C5'], ['G3', 'B3', 'D4', 'F4'], ['C4', 'E4', 'G4', 'B4'], ['A3', 'C4', 'E4', 'G4']]
vocal_jazz = ['F4', 'A4', 'C5', 'B4', 'A4', 'G4', 'F4', 'E4']
inst4, voc4 = generate_song_pair(chords_jazz, vocal_jazz, bpm=90, inst_type='piano', vowel='oo')
write_wav('tmp_stems/jazz_m.wav', inst4)
write_wav('tmp_stems/jazz_v.wav', voc4)
convert_wav_to_mp3('tmp_stems/jazz_m.wav', 'public/demo-audio/jazz.mp3')

# 5. Indie Pop (Key: G Major, 105 BPM)
chords_indie = [['G3', 'B3', 'D4'], ['D4', 'F4', 'A4'], ['E4', 'G4', 'B4'], ['C4', 'E4', 'G4']]
vocal_indie = ['D4', 'G4', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4']
inst5, voc5 = generate_song_pair(chords_indie, vocal_indie, bpm=105, inst_type='guitar', vowel='ah')
write_wav('tmp_stems/indie_m.wav', inst5)
write_wav('tmp_stems/indie_v.wav', voc5)
convert_wav_to_mp3('tmp_stems/indie_m.wav', 'public/demo-audio/indie.mp3')

# 6. Orchestral (Key: C Major, 95 BPM)
chords_orch = [['C4', 'E4', 'G4'], ['G3', 'B3', 'D4'], ['A3', 'C4', 'E4'], ['F3', 'A3', 'C4']]
vocal_orch = ['C4', 'E4', 'G4', 'C5', 'B4', 'A4', 'G4', 'E4']
inst6, voc6 = generate_song_pair(chords_orch, vocal_orch, bpm=95, inst_type='synth', vowel='ah')
write_wav('tmp_stems/orch_m.wav', inst6)
write_wav('tmp_stems/orch_v.wav', voc6)
convert_wav_to_mp3('tmp_stems/orch_m.wav', 'public/demo-audio/orchestral.mp3')
convert_wav_to_mp3('tmp_stems/orch_v.wav', 'public/demo-audio/vocal_melodic.mp3')

import shutil
shutil.rmtree('tmp_stems', ignore_errors=True)
print("All matched stem pairs generated successfully!")
