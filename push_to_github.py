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

def run_cmd(cmd):
    """Run a shell command and return CompletedProcess object."""
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
        print(f"❌ Command execution error: {cmd}")
        print(f"Error: {e}")
        return None

def check_git_config():
    """Ensure Git author name and email are configured."""
    name_res = run_cmd("git config user.name")
    email_res = run_cmd("git config user.email")
    
    name = name_res.stdout.strip() if name_res and name_res.returncode == 0 else ""
    email = email_res.stdout.strip() if email_res and email_res.returncode == 0 else ""
    
    if not name:
        print("⚙️ Setting local Git author name: Muzammil Ahmed")
        run_cmd('git config user.name "Muzammil Ahmed"')
    if not email:
        print("⚙️ Setting local Git author email: academytechandgraphica098@gmail.com")
        run_cmd('git config user.email "academytechandgraphica098@gmail.com"')

def main():
    print("=" * 60)
    print("   🚀 MockForge - Automatic GitHub Sync & Push")
    print("=" * 60)

    # 0. Check Git author configuration
    check_git_config()

    # 1. Check current repository status
    print("\n[1/4] 🔍 Checking repository status...")
    status_res = run_cmd("git status --porcelain")

    if status_res is None or status_res.returncode != 0:
        print("❌ Git repository not detected or git is not installed.")
        if status_res and status_res.stderr:
            print(status_res.stderr)
        input("\nPress Enter to exit...")
        return

    changes = status_res.stdout.strip()

    # Check for unpushed commits
    unpushed_res = run_cmd("git log origin/main..HEAD --oneline")
    unpushed_commits = unpushed_res.stdout.strip() if unpushed_res and unpushed_res.returncode == 0 else ""

    if not changes and not unpushed_commits:
        print("✨ No local changes detected and no unpushed commits.")
        print("✅ Everything is already up to date with GitHub origin/main!")
        input("\nPress Enter to exit...")
        return

    if changes:
        print("\nFound modified / new files:")
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
            print(f"❌ Commit failed:\n{commit_res.stderr}\n{commit_res.stdout}")
            input("\nPress Enter to exit...")
            return
        else:
            print(f"✅ Committed successfully:\n{commit_res.stdout.strip()}")
    else:
        print("📦 No uncommitted file changes. Found unpushed local commit(s):")
        print(unpushed_commits)

    # 5. Push to GitHub
    print("\n[4/4] 🚀 Pushing to GitHub (origin main)...")
    push_res = run_cmd("git push origin main")

    if push_res and push_res.returncode == 0:
        print("\n" + "=" * 60)
        print("🎉 SUCCESS! All changes have been pushed to GitHub!")
        if push_res.stdout.strip():
            print(push_res.stdout.strip())
        if push_res.stderr.strip():
            print(push_res.stderr.strip())
        print("Vercel will automatically build & deploy the latest changes.")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("❌ Push failed!")
        if push_res:
            print(push_res.stderr if push_res.stderr else push_res.stdout)
        print("=" * 60)

    print()
    input("Press Enter to close...")

if __name__ == "__main__":
    main()
