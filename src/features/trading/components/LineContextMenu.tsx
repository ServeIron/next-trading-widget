'use client';

/**
 * Line Context Menu Component
 * Minimal toolbar-style popup for line actions
 * PERFORMANCE OPTIMIZED: Memoized to prevent unnecessary re-renders
 */

import { memo } from 'react';
import { Dialog } from '@mui/material';
import styles from './LineContextMenu.module.css';
import { PRESET_LINE_COLORS } from '../constants';
import type { HorizontalLineConfig } from '../types/lines';

interface LineContextMenuProps {
  /**
   * Whether the dialog is open
   */
  open: boolean;

  /**
   * The line that was clicked
   */
  selectedLine: HorizontalLineConfig | null;

  /**
   * Callback when dialog should close
   */
  onClose: () => void;

  /**
   * Callback when delete action is clicked
   */
  onDelete?: (lineId: string) => void;

  /**
   * Callback when color is changed
   */
  onColorChange?: (lineId: string, color: string) => void;
}

/**
 * Line Context Menu Component
 * Minimal toolbar with delete icon and color boxes
 */
const LineContextMenuComponent = ({
  open,
  selectedLine,
  onClose,
  onDelete,
  onColorChange,
}: LineContextMenuProps) => {
  if (!selectedLine) return null;

  const handleDelete = () => {
    if (onDelete && selectedLine) {
      onDelete(selectedLine.id);
    }
    onClose();
  };

  const handleColorSelect = (color: string) => {
    if (onColorChange && selectedLine) {
      onColorChange(selectedLine.id, color);
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        className: styles.dialogPaper,
      }}
      sx={{
        '& .MuiDialog-container': {
          alignItems: 'flex-start',
          paddingTop: '80px',
        },
        '& .MuiBackdrop-root': {
          backgroundColor: 'transparent',
        },
      }}
    >
      <div className={styles.toolbar}>
        {/* Delete Icon */}
        <button
          className={styles.deleteButton}
          onClick={handleDelete}
          aria-label="Çizgiyi kaldır"
        >
          <svg
            className={styles.deleteIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </button>

        {/* Divider */}
        <div className={styles.divider} />

        {/* Color Boxes */}
        <div className={styles.colorBoxes}>
          {PRESET_LINE_COLORS.map((color) => (
            <button
              key={color}
              className={`${styles.colorBox} ${selectedLine.color === color ? styles.colorBoxActive : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => handleColorSelect(color)}
              aria-label={`Renk seç: ${color}`}
            />
          ))}
        </div>
      </div>
    </Dialog>
  );
};

export const LineContextMenu = memo(LineContextMenuComponent);
