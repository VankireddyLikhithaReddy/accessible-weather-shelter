import React, { useState, forwardRef, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import "bootstrap/dist/css/bootstrap.min.css";


export default forwardRef(function LocationInput({ onSearch }, ref) {
  const [location, setLocation] = useState("");
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (location.trim()) {
      onSearch(location.trim());
    }
  };

  // Listen for focus-search event and focus the input
  useEffect(() => {
    const handleFocusSearch = () => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    };

    // Listen for voice-search event with location query
    const handleVoiceSearch = (e) => {
      const query = e?.detail?.query;
      if (query) {
        setLocation(query);
        // Trigger search after setting the location
        setTimeout(() => {
          onSearch(query);
        }, 100);
      }
    };

    window.addEventListener('focus-search', handleFocusSearch);
    window.addEventListener('voice-search', handleVoiceSearch);
    return () => {
      window.removeEventListener('focus-search', handleFocusSearch);
      window.removeEventListener('voice-search', handleVoiceSearch);
    };
  }, [onSearch]);

  return (
    <form onSubmit={handleSubmit} className="w-100 d-flex justify-content-center mb-4">
      <div className="input-group" style={{ maxWidth: "500px" }}>
        <input
          ref={inputRef}
          type="text"
          className="form-control form-control-lg"
          placeholder="Enter city name..."
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          aria-label="Location search"
          data-testid="input-location"
        />
        <button type="submit" className="btn btn-primary btn-lg d-flex align-items-center" data-testid="button-search-location">
          <Search className="me-2" />
          Search
        </button>
      </div>
    </form>
  );
});