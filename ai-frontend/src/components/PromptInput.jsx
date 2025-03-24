import React, { useState } from "react";

function PromptInput({ prompt, setPrompt, generateCode }) {
  return (
    <div className="prompt-input">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter a prompt (e.g., Write a Python function to calculate factorial)"
        rows={4}
      />
      <button onClick={generateCode}>Generate Code</button>
    </div>
  );
}

export default PromptInput;