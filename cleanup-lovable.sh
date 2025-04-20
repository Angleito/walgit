#!/bin/bash

echo "Searching for 'lovable' references in the project..."

# Find all files containing 'lovable' (case insensitive)
FILES_WITH_LOVABLE=$(grep -ri "lovable" --include="*.{js,jsx,ts,tsx,json,html,css,md}" .)

if [ -z "$FILES_WITH_LOVABLE" ]; then
  echo "No 'lovable' references found in code files."
else
  echo "Found 'lovable' references in the following files:"
  grep -ri "lovable" --include="*.{js,jsx,ts,tsx,json,html,css,md}" . -l
  
  echo -e "\nPlease review these files and remove any 'lovable' references."
fi

# Check package.json for lovable dependencies
if grep -q "lovable" ./WalGit-frontend/package.json; then
  echo -e "\nFound 'lovable' dependencies in package.json. Please remove them manually."
  grep -n "lovable" ./WalGit-frontend/package.json
fi

echo -e "\nChecking for lovable node modules..."
if [ -d "./WalGit-frontend/node_modules/lovable-tagger" ]; then
  echo "Found lovable-tagger module. Please run 'npm uninstall lovable-tagger' in the WalGit-frontend directory."
fi

echo -e "\nChecklist for manual cleanup:"
echo "1. Remove any 'lovable' dependencies from package.json"
echo "2. Run 'npm uninstall' for any lovable packages"
echo "3. Remove any imports of lovable components in your code"
echo "4. Search for and replace any hardcoded 'lovable' strings"
echo "5. Check for lovable references in .env files or other config files"
