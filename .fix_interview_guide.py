"""Add isLight hook to all inner components in interview-guide/page.tsx"""
import re

path = r'd:\video\New folder\Fluenzy-AI\src\app\interview-guide\page.tsx'
with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

HOOK = "  const { resolvedTheme } = useTheme();\n  const isLight = resolvedTheme === 'light' || resolvedTheme === 'parchment';\n"

# Functions that need isLight based on error lines
# L103: SectionAccordion, L212: QuestionCard, L257: IntroductionCard, L299: InterviewGuidePageContent  
targets = [
    # (search string, description)
    ('const SectionAccordion = ({', 'SectionAccordion'),
    ('const QuestionCard = ({', 'QuestionCard'),
    ('const IntroductionCard = ({', 'IntroductionCard'),
    ('const InterviewGuidePageContent = () => {', 'InterviewGuidePageContent'),
    ('const InterviewGuidePage = () => {', 'InterviewGuidePage'),
]

count = 0
for trigger, name in targets:
    idx = content.find(trigger)
    if idx == -1:
        print(f'NOT FOUND: {name}')
        continue
    
    # Find opening brace of function body
    # For arrow functions, find => {
    # For others, find {
    arrow_idx = content.find(') => {', idx)
    brace_idx = content.find(') {', idx)
    
    # Find next newline after opening brace
    func_open = -1
    if arrow_idx != -1 and (brace_idx == -1 or arrow_idx < brace_idx + 30):
        func_open = arrow_idx + len(') => {')
    elif brace_idx != -1:
        func_open = brace_idx + len(') {')
    
    if func_open == -1:
        print(f'  Could not find opening brace for {name}')
        continue
    
    insert_pos = content.find('\n', func_open) + 1
    ahead = content[insert_pos:insert_pos+300]
    if 'isLight' in ahead or 'resolvedTheme' in ahead:
        print(f'  {name}: already has hook')
        continue
    
    content = content[:insert_pos] + HOOK + content[insert_pos:]
    count += 1
    print(f'  Added hook to {name}')

print(f'\nTotal hooks added: {count}')
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Written.')
