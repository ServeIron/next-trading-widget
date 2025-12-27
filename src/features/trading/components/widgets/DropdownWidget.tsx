'use client';

/**
 * Generic Dropdown Widget Component
 * Reusable dropdown menu component for consistent UI
 * PERFORMANCE OPTIMIZED: Memoized to prevent unnecessary re-renders
 */

import { memo, useCallback, useState, useRef, useEffect } from 'react';
import { Popper, ClickAwayListener, Paper, MenuList, MenuItem } from '@mui/material';
import styles from './DropdownWidget.module.css';

export interface DropdownItem<T = string> {
  value: T;
  label: string;
}

interface DropdownWidgetProps<T = string> {
  /**
   * Current selected value(s)
   */
  value: T | T[];

  /**
   * Available items in dropdown
   */
  items: DropdownItem<T>[];

  /**
   * Callback when selection changes
   */
  onChange: (value: T | T[]) => void;

  /**
   * Whether multiple selection is allowed
   */
  multiple?: boolean;

  /**
   * Placeholder text when no selection
   */
  placeholder?: string;

  /**
   * Custom label formatter for selected value
   */
  formatLabel?: (selected: DropdownItem<T> | DropdownItem<T>[]) => string;

  /**
   * ARIA label for accessibility
   */
  ariaLabel?: string;
}

/**
 * Generic Dropdown Widget Component
 * Supports single and multiple selection
 */
const DropdownWidgetComponent = <T extends string | number = string>({
  value,
  items,
  onChange,
  multiple = false,
  placeholder = 'Seçiniz',
  formatLabel,
  ariaLabel = 'Dropdown menü',
}: DropdownWidgetProps<T>) => {
  const [open, setOpen] = useState<boolean>(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  // Get selected items
  const getSelectedItems = useCallback((): DropdownItem<T>[] => {
    if (multiple) {
      const selectedValues = Array.isArray(value) ? value : [];
      return items.filter((item) => selectedValues.includes(item.value));
    } else {
      const selectedItem = items.find((item) => item.value === value);
      return selectedItem ? [selectedItem] : [];
    }
  }, [value, items, multiple]);

  // Get display label
  const getDisplayLabel = useCallback((): string => {
    const selectedItems = getSelectedItems();
    
    if (formatLabel) {
      return formatLabel(multiple ? selectedItems : selectedItems[0]);
    }

    if (selectedItems.length === 0) {
      return placeholder;
    }

    if (multiple) {
      if (selectedItems.length === 0) return placeholder;
      if (selectedItems.length === 1) return selectedItems[0].label;
      return `${selectedItems.length} seçili`;
    }

    return selectedItems[0]?.label || placeholder;
  }, [getSelectedItems, formatLabel, placeholder, multiple]);

  const handleToggle = useCallback(() => {
    setOpen((prevOpen) => !prevOpen);
  }, []);

  const handleClose = useCallback((event?: Event | React.SyntheticEvent) => {
    if (anchorRef.current && anchorRef.current.contains(event?.target as HTMLElement)) {
      return;
    }
    setOpen(false);
  }, []);

  const handleMenuItemClick = useCallback(
    (itemValue: T) => {
      if (multiple) {
        const currentValues = Array.isArray(value) ? value : [];
        const isSelected = currentValues.includes(itemValue);
        
        if (isSelected) {
          // Remove from selection
          onChange(currentValues.filter((v) => v !== itemValue) as T[]);
        } else {
          // Add to selection
          onChange([...currentValues, itemValue] as T[]);
        }
      } else {
        onChange(itemValue);
        setOpen(false);
      }
    },
    [onChange, multiple, value]
  );

  // Handle keyboard navigation
  const handleListKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  }, []);

  // Focus management when opening/closing
  const prevOpen = useRef(open);
  useEffect(() => {
    if (prevOpen.current === true && open === false && anchorRef.current) {
      anchorRef.current.focus();
    }
    prevOpen.current = open;
  }, [open]);

  const displayLabel = getDisplayLabel();
  const selectedItems = getSelectedItems();
  const selectedValues = multiple 
    ? (Array.isArray(value) ? value : [])
    : (value !== undefined && value !== null ? [value] : []);

  return (
    <div className={styles.widget}>
      <button
        ref={anchorRef}
        onClick={handleToggle}
        className={`${styles.button} ${styles.buttonDropdown} ${open ? styles.buttonActive : styles.buttonInactive}`}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span className={styles.buttonLabel}>{displayLabel}</span>
        <span className={styles.buttonArrow}>{open ? '▲' : '▼'}</span>
      </button>

      <Popper
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        style={{ zIndex: 1300 }}
        modifiers={[
          {
            name: 'offset',
            options: {
              offset: [0, 4],
            },
          },
        ]}
      >
        <ClickAwayListener onClickAway={handleClose}>
          <Paper
            className={styles.menuPaper}
            sx={{
              backgroundColor: '#1e222d !important',
              border: '1px solid #2a2e39',
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
              transformOrigin: 'top left',
            }}
          >
            <MenuList
              autoFocusItem={open}
              id="dropdown-menu"
              aria-labelledby="dropdown-button"
              onKeyDown={handleListKeyDown}
              className={styles.menuList}
              sx={{
                backgroundColor: '#1e222d !important',
                padding: '4px 0',
              }}
            >
              {items.map((item) => {
                const isSelected = selectedValues.includes(item.value);
                return (
                  <MenuItem
                    key={String(item.value)}
                    selected={isSelected}
                    onClick={() => handleMenuItemClick(item.value)}
                    className={`${styles.menuItem} ${isSelected ? styles.menuItemSelected : ''}`}
                    sx={{
                      backgroundColor: isSelected ? '#2a2e39' : 'transparent',
                      color: isSelected ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.7)',
                      '&:hover': {
                        backgroundColor: '#2a2e39',
                        color: 'rgba(255, 255, 255, 0.95)',
                      },
                    }}
                  >
                    {multiple && (
                      <span className={styles.checkbox}>
                        {isSelected ? '✓' : ''}
                      </span>
                    )}
                    {item.label}
                  </MenuItem>
                );
              })}
            </MenuList>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </div>
  );
};

export const DropdownWidget = memo(DropdownWidgetComponent) as typeof DropdownWidgetComponent;

