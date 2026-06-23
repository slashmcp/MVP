import os
import csv
import json
import time
from dotenv import load_dotenv
from anthropic import Anthropic
from duckduckgo_search import DDGS

# Load environment variables (to get ANTHROPIC_API_KEY)
load_dotenv(dotenv_path='.env.local')
load_dotenv(dotenv_path='.env')

# Initialize Anthropic Client
anthropic = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

def generate_boolean_search(prompt: str, target_type: str) -> str:
    """Uses Anthropic to convert a natural language prompt into a Boolean Search string."""
    print(f"🧠 [1/4] AI is analyzing your request to find the best {target_type}...")
    
    site_modifier = "site:linkedin.com/company/" if target_type == "clients" else "site:linkedin.com/in/"
    
    response = anthropic.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=200,
        temperature=0.1,
        system="""You are an expert technical sourcer. The user will give you a natural language request. 
        Your job is to return ONLY a highly optimized Google boolean search string.
        Do NOT include explanations. ONLY the raw search string.
        Ensure it starts with the provided site modifier.""",
        messages=[
            {"role": "user", "content": f"Request: {prompt}\nSite modifier: {site_modifier}"}
        ]
    )
    
    query = response.content[0].text.strip().replace('"', '\\"').strip('"\'')
    if not query.startswith('site:'):
        query = f"{site_modifier} {query}"
        
    print(f"🔍 [2/4] Generated Search Query: {query}")
    return query

def perform_search(query: str, max_results=10) -> list:
    """Uses Serper (Google) or DuckDuckGo to search the web and fetch profile/company snippets."""
    print(f"🌐 [3/4] Searching the web... (Fetching up to {max_results} results)")
    results = []
    
    serper_key = os.environ.get("SERPER_API_KEY")
    serpapi_key = os.environ.get("SERPAPI_API_KEY")
    
    if serpapi_key:
        print("   Using Google Search (SerpApi)...")
        import urllib.request
        import urllib.parse
        encoded_query = urllib.parse.quote(query)
        url = f"https://serpapi.com/search.json?q={encoded_query}&api_key={serpapi_key}&num={max_results}"
        try:
            req = urllib.request.Request(url)
            res = urllib.request.urlopen(req)
            data = json.loads(res.read().decode('utf-8'))
            organic_results = data.get("organic_results", [])
            results = [{"title": r.get("title", ""), "body": r.get("snippet", ""), "href": r.get("link", "")} for r in organic_results]
        except Exception as e:
            print(f"⚠️ SerpApi search failed: {e}")
    elif serper_key:
        print("   Using Google Search (Serper API)...")
        import urllib.request
        req = urllib.request.Request('https://google.serper.dev/search', 
            data=json.dumps({"q": query, "num": max_results}).encode('utf-8'),
            headers={'X-API-KEY': serper_key, 'Content-Type': 'application/json'},
            method='POST')
        try:
            res = urllib.request.urlopen(req)
            data = json.loads(res.read().decode('utf-8'))
            results = data.get("organic", [])
            # Format Serper results to match DDGS structure
            results = [{"title": r.get("title", ""), "body": r.get("snippet", ""), "href": r.get("link", "")} for r in results]
        except Exception as e:
            print(f"⚠️ Serper search failed: {e}")
    else:
        print("   Using DuckDuckGo (Free Web Search)...")
        try:
            with DDGS() as ddgs:
                for r in ddgs.text(query, max_results=max_results):
                    results.append(r)
        except Exception as e:
            print(f"⚠️ DuckDuckGo search failed: {e}")
            
    print(f"✅ Found {len(results)} potential matches.")
    return results

import sys
import threading

def spinner_task(stop_event, message):
    spinner_chars = ['|', '/', '-', '\\']
    i = 0
    while not stop_event.is_set():
        sys.stdout.write(f"\r🤖 {message} {spinner_chars[i % 4]}")
        sys.stdout.flush()
        time.sleep(0.1)
        i += 1
    sys.stdout.write('\r' + ' ' * (len(message) + 10) + '\r')

