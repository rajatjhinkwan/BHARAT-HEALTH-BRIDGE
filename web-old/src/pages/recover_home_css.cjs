const fs = require('fs');
const logPath = 'C:\\Users\\rajat\\.gemini\\antigravity\\brain\\b2f9afc6-e9b1-4bee-9fe8-abde399c4485\\.system_generated\\logs\\overview.txt';
const lines = fs.readFileSync(logPath, 'utf8').split('\n');

// Find the line with step_index 58
const line = lines.find(l => l.includes('"step_index":58'));
if (line) {
    const obj = JSON.parse(line);
    const targetContent = obj.tool_calls[0].args.TargetContent;
    fs.writeFileSync('c:\\Users\\rajat\\Desktop\\MAJOR PROJECT\\web-old\\src\\pages\\Home.css', targetContent);
    console.log('Successfully restored Home.css from logs.');
} else {
    console.log('Could not find step_index 58 in logs.');
}
