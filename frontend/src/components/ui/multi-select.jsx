import * as React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Button } from "./button"
import { Checkbox } from "./checkbox"
import { Badge } from "./badge"
import { ChevronDown, X } from "lucide-react"
import { cn } from "../../lib/utils"

const MultiSelect = React.forwardRef(({ 
  options = [], 
  value = [], 
  onChange, 
  placeholder = "Select items...",
  className,
  ...props 
}, ref) => {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (optionValue) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const handleRemove = (optionValue, e) => {
    e.stopPropagation();
    onChange(value.filter(v => v !== optionValue));
  };

  const selectedLabels = options
    .filter(opt => value.includes(opt.value))
    .map(opt => opt.label);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={ref}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between min-h-9 h-auto",
            !value.length && "text-muted-foreground",
            className
          )}
          {...props}
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {value.length === 0 ? (
              <span>{placeholder}</span>
            ) : (
              selectedLabels.map((label, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="mr-1 mb-1"
                >
                  {label}
                  <button
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleRemove(value[index], e);
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => handleRemove(value[index], e)}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              ))
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <div className="max-h-64 overflow-auto p-1">
          {options.map((option) => (
            <div
              key={option.value}
              className="flex items-center space-x-2 rounded-sm px-2 py-1.5 cursor-pointer hover:bg-accent"
              onClick={() => handleSelect(option.value)}
            >
              <Checkbox
                checked={value.includes(option.value)}
                onCheckedChange={() => handleSelect(option.value)}
              />
              <label className="flex-1 cursor-pointer text-sm">
                {option.label}
              </label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
});

MultiSelect.displayName = "MultiSelect";

export { MultiSelect }
