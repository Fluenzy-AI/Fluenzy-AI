"""
Bulk light theme fix: add useTheme + isLight + fix quoted className dark patterns.
Targets high-priority user-facing files.
"""
import re

FILES = [
    r'd:\video\New folder\Fluenzy-AI\src\app\u\[username]\page.tsx',
    r'd:\video\New folder\Fluenzy-AI\src\app\jobs\JobsClient.tsx',
    r'd:\video\New folder\Fluenzy-AI\src\components\AutoApplySetupModal.tsx',
    r'd:\video\New folder\Fluenzy-AI\src\components\chat\ChatMessages.tsx',
    r'd:\video\New folder\Fluenzy-AI\src\app\company-tracks\page.tsx',
]

def fix_file(path):
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    orig_size = len(content)

    # 1. Add useTheme import
    if 'useTheme' not in content:
        inserted = False
        for trigger in [
            'import { useSession } from "next-auth/react";',
            "import { useSession } from 'next-auth/react';",
        ]:
            if trigger in content:
                content = content.replace(trigger, trigger + '\nimport { useTheme } from "@/contexts/ThemeContext";', 1)
                inserted = True
                break

        if not inserted:
            # Try to add after first import line
            first_import = content.find('import ')
            if first_import != -1:
                end_of_line = content.find('\n', first_import)
                content = content[:end_of_line + 1] + 'import { useTheme } from "@/contexts/ThemeContext";\n' + content[end_of_line + 1:]

    # 2. Add isLight hook to component functions
    patterns = [
        r'(export default function \w+\([^)]*\)\s*\{)',
        r'(const \w+(?:Client|Content|Page|Modal|Messages|Component)\s*=\s*\([^)]*\)\s*=>\s*\{)',
        r'(function \w+(?:Client|Content|Page|Component)\([^)]*\)\s*\{)',
    ]
    added = False
    for pat in patterns:
        for m in re.finditer(pat, content):
            insert_pos = content.find('\n', m.end()) + 1
            ahead = content[insert_pos:insert_pos + 300]
            if 'isLight' not in ahead and 'resolvedTheme' not in ahead:
                hook = "  const { resolvedTheme } = useTheme();\n  const isLight = resolvedTheme === 'light' || resolvedTheme === 'parchment';\n"
                content = content[:insert_pos] + hook + content[insert_pos:]
                added = True
                break
        if added:
            break

    # 3. Replace quoted className dark patterns
    count = 0
    def make_conditional(m):
        nonlocal count
        cls = m.group(1)
        new_cls = cls

        pairs = [
            ('bg-slate-900', '${isLight ? "bg-white" : "bg-slate-900"}'),
            ('bg-gray-900',  '${isLight ? "bg-white" : "bg-gray-900"}'),
            ('bg-zinc-900',  '${isLight ? "bg-white" : "bg-zinc-900"}'),
            ('bg-slate-800', '${isLight ? "bg-slate-100" : "bg-slate-800"}'),
            ('bg-gray-800',  '${isLight ? "bg-slate-100" : "bg-gray-800"}'),
            ('border-slate-800', '${isLight ? "border-slate-200" : "border-slate-800"}'),
            ('border-gray-800',  '${isLight ? "border-slate-200" : "border-gray-800"}'),
            ('border-slate-700', '${isLight ? "border-slate-300" : "border-slate-700"}'),
            ('border-gray-700',  '${isLight ? "border-slate-300" : "border-gray-700"}'),
        ]
        for old, new in pairs:
            if old in new_cls:
                new_cls = new_cls.replace(old, new)

        if new_cls != cls:
            count += 1
            return f'className={{`{new_cls}`}}'
        return m.group(0)

    pattern = r'className="([^"]*(?:bg-(?:slate|gray|zinc)-(?:700|800|900)|border-(?:slate|gray)-(?:700|800))[^"]*)"'
    content = re.sub(pattern, make_conditional, content)

    name = path.split('\\')[-1]
    print(f'{name}: +hook={added}, fixes={count}, {orig_size}->{len(content)} bytes')

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

for f in FILES:
    try:
        fix_file(f)
    except Exception as e:
        print(f'ERROR {f}: {e}')

print('\nDone!')
