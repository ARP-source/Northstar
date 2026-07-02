const fs = require('fs');
const readline = require('readline');

async function processLineByLine() {
  const fileStream = fs.createReadStream('C:/Users/orien/.gemini/antigravity/brain/271822db-c1b3-43d6-beac-96c6cc4f6846/.system_generated/logs/transcript_full.jsonl');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let count = 0;
  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const step = JSON.parse(line);
      if (step.tool_calls) {
        for (const call of step.tool_calls) {
          let name = call.function ? call.function.name : call.name;
          if (name === 'write_to_file' || name === 'default_api:write_to_file') {
            const argsStr = call.function ? call.function.arguments : call.args;
            const args = typeof argsStr === 'string' ? JSON.parse(argsStr) : argsStr;
            
            let target = args.TargetFile;
            let content = args.CodeContent;
            if (target && target.includes('prompts')) {
              if (target.startsWith('"') && target.endsWith('"')) target = target.slice(1, -1);
              if (typeof content === 'string' && content.startsWith('"') && content.endsWith('"')) {
                try { content = JSON.parse(content); } catch(e) {}
              }
              target = target.replace(/\\\\/g, '/');
              console.log('Restoring from sub2:', target);
              fs.writeFileSync(target, content, 'utf8');
              count++;
            }
          }
        }
      }
    } catch(e) { }
  }
  console.log('Restored ' + count + ' files from sub2 transcript');
}

processLineByLine();
