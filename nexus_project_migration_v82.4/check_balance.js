const fs = require('fs');
const content = fs.readFileSync('components/CinematicLab.tsx', 'utf8');
const lines = content.split('\n');
let balance = 0;
lines.forEach((line, i) => {
  const opens = (line.match(/<div/g) || []).length;
  const closes = (line.match(/<\/div/g) || []).length;
  balance += opens - closes;
  if (balance < 0) {
    console.log(`Negative balance at line ${i + 1}: ${balance}`);
  }
});
console.log(`Final balance: ${balance}`);
