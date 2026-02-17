#!/bin/bash
# Pre-build script for Render - Install PyTorch CPU-only first
# This runs BEFORE pip install -r requirements.txt

echo "Installing PyTorch CPU-only (avoiding CUDA binaries)..."
pip install --index-url https://download.pytorch.org/whl/cpu torch==2.2.2 torchvision==0.17.2

echo "Installing remaining dependencies..."
pip install -r requirements.txt

echo "Build complete!"
