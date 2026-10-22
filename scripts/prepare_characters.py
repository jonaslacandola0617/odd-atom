"""Derive animation layers from the supplied artwork. Originals remain byte-for-byte intact."""
from pathlib import Path
import json
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
ET.register_namespace('', 'http://www.w3.org/2000/svg')

def fragment(element, prefix):
    raw = ET.tostring(element, encoding='unicode')
    raw = re.sub(r'\bclass="([^"]+)"', lambda m: 'class="' + ' '.join(prefix + c for c in m[1].split()) + '"', raw)
    return raw

def commands_for(element):
    """Normalize source coordinates so shared seams deform through the same field."""
    if element.tag.endswith('polygon'):
        nums = [float(v) for v in re.findall(r'[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?', element.get('points', ''))]
        return [{'type': 'M' if i == 0 else 'L', 'points': nums[i:i+2]} for i in range(0, len(nums), 2)] + [{'type': 'Z', 'points': []}]
    tokens = re.findall(r'[A-Za-z]|[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?', element.get('d', ''))
    result = []
    i = 0
    command = 'M'
    current = [0.0, 0.0]
    start = [0.0, 0.0]
    last_control = None
    last_type = None
    while i < len(tokens):
        if tokens[i].isalpha():
            command = tokens[i]
            i += 1
        upper = command.upper()
        relative = command.islower()
        if upper == 'Z':
            result.append({'type': 'Z', 'points': []})
            current = start.copy()
            last_control = None
            last_type = 'Z'
            continue
        count = {'M': 2, 'L': 2, 'H': 1, 'V': 1, 'C': 6, 'S': 4}[upper]
        values = [float(v) for v in tokens[i:i+count]]
        i += count
        if upper == 'H':
            points = [values[0] + (current[0] if relative else 0), current[1]]
            typ = 'L'
        elif upper == 'V':
            points = [current[0], values[0] + (current[1] if relative else 0)]
            typ = 'L'
        else:
            points = [v + (current[j % 2] if relative else 0) for j, v in enumerate(values)]
            typ = upper
            if upper == 'S':
                control = [2 * current[k] - last_control[k] for k in range(2)] if last_type in ('C', 'S') and last_control else current.copy()
                points = control + points
                typ = 'C'
        current = points[-2:]
        if upper == 'M':
            start = current.copy()
            command = 'l' if relative else 'L'
        last_control = points[-4:-2] if typ == 'C' else None
        last_type = upper
        result.append({'type': typ, 'points': [round(v, 4) for v in points]})
    return result

astronaut = ET.parse(ROOT / 'public/assets/characters/astronaut.svg').getroot()
groups = [c for c in astronaut if c.tag.endswith('g')]
style = next(c.text for c in astronaut if c.tag.endswith('style'))
astro_css = re.sub(r'\.st(\d+)', r'.astro-st\1', style or '')
bird = ET.parse(ROOT / 'public/assets/characters/bird.svg').getroot()
bird_style = ''.join(c.text or '' for c in bird.iter() if c.tag.endswith('style'))
bird_css = re.sub(r'\.s(\d+)', r'.bird-s\1', bird_style)
bird_root = next(c for c in bird if c.tag.endswith('g'))
data = {
    'astronaut': {'css': astro_css, 'body': fragment(groups[0], 'astro-'), 'shapes': [
        {'className': 'astro-' + c.get('class', ''), 'commands': commands_for(c)} for c in groups[0]
    ], 'heads': {
        'surprised': fragment(groups[1], 'astro-'),
        'worried': fragment(groups[2], 'astro-'),
        'happy': fragment(groups[3], 'astro-'),
        'neutral': fragment(groups[4], 'astro-'),
    }},
    'bird': {'css': bird_css, 'parts': [fragment(c, 'bird-') for c in bird_root]},
}
dest = ROOT / 'src/generated/characters.json'
dest.parent.mkdir(parents=True, exist_ok=True)
dest.write_text(json.dumps(data, indent=2))
print(f'Prepared original character layers: {dest}')
