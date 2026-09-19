#!/usr/bin/env python3
"""
MockForge - One-Click Git Push Script
Automatically stages, commits, and pushes all project changes to GitHub.
"""

import subprocess
import sys
from datetime import datetime
import os

# Set console title on Windows
if sys.platform == 'win32':
    os.system('title MockForge - Push to GitHub')

def run_cmd(cmd, check=True):
    """Run a shell command and return stdout string."""
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            text=True,
            capture_output=True,
            cwd=os.path.dirname(os.path.abspath(__file__))
        )
        return result
    except Exception as e:
        print(f"❌ Command failed: {cmd}")
        print(f"Error: {e}")
        return None

def main():
    print("=" * 60)
    print("   🚀 MockForge - Automatic GitHub Sync & Push")
    print("=" * 60)

    # 1. Check current status
    print("\n[1/4] 🔍 Checking repository status...")
    status_res = run_cmd("git status --porcelain")

    if status_res is None or status_res.returncode != 0:
        print("❌ Git repository not detected or git is not installed.")
        if status_res and status_res.stderr:
            print(status_res.stderr)
        input("\nPress Enter to exit...")
        return

    changes = status_res.stdout.strip()

    if not changes:
        print("✨ No local changes detected. Your working directory is clean!")
        print("Checking remote status...")
        push_check = run_cmd("git push origin main")
        if push_check and push_check.returncode == 0:
            print("✅ Already up to date with GitHub origin/main.")
        else:
            print(push_check.stdout if push_check else "")
            print(push_check.stderr if push_check else "")
        input("\nPress Enter to exit...")
        return

    print("Found modified / new files:")
    print("-" * 40)
    print(changes)
    print("-" * 40)

    # 2. Commit message prompt
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    default_msg = f"Update MockForge: {now_str}"

    print(f"\nDefault commit message: '{default_msg}'")
    try:
        user_msg = input("Enter custom commit message (or press ENTER to use default): ").strip()
    except EOFError:
        user_msg = ""

    commit_msg = user_msg if user_msg else default_msg

    # 3. Stage all changes
    print("\n[2/4] 📦 Staging all changes (git add -A)...")
    add_res = run_cmd("git add -A")
    if add_res.returncode != 0:
        print(f"❌ Failed to stage changes:\n{add_res.stderr}")
        input("\nPress Enter to exit...")
        return

    # 4. Commit changes
    print(f"\n[3/4] 💾 Committing: \"{commit_msg}\"...")
    commit_res = run_cmd(f'git commit -m "{commit_msg}"')
    if commit_res.returncode != 0:
        print(f"⚠️ Commit note:\n{commit_res.stdout}\n{commit_res.stderr}")

    # 5. Push to GitHub
    print("\n[4/4] 🚀 Pushing to GitHub (origin main)...")
    push_res = run_cmd("git push origin main")

    if push_res.returncode == 0:
        print("\n" + "=" * 60)
        print("🎉 SUCCESS! All changes have been pushed to GitHub!")
        print("Vercel will automatically build & deploy the latest changes.")
        print("=" * 60)
    else:
        print(f"\n❌ Push failed:\n{push_res.stderr}\n{push_res.stdout}")

    print()
    input("Press Enter to close...")

if __name__ == "__main__":
    main()
