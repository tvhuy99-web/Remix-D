const fs = require('fs');
const path = require('path');

const walkSync = function(dir, filelist) {
  let files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    }
    else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        filelist.push(path.join(dir, file));
      }
    }
  });
  return filelist;
};

const processFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Character
  content = content.replace(/import\s+\{\s*useCharacter\s*\}\s+from\s+['"](?:\.\.\/|\.\/)*contexts\/CharacterContext['"];?/g, "import { useCharacterStore } from '" + getRelativePath(filePath, 'src/store/characterStore') + "';");
  content = content.replace(/\buseCharacter\(\)/g, "useCharacterStore()");

  // Lorebook
  content = content.replace(/import\s+\{\s*useLorebook\s*\}\s+from\s+['"](?:\.\.\/|\.\/)*contexts\/LorebookContext['"];?/g, "import { useLorebookStore } from '" + getRelativePath(filePath, 'src/store/lorebookStore') + "';");
  content = content.replace(/\buseLorebook\(\)/g, "useLorebookStore()");

  // Preset
  content = content.replace(/import\s+\{\s*usePreset\s*\}\s+from\s+['"](?:\.\.\/|\.\/)*contexts\/PresetContext['"];?/g, "import { usePresetStore } from '" + getRelativePath(filePath, 'src/store/presetStore') + "';");
  content = content.replace(/\busePreset\(\)/g, "usePresetStore()");

  // UserPersona
  if (content.includes('useUserPersona')) {
    content = content.replace(/import\s+\{\s*useUserPersona\s*\}\s+from\s+['"](?:\.\.\/|\.\/)*contexts\/UserPersonaContext['"];?/g, "import { usePersonaStore } from '" + getRelativePath(filePath, 'src/store/personaStore') + "';");
    content = content.replace(/\buseUserPersona\(\)/g, "usePersonaStore()");
  }
  
  // Replace destructured dispatch safely
  content = content.replace(/(const\s+\{.*),\s*dispatch\s*(\}\s*=\s*(?:useCharacterStore|useLorebookStore|usePresetStore|usePersonaStore)\(\))/g, "$1$2");
  content = content.replace(/(const\s+\{\s*)dispatch,\s*(.*\}\s*=\s*(?:useCharacterStore|useLorebookStore|usePresetStore|usePersonaStore)\(\))/g, "$1$2");
  content = content.replace(/(const\s+\{\s*)dispatch\s*(\}\s*=\s*(?:useCharacterStore|useLorebookStore|usePresetStore|usePersonaStore)\(\))/g, "$1$2");

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated: ${filePath}`);
  }
};

const getRelativePath = (fromPath, toPath) => { 
    const fromDir = path.dirname(fromPath);
    let rel = path.relative(fromDir, path.join(process.cwd(), toPath));
    if (!rel.startsWith('.')) rel = './' + rel;
    rel = rel.replace(/\\/g, '/');
    if (rel.endsWith('.ts')) rel = rel.slice(0, -3);
    return rel;
};

const allFiles = walkSync('src');
allFiles.forEach(processFile);
