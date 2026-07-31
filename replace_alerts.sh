#!/bin/bash
for file in $(grep -rl "alert(" src/); do
  # Add import if not present
  if ! grep -q "import { toast } from 'sonner';" "$file"; then
    sed -i '1s/^/import { toast } from '\''sonner'\'';\n/' "$file"
  fi
  # Simple replacement of alert( to toast( or we can distinguish alert(something) to toast.error if it's an error, etc. 
done
