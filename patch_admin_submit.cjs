const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

// We need to inject logic into customPropsRecord creation for both switchToTextEditor and handleCreatePage
// Actually switchToTextEditor in the old code did not use customPropsRecord... Let's just focus on handleCreatePage or both.

code = code.replace(
  /const customPropsRecord: Record<string, string> = \{\};/,
  `const customPropsRecord: Record<string, string> = {};
    if (model3DKey) customPropsRecord['3D Model Key'] = model3DKey;
    if (model3DTexture) customPropsRecord['Texture URL'] = model3DTexture;`
);

// We want to add difficultyStats, movementSpeed, dropsTable
code = code.replace(
  /behaviorBullets: bullets\.length > 0 \? bullets : undefined,/g,
  `behaviorBullets: bullets.length > 0 ? bullets : undefined,
      difficultyStats: difficultyStats.length > 0 ? difficultyStats : undefined,
      movementSpeed: movementSpeed || undefined,
      dropsTable: dropsTable.length > 0 ? dropsTable : undefined,`
);

fs.writeFileSync('src/components/AdminPanel.tsx', code);
