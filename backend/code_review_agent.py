from langgraph.graph import StateGraph, START, END
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from typing import TypedDict, List
import os
from github import Github

# Define the state
class CodeReviewState(TypedDict):
    repo_name: str
    pr_number: int
    code_changes: List[str]
    feedback: List[str]

# Set up Groq LLM
llm = ChatGroq(
    model="openai/gpt-oss-20b",
    api_key=os.getenv("GROQ_API_KEY")
)

# Fetch PR changes
def fetch_pr_changes(state: CodeReviewState):
    repo_name = state["repo_name"]
    pr_number = state["pr_number"]
    
    g = Github(os.getenv("GITHUB_TOKEN"))
    repo = g.get_repo(repo_name)
    pr = repo.get_pull(pr_number)
    
    files = pr.get_files()
    code_changes = []
    for file in files:
        if file.patch:
            code_changes.append(f"File: {file.filename}\n{file.patch}")
    
    return {"code_changes": code_changes}

# Analyze code
def analyze_code(state: CodeReviewState):
    code_changes = state["code_changes"]
    all_code = "\n\n".join(code_changes)
    
    # Read the prompt from prompt.txt
    with open("prompt.txt", "r", encoding="utf-8") as f:
        prompt_template = f.read()
    
    # Replace the placeholder with the actual code
    prompt = prompt_template.replace("{all_code}", all_code)
    
    response = llm.invoke([SystemMessage(content="You are a code review expert."), HumanMessage(content=prompt)])
    analysis = response.content
    
    return {"feedback": [analysis]}

# Provide feedback
def provide_feedback(state: CodeReviewState):
    feedback = state["feedback"][0] if state["feedback"] else "No feedback generated."
    
    professional_feedback = f"""## 🤖 AI Code Review Analysis

{feedback}

---
*This review was generated automatically by the SmartReview AI agent. Please review the suggestions and address any critical issues before merging.*"""
    
    return {"feedback": [professional_feedback]}

# Post feedback
def post_feedback(state: CodeReviewState):
    repo_name = state["repo_name"]
    pr_number = state["pr_number"]
    feedback = state["feedback"][0] if state["feedback"] else "No feedback generated."
    
    g = Github(os.getenv("GITHUB_TOKEN"))
    repo = g.get_repo(repo_name)
    pr = repo.get_pull(pr_number)
    
    pr.create_issue_comment(feedback)
    return {}

# Build the graph
graph = StateGraph(CodeReviewState)
graph.add_node("fetch_pr", fetch_pr_changes)
graph.add_node("analyze", analyze_code)
graph.add_node("feedback", provide_feedback)
graph.add_node("post", post_feedback)

graph.add_edge(START, "fetch_pr")
graph.add_edge("fetch_pr", "analyze")
graph.add_edge("analyze", "feedback")
graph.add_edge("feedback", "post")
graph.add_edge("post", END)

code_review_agent = graph.compile()

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 3:
        print("Usage: python code_review_agent.py <repo_name> <pr_number>")
        sys.exit(1)
    
    repo_name = sys.argv[1]
    pr_number = int(sys.argv[2])
    
    result = code_review_agent.invoke({
        "repo_name": repo_name,
        "pr_number": pr_number,
        "code_changes": [],
        "feedback": []
    })
    
    print("Code review completed and posted to GitHub!")