import os
from datetime import datetime

def rename_files(folder_path, name_list):
  """
  Renames files in a folder based on a list, considering modification date.

  Args:
    folder_path: Path to the folder containing the files.
    name_list: List of new names for the files.
  """

  # Get files sorted by modification date (descending)
  files = [(f, os.path.getmtime(os.path.join(folder_path, f))) 
          for f in os.listdir(folder_path) if os.path.isfile(os.path.join(folder_path, f))]
  files.sort(key=lambda x: x[1], reverse=True)  # Sort by modification time descending

  # Rename files based on list and modification order
  for i, (file, _) in enumerate(files):
    if i < len(name_list):
      new_name = f"{name_list[i]}.{os.path.splitext(file)[1]}"
      old_path = os.path.join(folder_path, file)
      new_path = os.path.join(folder_path, new_name)
      
      # Check for name conflicts and add timestamp if needed
      counter = 1
      while os.path.exists(new_path):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        new_name = f"{name_list[i]}_{timestamp}{os.path.splitext(file)[1]}"
        new_path = os.path.join(folder_path, new_name)
        counter += 1
      
      print(f"Renaming '{file}' to '{new_name}'")
      os.rename(old_path, new_path)

# Example usage (replace with your actual folder path and name list)
folder_path = "charreads/"
# ' ', '!', 
name_list = ['"', '#', '$', '%', '&', "'", '(', ')', '*', '+', ',', '-', '.', '/', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ':', ';', '<', '=', '>', '?', '@', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '[', '\\', ']', '^', '_', '`', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '{', '|', '}', '~', ' ']

actual_name_list = []
for i in range(len(name_list)):
  actual_name_list.append(str(2 + i))

rename_files(folder_path, actual_name_list)
