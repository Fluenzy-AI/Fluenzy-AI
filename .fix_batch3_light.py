"""
Bulk light theme fix - batch 3.
Adds useTheme + isLight hook and replaces quoted className dark patterns.
Handles multiple inner functions correctly by adding hook to ALL functions.
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
    # Also fix border-white/10 and bg-slate-9xx/xx patterns
    ('border-white/10', '${isLight ? "border-slate-200" : "border-white/10"}'),
    ('border-white/5',  '${isLight ? "border-slate-100" : "border-white/5"}'),
    ('bg-slate-950/40', '${isLight ? "bg-slate-50" : "bg-slate-950/40"}'),
    ('bg-slate-900/70', '${isLight ? "bg-white/70" : "bg-slate-900/70"}'),
    ('bg-slate-900/80', '${isLight ? "bg-white" : "bg-slate-900/80"}'),
]

HOOK = "  const { resolvedTheme } = useTheme();\n  const isLight = resolvedTheme === 'light' || resolvedTheme === 'parchment';\n"

def add_hook_to_all_functions(content):
    """Add isLight hook to every React component function that uses JSX."""
    # Find all function declarations
    func_pattern = re.compile(
        r'((?:export\s+(?:default\s+)?)?function\s+\w+\s*\([^)]*\)\s*(?::\s*\w+(?:<[^>]*>)?)?\s*\{|'
        r'(?:export\s+)?const\s+\w+\s*(?::\s*React\.FC[^=]*)?\s*=\s*(?:\([^)]*\)|[^=])\s*=>\s*\{)',
        re.MULTILINE
    )
    
    # Find positions where we need to insert hooks
    insertions = []
    for m in func_pattern.finditer(content):
        # Check if this function contains JSX (has return with <)
        func_start = m.end()
        next_return = content.find('return', func_start)
        if next_return == -1: continue
        
        # Check if there's JSX between function start and next return
        between = content[func_start:next_return]
        has_jsx = '<' in content[next_return:next_return+50]
        
        if not has_jsx: continue
        
        # Check if isLight is already there before this return
        before_return = content[func_start:next_return]
        if 'isLight' in before_return or 'resolvedTheme' in before_return:
            continue
        
        # Check if isLight is used after this function start
        func_content_end = content.find('\n\nexport', func_start)
        if func_content_end == -1:
            func_content_end = len(content)
        func_content = content[func_start:func_content_end]
        if 'isLight' not in func_content:
            continue
        
        # Insert after first line of function
        insert_pos = content.find('\n', func_start) + 1
        insertions.append(insert_pos)
    
    # Insert from last to first to not break positions
    for pos in sorted(set(insertions), reverse=True):
        content = content[:pos] + HOOK + content[pos:]
    
    return content, len(set(insertions))

def fix_file(path):
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    if 'use client' not in content and '"use client"' not in content:
        print(f'  SKIP (server component): {path.split(chr(92))[-1]}')
        return
    
    orig_size = len(content)
    
    # 1. Add useTheme import if missing
    if 'useTheme' not in content:
        for trigger in [
            'import { useSession } from "next-auth/react";',
            "import { useSession } from 'next-auth/react';",
            "import { useTheme, themeConfig } from '@/contexts/ThemeContext';",
            "import { useTheme, themeConfig } from \"@/contexts/ThemeContext\";",
        ]:
            if trigger in content:
                content = content.replace(trigger, trigger + '\nimport { useTheme } from "@/contexts/ThemeContext";', 1)
                break
        else:
            # Add after first import
            first_import = content.find('import ')
            if first_import != -1:
                end_line = content.find('\n', first_import)
                content = content[:end_line + 1] + 'import { useTheme } from "@/contexts/ThemeContext";\n' + content[end_line + 1:]
    
    # 2. Add isLight hook to all component functions that need it
    content, hooks_added = add_hook_to_all_functions(content)
    
    # 3. Fix quoted dark className patterns
    count = 0
    def make_conditional(m):
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
    
    pattern = r'className="([^"]*(?:bg-(?:slate|gray|zinc)-(?:700|800|900)|border-(?:white|slate|gray)/|border-(?:slate|gray)-(?:700|800)|bg-slate-9[0-9]+/)[^"]*)"'
    content = re.sub(pattern, make_conditional, content)
    
    name = path.split('\\')[-1]
    print(f'{name}: hooks={hooks_added} cls_fixes={count} {orig_size}->{len(content)}b')
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

for f in FILES:
    try:
        fix_file(f)
    except Exception as e:
        import traceback
        print(f'ERROR {f}: {e}')
        traceback.print_exc()

print('\nDone!')
