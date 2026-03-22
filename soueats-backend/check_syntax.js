const fs = require('fs');
const content = fs.readFileSync('c:/Users/jayve/Desktop/pbl/smart-campus/src/components/RecommendationPanel.jsx', 'utf8');

let openBraces = 0;
let openBrackets = 0;
let openParens = 0;

for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '{') openBraces++;
    else if (char === '}') openBraces--;
    else if (char === '[') openBrackets++;
    else if (char === ']') openBrackets--;
    else if (char === '(') openParens++;
    else if (char === ')') openParens--;
}

console.log('Braces:', openBraces);
console.log('Brackets:', openBrackets);
console.log('Parens:', openParens);
