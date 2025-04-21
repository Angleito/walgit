#!/bin/bash

# Change to the frontend directory and run the test
cd "$(dirname "$0")/WalGit-frontend" && npm run test-gh-pages
