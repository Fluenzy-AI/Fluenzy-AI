"""
Fix analytics/report page.tsx - replace quoted className dark patterns.
"""
import re

path = r'd:\video\New folder\Fluenzy-AI\src\app\analytics\report\page.tsx'
with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

print(f"Initial size: {len(content)}")

count = 0

# Fix quoted className strings with specific dark patterns
# Pattern: className="... bg-slate-900 ..." or className="... bg-gray-900 ..."

def make_conditional(m):
    global count
    orig = m.group(0)
    cls_content = m.group(1)
    
    # Replace dark patterns with conditional expressions
    new_cls = cls_content
    
    # bg-slate-900 -> conditional  
    if 'bg-slate-900' in new_cls and 'bg-white' not in new_cls:
        new_cls = new_cls.replace('bg-slate-900', '${isLight ? "bg-white" : "bg-slate-900"}')
    if 'bg-gray-900' in new_cls and 'bg-white' not in new_cls:
        new_cls = new_cls.replace('bg-gray-900', '${isLight ? "bg-white" : "bg-gray-900"}')
    if 'bg-slate-800' in new_cls:
        new_cls = new_cls.replace('bg-slate-800', '${isLight ? "bg-slate-100" : "bg-slate-800"}')
    if 'bg-gray-800' in new_cls:
        new_cls = new_cls.replace('bg-gray-800', '${isLight ? "bg-slate-100" : "bg-gray-800"}')
    if 'border-slate-800' in new_cls:
        new_cls = new_cls.replace('border-slate-800', '${isLight ? "border-slate-200" : "border-slate-800"}')
    if 'border-gray-800' in new_cls:
        new_cls = new_cls.replace('border-gray-800', '${isLight ? "border-slate-200" : "border-gray-800"}')
    if 'border-slate-700' in new_cls:
        new_cls = new_cls.replace('border-slate-700', '${isLight ? "border-slate-300" : "border-slate-700"}')
    if 'text-white' in new_cls and 'bg-' not in orig:
        new_cls = new_cls.replace('text-white', '${isLight ? "text-slate-900" : "text-white"}')
        
    if new_cls != cls_content:
        count += 1
        return f'className={{`{new_cls}`}}'
    return orig

# Match className="..." but not className={...}
pattern = r'className="([^"]*(?:bg-(?:slate|gray)-(?:700|800|900)|border-(?:slate|gray)-(?:700|800))[^"]*)"'
content = re.sub(pattern, make_conditional, content)
print(f"Converted {count} className strings to template literals")

# Fix text-white as separate standalone className (not inside compound ones)
text_white_pattern = r'className="(text-white)"'
def fix_text_white(m):
    global count
    count += 1
    return 'className={isLight ? "text-slate-900" : "text-white"}'
content = re.sub(text_white_pattern, fix_text_white, content)

# Also fix min-h-screen bg pattern
min_h_pattern = r'className="(min-h-screen\s+(?:bg-gray-900|bg-slate-900|bg-zinc-900)[^"]*)"'
def fix_min_h(m):
    global count
    orig_cls = m.group(1)
    new_cls = orig_cls
    for dark in ['bg-gray-900', 'bg-slate-900', 'bg-zinc-900']:
        if dark in new_cls:
            new_cls = new_cls.replace(dark, '${isLight ? "bg-slate-50" : "' + dark + '"}')
    if new_cls != orig_cls:
        count += 1
        return f'className={{`{new_cls}`}}'
    return m.group(0)
content = re.sub(min_h_pattern, fix_min_h, content)

print(f"Total fixes: {count}")
print(f"Final size: {len(content)}")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Written.")
