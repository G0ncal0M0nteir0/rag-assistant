from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def generate_answer(question: str, context_chunks: list[str]) -> str:
    if not context_chunks:
        return "I couldn't find any relevant information in your documents to answer that question."

    context = "\n\n".join(context_chunks)

    prompt = f"""You are a helpful assistant. Answer the user's question using ONLY the context provided below.
If the answer is not in the context, say "I don't have enough information in your documents to answer that."
Do not make up information.

Context:
{context}

Question: {question}

Answer:"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=1000
    )

    return response.choices[0].message.content