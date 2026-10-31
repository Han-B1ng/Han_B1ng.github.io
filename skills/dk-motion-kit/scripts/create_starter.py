#!/usr/bin/env python3
"""Copy the bundled starter into an empty destination, without overwriting work."""
import argparse
from pathlib import Path
import shutil

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("destination", type=Path)
args = parser.parse_args()
source = Path(__file__).resolve().parents[1] / "assets" / "starter"
target = args.destination.expanduser().resolve()
if target == source or source in target.parents or target in source.parents:
    parser.error("Destination must be outside the bundled starter tree")
if target.exists() and (not target.is_dir() or any(target.iterdir())):
    parser.error("Destination must be empty; existing work will not be overwritten")
shutil.copytree(source, target, dirs_exist_ok=True,
                ignore=shutil.ignore_patterns("node_modules", "dist", ".DS_Store", "test-results", "__pycache__"))
print(f"Created {target}. Run npm install, then npm run dev in that directory.")
