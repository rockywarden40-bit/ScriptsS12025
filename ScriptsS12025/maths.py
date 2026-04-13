import sympy as sp
import math
import re

def math_ai_natural(question):
    question = question.lower()
    
    try:
        # Handle sum questions
        if "sum of" in question:
            # Example: "sum of numbers from 1 to 100"
            nums = re.findall(r'\d+', question)
            if len(nums) >= 2:
                a, b = int(nums[0]), int(nums[1])
                total = (b*(b+1)//2) - ((a-1)*a//2)
                return f"The sum of numbers from {a} to {b} is {total}."
        
        # Handle factorial
        elif "factorial" in question:
            nums = re.findall(r'\d+', question)
            if nums:
                n = int(nums[0])
                result = sp.factorial(n)
                return f"{n}! = {result}"
        
        # Handle probability questions
        elif "probability" in question or "chance" in question:
            # This is a very basic parser for "probability of k successes in n trials"
            match = re.findall(r'(\d+)', question)
            if len(match) >= 2:
                k, n = int(match[0]), int(match[1])
                prob = sp.Rational(math.comb(n,k), 2**n)
                return f"The probability of {k} successes in {n} fair coin flips is {prob} ({float(prob)*100:.4f}%)."
        
        # Handle simple math expressions
        else:
            # Remove question words
            expr = re.sub(r'what|is|the|of|calculate|compute|please', '', question)
            expr = expr.replace('^', '**')
            expr = sp.sympify(expr)
            result = sp.simplify(expr)
            return f"The answer is {result}"
        
    except Exception as e:
        return f"Sorry, I couldn't solve this. ({e})"

# Interactive chat loop
if __name__ == "__main__":
    print("Hello! I am your Math AI 🤖. Ask me anything about math.")
    while True:
        q = input("\nYou: ")
        if q.lower() in ["exit", "quit"]:
            print("Math AI: Goodbye! Keep solving math problems! 🧠")
            break
        answer = math_ai_natural(q)
        print(f"Math AI: {answer}")
