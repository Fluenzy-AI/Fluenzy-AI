"""
Fix ProfileClient.tsx light theme - targeted replacement of major dark structural elements.
Strategy: add useTheme import + isLight, then fix the top-level bg, card backgrounds, text-white.
"""
import re

path = r'd:\video\New folder\Fluenzy-AI\src\app\profile\ProfileClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add useTheme import after useSession import line
old_import = 'import { useSession } from "next-auth/react";'
new_import = 'import { useSession } from "next-auth/react";\nimport { useTheme } from "@/contexts/ThemeContext";'
content = content.replace(old_import, new_import, 1)

# 2. Add isLight after mobile detection setup
old_hook = '  // Mobile detection\n  const [isMobile, setIsMobile] = useState(false);'
new_hook = '  // Theme detection\n  const { resolvedTheme } = useTheme();\n  const isLight = resolvedTheme === \'light\' || resolvedTheme === \'parchment\';\n\n  // Mobile detection\n  const [isMobile, setIsMobile] = useState(false);'
content = content.replace(old_hook, new_hook, 1)

# 3. Fix main page background wrapper
old_bg = 'className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"'
new_bg = 'className={`min-h-screen transition-colors ${isLight ? \'bg-gradient-to-b from-slate-50 to-white\' : \'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950\'}`}'
content = content.replace(old_bg, new_bg, 1)

# 4. Fix Hero Profile Card background
old_card = 'className="relative overflow-hidden border-slate-700/50 bg-slate-900/60"'
new_card = 'className={`relative overflow-hidden ${isLight ? \'border-slate-200 bg-white shadow-sm\' : \'border-slate-700/50 bg-slate-900/60\'}`}'
content = content.replace(old_card, new_card, 1)

# 5. Fix avatar border - border-slate-900 (creates a white-on-white effect in light mode)
old_avatar = '"w-28 h-28 rounded-2xl border-4 border-slate-900 overflow-hidden bg-slate-800 shadow-xl"'
new_avatar = '{`w-28 h-28 rounded-2xl border-4 overflow-hidden shadow-xl ${isLight ? \'border-slate-100 bg-slate-200\' : \'border-slate-900 bg-slate-800\'}`}'
content = content.replace(old_avatar, new_avatar, 1)

# 6. Fix the locked-avatar overlay for upload (dark overlay)
old_overlay = '"absolute inset-0 rounded-2xl bg-slate-900/70 flex items-center justify-center"'
new_overlay = '{`absolute inset-0 rounded-2xl flex items-center justify-center ${isLight ? \'bg-white/70\' : \'bg-slate-900/70\'}`}'
content = content.replace(old_overlay, new_overlay, 1)

# 7. Fix the h1 name text (text-white)
old_h1 = '"text-2xl sm:text-3xl font-bold text-white tracking-tight"'
new_h1 = '{`text-2xl sm:text-3xl font-bold tracking-tight ${isLight ? \'text-slate-900\' : \'text-white\'}`}'
content = content.replace(old_h1, new_h1, 1)

# 8. Fix remaining Card backgrounds
old_card2 = '"border-slate-700/50 bg-slate-900/60"'
new_card2 = '{`${isLight ? \'border-slate-200 bg-white shadow-sm\' : \'border-slate-700/50 bg-slate-900/60\'}`}'
# Replace all occurrences (these are all the section cards)
content = content.replace(old_card2, new_card2)

# 9. Fix "font-semibold text-white" stat values
content = content.replace(
    '"font-semibold text-white"',
    '{`font-semibold ${isLight ? \'text-slate-900\' : \'text-white\'}`}'
)

# 10. Fix score/stat text-white values in stats grid
old_score = '"text-2xl font-black text-white"'
new_score = '{`text-2xl font-black ${isLight ? \'text-slate-900\' : \'text-white\'}`}'
content = content.replace(old_score, new_score)

# 11. Fix stat cards with border-white/10 bg-slate-950/40
old_stat_card = '"rounded-xl border border-white/10 bg-slate-950/40 p-3.5 flex flex-col justify-between"'
new_stat_card = '{`rounded-xl border p-3.5 flex flex-col justify-between ${isLight ? \'border-slate-200 bg-slate-50\' : \'border-white/10 bg-slate-950/40\'}`}'
content = content.replace(old_stat_card, new_stat_card)

# 12. Fix close/action button "bg-white/5 hover:bg-white/10 border border-white/10 ... text-slate-400 hover:text-white"
old_close_btn = '"w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all flex-shrink-0"'
new_close_btn = '{`w-9 h-9 rounded-xl border flex items-center justify-center transition-all flex-shrink-0 ${isLight ? \'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-500 hover:text-slate-900\' : \'bg-white/5 hover:bg-white/10 border-white/10 text-slate-400 hover:text-white\'}`}'
content = content.replace(old_close_btn, new_close_btn)

# 13. Fix modal/dialog header background
old_modal_header = '"px-5 md:px-6 py-4 border-b border-white/10 flex items-center justify-between gap-4 shrink-0 bg-slate-900/50"'
new_modal_header = '{`px-5 md:px-6 py-4 border-b flex items-center justify-between gap-4 shrink-0 ${isLight ? \'border-slate-200 bg-slate-50\' : \'border-white/10 bg-slate-900/50\'}`}'
content = content.replace(old_modal_header, new_modal_header)

# 14. Fix modal backdrop (overlay)  
old_modal_backdrop = '"fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"'
new_modal_backdrop = '"fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"'
# Keep as-is (modal overlay is intentionally dark in both themes)

# 15. Fix text-sm font-bold text-white module name
old_mod = '"text-sm font-bold text-white mt-1 truncate"'
new_mod = '{`text-sm font-bold mt-1 truncate ${isLight ? \'text-slate-900\' : \'text-white\'}`}'
content = content.replace(old_mod, new_mod)

print(f"Done. File size: {len(content)} bytes")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Written successfully.")
