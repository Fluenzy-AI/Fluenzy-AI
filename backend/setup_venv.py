#!/usr/bin/env python3
"""
Setup script to create and configure Python virtual environment for the backend.
This script checks if venv exists, creates it if needed, and installs dependencies.
"""
import os
import sys
import subprocess
import shutil

def setup_venv():
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    venv_path = os.path.join(script_dir, "venv")
    requirements_path = os.path.join(script_dir, "requirements.txt")
    
    # Check if virtual environment exists
    if not os.path.exists(venv_path):
        print(f"Creating virtual environment at {venv_path}...")
        try:
            # Try using python3.11 first
            python_exes = ["python3.11", "python311", "python"]
            python_exe = None
            
            for py in python_exes:
                if shutil.which(py):
                    python_exe = py
                    break
            
            if not python_exe:
                print("Error: Python 3.11 not found. Please install Python 3.11")
                sys.exit(1)
            
            # Create virtual environment
            subprocess.run([python_exe, "-m", "venv", venv_path], check=True)
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
    
    # Install dependencies
    print("Installing dependencies from requirements.txt...")
    subprocess.run([venv_python, "-m", "pip", "install", "-r", requirements_path], check=True)
    
    print("Setup completed successfully!")

if __name__ == "__main__":
    setup_venv()
