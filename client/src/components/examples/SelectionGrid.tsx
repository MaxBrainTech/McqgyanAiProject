import SelectionGrid from '../SelectionGrid';
import { useState } from 'react';

export default function SelectionGridExample() {
  const [selected, setSelected] = useState<number>(8);

  const classes = [
    { label: 'Class 6', value: 6 },
    { label: 'Class 7', value: 7 },
    { label: 'Class 8', value: 8 },
    { label: 'Class 9', value: 9 },
    { label: 'Class 10', value: 10 },
  ];

  return (
    <div className="p-8 bg-background">
      <SelectionGrid
        title="Select Your Class"
        items={classes}
        selected={selected}
        onSelect={(value) => setSelected(value as number)}
      />
    </div>
  );
}
