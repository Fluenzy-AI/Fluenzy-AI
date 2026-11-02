"""
Fix job-search page light theme.
Strategy:
1. Add useTheme import
2. Add isLight = resolvedTheme === 'light' || resolvedTheme === 'parchment'
3. Replace desktop section div background (line ~572)
4. Replace all dark hardcoded text/bg inside the desktop block
"""
import re

path = r'd:\video\New folder\Fluenzy-AI\src\app\train\job-search\page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add useTheme import after useSession import
old_import = 'import { useState, useEffect } from "react";'
new_import = '''import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";'''
content = content.replace(old_import, new_import, 1)

# 2. Add isLight after session line
old_session = 'const { data: session } = useSession();'
new_session = '''const { data: session } = useSession();
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light' || resolvedTheme === 'parchment';'''
content = content.replace(old_session, new_session, 1)

# 3. Fix the desktop wrapper div background
old_desktop_wrapper = 'className="hidden sm:block min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-blue-900/20 p-6"'
new_desktop_wrapper = '''className={`hidden sm:block min-h-screen p-6 transition-colors ${
          isLight
            ? 'bg-gradient-to-br from-slate-50 via-white to-violet-50/40'
            : 'bg-gradient-to-br from-gray-900 via-gray-900 to-blue-900/20'
        }`}'''
content = content.replace(old_desktop_wrapper, new_desktop_wrapper, 1)

# 4. Fix page title text-white
content = content.replace(
    '<h1 className="text-4xl font-bold text-white">\n                AI Job Search\n              </h1>',
    '''<h1 className={`text-4xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                AI Job Search
              </h1>''', 1
)

# 5. Fix subtitle text-gray-400
content = content.replace(
    '<p className="text-gray-400 text-lg">',
    '<p className={`text-lg ${isLight ? \'text-slate-500\' : \'text-gray-400\'}`}>',
    1
)

# 6. Fix session usage bar container bg-gray-800/50
content = content.replace(
    '"bg-gray-800/50 rounded-xl p-4 border border-gray-700"',
    '''{`rounded-xl p-4 border transition-colors ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-gray-800/50 border-gray-700'}`}''',
    1
)

# 7. Fix "Search Sessions" label text-gray-300
content = content.replace(
    '<span className="text-sm font-medium text-gray-300">Search Sessions</span>',
    '<span className={`text-sm font-medium ${isLight ? \'text-slate-700\' : \'text-gray-300\'}`}>Search Sessions</span>',
    1
)

# 8. Fix sessions count text-gray-400
content = content.replace(
    '<span className="text-sm text-gray-400">{sessionsUsed}/{sessionsLimit} used</span>',
    '<span className={`text-sm ${isLight ? \'text-slate-500\' : \'text-gray-400\'}`}>{sessionsUsed}/{sessionsLimit} used</span>',
    1
)

# 9. Fix progress track bg-gray-700
content = content.replace(
    '"h-2 bg-gray-700 rounded-full overflow-hidden"',
    '''{`h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-gray-700'}`}''',
    1
)

# 10. Fix history toggle button dark styles
content = content.replace(
    '"flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-700/50 rounded-lg border border-gray-700 transition-all"',
    '''{`flex items-center gap-2 px-4 py-2 text-sm rounded-lg border transition-all ${isLight ? 'text-slate-500 hover:text-slate-900 bg-white hover:bg-slate-50 border-slate-200' : 'text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-700/50 border-gray-700'}`}''',
    1
)

# 11. Fix modal / drawer headers - "text-white font-medium flex items-center gap-2"
content = content.replace(
    '<h3 className="text-white font-medium flex items-center gap-2">',
    '<h3 className={`font-medium flex items-center gap-2 ${isLight ? \'text-slate-900\' : \'text-white\'}`}>',
    2  # two modals
)

# 12. Fix modal close buttons "text-gray-400 hover:text-white"
content = content.replace(
    'className="text-gray-400 hover:text-white">',
    'className={`transition-colors ${isLight ? \'text-slate-400 hover:text-slate-700\' : \'text-gray-400 hover:text-white\'}`}>',
    2  # two modals
)

# 13. Fix form labels "text-white font-medium"
content = content.replace(
    '"flex items-center gap-2 text-white font-medium"',
    '''{`flex items-center gap-2 font-medium ${isLight ? 'text-slate-800' : 'text-white'}`}''',
    10  # multiple labels
)

# 14. Fix text inputs dark bg
content = content.replace(
    '"w-full bg-gray-700/50 border border-gray-600 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"',
    '''{`w-full border rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${isLight ? 'bg-white border-slate-200 text-slate-900 placeholder-slate-400' : 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400'}`}''',
    2  # two text inputs
)

# 15. Fix select dark bg
content = content.replace(
    '"w-full bg-gray-700/50 border border-gray-600 rounded-xl pl-12 pr-4 py-3.5 text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"',
    '''{`w-full border rounded-xl pl-12 pr-4 py-3.5 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-gray-700/50 border-gray-600 text-white'}`}''',
    1
)

# 16. Fix history item text dark
content = content.replace(
    '<p className="text-white text-sm font-medium">{item.query}</p>',
    '<p className={`text-sm font-medium ${isLight ? \'text-slate-900\' : \'text-white\'}`}>{item.query}</p>',
    1
)

print("Done applying light theme fixes.")
print(f"File size: {len(content)} bytes")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Written successfully.")
