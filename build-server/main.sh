#!/bin/bash

# Make script fail on any error
set -e

export GIT_REPO_URL="$GIT_REPO_URL"

# Get the directory of the current script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "Script is running from: $SCRIPT_DIR"

# Define SSH key path
SSH_KEY_PATH="$SCRIPT_DIR/ca.pem"

# Create PEM file from environment variable
if [ -n "$KAFKA_SSH_KEY" ]; then
    echo "$KAFKA_SSH_KEY" > "$SSH_KEY_PATH"
    chmod 600 "$SSH_KEY_PATH"
    echo "SSH key created at: $SSH_KEY_PATH"
else
    echo "Warning: SSH_PRIVATE_KEY environment variable is not set"
fi

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