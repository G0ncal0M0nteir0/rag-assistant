from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

GROQ_LIMITS = {
    "llama-3.3-70b-versatile": {
        "requests_per_minute": 30,
        "requests_per_day": 1000,
        "tokens_per_minute": 12000,
        "tokens_per_day": 100000,
    }
}

def generate_answer(
    question: str,
    context_chunks: list[str],
    history: list[dict] = []
) -> dict:
    if not context_chunks:
        return {
            "answer": "I couldn't find any relevant information in your documents to answer that question.",
            "prompt_tokens": 0,
            "answer_tokens": 0,
            "total_tokens": 0
        }

    context = "\n\n".join(context_chunks)

    system_prompt = f"""You are a helpful assistant. Answer the user's question using ONLY the context provided below.
If the answer is not in the context, say "I don't have enough information in your documents to answer that."
Do not make up information.

Context:
{context}"""

    messages = [{"role": "system", "content": system_prompt}]

    for turn in history[-4:]:
        messages.append({"role": "user", "content": turn["question"]})
        messages.append({"role": "assistant", "content": turn["answer"]})

    messages.append({"role": "user", "content": question})

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        temperature=0.2,
        max_tokens=1000
    )

    usage = response.usage

    return {
        "answer": response.choices[0].message.content,
        "prompt_tokens": usage.prompt_tokens,
        "answer_tokens": usage.completion_tokens,
        "total_tokens": usage.total_tokens
    }

def get_groq_limits() -> dict:
    return GROQ_LIMITS["llama-3.3-70b-versatile"]