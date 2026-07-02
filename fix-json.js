const fs = require('fs');
const path = require('path');

const fixes = [
  { file: 'src/lib/agents/drift-detection.ts', model: 'QWEN_PLUS' },
  { file: 'src/lib/agents/explanation.ts', model: 'QWEN_TURBO' },
  { file: 'src/lib/agents/forgetting.ts', model: 'QWEN_TURBO' },
  { file: 'src/lib/agents/hallucination-risk.ts', model: 'QWEN_PLUS' },
  { file: 'src/lib/agents/ingestion.ts', model: 'QWEN_PLUS' },
  { file: 'src/lib/agents/memory-construction.ts', model: 'QWEN_PLUS' },
  { file: 'src/lib/agents/push-analysis.ts', model: 'QWEN_PLUS' }
];

fixes.forEach(fix => {
  const fullPath = path.join('c:/Aiges/Northstar', fix.file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(/jsonCompletion(<[^>]+>)?\(\s*\[/g, "jsonCompletion$1(\n      " + fix.model + ",\n      [");
    fs.writeFileSync(fullPath, content);
    console.log('Fixed ' + fix.file);
  }
});
