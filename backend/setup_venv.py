#!/usr/bin/env python3
"""
Setup script to create and configure Python virtual environment for the backend.
This script checks if venv exists, creates it if needed, and installs dependencies.
"""
import os
import sys
import subprocess
import shutil
from typing import Optional, List

def setup_venv():
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    venv_path = os.path.join(script_dir, "venv")
    requirements_path = os.path.join(script_dir, "requirements.txt")

    def get_python_version(cmd: List[str]) -> Optional[str]:
        try:
            result = subprocess.run(
                cmd + ["-c", "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')"],
                capture_output=True,
                text=True,
                check=True
            )
            return result.stdout.strip()
        except Exception:
            return None

    # Prefer Python 3.11 because mediapipe/opencv wheels are stable there.
    candidate_cmds = [
        ["py", "-3.11"],
        ["python3.11"],
        ["python311"],
        ["python"],
    ]
    python_cmd = None
    python_version = None
    for cmd in candidate_cmds:
        if shutil.which(cmd[0]):
            version = get_python_version(cmd)
            if version == "3.11":
                python_cmd = cmd
                python_version = version
                break
            if python_cmd is None and version:
                python_cmd = cmd
                python_version = version

    if python_cmd is None:
        print("Error: Python is not available in PATH.")
        sys.exit(1)

    if python_version != "3.11":
        print(
            f"Error: Detected Python {python_version or 'unknown'}, but backend requires Python 3.11.\n"
            "Please install Python 3.11 and run again. On Windows, ensure `py -3.11` works."
        )
        sys.exit(1)
    
    # Check if virtual environment exists
    if not os.path.exists(venv_path):
        print(f"Creating virtual environment at {venv_path}...")
        try:
            # Create virtual environment
            subprocess.run(python_cmd + ["-m", "venv", venv_path], check=True)
            print("Virtual environment created successfully.")
        except Exception as e:
            print(f"Error creating virtual environment: {e}")
            sys.exit(1)
    else:
        print(f"Virtual environment already exists at {venv_path}")
    
    # Determine the Python executable in the venv
    if sys.platform == "win32":
        venv_python = os.path.join(venv_path, "Scripts", "python.exe")
    else:
        venv_python = os.path.join(venv_path, "bin", "python")
    
    # Upgrade pip
    print("Upgrading pip...")
    subprocess.run([venv_python, "-m", "pip", "install", "--upgrade", "pip"], check=True)
    subprocess.run([venv_python, "-m", "pip", "install", "--upgrade", "setuptools", "wheel"], check=True)
    
    # Install dependencies
    print("Installing dependencies from requirements.txt...")
    subprocess.run([venv_python, "-m", "pip", "install", "--prefer-binary", "-r", requirements_path], check=True)
    
    print("Setup completed successfully!")

if __name__ == "__main__":
    setup_venv()
