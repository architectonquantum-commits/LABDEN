import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Star, 
  RotateCcw, 
  X, 
  Gem, 
  Shield, 
  Target,
  Link,
  Smile,
  Layers,
  Circle,
  Square,
  Crown,
  Zap,
  Hexagon
} from "lucide-react";

// Dental treatments with colors and icons
const conditions = {
  corona: { label: "Corona", color: "bg-yellow-500", textColor: "text-yellow-600", icon: Crown },
  carilla: { label: "Carilla", color: "bg-blue-500", textColor: "text-blue-600", icon: Layers },
  carilla_v: { label: "Carilla V", color: "bg-cyan-500", textColor: "text-cyan-600", icon: Zap },
  puente: { label: "Puente", color: "bg-orange-500", textColor: "text-orange-600", icon: Link },
  corona_sobre_implante: { label: "Corona sobre implante", color: "bg-amber-500", textColor: "text-amber-600", icon: Star },
  incrustacion: { label: "Incrustacion", color: "bg-purple-500", textColor: "text-purple-600", icon: Gem },
  v_onley: { label: "V-onley", color: "bg-teal-500", textColor: "text-teal-600", icon: Shield },
  onley: { label: "Onley", color: "bg-emerald-500", textColor: "text-emerald-600", icon: Target },
  chip_ceramico: { label: "Chip cerámico", color: "bg-rose-500", textColor: "text-rose-600", icon: Hexagon },
  maryland: { label: "Maryland", color: "bg-indigo-500", textColor: "text-indigo-600", icon: Square }
} as const;

type ConditionType = keyof typeof conditions;

interface ToothConditionModalProps {
  isOpen: boolean;
  onClose: () => void;
  toothNumber: number | null;
  selectedConditions: ConditionType[];
  onSave: (toothNumber: number, conditions: ConditionType[]) => void;
}

export function ToothConditionModal({ 
  isOpen, 
  onClose, 
  toothNumber, 
  selectedConditions = [], 
  onSave 
}: ToothConditionModalProps) {
  const [tempConditions, setTempConditions] = useState<ConditionType[]>([]);

  useEffect(() => {
    if (isOpen) {
      setTempConditions([...selectedConditions]);
    }
  }, [isOpen, selectedConditions]);

  const handleConditionToggle = (condition: ConditionType) => {
    setTempConditions(prev => {
      if (prev.includes(condition)) {
        return prev.filter(c => c !== condition);
      } else {
        return [...prev, condition];
      }
    });
  };

  const handleSave = () => {
    if (toothNumber !== null) {
      onSave(toothNumber, tempConditions);
    }
    onClose();
  };

  const handleClear = () => {
    setTempConditions([]);
  };

  if (toothNumber === null) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Diente #{toothNumber}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="ml-auto"
              data-testid="button-close-tooth-modal"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Conditions List */}
          <div className="space-y-3">
            {Object.entries(conditions).map(([key, condition]) => {
              const Icon = condition.icon;
              const isSelected = tempConditions.includes(key as ConditionType);
              
              return (
                <div 
                  key={key} 
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50"
                  data-testid={`checkbox-${key}`}
                >
                  <Checkbox
                    id={`condition-${key}`}
                    checked={isSelected}
                    onCheckedChange={() => handleConditionToggle(key as ConditionType)}
                  />
                  <Icon className={`w-4 h-4 ${condition.textColor}`} />
                  <label 
                    htmlFor={`condition-${key}`}
                    className="flex-1 text-sm font-medium cursor-pointer"
                  >
                    {condition.label}
                  </label>
                  <div className={`w-3 h-3 rounded ${condition.color}`} />
                </div>
              );
            })}
          </div>

          {/* Selected Conditions Preview */}
          {tempConditions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Condiciones seleccionadas:</h4>
              <div className="flex flex-wrap gap-2">
                {tempConditions.map((condition) => (
                  <Badge 
                    key={condition} 
                    variant="secondary"
                    className="text-xs"
                  >
                    {conditions[condition].label}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={tempConditions.length === 0}
            data-testid="button-clear-tooth"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Limpiar
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            data-testid="button-cancel-tooth"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            data-testid="button-save-tooth"
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { conditions };
export type { ConditionType };