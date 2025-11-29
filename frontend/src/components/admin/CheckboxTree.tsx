// src/admin/components/CheckboxTree.tsx
import React from 'react';
import CheckboxTree from 'react-checkbox-tree';
import 'react-checkbox-tree/lib/react-checkbox-tree.css';
import { MdFolder, MdFolderOpen, MdInsertDriveFile } from 'react-icons/md';

interface Props {
  nodes: any[];
  checked: string[];
  onCheck: (checked: string[]) => void;
}

export default function CategoryCheckboxTree({ nodes, checked, onCheck }: Props) {
  return (
    <CheckboxTree
      nodes={nodes}
      checked={checked}
      expanded={[]} // tự động mở dần khi chọn
      onCheck={onCheck}
      icons={{
        check: <span className="rct-icon rct-icon-check" />,
        uncheck: <span className="rct-icon rct-icon-uncheck" />,
        halfCheck: <span className="rct-icon rct-icon-half-check" />,
        expandClose: <MdFolder />,
        expandOpen: <MdFolderOpen />,
        leaf: <MdInsertDriveFile />,
      }}
    />
  );
}