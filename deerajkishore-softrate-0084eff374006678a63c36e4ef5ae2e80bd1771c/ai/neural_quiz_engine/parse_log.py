
import sys

log_file = "debug_output_final_v4.txt"
try:
    with open(log_file, "r", encoding="utf-16-le", errors='ignore') as f:
        content = f.read()
    
    if "Traceback" in content:
        print("Found Traceback. Saving to traceback.txt")
        start = content.rfind("Traceback")
        with open("traceback.txt", "w", encoding="utf-8") as tf:
            tf.write(content[start:])
    else:
        print("No traceback found. Last 500 chars:")
        print(content[-500:])

except Exception as e:
    print(f"Error reading log: {e}")
