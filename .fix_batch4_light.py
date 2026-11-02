"""
Batch 4 - Fix remaining high-priority user-facing components for light theme.
"""
import re, os

FILES = [
    r'd:\video\New folder\Fluenzy-AI\src\components\assessments\results\PerformanceBreakdown.tsx',
    r'd:\video\New folder\Fluenzy-AI\src\modules\features\index.tsx',
    r'd:\video\New folder\Fluenzy-AI\src\modules\analytics-intelligence\index.tsx',
    r'd:\video\New folder\Fluenzy-AI\src\modules\hero\index.tsx',
    r'd:\video\New folder\Fluenzy-AI\src\modules\pro-features\index.tsx',
    r'd:\video\New folder\Fluenzy-AI\src\app\train\gd\private\page.tsx',
    r'd:\video\New folder\Fluenzy-AI\src\app\train\gd\private\[roomId]\page.tsx',
    r'd:\video\New folder\Fluenzy-AI\src\app\train\interview\private\page.tsx',
    r'd:\video\New folder\Fluenzy-AI\src\app\train\interview\private\[roomId]\page.tsx',
    r'd:\video\New folder\Fluenzy-AI\src\components\LiveInterviewRoom.tsx',
    r'd:\video\New folder\Fluenzy-AI\src\components\competitions\CompetitionGDBattleRoom.tsx',
]

HOOK = "  const { resolvedTheme } = useTheme();\n  const isLight = resolvedTheme === 'light' || resolvedTheme === 'parchment';\n"

PAIRS = [
    ('bg-slate-900', '${isLight ? "bg-white" : "bg-slate-900"}'),
    ('bg-gray-900',  '${isLight ? "bg-white" : "bg-gray-900"}'),
    ('bg-zinc-900',  '${isLight ? "bg-white" : "bg-zinc-900"}'),
    ('bg-slate-800', '${isLight ? "bg-slate-100" : "bg-slate-800"}'),
    ('bg-gray-800',  '${isLight ? "bg-slate-100" : "bg-gray-800"}'),
    ('border-slate-800', '${isLight ? "border-slate-200" : "border-slate-800"}'),
    ('border-gray-800',  '${isLight ? "border-slate-200" : "border-gray-800"}'),
    ('border-slate-700', '${isLight ? "border-slate-300" : "border-slate-700"}'),
    ('border-gray-700',  '${isLight ? "border-slate-300" : "border-gray-700"}'),
    ('border-white/10', '${isLight ? "border-slate-200" : "border-white/10"}'),
    ('border-white/5',  '${isLight ? "border-slate-100" : "border-white/5"}'),
    ('bg-slate-950/40', '${isLight ? "bg-slate-50" : "bg-slate-950/40"}'),
    ('bg-slate-900/70', '${isLight ? "bg-white/80" : "bg-slate-900/70"}'),
    ('bg-slate-900/80', '${isLight ? "bg-white" : "bg-slate-900/80"}'),
    ('bg-slate-900/60', '${isLight ? "bg-white" : "bg-slate-900/60"}'),
    ('bg-slate-900/50', '${isLight ? "bg-slate-50" : "bg-slate-900/50"}'),
]

FUNC_STARTS = [
    re.compile(r'export default function \w+\s*\([^)]*\)\s*(?::\s*[\w<>]+)?\s*\{'),
    re.compile(r'export function \w+\s*\([^)]*\)\s*(?::\s*[\w<>]+)?\s*\{'),
    re.compile(r'const \w+\s*(?::\s*React\.FC[^=]*)?\s*=\s*(?:\([^)]*\)|\w+)\s*=>\s*\{'),
    re.compile(r'function \w+\s*\([^)]*\)\s*(?::\s*[\w<>]+)?\s*\{'),
]

def inject_hook(content):
    if 'const isLight' in content:
        return content, False
    
    for pat in FUNC_STARTS:
        m = pat.search(content)
        if m:
            insert_pos = content.find('\n', m.end()) + 1
            ahead = content[insert_pos:insert_pos+300]
            if 'isLight' in ahead or 'resolvedTheme' in ahead:
                return content, False
            return content[:insert_pos] + HOOK + content[insert_pos:], True
    return content, False

def add_import(content):
    if 'useTheme' in content:
        return content
    triggers = [
        'import { useSession } from "next-auth/react";',
        "import { useSession } from 'next-auth/react';",
        "'use client';\n",
        '"use client";\n',
    ]
    for t in triggers:
        if t in content:
            content = content.replace(t, t + 'import { useTheme } from "@/contexts/ThemeContext";\n', 1)
            return content
    # fallback: add after first import
    idx = content.find('import ')
    if idx != -1:
        end = content.find('\n', idx)
        content = content[:end+1] + 'import { useTheme } from "@/contexts/ThemeContext";\n' + content[end+1:]
    return content

def fix_classnames(content):
    count = 0
    def replace(m):
        nonlocal count
        cls = m.group(1)
        new_cls = cls
        for old, new in PAIRS:
            if old in new_cls:
                new_cls = new_cls.replace(old, new)
        if new_cls != cls:
            count += 1
            return f'className={{`{new_cls}`}}'
        return m.group(0)
    
    pattern = r'className="([^"]*(?:bg-(?:slate|gray|zinc)-(?:700|800|900|950)|border-(?:white|slate|gray)/|border-(?:slate|gray)-(?:700|800)|bg-slate-9\d+/)[^"]*)"'
    content = re.sub(pattern, replace, content)
    return content, count

for path in FILES:
    if not os.path.exists(path):
        print('MISSING: ' + path.split('\\')[-1])
        continue
    try:
        with open(path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        if 'use client' not in content:
            print('SKIP server: ' + path.split('\\')[-1])
            continue
        
        content = add_import(content)
        content, hooked = inject_hook(content)
        content, fixes = fix_classnames(content)
        
        name = path.split('\\')[-1]
        print(name + ': hook=' + str(hooked) + ' cls=' + str(fixes))
        
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
    except Exception as e:
        print('ERROR ' + path.split('\\')[-1] + ': ' + str(e))

print('\nDone!')
