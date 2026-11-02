"""
Fix history page: add isLight and fix dark-locked modal header, stat cards, close buttons, text-white patterns.
"""
import re

path = r'd:\video\New folder\Fluenzy-AI\src\app\history\page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add isLight after currentTheme declarations - find the pattern
old_theme = 'const currentTheme = themeConfig[resolvedTheme] || themeConfig.dark;'
# Only add isLight once (it may appear in multiple functions, add after first occurrence)
first_idx = content.find(old_theme)
if first_idx != -1:
    # Find the end of that line
    end_idx = content.find('\n', first_idx) + 1
    content = (
        content[:end_idx]
        + "  const isLight = resolvedTheme === 'parchment' || resolvedTheme === 'light';\n"
        + content[end_idx:]
    )
    print("Added isLight after first currentTheme declaration")

# 2. Fix modal header bg/border (dark-locked)
old_modal_hdr = '"px-5 md:px-6 py-4 border-b border-white/10 flex items-center justify-between gap-4 shrink-0 bg-slate-900/50"'
new_modal_hdr = '{`px-5 md:px-6 py-4 border-b flex items-center justify-between gap-4 shrink-0 ${isLight ? \'border-slate-200 bg-slate-50\' : \'border-white/10 bg-slate-900/50\'}`}'
content = content.replace(old_modal_hdr, new_modal_hdr)

# 3. Fix close button
old_close = '"w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all flex-shrink-0"'
new_close = '{`w-9 h-9 rounded-xl border flex items-center justify-center transition-all flex-shrink-0 ${isLight ? \'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-500 hover:text-slate-800\' : \'bg-white/5 hover:bg-white/10 border-white/10 text-slate-400 hover:text-white\'}`}'
content = content.replace(old_close, new_close)

# 4. Fix all stat mini cards (border-white/10 bg-slate-950/40)
old_stat = '"rounded-xl border border-white/10 bg-slate-950/40 p-3.5 flex flex-col justify-between"'
new_stat = '{`rounded-xl border p-3.5 flex flex-col justify-between ${isLight ? \'border-slate-200 bg-slate-50\' : \'border-white/10 bg-slate-950/40\'}`}'
content = content.replace(old_stat, new_stat)

# 5. Fix text-2xl font-black text-white in score / turn prompts
content = content.replace(
    '"text-2xl font-black text-white"',
    '{`text-2xl font-black ${isLight ? \'text-slate-900\' : \'text-white\'}`}'
)

# 6. Fix "text-sm font-bold text-white mt-1 truncate" (module name)
content = content.replace(
    '"text-sm font-bold text-white mt-1 truncate"',
    '{`text-sm font-bold mt-1 truncate ${isLight ? \'text-slate-900\' : \'text-white\'}`}'
)

# 7. Fix "text-2xl font-black text-white mt-1" (turn prompts)
content = content.replace(
    '"text-2xl font-black text-white mt-1"',
    '{`text-2xl font-black mt-1 ${isLight ? \'text-slate-900\' : \'text-white\'}`}'
)

print(f"Done. File size: {len(content)} bytes")
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Written successfully.")
