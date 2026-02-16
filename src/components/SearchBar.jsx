/**
 * Search Bar Component
 * Provides search functionality with autocomplete
 */
import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader } from 'lucide-react';
import api from '../services/api';

export default function SearchBar({ onSearch, placeholder = "Search stalls and menu items..." }) {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchResults, setSearchResults] = useState(null);
    const searchRef = useRef(null);
    const suggestionsRef = useRef(null);

    // Debounce search suggestions
    useEffect(() => {
        if (query.length < 1) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                setLoading(true);
                const data = await api.get(`/search/suggestions?q=${encodeURIComponent(query)}`);
                setSuggestions(data.suggestions || []);
                setShowSuggestions(true);
            } catch (error) {
                console.error('Error fetching suggestions:', error);
                setSuggestions([]);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                searchRef.current &&
                !searchRef.current.contains(event.target) &&
                suggestionsRef.current &&
                !suggestionsRef.current.contains(event.target)
            ) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = async (searchQuery = query) => {
        if (!searchQuery.trim()) return;

        try {
            setLoading(true);
            const data = await api.get(`/search?q=${encodeURIComponent(searchQuery)}&type=all`);
            setSearchResults(data);
            setShowSuggestions(false);
            if (onSearch) {
                onSearch(data);
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSuggestionClick = (suggestion) => {
        setQuery(suggestion.name);
        setShowSuggestions(false);
        handleSearch(suggestion.name);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    const clearSearch = () => {
        setQuery('');
        setSearchResults(null);
        setSuggestions([]);
        setShowSuggestions(false);
        if (onSearch) {
            onSearch(null);
        }
    };

    return (
        <div className="relative w-full max-w-2xl mx-auto">
            {/* Search Input */}
            <div ref={searchRef} className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    {loading ? (
                        <Loader className="h-5 w-5 text-gray-400 animate-spin" />
                    ) : (
                        <Search className="h-5 w-5 text-gray-400" />
                    )}
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    onFocus={() => query.length > 0 && setShowSuggestions(true)}
                    placeholder={placeholder}
                    className="w-full pl-12 pr-12 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-300 shadow-lg hover:shadow-xl text-gray-900 placeholder-gray-400"
                />
                {query && (
                    <button
                        onClick={clearSearch}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div
                    ref={suggestionsRef}
                    className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-64 overflow-y-auto"
                >
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full px-6 py-3 text-left hover:bg-indigo-50 transition-colors duration-200 flex items-center space-x-3 border-b border-gray-100 last:border-b-0"
                        >
                            <Search className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-900 font-medium">{suggestion.name}</span>
                            <span className="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                {suggestion.type}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {/* Search Results Summary */}
            {searchResults && (
                <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                    <p className="text-sm text-indigo-700">
                        Found <strong>{searchResults.counts.total}</strong> results
                        {searchResults.counts.stalls > 0 && ` (${searchResults.counts.stalls} stalls`}
                        {searchResults.counts.menu > 0 && `, ${searchResults.counts.menu} items`}
                        {searchResults.counts.stalls > 0 || searchResults.counts.menu > 0 ? ')' : ''}
                    </p>
                </div>
            )}
        </div>
    );
}
