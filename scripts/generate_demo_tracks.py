import subprocess
import os

os.makedirs('public/demo-audio', exist_ok=True)

# Generate Synthwave track (Punchy bass + arpeggio synth chord rhythm)
synthwave_filter = (
    "eval='a=mod(t,0.5); p=if(lt(a,0.25),440,554.37); c=sine(p)*0.4 + sine(220)*0.5 + sine(110)*0.6':"
    "duration=20:sample_rate=44100"
)

# 1. Synthwave Track
subprocess.run([
    'ffmpeg', '-y', '-f', 'lavfi',
    '-i', 'aevalsrc=sin(2*PI*110*t)*0.5 + sin(2*PI*220*t)*0.3 + sin(2*PI*330*t)*0.2:d=25:s=44100',
    '-af', 'tremolo=f=6:d=0.7,aecho=0.8:0.88:60:0.4',
    '-c:a', 'mp3', '-b:a', '192k', 'public/demo-audio/synthwave.mp3'
], check=True)

# 2. Lo-Fi Chill Beat
subprocess.run([
    'ffmpeg', '-y', '-f', 'lavfi',
    '-i', 'aevalsrc=sin(2*PI*261.63*t)*0.4 + sin(2*PI*329.63*t)*0.3 + sin(2*PI*392*t)*0.3:d=25:s=44100',
    '-af', 'vibrato=f=4:d=0.3,lowpass=f=1200,aecho=0.8:0.7:150:0.3',
    '-c:a', 'mp3', '-b:a', '192k', 'public/demo-audio/lofi.mp3'
], check=True)

# 3. EDM Festival Drop
subprocess.run([
    'ffmpeg', '-y', '-f', 'lavfi',
    '-i', 'aevalsrc=sin(2*PI*55*t)*0.7 + sin(2*PI*110*t)*0.4 + sin(2*PI*440*t)*0.2:d=25:s=44100',
    '-af', 'tremolo=f=8:d=0.8,apulsator=mode=sine:hz=2',
    '-c:a', 'mp3', '-b:a', '192k', 'public/demo-audio/edm.mp3'
], check=True)

# 4. Jazz Lounge
subprocess.run([
    'ffmpeg', '-y', '-f', 'lavfi',
    '-i', 'aevalsrc=sin(2*PI*174.61*t)*0.4 + sin(2*PI*220*t)*0.3 + sin(2*PI*261.63*t)*0.3 + sin(2*PI*311.13*t)*0.2:d=25:s=44100',
    '-af', 'vibrato=f=2:d=0.4,aecho=0.8:0.8:200:0.4',
    '-c:a', 'mp3', '-b:a', '192k', 'public/demo-audio/jazz.mp3'
], check=True)

# 5. Indie Pop
subprocess.run([
    'ffmpeg', '-y', '-f', 'lavfi',
    '-i', 'aevalsrc=sin(2*PI*293.66*t)*0.4 + sin(2*PI*369.99*t)*0.3 + sin(2*PI*440*t)*0.3:d=25:s=44100',
    '-af', 'flanger=delay=4:depth=2:regen=50,aecho=0.8:0.7:100:0.3',
    '-c:a', 'mp3', '-b:a', '192k', 'public/demo-audio/indie.mp3'
], check=True)

# 6. Epic Orchestral
subprocess.run([
    'ffmpeg', '-y', '-f', 'lavfi',
    '-i', 'aevalsrc=sin(2*PI*130.81*t)*0.5 + sin(2*PI*196*t)*0.4 + sin(2*PI*261.63*t)*0.4:d=25:s=44100',
    '-af', 'chorus=0.7:0.9:55:0.4:0.25:2,aecho=0.8:0.88:300:0.5',
    '-c:a', 'mp3', '-b:a', '192k', 'public/demo-audio/orchestral.mp3'
], check=True)

# 7. AI Male Vocal Track
subprocess.run([
    'ffmpeg', '-y', '-f', 'lavfi',
    '-i', 'aevalsrc=sin(2*PI*220*t)*0.6 + sin(2*PI*440*t)*0.2:d=25:s=44100',
    '-af', 'vibrato=f=6:d=0.5,bandpass=f=1500:width_type=h:w=1000,aecho=0.8:0.7:120:0.3',
    '-c:a', 'mp3', '-b:a', '192k', 'public/demo-audio/vocal_male.mp3'
], check=True)

# 8. AI Female Vocal Track
subprocess.run([
    'ffmpeg', '-y', '-f', 'lavfi',
    '-i', 'aevalsrc=sin(2*PI*349.23*t)*0.6 + sin(2*PI*698.46*t)*0.2:d=25:s=44100',
    '-af', 'vibrato=f=7:d=0.6,bandpass=f=2200:width_type=h:w=1200,aecho=0.8:0.7:140:0.4',
    '-c:a', 'mp3', '-b:a', '192k', 'public/demo-audio/vocal_female.mp3'
], check=True)

print("All demo audio tracks generated successfully in public/demo-audio!")
