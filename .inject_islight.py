"""
Simple: add const isLight = ... to the first function's body in each file.
Uses multiple patterns to find the component function start.
"""
import re

FILES = [
    r'd:\video\New folder\Fluenzy-AI\src\app\interview-guide\page.tsx',
    r'd:\video\New folder\Fluenzy-AI\src\app\signup\page.tsx',
    r'd:\video\New folder\Fluenzy-AI\src\components\navbar\index.tsx',
    r'd:\video\New folder\Fluenzy-AI\src\components\chat\ChatInput.tsx',
    r'd:\video\New folder\Fluenzy-AI\src\app\ats\upload-resume\page.tsx',
    r'd:\video\New folder\Fluenzy-AI\src\app\train\friends\FriendsPageClient.tsx',
    r'd:\video\New folder\Fluenzy-AI\src\components\InterviewReport.tsx',
    r'd:\video\New folder\Fluenzy-AI\src\app\train\competitions\[competitionId]\page.tsx',
    r'd:\video\New folder\Fluenzy-AI\src\components\VideoAnalysisPanel.tsx',
]

HOOK = "  const { resolvedTheme } = useTheme();\n  const isLight = resolvedTheme === 'light' || resolvedTheme === 'parchment';\n"

FUNC_PATTERNS = [
    re.compile(r'export default function \w+\([^)]*\)\s*(?::\s*\w+(?:<[^>]+>)?)?\s*\{'),
    re.compile(r'export function \w+\([^)]*\)\s*(?::\s*\w+(?:<[^>]+>)?)?\s*\{'),
    re.compile(r'export const \w+(?:\s*:\s*React\.FC[^=]*)?\s*=\s*(?:\([^)]*\)|\w+)\s*=>\s*\{'),
    re.compile(r'const \w+(?:Client|Panel|Page|Report|Input|Dashboard|Room)\s*=\s*(?:\([^)]*\)|\w+)\s*=>\s*\{'),
    re.compile(r'function \w+\(\s*\{\s*[^}]+\}\s*:[^)]+\)\s*\{'),
]

def add_hook_after_first_func(content, path):
    name = path.split('\\')[-1]
    
    if 'const isLight' in content:
        print(f'  {name}: already has hook, skipping')
        return content
    
    for pat in FUNC_PATTERNS:
        m = pat.search(content)
        if m:
            insert_pos = content.find('\n', m.end()) + 1
            # Check there's no isLight in next 200 chars (already added)
            ahead = content[insert_pos:insert_pos+200]
            if 'isLight' in ahead:
                continue
            content = content[:insert_pos] + HOOK + content[insert_pos:]
            print(f'  {name}: hook added after: {m.group()[:60]}')
            return content
    
    print(f'  {name}: WARNING - no matching function found!')
    return content

for path in FILES:
    try:
        with open(path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        if 'use client' not in content:
            print(f'SKIP (server): {path.split(chr(92))[-1]}')
            continue
        
        new_content = add_hook_after_first_func(content, path)
        
        if new_content != content:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f'    -> Written')
    except Exception as e:
        print(f'ERROR {path}: {e}')

print('\nDone!')
