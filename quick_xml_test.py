"""
Test XML loading from ICS3U folder
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
from python_runner import runner

async def test():
    script_path = os.path.join("storage", "ICS3U_Justin-assignment03", "test_xml_loading.py")
    with open(script_path, 'r') as f:
        script_content = f.read()
    
    source_dir = os.path.abspath(os.path.join("storage", "ICS3U_Justin-assignment03"))
    
    result = await runner.run_python_file(
        session_id="xml_test",
        file_content=script_content,
        file_name="test_xml_loading.py",
        source_dir=source_dir
    )
    
    print("STDOUT:")
    print(result['stdout'])
    if result['stderr']:
        print("\nSTDERR:")
        print(result['stderr'])
    
    runner.cleanup_environment("xml_test")

asyncio.run(test())
