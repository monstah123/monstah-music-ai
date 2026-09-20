import urllib.request
import json
import subprocess
import os
import ssl

ssl_ctx = ssl._create_unverified_context()
headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'}

files_to_fetch = [
    {
        'title': 'File:Generative Digital Synthesizer Improv in a DAW 2.wav',
        'out_music': 'public/demo-audio/synthwave.mp3',
        'ss_m': '00:00:10'
    },
    {
        'title': 'File:Jazz Piano.ogg',
        'out_music': 'public/demo-audio/jazz.mp3',
        'ss_m': '00:00:00'
    },
    {
        'title': 'File:Wikipedia guitar solo.ogg',
        'out_music': 'public/demo-audio/lofi.mp3',
        'ss_m': '00:00:00'
    },
    {
        'title': 'File:Jana gana mana vocal.ogg',
        'out_music': 'public/demo-audio/edm.mp3',
        'out_vocal': 'public/demo-audio/vocal_expressive.mp3',
        'ss_m': '00:00:02',
        'ss_v': '00:00:12'
    },
    {
        'title': 'File:Swiss Psalm (official vocal).ogg',
        'out_music': 'public/demo-audio/indie.mp3',
        'out_vocal': 'public/demo-audio/vocal_female.mp3',
        'ss_m': '00:00:04',
        'ss_v': '00:00:14'
    },
    {
        'title': 'File:Auferstanden Aus Ruinen (Vocal).ogg',
        'out_music': 'public/demo-audio/orchestral.mp3',
        'out_vocal': 'public/demo-audio/vocal_melodic.mp3',
        'ss_m': '00:00:02',
        'ss_v': '00:00:15'
    },
    {
        'title': 'File:National Anthem of Lithuania (Vocal).ogg',
        'out_vocal': 'public/demo-audio/vocal_male.mp3',
        'ss_v': '00:00:03'
    }
]

os.makedirs('public/demo-audio', exist_ok=True)
os.makedirs('tmp_media', exist_ok=True)

for item in files_to_fetch:
    title = item['title']
    api_url = f"https://commons.wikimedia.org/w/api.php?action=query&titles={urllib.parse.quote(title)}&prop=imageinfo&iiprop=url&format=json"
    req = urllib.request.Request(api_url, headers=headers)
    try:
        with urllib.request.urlopen(req, context=ssl_ctx) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            pages = data['query']['pages']
            pid = list(pages.keys())[0]
            if pid != '-1':
                file_url = pages[pid]['imageinfo'][0]['url']
                print(f"Fetching {title} -> {file_url}")
                tmp_src = f"tmp_media/{pid}.src"
                
                f_req = urllib.request.Request(file_url, headers=headers)
                with urllib.request.urlopen(f_req, context=ssl_ctx) as fin, open(tmp_src, 'wb') as fout:
                    fout.write(fin.read())
                    
                if 'out_music' in item:
                    subprocess.run(['ffmpeg', '-y', '-i', tmp_src, '-ss', item.get('ss_m', '00:00:00'), '-t', '00:00:22', '-c:a', 'mp3', '-b:a', '192k', item['out_music']], check=True)
                    print(f"  Created {item['out_music']} (size: {os.path.getsize(item['out_music'])})")
                if 'out_vocal' in item:
                    subprocess.run(['ffmpeg', '-y', '-i', tmp_src, '-ss', item.get('ss_v', '00:00:05'), '-t', '00:00:22', '-c:a', 'mp3', '-b:a', '192k', item['out_vocal']], check=True)
                    print(f"  Created {item['out_vocal']} (size: {os.path.getsize(item['out_vocal'])})")
    except Exception as e:
        print(f"Error fetching {title}: {e}")

print("\nFinished! Verification of unique audio sizes:")
for f in sorted(os.listdir('public/demo-audio')):
    if f.endswith('.mp3'):
        p = os.path.join('public/demo-audio', f)
        print(f"  - {f}: {os.path.getsize(p)} bytes")
