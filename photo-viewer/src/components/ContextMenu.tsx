interface ContextMenuProps {
  x: number;
  y: number;
  onFindSimilar: () => void;
  onClose: () => void;
  aiEnabled: boolean;
}

export function ContextMenu({ x, y, onFindSimilar, onClose, aiEnabled }: ContextMenuProps) {
  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      <div
        className="fixed bg-gray-800 rounded shadow-lg z-50 py-2 min-w-[200px]"
        style={{ left: x, top: y }}
      >
        {aiEnabled && (
          <button
            onClick={() => {
              onFindSimilar();
              onClose();
            }}
            className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 transition"
          >
            Find Similar (AI)
          </button>
        )}
      </div>
    </>
  );
}
