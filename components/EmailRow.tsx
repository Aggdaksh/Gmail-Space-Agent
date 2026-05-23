interface Email {
  id: string;
  subject: string;
  from: string;
  date: string;
  size?: string;
  category?: string;
}

interface Props {
  email: Email;
  selected: boolean;
  onToggle: () => void;
  onTrash: (id: string) => void;
}

export default function EmailRow({ email, selected, onToggle, onTrash }: Props) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all
      ${selected
        ? "bg-emerald-900/20 border-emerald-800/40"
        : "bg-gray-900 border-gray-800 hover:border-gray-700"
      }`}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggle}
        className="w-4 h-4 accent-emerald-500 cursor-pointer shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-200 truncate">
          {email.subject}
        </div>
        <div className="text-xs text-gray-500 mt-0.5 flex gap-2 flex-wrap">
          <span className="truncate max-w-37.5">{email.from}</span>
          <span>· {email.date}</span>
          {email.size && (
            <span className="text-red-400 font-medium">📎 {email.size}</span>
          )}
          {email.category && (
            <span className="bg-purple-900/40 text-purple-400 px-1.5 rounded text-xs">
              {email.category}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={() => onTrash(email.id)}
        className="text-xs text-red-400 hover:text-red-300 border border-red-900/50
                   hover:border-red-700 px-2 py-1 rounded transition-colors shrink-0"
      >
        Trash
      </button>
    </div>
  );
}