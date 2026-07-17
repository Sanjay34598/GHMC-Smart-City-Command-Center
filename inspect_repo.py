from pathlib import Path
files = [
    'frontend/package.json',
    'frontend/src/main.tsx',
    'frontend/src/app/App.tsx',
    'frontend/src/pages/CivicSenseBoardPage.tsx',
    'vercel.json',
]
for f in files:
    print(f'===== {f} =====')
    path = Path(f)
    for i, line in enumerate(path.read_text(encoding='utf-8').splitlines(), 1):
        print(f'{i}: {line}')
    print()
