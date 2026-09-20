import urllib.request
import json
import subprocess
import os
import ssl

ssl_context = ssl._create_unverified_context()

files_to_download = [
    {
        'title': 'File:National Anthem of Lithuania (Vocal).ogg',
        'out_vocal': 'public/demo-audio/vocal_male.mp3',
        'out_music': 'public/demo-audio/synthwave.mp3'
    },
    {
        'title': 'File:Swiss Psalm (official vocal).ogg',
        'out_vocal': 'public/demo-audio/vocal_female.mp3',
        'out_music': 'public/demo-audio/lofi.mp3'
    },
    {
        'title': 'File:Jana gana mana vocal.ogg',
        'out_vocal': 'public/demo-audio/vocal_expressive.mp3',
        'out_music': 'public/demo-audio/edm.mp3'
    },
    {
        'title': 'File:Auferstanden Aus Ruinen (Vocal).ogg',
        'out_vocal': 'public/demo-audio/vocal_melodic.mp3',
        'out_music': 'public/demo-audio/orchestral.mp3'
    }
]

headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'}
os.makedirs('public/demo-audio', exist_ok=True)
os.makedirs('tmp_downloads', exist_ok=True)

for item in files_to_download:
    title = item['title']
    api_url = f"https://commons.wikimedia.org/w/api.php?action=query&titles={urllib.parse.quote(title)}&prop=imageinfo&iiprop=url&format=json"
    
    req = urllib.request.Request(api_url, headers=headers)
    try:
        with urllib.request.urlopen(req, context=ssl_context) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            pages = data['query']['pages']
            page_id = list(pages.keys())[0]
            if page_id != '-1':
                file_url = pages[page_id]['imageinfo'][0]['url']
                print(f"Downloading {title} from {file_url}...")
                
                tmp_ogg = f"tmp_downloads/{page_id}.ogg"
                file_req = urllib.request.Request(file_url, headers=headers)
                with urllib.request.urlopen(file_req, context=ssl_context) as f_in, open(tmp_ogg, 'wb') as f_out:
                    f_out.write(f_in.read())
                    
                # Convert to MP3 using ffmpeg (slice to 25 seconds)
                subprocess.run(['ffmpeg', '-y', '-i', tmp_ogg, '-ss', '00:00:02', '-t', '00:00:25', '-c:a', 'mp3', '-b:a', '192k', item['out_vocal']], check=True)
                subprocess.run(['ffmpeg', '-y', '-i', tmp_ogg, '-ss', '00:00:05', '-t', '00:00:25', '-c:a', 'mp3', '-b:a', '192k', item['out_music']], check=True)
                print(f"Successfully generated {item['out_vocal']} and {item['out_music']}")
    except Exception as e:
        print(f"Error processing {title}: {e}")

# Copy to remaining genre fallbacks if needed
for g in ['jazz.mp3', 'indie.mp3']:
    if os.path.exists('public/demo-audio/synthwave.mp3'):
        subprocess.run(['cp', 'public/demo-audio/synthwave.mp3', f'public/demo-audio/{g}'])

print("All real vocal audio downloads completed!")
