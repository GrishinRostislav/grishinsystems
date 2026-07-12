const fs = require('fs');
const path = require('path');

const swiftFilePath = path.join(__dirname, '../swift_backup/LanguageApp_02/NeuroLang/SystemFiles/StarterWords.swift');
const outputJsonPath = path.join(__dirname, '../src/lib/starterWords.json');

try {
  const content = fs.readFileSync(swiftFilePath, 'utf8');
  
  // Split by "static let" to isolate each category block
  const blocks = content.split(/\bstatic\s+let\s+/);
  const categories = {};
  
  // Skip the first block as it's the class/struct header
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    
    // Extract the variable name
    const nameMatch = block.match(/^(\w+)/);
    if (!nameMatch) continue;
    const categoryName = nameMatch[1];
    
    // Parse all tuples in this block: ("...", "...")
    // Supports double quotes, smart quotes, single quotes, brackets inside strings
    const tupleRegex = /\(\s*"([\s\S]*?)"\s*,\s*"([\s\S]*?)"\s*\)/g;
    const words = [];
    let tupleMatch;
    
    while ((tupleMatch = tupleRegex.exec(block)) !== null) {
      words.push({
        origin: tupleMatch[1].replace(/\\”|\\“|\\"/g, '"'),
        translate: tupleMatch[2].replace(/\\”|\\“|\\"/g, '"')
      });
    }
    
    categories[categoryName] = words;
    console.log(`Parsed category "${categoryName}": ${words.length} words`);
  }
  
  // Ensure target folder exists
  const targetDir = path.dirname(outputJsonPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  fs.writeFileSync(outputJsonPath, JSON.stringify(categories, null, 2), 'utf8');
  console.log(`Successfully wrote parsed starter words to ${outputJsonPath}`);
} catch (error) {
  console.error('Error parsing StarterWords.swift:', error);
}
