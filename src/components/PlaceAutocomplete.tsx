import React, { useState, useEffect, useRef } from "react";

export interface PlaceResult {
  lat: number;
  lng: number;
  name: string;
}

interface PlaceAutocompleteProps {
  id?: string;
  defaultValue?: string;
  className?: string;
  onPlaceSelect?: (place: PlaceResult | null) => void;
}

export function PlaceAutocomplete({
  id,
  defaultValue,
  className,
  onPlaceSelect,
}: PlaceAutocompleteProps) {
  const [inputVal, setInputVal] = useState(defaultValue || "");
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputVal.length >= 3 && inputVal !== defaultValue) {
        searchPlaces(inputVal);
      } else if (inputVal.length < 3) {
        setResults([]);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [inputVal]);

  const searchPlaces = async (query: string) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
      );
      if (!res.ok) throw new Error("Error fetching data");
      const data = await res.json();
      setResults(data || []);
      setIsOpen(true);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="relative w-full flex-1 min-w-0" ref={wrapperRef}>
      <input
        type="text"
        id={id}
        value={inputVal}
        onChange={(e) => {
          setInputVal(e.target.value);
        }}
        onFocus={() => {
          if (results.length > 0) setIsOpen(true);
        }}
        className={className}
        placeholder="Escribe la ubicación..."
        autoComplete="off"
      />
      {isOpen && results.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border border-slate-200 mt-1 rounded-md shadow-lg max-h-60 overflow-auto">
          {results.map((result, i) => {
            const displayName = result.display_name || '';
            
            return (
            <li
              key={result.place_id || i}
              className="px-4 py-2 hover:bg-slate-100 cursor-pointer text-sm text-slate-700 border-b border-slate-100 last:border-0"
              onClick={() => {
                setInputVal(displayName);
                setIsOpen(false);
                if (onPlaceSelect) {
                  onPlaceSelect({
                    lat: parseFloat(result.lat),
                    lng: parseFloat(result.lon),
                    name: displayName,
                  });
                }
              }}
            >
              {displayName}
            </li>
          )})}
        </ul>
      )}
    </div>
  );
}
