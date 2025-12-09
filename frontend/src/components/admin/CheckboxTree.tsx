// src/admin/components/CheckboxTree.tsx
import React, { useState, useEffect } from 'react';
import Tree from 'rc-tree';
// import 'rc-tree/assets/index.css';
import { MdFolder, MdFolderOpen, MdInsertDriveFile, MdChevronRight } from 'react-icons/md';
import type { DataNode, EventDataNode } from 'rc-tree/lib/interface';

interface Props {
  nodes: any[];
  checked: string[];
  expanded?: string[];
  onCheck: (checked: string[]) => void;
  onExpand?: (expanded: string[]) => void;
}

// Convert từ format react-checkbox-tree sang rc-tree
const convertNodes = (nodes: any[]): DataNode[] => {
  return nodes.map(node => ({
    key: node.value,
    title: node.label,
    children: node.children ? convertNodes(node.children) : undefined,
  }));
};

export default function CategoryCheckboxTree({
  nodes,
  checked,
  expanded = [],
  onCheck,
  onExpand,
}: Props) {
  const [expandedKeys, setExpandedKeys] = useState<string[]>(expanded);
  const [checkedKeys, setCheckedKeys] = useState<string[]>(checked);

  useEffect(() => {
    setExpandedKeys(expanded);
  }, [expanded]);

  useEffect(() => {
    setCheckedKeys(checked);
  }, [checked]);

  const handleExpand = (expandedKeys: React.Key[]) => {
    const keys = expandedKeys.map(String);
    setExpandedKeys(keys);
    if (onExpand) {
      onExpand(keys);
    }
  };

  const handleCheck = (checkedKeys: React.Key[] | { checked: React.Key[]; halfChecked: React.Key[] }) => {
    let keys: string[];
    
    if (Array.isArray(checkedKeys)) {
      keys = checkedKeys.map(String);
    } else {
      keys = checkedKeys.checked.map(String);
    }
    
    setCheckedKeys(keys);
    onCheck(keys);
  };

  // Custom icons
  const switcherIcon = (obj: any) => {
    if (obj.isLeaf) {
      return <MdInsertDriveFile color="#64748b" size={18} />;
    }
    return obj.expanded ? (
      <MdChevronRight size={18} style={{ transform: 'rotate(90deg)', transition: 'transform 0.2s' }} />
    ) : (
      <MdChevronRight size={18} style={{ transition: 'transform 0.2s' }} />
    );
  };

  const renderTitle = (nodeData: DataNode) => {
    const hasChildren = nodeData.children && nodeData.children.length > 0;
    const isExpanded = expandedKeys.includes(String(nodeData.key));
    
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {hasChildren ? (
          isExpanded ? (
            <MdFolderOpen color="#3b82f6" size={18} />
          ) : (
            <MdFolder color="#94a3b8" size={18} />
          )
        ) : (
          <MdInsertDriveFile color="#64748b" size={18} />
        )}
        <span>{nodeData.title}</span>
      </span>
    );
  };

  const treeData = convertNodes(nodes);

  return (
    <div className="checkbox-tree-custom rc-tree-wrapper">
      <Tree
        checkable
        treeData={treeData}
        checkedKeys={checkedKeys}
        expandedKeys={expandedKeys}
        onExpand={handleExpand}
        onCheck={handleCheck}
        switcherIcon={switcherIcon}
        titleRender={renderTitle}
        showIcon={false}
      />
    </div>
  );
}