"""Analyze remaining high-priority files for light theme."""
import os, re

files = [
    r'd:\video\New folder\Fluenzy-AI\src\app\u\[username]\page.tsx',
    r'd:\video\New folder\Fluenzy-AI\src\app\jobs\JobsClient.tsx',
    r'd:\video\New folder\Fluenzy-AI\src\components\AutoApplySetupModal.tsx',
    r'd:\video\New folder\Fluenzy-AI\src\components\chat\ChatMessages.tsx',
    r'd:\video\New folder\Fluenzy-AI\src\app\company-tracks\page.tsx',
]
for p in files:
    if not os.path.exists(p):
        print(f'MISSING: {p}')
        continue
    with open(p, 'r', encoding='utf-8', errors='ignore') as f:
        c = f.read()
    has_mobile = bool(re.search(r'isMobile|MobilePage|MobileJob', c))
    dark = len(re.findall(r'bg-(?:gray|slate|zinc)-(?:800|900)', c))
    lines = c.count('\n')
    name = p.split('\\')[-1]
    print(f'{name}: {lines}L, mobile={has_mobile}, dark={dark}')
