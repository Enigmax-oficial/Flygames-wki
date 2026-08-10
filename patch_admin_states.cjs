const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const states = `
  const [model3DKey, setModel3DKey] = useState('');
  const [model3DTexture, setModel3DTexture] = useState('');
  const [difficultyStats, setDifficultyStats] = useState<{difficulty: string, health: string, attack: string, icon: string}[]>([]);
  const [movementSpeed, setMovementSpeed] = useState('');
  const [dropsTable, setDropsTable] = useState<{item: string, amount: string, chance: string, icon: string}[]>([]);

  const addDifficultyStat = () => setDifficultyStats([...difficultyStats, { difficulty: 'Normal', health: '20', attack: '3', icon: '🛡️' }]);
  const updateDifficultyStat = (index, field, val) => {
    const list = [...difficultyStats];
    list[index][field] = val;
    setDifficultyStats(list);
  };
  const removeDifficultyStat = (index) => {
    setDifficultyStats(difficultyStats.filter((_, i) => i !== index));
  };

  const addDrop = () => setDropsTable([...dropsTable, { item: 'Rotten Flesh', amount: '1-2', chance: '100%', icon: '🍖' }]);
  const updateDrop = (index, field, val) => {
    const list = [...dropsTable];
    list[index][field] = val;
    setDropsTable(list);
  };
  const removeDrop = (index) => {
    setDropsTable(dropsTable.filter((_, i) => i !== index));
  };
`;
code = code.replace(/const addCustomProp = \(\) => setCustomPropsList\(\[\.\.\.customPropsList, \{ key: '', value: '' \}\]\);/, states + '\n  const addCustomProp = () => setCustomPropsList([...customPropsList, { key: \'\', value: \'\' }]);');

fs.writeFileSync('src/components/AdminPanel.tsx', code);
