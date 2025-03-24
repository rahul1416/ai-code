from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import re
import subprocess
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from langchain_groq import ChatGroq
from langchain.schema import HumanMessage

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


llm = ChatGroq(model_name="llama-3.3-70b-versatile")

suggestion_model = ChatGroq(
    model_name="qwen-2.5-coder-32b",
    temperature=0.3,
    max_tokens=20,
    timeout=None
)

class PromptRequest(BaseModel):
    prompt: str

class CodeSnippetRequest(BaseModel):
    code_snippet: str

def generate_code(prompt: str) -> str:
    formatted_prompt = f"Output only structured code without any explanations or comments.\n\n {prompt}"

    messages = [HumanMessage(content=formatted_prompt)]

    response = llm.invoke(messages)
    generated_text = response.content  

    code_match = re.findall(r"```(?:\w+)?\n(.*?)```", generated_text, re.DOTALL)

    if code_match:
        return "\n".join(code_match)
    else:
        return generated_text.strip()

def suggest_next_word(code_snippet: str) -> str:
    
    prompt = f"Continue the given Python code snippet by generating only the next required characters or tokens. \n Rules \n 1. If the code is incomplete, generate only the next necessary continuation.  \n2. Do not include any explanations, comments, or extra text. \n 3. Ensure the output consists strictly of the required Python code continuation. \n 4. If the last token is incomplete (e.g., `for i in ran`), complete it minimally (e.g., `ge(0, )`).  \n Code Snippet: \n{code_snippet}"
    response = suggestion_model.invoke(prompt)
    return response.content.strip()


def execute_python_code(code: str, input_data: str = "") -> dict:
    try:
        with open("generated_script.py", "w") as f:
            f.write(code)

        process = subprocess.Popen(
            ['python3', 'generated_script.py'],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        stdout, stderr = process.communicate(input=input_data)
    
        return {"output": stdout, "error": stderr}
    except Exception as e:
        return {"output": "", "error": str(e)}



@app.post("/generate-code")
async def generate_code_endpoint(request: PromptRequest):
    try:

        generated_code = generate_code(request.prompt)

        with open("generated_script.py", "w") as f:
            f.write(generated_code)


        return {"code": generated_code}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/compile-code")
async def compile_code_endpoint(request: dict):
    try:
        code = request.get("code", "")
        input_data = request.get("input_data", "")
        result = execute_python_code(code, input_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/suggest-next-word")
async def suggest_next_word_endpoint(request: CodeSnippetRequest):
    try:
        suggestion = suggest_next_word(request.code_snippet)
        return {"suggestion": suggestion}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)

