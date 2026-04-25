import sys
import os

# Adds lexicore\ to Python path so 'from backend.x import y' works in all tests
sys.path.insert(0, os.path.dirname(__file__))