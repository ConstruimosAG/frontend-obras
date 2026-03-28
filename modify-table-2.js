const fs = require('fs');

// 1. Update items-table.tsx
let tableContent = fs.readFileSync('components/coordinator/items-table.tsx', 'utf8');

// Update states
tableContent = tableContent.replace(
  'const [addingTitle, setAddingTitle] = useState(false);',
  'const [addingTitle, setAddingTitle] = useState(false);\n  const [selectedTitleForNewItem, setSelectedTitleForNewItem] = useState<string>("");'
);

// Update groupedItems
tableContent = tableContent.replace(
  /const groupedItems = useMemo\(\(\) => \{[\s\S]*?\}, \[filteredItems, localTitles\]\);/,
  `const groupedItems = useMemo(() => {
    const groups: { title: string; items: any[] }[] = [];
    localTitles.forEach((t) => {
      groups.push({ title: t, items: [] });
    });
    filteredItems.forEach((item) => {
      if (item.title && localTitles.includes(item.title)) {
        const group = groups.find((g) => g.title === item.title);
        if (group) group.items.push(item);
      }
    });
    return groups;
  }, [filteredItems, localTitles]);`
);

// Update handleCreateItem
tableContent = tableContent.replace(
  /const handleCreateItem = \(\) => \{[\s\S]*?setEditModalOpen\(true\);\s*\};/,
  `const handleCreateItem = (title: string = "") => {
    setSelectedItem(null);
    setEditingQuoteItem(null);
    setSelectedTitleForNewItem(title);
    setEditModalOpen(true);
  };`
);

// Update top buttons (Remove global Crear Ítem)
tableContent = tableContent.replace(
  '<Button\n                    onClick={handleCreateItem}\n                    className="flex-1 sm:flex-none bg-green-500 hover:bg-green-600 text-white"\n                  >\n                    <Plus className="h-4 w-4 mr-1" />\n                    Crear Ítem\n                  </Button>',
  ''
);

// Update group headers to add 'Añadir Ítem'
tableContent = tableContent.replace(
  '<h2 className="text-lg font-bold text-foreground border-b pb-2">{group.title ? group.title : "General (Sin título)"}</h2>',
  `<div className="flex justify-between items-center border-b pb-2">
                <h2 className="text-lg font-bold text-foreground">{group.title}</h2>
                {!work.finalized && !management && (
                  <Button
                    size="sm"
                    onClick={() => handleCreateItem(group.title as string)}
                    className="bg-green-500 hover:bg-green-600 text-white h-7 px-2"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Ítem
                  </Button>
                )}
              </div>`
);

// Pass selectedTitle to ItemModal
tableContent = tableContent.replace(
  '<ItemModal\n        titles={localTitles}\n        open={editModalOpen}',
  '<ItemModal\n        titles={localTitles}\n        selectedTitle={selectedTitleForNewItem}\n        open={editModalOpen}'
);

if (tableContent.includes("No hay ítems en este título aún")) {
   console.log("Table successfully replaced parts");
}
fs.writeFileSync('components/coordinator/items-table.tsx', tableContent);


// 2. Update item-modal.tsx
let modalContent = fs.readFileSync('components/coordinator/item-modal.tsx', 'utf8');

modalContent = modalContent.replace(
  'titles?: string[] | null;\n}',
  'titles?: string[] | null;\n  selectedTitle?: string;\n}'
);

modalContent = modalContent.replace(
  'titles = [],\n}: ItemModalProps) {',
  'titles = [],\n  selectedTitle = "",\n}: ItemModalProps) {'
);

modalContent = modalContent.replace(
  'title: "",\n        description: "",\n        estimatedExecutionTime: "",',
  'title: selectedTitle,\n        description: "",\n        estimatedExecutionTime: "",'
);

// Replace the Select with a disabled Input
const selectRegex = /\{\(!isEditingQuote && titles && titles\.length > 0\) && \([\s\S]*?<\/div>\s*\)\}/;
const replacementSelect = `{(!isEditingQuote && titles && titles.length > 0) && (
            <div className="space-y-2">
              <Label>Título Padre</Label>
              <Input value={formData.title} disabled className="bg-muted dark:text-black/80 font-semibold" />
            </div>
          )}`;
modalContent = modalContent.replace(selectRegex, replacementSelect);

fs.writeFileSync('components/coordinator/item-modal.tsx', modalContent);
console.log("Modal successfully replaced parts");

