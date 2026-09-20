import urllib.request
import subprocess
import os
import ssl

ssl_ctx = ssl._create_unverified_context()
headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'}

sources = [
    {
        'name': 'synthwave',
        'url': 'https://upload.wikimedia.org/wikipedia/commons/0/02/Generative_Digital_Synthesizer_Improv_in_a_DAW_2.wav',
        'out_music': 'public/demo-audio/synthwave.mp3',
        'out_vocal': 'public/demo-audio/vocal_male.mp3',
        'ss_m': '00:00:05',
        'ss_v': '00:00:15'
    },
    {
        'name': 'lofi',
        'url': 'https://upload.wikimedia.org/wikipedia/commons/1/17/El_Noi_de_la_Mare_%28guitar%29.ogg',
        'out_music': 'public/demo-audio/lofi.mp3',
        'ss_m': '00:00:02'
    },
    {
        'name': 'edm',
        'url': 'https://upload.wikimedia.org/wikipedia/commons/5/50/Jana_gana_mana_vocal.ogg',
        'out_music': 'public/demo-audio/edm.mp3',
        'out_vocal': 'public/demo-audio/vocal_expressive.mp3',
        'ss_m': '00:00:01',
        'ss_v': '00:00:10'
    },
    {
        'name': 'jazz',
        'url': 'https://upload.wikimedia.org/wikipedia/commons/7/75/Jazz_Piano.ogg',
        'out_music': 'public/demo-audio/jazz.mp3',
        'ss_m': '00:00:00'
    },
    {
        'name': 'indie',
        'url': 'https://upload.wikimedia.org/wikipedia/commons/b/b7/Swiss_Psalm_%28official_vocal%29.ogg',
        'out_music': 'public/demo-audio/indie.mp3',
        'out_vocal': 'public/demo-audio/vocal_female.mp3',
        'ss_m': '00:00:04',
        'ss_v': '00:00:14'
    },
    {
        'name': 'orchestral',
        'url': 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Auferstanden_Aus_Ruinen_%28Vocal%29.ogg',
        'out_music': 'public/demo-audio/orchestral.mp3',
        'out_vocal': 'public/demo-audio/vocal_melodic.mp3',
        'ss_m': '00:00:02',
        'ss_v': '00:00:12'
    }
]

os.makedirs('public/demo-audio', exist_ok=True)
os.makedirs('tmp_unique', exist_ok=True)

for item in sources:
    tmp_path = f"tmp_unique/{item['name']}.src"
    print(f"Downloading {item['name']} from {item['url']}...")
    req = urllib.request.Request(item['url'], headers=headers)
    with urllib.request.urlopen(req, context=ssl_ctx) as f_in, open(tmp_path, 'wb') as f_out:
        f_out.write(f_in.read())
        
    if 'out_music' in item:
        subprocess.run(['ffmpeg', '-y', '-i', tmp_path, '-ss', item.get('ss_m', '00:00:00'), '-t', '00:00:25', '-c:a', 'mp3', '-b:a', '192k', item['out_music']], check=True)
        print(f"-> Created {item['out_music']} (size: {os.path.getsize(item['out_music'])} bytes)")
    if 'out_vocal' in item:
        subprocess.run(['ffmpeg', '-y', '-i', tmp_path, '-ss', item.get('ss_v', '00:00:05'), '-t', '00:00:25', '-c:a', 'mp3', '-b:a', '192k', item['out_vocal']], check=True)
        print(f"-> Created {item['out_vocal']} (size: {os.path.getsize(item['out_vocal'])} bytes)")

print("\nDone! Verified distinct sizes:")
for f in os.listdir('public/demo-audio'):
    if f.endswith('.mp3'):
        p = os.path.join('public/demo-audio', f)
        print(f"  - {f}: {os.path.getsize(p)} bytes")
