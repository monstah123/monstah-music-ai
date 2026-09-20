import urllib.request
import json
import subprocess
import os
import ssl

ssl_ctx = ssl._create_unverified_context()
headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'}

track_mapping = [
    {
        'title': 'File:Wikipedia guitar solo.ogg',
        'out': 'public/demo-audio/synthwave.mp3'
    },
    {
        'title': 'File:El Noi de la Mare (guitar).ogg',
        'out': 'public/demo-audio/lofi.mp3'
    },
    {
        'title': 'File:Jana gana mana vocal.ogg',
        'out': 'public/demo-audio/edm.mp3',
        'vocal_out': 'public/demo-audio/vocal_expressive.mp3'
    },
    {
        'title': 'File:Cole Porter’s “I Love You” - JMC, Han\'s Piano Edition.ogg',
        'out': 'public/demo-audio/jazz.mp3'
    },
    {
        'title': 'File:Swiss Psalm (official vocal).ogg',
        'out': 'public/demo-audio/indie.mp3',
        'vocal_out': 'public/demo-audio/vocal_female.mp3'
    },
    {
        'title': 'File:Auferstanden Aus Ruinen (Vocal).ogg',
        'out': 'public/demo-audio/orchestral.mp3',
        'vocal_out': 'public/demo-audio/vocal_melodic.mp3'
    },
    {
        'title': 'File:National Anthem of Lithuania (Vocal).ogg',
        'vocal_out': 'public/demo-audio/vocal_male.mp3'
    }
]

os.makedirs('public/demo-audio', exist_ok=True)
os.makedirs('tmp_downloads', exist_ok=True)

for item in track_mapping:
    title = item['title']
    url = f"https://commons.wikimedia.org/w/api.php?action=query&titles={urllib.parse.quote(title)}&prop=imageinfo&iiprop=url&format=json"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, context=ssl_ctx) as r:
            d = json.loads(r.read().decode('utf-8'))
            pages = d['query']['pages']
            pid = list(pages.keys())[0]
            if pid != '-1':
                file_url = pages[pid]['imageinfo'][0]['url']
                print(f"Downloading {title}...")
                tmp_file = f"tmp_downloads/{pid}.audio"
                file_req = urllib.request.Request(file_url, headers=headers)
                with urllib.request.urlopen(file_req, context=ssl_ctx) as f_in, open(tmp_file, 'wb') as f_out:
                    f_out.write(f_in.read())
                    
                if 'out' in item:
                    subprocess.run(['ffmpeg', '-y', '-i', tmp_file, '-ss', '00:00:01', '-t', '00:00:25', '-c:a', 'mp3', '-b:a', '192k', item['out']], check=True)
                    print(f"Generated {item['out']}")
                if 'vocal_out' in item:
                    subprocess.run(['ffmpeg', '-y', '-i', tmp_file, '-ss', '00:00:03', '-t', '00:00:25', '-c:a', 'mp3', '-b:a', '192k', item['vocal_out']], check=True)
                    print(f"Generated {item['vocal_out']}")
    except Exception as e:
        print(f"Error for {title}: {e}")

print("Distinct track download finished!")
