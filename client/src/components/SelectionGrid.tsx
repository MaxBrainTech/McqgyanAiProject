import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface SelectionGridProps {
  title: string;
  items: Array<{ label: string; value: string | number }>;
  selected?: string | number;
  onSelect: (value: string | number) => void;
}

export default function SelectionGrid({ title, items, selected, onSelect }: SelectionGridProps) {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {items.map((item) => (
          <Button
            key={item.value}
            variant={selected === item.value ? "default" : "outline"}
            onClick={() => onSelect(item.value)}
            className="h-auto py-3"
            data-testid={`button-select-${item.value}`}
          >
            {item.label}
          </Button>
        ))}
      </div>
    </Card>
  );
}
