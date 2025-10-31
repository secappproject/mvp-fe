"use client";

import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDown, EyeOff } from "lucide-react";
import type { Column } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import React from "react";

type NullString = {
  String: string;
  Valid: boolean;
};

interface DataTableColumnHeaderProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({ column, title, className }: DataTableColumnHeaderProps<TData, TValue>) {
  
  let uniqueValues = Array.from(column.getFacetedUniqueValues().keys());

  if (column.id === 'vendorsMerged' || column.id === 'projectDetails' || column.id === 'actualBasicKit' || column.id === 'actualAccessories' || column.id === 'planMerged') {
      const allValues = new Set<string>();
      uniqueValues.forEach(val => {
          if (typeof val === 'string' && val.includes(' | ')) {
              val.split(' | ').forEach(v => {
                const trimmedV = v.trim();
                if (trimmedV && trimmedV !== 'null' && trimmedV !== '-' && trimmedV !== 'undefined') {
                    allValues.add(trimmedV);
                } else if (trimmedV === '-' || trimmedV === '') {
                    allValues.add('(Kosong)');
                }
              });
          } else if (val) {
              const trimmedVal = String(val).trim();
              if (trimmedVal && trimmedVal !== 'null' && trimmedVal !== 'undefined') {
                  allValues.add(trimmedVal);
              }
          }
      });
      uniqueValues = Array.from(allValues).sort(); 
  } else {
    uniqueValues.sort();
  }

  const selectedValues = new Set(column.getFilterValue() as string[]);

  const getDisplayValue = (val: unknown): string => {
    if (val === null || val === undefined || val === '') {
      return "(Kosong)";
    }
    if (typeof val === 'object' && val !== null && 'Valid' in val && 'String' in val) {
      const nullString = val as NullString;
      return nullString.Valid ? nullString.String : "(Kosong)";
    }
    return String(val);
  };

  const getKey = (val: unknown): string => {
    if (val === null) {
      return "__null_key__";
    }
    if (val === undefined) {
      return "__undefined_key__";
    }
    if (typeof val === 'object' && val !== null && 'Valid' in val && 'String' in val) {
      const nullString = val as NullString;
      return `nullstring_${nullString.Valid}_${nullString.String}`; 
    }
    return String(val);
  };
  
  const optionsWithKeys = uniqueValues.map((option) => ({
    key: getKey(option),
    displayValue: getDisplayValue(option),
  }));

  const uniqueOptions = Array.from(
    new Map(optionsWithKeys.map((item) => [item.key, item])).values()
  ).filter(option => option.displayValue !== ''); 

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      
      {column.getCanFilter() ? (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="-ml-3 h-8 data-[state=open]:bg-accent">
              <span>{title}</span>
              {selectedValues.size > 0 && (
                <Badge variant="secondary" className="ml-2 rounded-sm px-1 font-normal">
                  {selectedValues.size}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="start">
            <Command>
              <CommandInput placeholder={`Filter ${title}...`} />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                  {uniqueOptions.map((option) => {
                    const displayValueForCheck = option.displayValue;
                    const isSelected = selectedValues.has(displayValueForCheck);
                    
                    return (
                      <CommandItem
                        key={option.key}
                        onSelect={() => {
                          if (isSelected) {
                            selectedValues.delete(displayValueForCheck);
                          } else {
                            selectedValues.add(displayValueForCheck);
                          }
                          const filterValues = Array.from(selectedValues);
                          column.setFilterValue(filterValues.length ? filterValues : undefined);
                        }}
                      >
                        <div className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary", isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible")}>
                          <Check className={cn("h-4 w-4")} />
                        </div>
                        <span>{option.displayValue}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                {selectedValues.size > 0 && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem onSelect={() => column.setFilterValue(undefined)} className="justify-center text-center">
                        Clear filters
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      ) : (
        <div className={cn(className, "pl-1")}>{title}</div>
      )}

      {column.getCanSort() && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 data-[state=open]:bg-accent">
              <ChevronsUpDown className="h-4 w-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
              <ArrowUpIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" /> Asc
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
              <ArrowDownIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" /> Desc
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
              <EyeOff className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" /> Hide
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}