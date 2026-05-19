import os
import re
import sys

def get_import_group(line):
    # Determine the group of the import
    if re.search(r'from\s+["\']@/type/', line) or re.search(r'import\s+type\s+', line):
        return 4
    if re.search(r'from\s+["\']@/assets/', line) or re.search(r'import\s+["\']@/assets/', line) or re.search(r'\.(css|scss|less|png|jpg|svg|json)["\']', line):
        return 5
    if re.search(r'from\s+["\']@/components/', line) or re.search(r'from\s+["\']@/tw', line) or re.search(r'from\s+["\']@/app/', line) or re.search(r'from\s+["\']\./', line) or re.search(r'from\s+["\']\.\./', line):
        return 3
    if re.search(r'from\s+["\']@/', line):
        return 2
    return 1

def fix_imports_in_file(filepath):
    with open(filepath, 'r') as f:
        lines = f.readlines()
        
    import_lines = []
    other_lines = []
    
    in_import = False
    current_import = ""
    
    # Simple parser for imports
    i = 0
    while i < len(lines):
        line = lines[i]
        if line.strip().startswith("import "):
            if ";" in line or "from" in line and (line.strip().endswith(";") or line.strip().endswith("'") or line.strip().endswith('"')):
                import_lines.append((get_import_group(line), line))
            else:
                in_import = True
                current_import = line
        elif in_import:
            current_import += line
            if ";" in line or "from" in line and (line.strip().endswith(";") or line.strip().endswith("'") or line.strip().endswith('"')):
                in_import = False
                import_lines.append((get_import_group(current_import), current_import))
        else:
            other_lines.append(line)
        i += 1
        
    if not import_lines:
        return False
        
    # Remove leading empty lines from other_lines
    while other_lines and other_lines[0].strip() == "":
        other_lines.pop(0)
        
    # Sort imports by group, then alphabetically within group
    import_lines.sort(key=lambda x: (x[0], x[1]))
    
    new_content = ""
    current_grp = -1
    for grp, imp in import_lines:
        if current_grp != -1 and current_grp != grp:
            new_content += "\n"
        new_content += imp
        current_grp = grp
        
    new_content += "\n" + "".join(other_lines)
    
    with open(filepath, 'w') as f:
        f.write(new_content)
        
    return True

files = [
    "src/type/store-manager/store.ts",
    "src/type/store-manager/qr.purchase.ts",
    "src/type/store-manager/streak.ts",
    "src/type/store-manager/stamp.ts",
    "src/type/store-manager/staff.ts",
    "src/type/store-manager/detail.ts",
    "src/type/store-manager/reward.ts",
    "src/type/store-manager/transaction.ts",
    
    "src/store/store-manager/create-store-store.ts",
    "src/store/store-manager/qr-store.ts",
    "src/store/store-manager/streak-store.ts",
    "src/store/store-manager/stamp-store.ts",
    "src/store/store-manager/staff-store.ts",
    "src/store/store-manager/detail-store.ts",
    "src/store/store-manager/reward-store.ts",
    "src/store/store-manager/subscription-store.ts",
    "src/store/store-manager/transaction.ts",
    
    "src/services/store-manager/qr-service.ts",
    "src/services/store-manager/streak-service.ts",
    "src/services/store-manager/stamp-service.ts",
    "src/services/store-manager/staff-service.ts",
    "src/services/store-manager/detail-service.ts",
    "src/services/store-manager/reward-service.ts",
    "src/services/store-manager/subscription-service.ts",
    "src/services/store-manager/transactions-service.ts",
    
    "src/components/store_manager/create-store/store-step.tsx",
    "src/components/store_manager/create-store/business-step.tsx",
    "src/components/store_manager/create-store/location-step.tsx",
    "src/components/store_manager/stamp/stamp-card.tsx",
    "src/components/store_manager/stamp/reward-picker-modal.tsx",
    "src/components/store_manager/streak/streak-card.tsx",
    
    "src/app/(store_manager)/stores.tsx",
    "src/app/(store_manager)/store/create-store.tsx",
    "src/app/(store_manager)/subscription.tsx",
    "src/app/(store_manager)/transactions.tsx"
]

import glob
# add globs
for g in ["src/app/(store_manager)/qr/*.tsx", "src/app/(store_manager)/streak/*.tsx", "src/app/(store_manager)/stamp/*.tsx", "src/app/(store_manager)/staff/*.tsx", "src/app/(store_manager)/detail/*.tsx", "src/app/(store_manager)/reward/*.tsx"]:
    files.extend(glob.glob(g))

count = 0
for f in set(files):
    if os.path.exists(f):
        if fix_imports_in_file(f):
            count += 1
            print(f"Fixed {f}")
print(f"Fixed {count} files")
