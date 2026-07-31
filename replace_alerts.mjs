import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('src', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Some basic replacements based on keywords
    content = content.replace(/alert\((.*?failed.*?|.*?Error.*?|.*?Network.*?|.*?Cannot.*?)\)/gi, 'toast.error($1)');
    content = content.replace(/alert\((.*?successful.*?|.*?saved.*?|.*?copied.*?)\)/gi, 'toast.success($1)');
    content = content.replace(/alert\((.*?)\)/g, 'toast.info($1)');
    
    if (content !== original) {
      // Ensure import is there
      if (!content.includes("import { toast } from 'sonner';")) {
          // It might have been added by bash on line 1, let's remove duplicates if any
          // Actually bash added it to line 1.
      }
      fs.writeFileSync(filePath, content);
      console.log('Updated', filePath);
    }
  }
});
