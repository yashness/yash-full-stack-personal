#!/usr/bin/env python
"""Post-generation hook for cookiecutter template."""

import os
import shutil
import stat
import subprocess

# Cookiecutter context variables
COPILOT_UI = "{{ cookiecutter.copilot_ui }}" == "True"


def remove_copilot_files():
    """Remove copilot-related files if copilot_ui is disabled."""
    if COPILOT_UI:
        print("✓ Copilot UI enabled - keeping copilot files")
        return

    # Files to remove when copilot_ui is false
    copilot_files = [
        os.path.join("frontend", "app", "copilot", "page.tsx"),
        os.path.join("frontend", "components", "copilot-chat.tsx"),
        os.path.join("frontend", "app", "api", "chat", "route.ts"),
        os.path.join("backend", "src", "chat.py"),
    ]

    # Directories to remove when copilot_ui is false (order matters - children first)
    copilot_dirs = [
        os.path.join("frontend", "components", "copilot"),
        os.path.join("frontend", "app", "copilot"),
        os.path.join("frontend", "app", "api", "chat"),
    ]

    for filepath in copilot_files:
        if os.path.exists(filepath):
            os.remove(filepath)
            print(f"✓ Removed {filepath}")

    # Remove directories recursively
    for dirpath in copilot_dirs:
        if os.path.exists(dirpath):
            shutil.rmtree(dirpath)
            print(f"✓ Removed directory {dirpath}")

    print("✓ Copilot UI disabled - removed copilot files")


def make_scripts_executable():
    """Make all shell scripts in the scripts folder executable."""
    scripts_dir = os.path.join(os.getcwd(), "scripts")

    if os.path.exists(scripts_dir):
        for filename in os.listdir(scripts_dir):
            if filename.endswith(".sh"):
                filepath = os.path.join(scripts_dir, filename)
                # Add execute permissions
                current_mode = os.stat(filepath).st_mode
                os.chmod(filepath, current_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)
                print(f"✓ Made {filename} executable")


def init_git_repository():
    """Initialize git repository."""
    try:
        subprocess.run(["git", "init"], check=True, capture_output=True)
        print("✓ Initialized git repository")
    except subprocess.CalledProcessError:
        print("⚠ Could not initialize git repository")
    except FileNotFoundError:
        print("⚠ Git not found, skipping repository initialization")


def main():
    """Run post-generation tasks."""
    print("\n🚀 Running post-generation setup...\n")

    remove_copilot_files()
    make_scripts_executable()
    init_git_repository()

    print("\n✅ Project setup complete!")
    print("\nNext steps:")
    print("  1. cd {{ cookiecutter.project_slug }}")
    print("  2. Copy .env.example files and add your secrets")
    print("  3. task setup")
    print("  4. task dev")


if __name__ == "__main__":
    main()
