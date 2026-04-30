import { useState, useRef, useEffect } from 'react';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  existingTags: string[];
}

export default function TagInput({ value, onChange, existingTags }: TagInputProps) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const addTag = (tag: string) => {
    const normalized = tag.toLowerCase().trim();
    if (!normalized) return;
    if (value.includes(normalized)) return; // Prevent duplicates
    onChange([...value, normalized]);
    setInput('');
    setShowSuggestions(false);
  };

  const removeTag = (tag: string) => {
    onChange(value.filter(t => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  const suggestions = existingTags.filter(
    t =>
      t.toLowerCase().includes(input.toLowerCase()) &&
      !value.includes(t.toLowerCase()),
  );

  return (
    <div ref={containerRef} className="relative">
      {/* Tags */}
      <div className="flex flex-wrap items-center gap-1 border border-neutral-200 rounded-lg px-3 py-2 min-h-[44px] focus-within:ring-2 focus-within:ring-cito-primary">
        {value.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-700 border border-neutral-200 text-[14px] rounded-full px-2 py-0.5"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-neutral-400 hover:text-neutral-600 text-[12px] leading-none"
            >
              x
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => {
            setInput(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? 'Tag toevoegen...' : ''}
          className="flex-1 min-w-[100px] outline-none text-base text-neutral-700 bg-transparent"
        />
      </div>

      {/* Autocomplete suggestions */}
      {showSuggestions && input && suggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-neutral-200 rounded-lg shadow-lg max-h-[160px] overflow-y-auto">
          {suggestions.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => addTag(tag)}
              className="w-full text-left px-3 py-2 text-[14px] text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
