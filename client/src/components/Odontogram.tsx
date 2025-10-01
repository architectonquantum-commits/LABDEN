import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { ToothConditionModal, conditions, type ConditionType } from "./ToothConditionModal";


interface OdontogramProps {
  selectedConditions: Record<number, ConditionType[]>;
  onToothSelect: (toothNumber: number, conditions: ConditionType[]) => void;
  onClearTooth: (toothNumber: number) => void;
}

export function Odontogram({ 
  selectedConditions, 
  onToothSelect, 
  onClearTooth
}: OdontogramProps) {
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleToothClick = (number: number) => {
    setSelectedTooth(number);
    setIsModalOpen(true);
  };

  const handleToothSave = (toothNumber: number, conditions: ConditionType[]) => {
    if (conditions.length === 0) {
      onClearTooth(toothNumber);
    } else {
      onToothSelect(toothNumber, conditions);
    }
    setIsModalOpen(false);
    setSelectedTooth(null);
  };


  const handleClearAll = () => {
    Object.keys(selectedConditions).forEach(tooth => {
      onClearTooth(parseInt(tooth));
    });
    console.log('Clearing all tooth selections');
  };

  // Crear componente ToothButton para reutilizar
  const ToothButton = ({ number }: { number: number }) => {
    const toothConditions = selectedConditions[number] || [];
    const hasConditions = toothConditions.length > 0;
    
    return (
      <button 
        className="aspect-square w-full max-w-[50px] border-2 border-gray-300 rounded bg-white hover:bg-blue-50 flex items-center justify-center text-sm font-medium"
        style={{ 
          backgroundColor: hasConditions ? '#3b82f6' : '#ffffff',
          borderColor: hasConditions ? '#1d4ed8' : '#d1d5db',
          color: hasConditions ? '#ffffff' : '#374151'
        }}
        onClick={() => handleToothClick(number)}
        data-testid={`tooth-${number}`}
      >
        {number}
      </button>
    );
  };

  return (
    <Card data-testid="odontogram">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Odontograma</CardTitle>
          <Button variant="outline" size="sm" onClick={handleClearAll}>
            <RotateCcw className="w-3 h-3 mr-1" />
            Limpiar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Instructions */}
        <div className="bg-muted/50 p-3 rounded-lg mb-6">
          <p className="text-xs text-muted-foreground text-center">
            Haz clic en cualquier diente para seleccionar sus condiciones
          </p>
        </div>

        {/* Contenedor responsive sin overflow horizontal */}
        <div className="w-full overflow-x-hidden px-2">
          {/* Arcada Superior */}
          <div className="mb-6">
            <h3 className="text-center text-sm font-medium mb-4">Arcada Superior</h3>
            
            {/* Fila 1: Dientes 18-11 */}
            <div className="grid grid-cols-8 gap-2 w-full max-w-2xl mx-auto mb-3" data-testid="row-upper-1">
              {[18,17,16,15,14,13,12,11].map(num => (
                <ToothButton key={num} number={num} />
              ))}
            </div>
            
            {/* Fila 2: Dientes 21-28 */}
            <div className="grid grid-cols-8 gap-2 w-full max-w-2xl mx-auto mb-6" data-testid="row-upper-2">
              {[21,22,23,24,25,26,27,28].map(num => (
                <ToothButton key={num} number={num} />
              ))}
            </div>
          </div>

          {/* Arcada Inferior */}
          <div className="mb-6">
            <h3 className="text-center text-sm font-medium mb-4">Arcada Inferior</h3>
            
            {/* Fila 3: Dientes 48-41 */}
            <div className="grid grid-cols-8 gap-2 w-full max-w-2xl mx-auto mb-3" data-testid="row-lower-1">
              {[48,47,46,45,44,43,42,41].map(num => (
                <ToothButton key={num} number={num} />
              ))}
            </div>
            
            {/* Fila 4: Dientes 31-38 */}
            <div className="grid grid-cols-8 gap-2 w-full max-w-2xl mx-auto" data-testid="row-lower-2">
              {[31,32,33,34,35,36,37,38].map(num => (
                <ToothButton key={num} number={num} />
              ))}
            </div>
          </div>
        </div>

        {/* Selected Conditions Summary */}
        {Object.keys(selectedConditions).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Condiciones Seleccionadas:</h4>
            <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
              {Object.entries(selectedConditions).map(([tooth, toothConditions]) => 
                toothConditions.map((condition, index) => (
                  <Badge 
                    key={`${tooth}-${condition}-${index}`} 
                    variant="secondary"
                    className="text-xs"
                  >
                    Diente {tooth}: {conditions[condition].label}
                  </Badge>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tooth Condition Modal */}
        <ToothConditionModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTooth(null);
          }}
          toothNumber={selectedTooth}
          selectedConditions={selectedTooth ? selectedConditions[selectedTooth] || [] : []}
          onSave={handleToothSave}
        />
      </CardContent>
    </Card>
  );
}