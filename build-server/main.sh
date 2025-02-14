#!/bin/bash

# Make script fail on any error
set -e

export GIT_REPO_URL="$GIT_REPO_URL"

# Add error handling for git clone
if [ -z "$GIT_REPO_URL" ]; then
    echo "Error: GIT_REPO_URL environment variable is not set"
    exit 1
fi

git clone "$GIT_REPO_URL" /home/app/output || {
    echo "Error: Failed to clone repository"
    exit 1
}

exec node script.js