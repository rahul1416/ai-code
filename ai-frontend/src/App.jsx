import React, { useState } from "react";
import axios from "axios";
import CodeEditor from "./components/CodeEditor";
import PromptInput from "./components/PromptInput";
import OutputDisplay from "./components/OutputDisplay";

function App() {
  const [prompt, setPrompt] = useState("");
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [inputData, setInputData] = useState("");

  const generateCode = async () => {
    try {
      const response = await axios.post("http://localhost:5000/generate-code", {
        prompt,
      });
      setCode(response.data.code);
    } catch (error) {
      console.error("Error generating code:", error);
    }
  };

  const compileCode = async () => {
    try {
      const response = await axios.post("http://localhost:5000/compile-code", {
        code: code,
        input_data: inputData,
      });
      setOutput(response.data.output);
      if (response.data.error) {
        console.error("Error:", response.data.error);
      }
    } catch (error) {
      console.error("Error compiling code:", error);
    }
  };

  return (
    <div className="app">
      <h1>AI Code Generator and Compiler</h1>
      <PromptInput
        prompt={prompt}
        setPrompt={setPrompt}
        generateCode={generateCode}
      />
      <CodeEditor code={code} setCode={setCode} />
      <textarea
        value={inputData}
        onChange={(e) => setInputData(e.target.value)}
        placeholder="Enter input data (if needed)"
        rows={2}
      />
      <button onClick={compileCode}>Run Code</button>
      <OutputDisplay output={output} />
    </div>
  );
}

export default App;