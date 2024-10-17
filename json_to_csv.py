import json
import csv
import os
import sys
import codecs

def process_json_files(input_folder, output_csv):
    all_data = []
    all_keys = set()

    # Iterate through all JSON files in the input folder
    for filename in os.listdir(input_folder):
        if filename.endswith('.json'):
            file_path = os.path.join(input_folder, filename)
            try:
                with codecs.open(file_path, 'r', encoding='utf-8-sig') as file:
                    content = file.read()
                    if not content.strip():
                        print(f"Warning: {filename} is empty. Skipping.")
                        continue
                    data = json.loads(content)
                
                # Ensure data is a list of dictionaries
                if not isinstance(data, list):
                    data = [data]
                
                # Skip empty lists
                if not data:
                    print(f"Warning: No data found in {filename}. Skipping.")
                    continue
                
                # Collect all unique keys and handle missing fields
                for item in data:
                    if not isinstance(item, dict):
                        print(f"Warning: Non-dictionary item found in {filename}. Skipping this item.")
                        continue
                    all_keys.update(item.keys())
                    # Fill missing fields with empty string
                    item = {key: item.get(key, "") for key in all_keys}
                    all_data.append(item)

            except json.JSONDecodeError:
                print(f"Error: {filename} is not a valid JSON file. Skipping.")
            except Exception as e:
                print(f"Error processing {filename}: {str(e)}. Skipping.")

    # If no data was found, exit
    if not all_data:
        print("No valid JSON data found in the specified folder.")
        return

    # Write to the CSV file
    try:
        with open(output_csv, 'w', newline='', encoding='utf-8') as file:
            writer = csv.DictWriter(file, fieldnames=list(all_keys))
            writer.writeheader()
            for row in all_data:
                writer.writerow(row)
        print(f"CSV file '{output_csv}' has been created successfully.")
    except Exception as e:
        print(f"Error writing to CSV file: {str(e)}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python script.py <input_folder> <output_csv_file>")
        sys.exit(1)
    
    input_folder = sys.argv[1]
    output_csv = sys.argv[2]
    
    if not os.path.isdir(input_folder):
        print(f"Error: '{input_folder}' is not a valid directory.")
        sys.exit(1)
    
    process_json_files(input_folder, output_csv)