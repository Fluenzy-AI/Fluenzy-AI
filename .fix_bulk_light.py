"""
Bulk fix all remaining dark-locked pages with the same pattern:
- Add useTheme import
- Add isLight hook  
- Replace quoted className dark patterns with template literal conditionals
"""
import re

FILES = [
    r'd:\video\New folder\Fluenzy-AI\src\app\u\[username]\PublicProfileClient.tsx',
    r'd:\video\New folder\Fluenzy-AI\src\app\train\competitions\[competitionId]\battle\page.tsx',
    r'd:\video\New folder\Fluenzy-AI\src\app\interview-guide\history\page.tsx',
]

def fix_file(path):
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    orig_size = len(content)
    
    # 1. Add useTheme import
    if 'useTheme' not in content:
        for trigger in [
            'import { useSession } from "next-auth/react";',
            "import { useSession } from 'next-auth/react';",
            '"use client";',
        ]:
            if trigger in content:
                content = content.replace(trigger, trigger + '\nimport { useTheme } from "@/contexts/ThemeContext";', 1)
                break
    
    # 2. Find component function and add isLight hook
    added_hook = False
    for pattern in [
        r'(export default function \w+\([^)]*\)\s*\{)',
        r'(function \w+Client\([^)]*\)\s*\{)',
        r'(function \w+Content\([^)]*\)\s*\{)',
        r'(function \w+Page\([^)]*\)\s*\{)',
    ]:
        for m in re.finditer(pattern, content):
            insert_pos = content.find('\n', m.end()) + 1
            ahead = content[insert_pos:insert_pos+300]
            if 'isLight' not in ahead and 'resolvedTheme' not in ahead:
                hook_code = (
                    "  const { resolvedTheme } = useTheme();\n"
                    "  const isLight = resolvedTheme === 'light' || resolvedTheme === 'parchment';\n"
                )
                content = content[:insert_pos] + hook_code + content[insert_pos:]
                added_hook = True
                break
        if added_hook:
            break
    
    # 3. Replace quoted className dark patterns  
    count = 0
    def make_conditional(m):
        nonlocal count
        cls_content = m.group(1)
        new_cls = cls_content
        
        replacements_map = [
            ('bg-slate-900', '${isLight ? "bg-white" : "bg-slate-900"}'),
            ('bg-gray-900', '${isLight ? "bg-white" : "bg-gray-900"}'),
            ('bg-zinc-900', '${isLight ? "bg-white" : "bg-zinc-900"}'),
            ('bg-slate-800', '${isLight ? "bg-slate-100" : "bg-slate-800"}'),
            ('bg-gray-800', '${isLight ? "bg-slate-100" : "bg-gray-800"}'),
            ('border-slate-800', '${isLight ? "border-slate-200" : "border-slate-800"}'),
            ('border-gray-800', '${isLight ? "border-slate-200" : "border-gray-800"}'),
            ('border-slate-700', '${isLight ? "border-slate-300" : "border-slate-700"}'),
            ('border-gray-700', '${isLight ? "border-slate-300" : "border-gray-700"}'),
        ]
        
        for old, new in replacements_map:
            if old in new_cls:
                new_cls = new_cls.replace(old, new)
        
        if new_cls != cls_content:
            count += 1
            return f'className={{`{new_cls}`}}'
        return m.group(0)
    
    pattern = r'className="([^"]*(?:bg-(?:slate|gray|zinc)-(?:700|800|900)|border-(?:slate|gray)-(?:700|800))[^"]*)"'
    content = re.sub(pattern, make_conditional, content)
    
    final_size = len(content)
    name = path.split('\\')[-1]
    print(f'{name}: {count} fixes, {orig_size} -> {final_size} bytes')
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

for f in FILES:
    try:
        fix_file(f)
    except Exception as e:
        print(f'ERROR {f}: {e}')

print("\nDone!")
