// src/admin/components/CheckboxTree.tsx
import React from 'react';
import CheckboxTree from 'react-checkbox-tree';
import { MdFolder, MdFolderOpen, MdInsertDriveFile, MdChevronRight } from 'react-icons/md';

interface Props {
  nodes: any[];
  checked: string[];
  expanded?: string[];
  onCheck: (checked: string[]) => void;
  onExpand?: (expanded: string[]) => void;
}

export default function CategoryCheckboxTree({
  nodes,
  checked,
  expanded = [],
  onCheck,
  onExpand,
}: Props) {
  return (
    // Class này sẽ được style trong productBulkCategory.scss
    <div className="checkbox-tree-custom">
      <CheckboxTree
        nodes={nodes}
        checked={checked}
        expanded={expanded}
        onCheck={onCheck}
        onExpand={onExpand}
        icons={{
          check: <span className="rct-icon rct-icon-check" />,
          uncheck: <span className="rct-icon rct-icon-uncheck" />,
          halfCheck: <span className="rct-icon rct-icon-half-check" />,
          expandClose: <MdChevronRight size={16} />,
          expandOpen: <MdChevronRight size={16} style={{ transform: 'rotate(90deg)' }} />,
          parentClose: <MdFolder color="#94a3b8" />,
          parentOpen: <MdFolderOpen color="#3b82f6" />,
          leaf: <MdInsertDriveFile color="#64748b" />,
        }}
        iconsClass="fa"
      />
    </div>
  );
}