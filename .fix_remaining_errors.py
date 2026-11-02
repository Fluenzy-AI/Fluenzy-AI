"""
Fix remaining isLight errors - targeted approach for each file.
"""
import re

HOOK = "  const { resolvedTheme } = useTheme();\n  const isLight = resolvedTheme === 'light' || resolvedTheme === 'parchment';\n"

# 1. GD private [roomId]/page.tsx - isLight used in dynamic() loading at module scope - must hardcode
for path in [
    r'd:\video\New folder\Fluenzy-AI\src\app\train\gd\private\[roomId]\page.tsx',
    r'd:\video\New folder\Fluenzy-AI\src\app\train\interview\private\[roomId]\page.tsx',
]:
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        c = f.read()
    # Replace isLight conditional in loading state (module scope, can't use hooks)
    c = re.sub(
        r'\$\{isLight \? "bg-white" : "bg-slate-900"\}',
        'bg-slate-900',
        c
    )
    with open(path, 'w', encoding='utf-8') as f:
        f.write(c)
    print('Fixed module-scope isLight in: ' + path.split('\\')[-1])

# 2. LiveInterviewRoom.tsx - find the inner component around L112
path = r'd:\video\New folder\Fluenzy-AI\src\components\LiveInterviewRoom.tsx'
with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    c = f.read()

# Find function just before L112
lines = c.split('\n')
# L112 is 0-indexed L111 in the list
# Search backwards from L111 for a function start
target_line = 111  # 0-indexed
for i in range(target_line, max(0, target_line-50), -1):
    line = lines[i]
    if re.match(r'^(function |const \w+ )', line) or ') => {' in line or ') {' in line:
        if 'function' in line or '=>' in line:
            # Found the function - add hook after it
            pos = sum(len(l)+1 for l in lines[:i+1])
            # Check if already has isLight
            ahead = c[pos:pos+300]
            if 'isLight' not in ahead and 'resolvedTheme' not in ahead:
                c = c[:pos] + HOOK + c[pos:]
                print('Added hook to LiveInterviewRoom inner component at L' + str(i+1) + ': ' + line[:60])
            else:
                print('LiveInterviewRoom: hook already present near L' + str(i+1))
            break

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)

# 3. PerformanceBreakdown.tsx L230 - find containing function  
path = r'd:\video\New folder\Fluenzy-AI\src\components\assessments\results\PerformanceBreakdown.tsx'
with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    c = f.read()

lines = c.split('\n')
target_line = 229  # 0-indexed
for i in range(target_line, max(0, target_line-60), -1):
    line = lines[i]
    if re.match(r'^(function |const \w+ )', line) or (') => {' in line and 'return' not in line):
        pos = sum(len(l)+1 for l in lines[:i+1])
        ahead = c[pos:pos+300]
        if 'isLight' not in ahead and 'resolvedTheme' not in ahead:
            c = c[:pos] + HOOK + c[pos:]
            print('Added hook to PerformanceBreakdown at L' + str(i+1) + ': ' + line[:60])
        else:
            print('PerformanceBreakdown: hook already near L' + str(i+1))
        break

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)

# 4. CompetitionGDBattleRoom.tsx L109
path = r'd:\video\New folder\Fluenzy-AI\src\components\competitions\CompetitionGDBattleRoom.tsx'
with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    c = f.read()

lines = c.split('\n')
target_line = 108  # 0-indexed
for i in range(target_line, max(0, target_line-60), -1):
    line = lines[i]
    if re.match(r'^(function |const \w+ )', line) or (') => {' in line and 'return' not in line):
        pos = sum(len(l)+1 for l in lines[:i+1])
        ahead = c[pos:pos+300]
        if 'isLight' not in ahead and 'resolvedTheme' not in ahead:
            c = c[:pos] + HOOK + c[pos:]
            print('Added hook to CompetitionGDBattleRoom at L' + str(i+1) + ': ' + line[:60])
        else:
            print('CompetitionGDBattleRoom: hook already near L' + str(i+1))
        break

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)

print('\nDone!')
