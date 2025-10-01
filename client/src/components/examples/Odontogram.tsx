import { useState } from 'react';
import { Odontogram } from '../Odontogram';

type ConditionType = "caries" | "ausente" | "fractura" | "endodoncia";

export default function OdontogramExample() {
  const [selectedConditions, setSelectedConditions] = useState<Record<number, ConditionType[]>>({
    11: ["caries"],
    14: ["caries", "endodoncia"],
    21: ["ausente"],
    46: ["fractura"]
  });
  
  const [activeCondition, setActiveCondition] = useState<ConditionType>("caries");

  const handleToothSelect = (toothNumber: number, condition: ConditionType) => {
    setSelectedConditions(prev => {
      const current = prev[toothNumber] || [];
      if (current.includes(condition)) {
        return prev; // Don't add duplicate conditions
      }
      return {
        ...prev,
        [toothNumber]: [...current, condition]
      };
    });
    console.log(`Selected tooth ${toothNumber} with condition ${condition}`);
  };

  const handleClearTooth = (toothNumber: number) => {
    setSelectedConditions(prev => {
      const newConditions = { ...prev };
      delete newConditions[toothNumber];
      return newConditions;
    });
    console.log(`Cleared tooth ${toothNumber}`);
  };

  return (
    <div className="p-4">
      <Odontogram
        selectedConditions={selectedConditions}
        onToothSelect={handleToothSelect}
        onClearTooth={handleClearTooth}
        activeCondition={activeCondition}
        onConditionChange={setActiveCondition}
      />
    </div>
  );
}