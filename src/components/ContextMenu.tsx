import { useEffect, useRef, useState } from 'react';
import { useStudio } from '../store';
import type { Selection } from '../types';
import { DEVICE_META } from '../templates';
import { 
  IcCopy, IcTrash, IcLock, IcUnlock, IcEye, IcEyeOff, IcArrowL, IcArrowR, 
  IcLayers, IcType, IcSearch, IcCheck, IcClose, IcSpark, IcWand, IcDice,
  IcUp, IcDown, IcRefresh, IcStar, IcHeart
} from '../icons';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon?: (props: { size?: number }) => JSX.Element;
  shortcut?: string;
  disabled?: boolean;
  action: () => void;
  divider?: boolean;
  submenu?: MenuItem[];
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export function ContextMenu({ x, y, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  
  const selection = useStudio(s => s.selection);
  const project = useStudio(s => s.project)!;
  const update = useStudio(s => s.update);
  const checkpoint = useStudio(s => s.checkpoint);
  const removeDevice = useStudio(s => s.removeDevice);
  const duplicateDevice = useStudio(s => s.duplicateDevice);
  const toast = useStudio(s => s.toast);
  const setZoom = useStudio(s => s.setZoom);
  const zoom = useStudio(s => s.zoom);
  const setGenOpen = useStudio(s => s.setGenOpen);
  const randomize = useStudio(s => s.randomize);
  const addDevice = useStudio(s => s.addDevice);
  const addTextBox = useStudio(s => s.addTextBox);
  const setSelection = useStudio(s => s.setSelection);
  const lockedObjects = useStudio(s => s.lockedObjects);
  const lockObject = useStudio(s => s.lockObject);
  const unlockObject = useStudio(s => s.unlockObject);

  // Close on click outside or escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const allItems = getAllMenuItems();
      const filteredItems = searchQuery 
        ? allItems.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()))
        : allItems;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex(prev => (prev + 1) % filteredItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === 'Enter' && focusedIndex >= 0) {
        e.preventDefault();
        const item = filteredItems[focusedIndex];
        if (item && !item.disabled) {
          item.action();
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex, searchQuery, onClose]);

  // Focus search on open
  useEffect(() => {
    setTimeout(() => searchRef.current?.focus(), 50);
  }, []);

  // Smart positioning
  const getSmartPosition = () => {
    const menuWidth = 280;
    const menuHeight = 400;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let posX = x;
    let posY = y;

    if (x + menuWidth > viewportWidth) {
      posX = x - menuWidth;
    }
    if (y + menuHeight > viewportHeight) {
      posY = y - menuHeight;
    }

    return { left: Math.max(10, posX), top: Math.max(10, posY) };
  };

  const position = getSmartPosition();

  // Check if object is locked
  const isLocked = (kind: string, id: string) => {
    return lockedObjects.has(`${kind}:${id}`);
  };

  // Build menu based on selection
  const buildMenu = (): MenuSection[] => {
    if (!selection) {
      return buildCanvasMenu();
    }

    switch (selection.kind) {
      case 'device':
        return buildDeviceMenu(selection);
      case 'text':
        return buildTextMenu();
      case 'textbox':
        return buildTextBoxMenu(selection);
      case 'icon':
        return buildIconMenu(selection);
      case 'canvasImage':
        return buildCanvasImageMenu(selection);
      case 'deco':
        return buildDecorationMenu(selection);
      case 'logo':
        return buildLogoMenu();
      case 'background':
        return buildBackgroundMenu();
      default:
        return buildCanvasMenu();
    }
  };

  // Canvas menu (empty area)
  const buildCanvasMenu = (): MenuSection[] => [
    {
      title: 'ADD',
      items: [
        { id: 'add-laptop', label: 'Add Laptop', icon: IcLayers, action: () => { addDevice('laptop'); toast('Laptop added'); } },
        { id: 'add-phone', label: 'Add Phone', icon: IcLayers, action: () => { addDevice('phone'); toast('Phone added'); } },
        { id: 'add-tablet', label: 'Add Tablet', icon: IcLayers, action: () => { addDevice('tablet'); toast('Tablet added'); } },
        { id: 'add-browser', label: 'Add Browser', icon: IcLayers, action: () => { addDevice('browser'); toast('Browser added'); } },
        { id: 'add-monitor', label: 'Add Monitor', icon: IcLayers, action: () => { addDevice('monitor'); toast('Monitor added'); } },
        { id: 'add-text', label: 'Add Text Box', icon: IcType, action: () => { addTextBox(); toast('Text box added'); } },
      ]
    },
    {
      title: 'DESIGN',
      items: [
        { id: 'generate', label: 'Generate Design', icon: IcWand, shortcut: 'Ctrl+G', action: () => { setGenOpen(true); } },
        { id: 'surprise', label: 'Surprise Me', icon: IcDice, shortcut: 'Ctrl+Shift+R', action: () => { randomize(); } },
      ]
    },
    {
      title: 'VIEW',
      items: [
        { id: 'zoom-in', label: 'Zoom In', icon: IcUp, shortcut: 'Ctrl+]', action: () => setZoom(zoom * 1.2) },
        { id: 'zoom-out', label: 'Zoom Out', icon: IcDown, shortcut: 'Ctrl+[', action: () => setZoom(zoom * 0.8) },
        { id: 'zoom-100', label: 'Zoom 100%', icon: IcRefresh, shortcut: 'Ctrl+0', action: () => setZoom(1) },
        { id: 'zoom-fit', label: 'Fit Canvas', icon: IcRefresh, action: () => {
          const availW = window.innerWidth - 264 - 292 - 120;
          const availH = window.innerHeight - 48 - 70;
          setZoom(Math.min(availW / project.canvas.w, availH / project.canvas.h) * 0.9);
        }},
      ]
    }
  ];

  // Device menu
  const buildDeviceMenu = (selection: Selection): MenuSection[] => {
    const device = project.devices.find(d => d.id === selection.id);
    if (!device) return [];

    const locked = isLocked('device', device.id);

    return [
      {
        title: 'DEVICE',
        items: [
          { id: 'duplicate', label: 'Duplicate Device', icon: IcCopy, shortcut: 'Ctrl+D', disabled: locked, action: () => { checkpoint(); duplicateDevice(device.id); toast('Device duplicated'); } },
          { id: 'delete', label: 'Delete Device', icon: IcTrash, shortcut: 'Del', disabled: locked, action: () => { checkpoint(); removeDevice(device.id); toast('Device deleted'); } },
        ]
      },
      {
        title: 'ARRANGE',
        items: [
          { id: 'forward', label: 'Bring Forward', icon: IcUp, disabled: locked, action: () => { checkpoint(); update(p => ({ ...p, devices: p.devices.map((d, i) => i === p.devices.findIndex(dev => dev.id === device.id) ? { ...d, z: d.z + 1 } : d) })); toast('Brought forward'); } },
          { id: 'backward', label: 'Send Backward', icon: IcDown, disabled: locked, action: () => { checkpoint(); update(p => ({ ...p, devices: p.devices.map((d, i) => i === p.devices.findIndex(dev => dev.id === device.id) ? { ...d, z: d.z - 1 } : d) })); toast('Sent backward'); } },
        ]
      },
      {
        title: 'LOCK',
        items: [
          { id: 'lock', label: locked ? 'Unlock Device' : 'Lock Device', icon: locked ? IcUnlock : IcLock, action: () => { 
            if (locked) { unlockObject('device', device.id); toast('Device unlocked'); }
            else { lockObject('device', device.id); toast('Device locked'); }
          }},
        ]
      },
      {
        title: 'VISIBILITY',
        items: [
          { id: 'toggle-visibility', label: device.visible ? 'Hide Device' : 'Show Device', icon: device.visible ? IcEyeOff : IcEye, disabled: locked, action: () => { checkpoint(); update(p => ({ ...p, devices: p.devices.map(d => d.id === device.id ? { ...d, visible: !d.visible } : d) })); toast(device.visible ? 'Device hidden' : 'Device shown'); } },
        ]
      },
      {
        title: 'PROPERTIES',
        items: [
          { id: 'edit-props', label: 'Edit Properties', icon: IcType, action: () => { setSelection({ kind: 'device', id: device.id }); toast('Properties panel focused'); } },
        ]
      }
    ];
  };

  // Text menu (main text block)
  const buildTextMenu = (): MenuSection[] => {
    const locked = isLocked('text', 'main');

    return [
      {
        title: 'TEXT',
        items: [
          { id: 'edit-text', label: 'Edit Text', icon: IcType, disabled: locked, action: () => { setSelection({ kind: 'text' }); toast('Text selected'); } },
          { id: 'toggle-visibility', label: project.text.enabled ? 'Hide Text' : 'Show Text', icon: project.text.enabled ? IcEyeOff : IcEye, disabled: locked, action: () => { checkpoint(); update(p => ({ ...p, text: { ...p.text, enabled: !p.text.enabled } })); toast(project.text.enabled ? 'Text hidden' : 'Text shown'); } },
        ]
      },
      {
        title: 'LOCK',
        items: [
          { id: 'lock', label: locked ? 'Unlock Text' : 'Lock Text', icon: locked ? IcUnlock : IcLock, action: () => { 
            if (locked) { unlockObject('text', 'main'); toast('Text unlocked'); }
            else { lockObject('text', 'main'); toast('Text locked'); }
          }},
        ]
      },
      {
        title: 'PROPERTIES',
        items: [
          { id: 'edit-props', label: 'Edit Properties', icon: IcType, action: () => { setSelection({ kind: 'text' }); toast('Properties panel focused'); } },
        ]
      }
    ];
  };

  // Text box menu
  const buildTextBoxMenu = (selection: Selection): MenuSection[] => {
    const textbox = project.textboxes.find(t => t.id === selection.id);
    if (!textbox) return [];

    const locked = isLocked('textbox', textbox.id);

    return [
      {
        title: 'TEXT BOX',
        items: [
          { id: 'duplicate', label: 'Duplicate Text Box', icon: IcCopy, shortcut: 'Ctrl+D', disabled: locked, action: () => { checkpoint(); update(p => ({ ...p, textboxes: [...p.textboxes, { ...textbox, id: Math.random().toString(36).slice(2), x: textbox.x + 0.02, y: textbox.y + 0.02 }] })); toast('Text box duplicated'); } },
          { id: 'delete', label: 'Delete Text Box', icon: IcTrash, shortcut: 'Del', disabled: locked, action: () => { checkpoint(); update(p => ({ ...p, textboxes: p.textboxes.filter(t => t.id !== textbox.id) })); toast('Text box deleted'); } },
        ]
      },
      {
        title: 'LOCK',
        items: [
          { id: 'lock', label: locked ? 'Unlock Text Box' : 'Lock Text Box', icon: locked ? IcUnlock : IcLock, action: () => { 
            if (locked) { unlockObject('textbox', textbox.id); toast('Text box unlocked'); }
            else { lockObject('textbox', textbox.id); toast('Text box locked'); }
          }},
        ]
      },
      {
        title: 'VISIBILITY',
        items: [
          { id: 'toggle-visibility', label: textbox.opacity > 0 ? 'Hide Text Box' : 'Show Text Box', icon: textbox.opacity > 0 ? IcEyeOff : IcEye, disabled: locked, action: () => { checkpoint(); update(p => ({ ...p, textboxes: p.textboxes.map(t => t.id === textbox.id ? { ...t, opacity: t.opacity === 0 ? 1 : 0 } : t) })); toast(textbox.opacity > 0 ? 'Text box hidden' : 'Text box shown'); } },
        ]
      },
      {
        title: 'PROPERTIES',
        items: [
          { id: 'edit-props', label: 'Edit Properties', icon: IcType, action: () => { setSelection({ kind: 'textbox', id: textbox.id }); toast('Properties panel focused'); } },
        ]
      }
    ];
  };

  // Canvas Image menu
  const buildCanvasImageMenu = (selection: Selection): MenuSection[] => {
    const canvasImage = project.canvasImages?.find(img => img.id === selection.id);
    if (!canvasImage) return [];

    const locked = isLocked('canvasImage', canvasImage.id);
    const asset = project.assets.find(a => a.id === canvasImage.assetId);

    return [
      {
        title: 'CANVAS IMAGE',
        items: [
          { id: 'duplicate', label: 'Duplicate Image', icon: IcCopy, shortcut: 'Ctrl+D', disabled: locked, action: () => { checkpoint(); update(p => ({ ...p, canvasImages: [...(p.canvasImages || []), { ...canvasImage, id: Math.random().toString(36).slice(2), x: canvasImage.x + 0.02, y: canvasImage.y + 0.02 }] })); toast('Image duplicated'); } },
          { id: 'delete', label: 'Delete Image', icon: IcTrash, shortcut: 'Del', disabled: locked, action: () => { checkpoint(); update(p => ({ ...p, canvasImages: (p.canvasImages || []).filter(img => img.id !== canvasImage.id) })); setSelection(null); toast('Image deleted'); } },
        ]
      },
      {
        title: 'ARRANGE',
        items: [
          { id: 'forward', label: 'Bring Forward', icon: IcUp, disabled: locked, action: () => { checkpoint(); update(p => ({ ...p, canvasImages: (p.canvasImages || []).map(img => img.id === canvasImage.id ? { ...img, z: img.z + 1 } : img) })); toast('Brought forward'); } },
          { id: 'backward', label: 'Send Backward', icon: IcDown, disabled: locked, action: () => { checkpoint(); update(p => ({ ...p, canvasImages: (p.canvasImages || []).map(img => img.id === canvasImage.id ? { ...img, z: img.z - 1 } : img) })); toast('Sent backward'); } },
        ]
      },
      {
        title: 'LOCK',
        items: [
          { id: 'lock', label: locked ? 'Unlock Image' : 'Lock Image', icon: locked ? IcUnlock : IcLock, action: () => { 
            if (locked) { unlockObject('canvasImage', canvasImage.id); toast('Image unlocked'); }
            else { lockObject('canvasImage', canvasImage.id); toast('Image locked'); }
          }},
        ]
      },
      {
        title: 'VISIBILITY',
        items: [
          { id: 'toggle-visibility', label: canvasImage.visible ? 'Hide Image' : 'Show Image', icon: canvasImage.visible ? IcEyeOff : IcEye, disabled: locked, action: () => { checkpoint(); update(p => ({ ...p, canvasImages: (p.canvasImages || []).map(img => img.id === canvasImage.id ? { ...img, visible: !img.visible } : img) })); toast(canvasImage.visible ? 'Image hidden' : 'Image shown'); } },
        ]
      },
      {
        title: 'PROPERTIES',
        items: [
          { id: 'edit-props', label: 'Edit Properties', icon: IcType, action: () => { setSelection({ kind: 'canvasImage', id: canvasImage.id }); toast('Properties panel focused'); } },
        ]
      }
    ];
  };

  // Text box menu (continued)
  const buildTextBoxMenuOld = (selection: Selection): MenuSection[] => {
    const textbox = project.textboxes.find(t => t.id === selection.id);
    if (!textbox) return [];

    const locked = isLocked('textbox', textbox.id);

    return [
      {
        title: 'TEXT BOX',
        items: [
          { id: 'duplicate', label: 'Duplicate Text Box', icon: IcCopy, shortcut: 'Ctrl+D', disabled: locked, action: () => { checkpoint(); update(p => ({ ...p, textboxes: [...p.textboxes, { ...textbox, id: Math.random().toString(36).slice(2), x: textbox.x + 0.02, y: textbox.y + 0.02 }] })); toast('Text box duplicated'); } },
          { id: 'delete', label: 'Delete Text Box', icon: IcTrash, shortcut: 'Del', disabled: locked, action: () => { checkpoint(); update(p => ({ ...p, textboxes: p.textboxes.filter(t => t.id !== textbox.id) })); toast('Text box deleted'); } },
        ]
      },
      {
        title: 'LOCK',
        items: [
          { id: 'lock', label: locked ? 'Unlock Text Box' : 'Lock Text Box', icon: locked ? IcUnlock : IcLock, action: () => { 
            if (locked) { unlockObject('textbox', textbox.id); toast('Text box unlocked'); }
            else { lockObject('textbox', textbox.id); toast('Text box locked'); }
          }},
        ]
      },
      {
        title: 'VISIBILITY',
        items: [
          { id: 'toggle-visibility', label: textbox.opacity > 0 ? 'Hide Text Box' : 'Show Text Box', icon: textbox.opacity > 0 ? IcEyeOff : IcEye, disabled: locked, action: () => { checkpoint(); update(p => ({ ...p, textboxes: p.textboxes.map(t => t.id === textbox.id ? { ...t, opacity: t.opacity > 0 ? 0 : 1 } : t) })); toast(textbox.opacity > 0 ? 'Text box hidden' : 'Text box shown'); } },
        ]
      },
      {
        title: 'PROPERTIES',
        items: [
          { id: 'edit-props', label: 'Edit Properties', icon: IcType, action: () => { setSelection({ kind: 'textbox', id: textbox.id }); toast('Properties panel focused'); } },
        ]
      }
    ];
  };

  // Icon menu
  const buildIconMenu = (selection: Selection): MenuSection[] => {
    const icon = project.icons.find(i => i.id === selection.id);
    if (!icon) return [];

    const locked = isLocked('icon', icon.id);

    return [
      {
        title: 'ICON',
        items: [
          { id: 'duplicate', label: 'Duplicate Icon', icon: IcCopy, shortcut: 'Ctrl+D', disabled: locked, action: () => { checkpoint(); update(p => ({ ...p, icons: [...p.icons, { ...icon, id: Math.random().toString(36).slice(2), x: icon.x + 0.02, y: icon.y + 0.02 }] })); toast('Icon duplicated'); } },
          { id: 'delete', label: 'Delete Icon', icon: IcTrash, shortcut: 'Del', disabled: locked, action: () => { checkpoint(); update(p => ({ ...p, icons: p.icons.filter(i => i.id !== icon.id) })); toast('Icon deleted'); } },
        ]
      },
      {
        title: 'LOCK',
        items: [
          { id: 'lock', label: locked ? 'Unlock Icon' : 'Lock Icon', icon: locked ? IcUnlock : IcLock, action: () => { 
            if (locked) { unlockObject('icon', icon.id); toast('Icon unlocked'); }
            else { lockObject('icon', icon.id); toast('Icon locked'); }
          }},
        ]
      },
      {
        title: 'VISIBILITY',
        items: [
          { id: 'toggle-visibility', label: icon.opacity > 0 ? 'Hide Icon' : 'Show Icon', icon: icon.opacity > 0 ? IcEyeOff : IcEye, disabled: locked, action: () => { checkpoint(); update(p => ({ ...p, icons: p.icons.map(i => i.id === icon.id ? { ...i, opacity: i.opacity > 0 ? 0 : 1 } : i) })); toast(icon.opacity > 0 ? 'Icon hidden' : 'Icon shown'); } },
        ]
      },
      {
        title: 'PROPERTIES',
        items: [
          { id: 'edit-props', label: 'Edit Properties', icon: IcType, action: () => { setSelection({ kind: 'icon', id: icon.id }); toast('Properties panel focused'); } },
        ]
      }
    ];
  };

  // Decoration menu
  const buildDecorationMenu = (selection: Selection): MenuSection[] => {
    const deco = project.decos.find(d => d.id === selection.id);
    if (!deco) return [];

    const locked = isLocked('deco', deco.id);

    return [
      {
        title: 'DECORATION',
        items: [
          { id: 'duplicate', label: 'Duplicate Decoration', icon: IcCopy, shortcut: 'Ctrl+D', disabled: locked, action: () => { checkpoint(); update(p => ({ ...p, decos: [...p.decos, { ...deco, id: Math.random().toString(36).slice(2), x: deco.x + 0.02, y: deco.y + 0.02 }] })); toast('Decoration duplicated'); } },
          { id: 'delete', label: 'Delete Decoration', icon: IcTrash, shortcut: 'Del', disabled: locked, action: () => { checkpoint(); update(p => ({ ...p, decos: p.decos.filter(d => d.id !== deco.id) })); toast('Decoration deleted'); } },
        ]
      },
      {
        title: 'LOCK',
        items: [
          { id: 'lock', label: locked ? 'Unlock Decoration' : 'Lock Decoration', icon: locked ? IcUnlock : IcLock, action: () => { 
            if (locked) { unlockObject('deco', deco.id); toast('Decoration unlocked'); }
            else { lockObject('deco', deco.id); toast('Decoration locked'); }
          }},
        ]
      },
      {
        title: 'VISIBILITY',
        items: [
          { id: 'toggle-visibility', label: deco.opacity > 0 ? 'Hide Decoration' : 'Show Decoration', icon: deco.opacity > 0 ? IcEyeOff : IcEye, disabled: locked, action: () => { checkpoint(); update(p => ({ ...p, decos: p.decos.map(d => d.id === deco.id ? { ...d, opacity: d.opacity > 0 ? 0 : 1 } : d) })); toast(deco.opacity > 0 ? 'Decoration hidden' : 'Decoration shown'); } },
        ]
      },
      {
        title: 'PROPERTIES',
        items: [
          { id: 'edit-props', label: 'Edit Properties', icon: IcType, action: () => { setSelection({ kind: 'deco', id: deco.id }); toast('Properties panel focused'); } },
        ]
      }
    ];
  };

  // Logo menu
  const buildLogoMenu = (): MenuSection[] => {
    const locked = isLocked('logo', 'main');

    return [
      {
        title: 'LOGO',
        items: [
          { id: 'toggle-visibility', label: project.logo.enabled ? 'Hide Logo' : 'Show Logo', icon: project.logo.enabled ? IcEyeOff : IcEye, disabled: locked, action: () => { checkpoint(); update(p => ({ ...p, logo: { ...p.logo, enabled: !p.logo.enabled } })); toast(project.logo.enabled ? 'Logo hidden' : 'Logo shown'); } },
        ]
      },
      {
        title: 'LOCK',
        items: [
          { id: 'lock', label: locked ? 'Unlock Logo' : 'Lock Logo', icon: locked ? IcUnlock : IcLock, action: () => { 
            if (locked) { unlockObject('logo', 'main'); toast('Logo unlocked'); }
            else { lockObject('logo', 'main'); toast('Logo locked'); }
          }},
        ]
      },
      {
        title: 'PROPERTIES',
        items: [
          { id: 'edit-props', label: 'Edit Properties', icon: IcType, action: () => { setSelection({ kind: 'logo' }); toast('Properties panel focused'); } },
        ]
      }
    ];
  };

  // Background menu
  const buildBackgroundMenu = (): MenuSection[] => {
    return [
      {
        title: 'BACKGROUND',
        items: [
          { id: 'edit-props', label: 'Edit Background', icon: IcType, action: () => { setSelection({ kind: 'background' }); toast('Properties panel focused'); } },
          { id: 'randomize', label: 'Randomize Background', icon: IcDice, action: () => { randomize(); toast('Background randomized'); } },
        ]
      }
    ];
  };

  const menuSections = buildMenu();

  // Get all menu items for search and keyboard navigation
  const getAllMenuItems = (): MenuItem[] => {
    return menuSections.flatMap(section => section.items);
  };

  // Filter items based on search
  const getFilteredMenu = (): MenuSection[] => {
    if (!searchQuery) return menuSections;

    return menuSections
      .map(section => ({
        ...section,
        items: section.items.filter(item => 
          item.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }))
      .filter(section => section.items.length > 0);
  };

  const filteredMenu = getFilteredMenu();
  const allFilteredItems = filteredMenu.flatMap(section => section.items);

  const menuItemClass = "flex items-center gap-2 px-3 py-2 text-[12px] cursor-pointer transition-colors";

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] bg-panel border border-line rounded-lg shadow-2xl anim-pop overflow-hidden"
      style={{ left: position.left, top: position.top, width: 280 }}
    >
      {/* Search */}
      <div className="p-2 border-b border-line">
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-dim">
            <IcSearch size={12} />
          </span>
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setFocusedIndex(-1); }}
            placeholder="Search actions..."
            className="w-full pl-7 pr-2 py-1.5 text-[11px] bg-ink border border-line rounded focus:border-acc outline-none"
            style={{ color: 'var(--color-fg)' }}
          />
        </div>
      </div>

      {/* Menu Sections */}
      <div className="max-h-[400px] overflow-y-auto">
        {filteredMenu.length === 0 ? (
          <div className="px-3 py-4 text-center text-[11px]" style={{ color: 'var(--color-dim)' }}>
            No actions found
          </div>
        ) : (
          filteredMenu.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {sectionIndex > 0 && <div className="border-t border-line" />}
              <div className="px-3 py-1.5 text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-dim)' }}>
                {section.title}
              </div>
              {section.items.map((item, itemIndex) => {
                const globalIndex = allFilteredItems.indexOf(item);
                const Icon = item.icon;
                const isFocused = globalIndex === focusedIndex;

                return (
                  <div
                    key={item.id}
                    className={`${menuItemClass} ${item.disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-panel2'} ${isFocused ? 'bg-panel2' : ''}`}
                    style={{ color: item.disabled ? 'var(--color-dim)' : 'var(--color-fg)' }}
                    onClick={() => {
                      if (!item.disabled) {
                        item.action();
                        onClose();
                      }
                    }}
                    onMouseEnter={() => setFocusedIndex(globalIndex)}
                  >
                    {Icon && <Icon size={14} />}
                    <span className="flex-1">{item.label}</span>
                    {item.shortcut && (
                      <span className="text-[9px]" style={{ color: 'var(--color-dim)', fontFamily: 'var(--font-mono)' }}>
                        {item.shortcut}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-line flex items-center justify-between text-[9px]" style={{ color: 'var(--color-dim)' }}>
        <span>↑↓ Navigate</span>
        <span>↵ Select</span>
        <span>Esc Close</span>
      </div>
    </div>
  );
}
