import os

files_to_patch = [
    "cuti.html",
    "pelanggaran.html",
    "dashboard/index.html",
    "tip.html",
    "peminjaman.html",
    "peminjaman_admin.html",
    "karyawan.html",
    "users.html"
]

for file in files_to_patch:
    if not os.path.exists(file):
        print(f"File not found: {file}")
        continue
    
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    prefix = "../" if "/" in file else ""
    base_dir = ".." if "/" in file else "."
    
    # 1. Inject CSS links
    css_links = f'  <link rel="stylesheet" href="{prefix}shared/design-tokens.css">\n  <link rel="stylesheet" href="{prefix}shared/shell.css">\n  <style>'
    
    if '<link rel="stylesheet" href="' + prefix + 'shared/design-tokens.css">' not in content:
        content = content.replace('<style>', css_links, 1)
        
    # 2. Inject shell.js
    js_link = f'  <script src="{prefix}shared/shell.js" data-base="{base_dir}"></script>\n</body>'
    
    if '<script src="' + prefix + 'shared/shell.js"' not in content:
        # handle different spacing/newlines before </body>
        content = content.replace('</body>', js_link)
        
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print(f"Patched {file}")
