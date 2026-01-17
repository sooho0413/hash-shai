
import os
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM

MODEL_PATH = ".."  # As seen in main.py
device = "mps" if torch.backends.mps.is_available() else "cpu"
print(f"Device: {device}")

try:
    print("Loading tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
    
    print("Loading model...")
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_PATH,
        torch_dtype=torch.bfloat16,
        device_map=device,
        attn_implementation="sdpa"
    )
    print("Model loaded successfully")
    
    print("Testing generation...")
    input_text = "Hello"
    input_ids = tokenizer(input_text, return_tensors="pt").to(device)
    
    with torch.inference_mode():
        outputs = model.generate(
            **input_ids,
            max_new_tokens=10,
            do_sample=True,
            temperature=0.6
        )
    print("Generation output:", tokenizer.decode(outputs[0]))
    print("SUCCESS")

except Exception as e:
    print("FAILED")
    print(e)
    # Print detailed traceback
    import traceback
    traceback.print_exc()
