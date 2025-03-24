import React, { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import debounce from "lodash.debounce";

function CodeEditor({ code, setCode }) {
  const editorRef = useRef(null);
  const [suggestion, setSuggestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const decorationsRef = useRef([]);

  // Handle editor mount
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    // Register inline completion provider
    monaco.languages.registerInlineCompletionsProvider("python", {
      provideInlineCompletions: async (model, position) => {
        if (!suggestion) return { items: [] };

        return {
          items: [
            {
              text: suggestion,
              range: new monaco.Range(
                position.lineNumber,
                position.column,
                position.lineNumber,
                position.column
              ),
            },
          ],
        };
      },
      freeInlineCompletions() {}, // Ensure this function exists to prevent errors
    });
  };

  // Debounced function to fetch suggestions
  const fetchSuggestions = debounce(async (value) => {
    setIsLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/suggest-next-word", {
        code_snippet: value,
      });

      setSuggestion(response.data.suggestion);
    } catch (error) {
      console.error("Error fetching suggestion:", error);
    } finally {
      setIsLoading(false);
    }
  }, 500);

  // Handle code changes
  const handleCodeChange = (value) => {
    setCode(value || "");
    fetchSuggestions(value);
  };

  // Update ghost text decoration when suggestion changes
  useEffect(() => {
    if (editorRef.current && suggestion) {
      const editor = editorRef.current;
      const position = editor.getPosition();

      // Remove previous decorations
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);

      // Add new decoration for ghost text
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [
        {
          range: new monaco.Range(
            position.lineNumber,
            position.column,
            position.lineNumber,
            position.column + suggestion.length
          ),
          options: {
            inlineClassName: "ghost-text", // CSS class for ghost text styling
            after: {
              content: suggestion,
              inlineClassName: "ghost-text", // CSS class for ghost text styling
            },
          },
        },
      ]);
    } else if (editorRef.current && !suggestion) {
      // Clear decorations if there's no suggestion
      decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
    }
  }, [suggestion]);

  // Handle accepting suggestions on Tab key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Tab" && suggestion && editorRef.current) {
        event.preventDefault();
        const editor = editorRef.current;
        const position = editor.getPosition();

        // Insert suggestion at cursor position
        editor.executeEdits("suggestion", [
          {
            range: new monaco.Range(
              position.lineNumber,
              position.column,
              position.lineNumber,
              position.column
            ),
            text: suggestion,
            forceMoveMarkers: true,
          },
        ]);

        setSuggestion("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [suggestion]);

  return (
    <div className="code-editor">
      <Editor
        height="400px"
        defaultLanguage="python"
        value={code}
        onChange={handleCodeChange}
        theme="vs-dark"
        options={{
          fontSize: 14,
          automaticLayout: true,
          inlineSuggest: true, // Enables inline suggestions
        }}
        onMount={handleEditorDidMount}
      />
      {isLoading && <div className="loading-indicator">Fetching suggestion...</div>}
    </div>
  );
}

export default CodeEditor;