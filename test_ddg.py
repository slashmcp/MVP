from duckduckgo_search import DDGS
import json

try:
    with DDGS() as ddgs:
        res = list(ddgs.text('site:linkedin.com/in/ Glasgow', max_results=50))
        print(len(res))
        if len(res) > 0: 
            print(json.dumps(res[0], indent=2))
except Exception as e:
    print(f"Error: {e}")