def extract_structured_data(search_results: list, target_type: str) -> list:
    """Uses Anthropic to extract structured JSON data from the raw search results."""
    if not search_results:
        return []
        
    print(f"🤖 [4/4] AI is structuring the data for CSV import...")
    
    if target_type == "clients":
        schema = '{"name": "Company Name", "industry": "Industry/Tech", "location": "HQ Location", "summary": "Company description", "url": "LinkedIn URL"}'
    else:
        schema = '{"name": "Full Name", "title": "Current Title", "company": "Current Company", "location": "Location", "skills": "Technical/Soft Skills", "url": "LinkedIn URL", "summary": "Brief summary"}'

    structured_data = []
    chunk_size = 5
    
    for i in range(0, len(search_results), chunk_size):
        chunk = search_results[i:i+chunk_size]
        
        prompt = f"""Extract structured data from these search engine snippets.
        Return ONLY a JSON array of objects matching this schema: {schema}.
        If a field is missing, output an empty string. 
        Remove ' | LinkedIn' from names/titles.
        
        Snippets:
        {json.dumps(chunk, indent=2)}
        """
        
        stop_spinner = threading.Event()
        spinner_thread = threading.Thread(target=spinner_task, args=(stop_spinner, f"Processing chunk {(i//chunk_size)+1} of {(len(search_results)+chunk_size-1)//chunk_size}..."))
        spinner_thread.start()
        
        try:
            response = anthropic.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=2000,
                temperature=0.1,
                messages=[{"role": "user", "content": prompt}]
            )
            
            stop_spinner.set()
            spinner_thread.join()
            
            content = response.content[0].text.strip()
            if content.startswith('```json'): content = content[7:]
            if content.startswith('```'): content = content[3:]
            if content.endswith('```'): content = content[:-3]
                
            data = json.loads(content)
            structured_data.extend(data)
            print(f"   ✓ Chunk {(i//chunk_size)+1} completed.")
        except Exception as e:
            stop_spinner.set()
            spinner_thread.join()
            print(f"   ⚠️ Error parsing chunk: {e}")
            
        if i + chunk_size < len(search_results):
            time.sleep(1) # Small delay to avoid API rate limits
        
    return structured_data

def save_to_csv(data: list, target_type: str):
    if not data:
        print("No data to save.")
        return
        
    filename = f"sourced_{target_type}.csv"
    headers = data[0].keys()
    
    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(data)
        
    print(f"🎉 Success! Saved {len(data)} records to {filename}")

def main():
    print("=" * 60)
    print("🚀 AI Sourcing Engine (Juicebox Alternative)")
    print("=" * 60)
    
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("❌ Error: ANTHROPIC_API_KEY not found in environment.")
        return
        
    target_type = input("What do you want to source? [1] Candidates [2] Clients (Companies): ").strip()
    
    if target_type == '1':
        target = "candidates"
        prompt = input("\nDescribe the ideal candidate (e.g., 'Senior React developers in London'): ")
    elif target_type == '2':
        target = "clients"
        prompt = input("\nDescribe the ideal client (e.g., 'Healthcare tech startups in Scotland'): ")
    else:
        print("Invalid choice.")
        return
        
    try:
        max_results = int(input("\nHow many results to fetch? (1-30, default 10): ") or "10")
    except ValueError:
        max_results = 10
        
    print("\nStarting Sourcing Pipeline...\n" + "-"*40)
    
    # 1. Generate Boolean Search
    query = generate_boolean_search(prompt, target)
    
    # 2. Perform Web Search
    results = perform_search(query, max_results=max_results)
    
    # 3. Extract Structured Data
    structured_data = extract_structured_data(results, target)
    
    # 4. Save to CSV
    save_to_csv(structured_data, target)

if __name__ == "__main__":
    main()
