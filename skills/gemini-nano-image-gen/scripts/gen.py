#!/usr/bin/env python3

import argparse
import json
import os
import sys
from pathlib import Path
from datetime import datetime
import base64

# Try to import google.generativeai, with helpful error message
try:
    import google.generativeai as genai
except ImportError:
    print("Error: google-generativeai is not installed.")
    print("Install it with: pip install google-generativeai pillow")
    sys.exit(1)

def generate_images(prompt, count=1, api_key=None, out_dir=None):
    """Generate images using Google Gemini API."""
    
    # Get API key from parameter or environment
    if not api_key:
        api_key = os.environ.get("GEMINI_API_KEY")
    
    if not api_key:
        print("Error: GEMINI_API_KEY not set")
        sys.exit(1)
    
    # Configure the API
    genai.configure(api_key=api_key)
    
    # Set output directory
    if not out_dir:
        base_tmp = Path.home() / "Projects" / "tmp"
        if base_tmp.exists():
            out_dir = base_tmp / f"gemini-nano-image-gen-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        else:
            out_dir = Path("./tmp") / f"gemini-nano-image-gen-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"Generating {count} image(s) for prompt: '{prompt}'")
    print(f"Output directory: {out_dir}")
    
    prompts_data = []
    
    try:
        # Use Gemini 2.0 Flash with vision capabilities
        # Note: Image generation is available through the Gemini API
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        for i in range(count):
            print(f"  Generating image {i+1}/{count}...")
            
            # Create a detailed prompt for better results
            detailed_prompt = f"Generate a high-quality, detailed image of: {prompt}"
            
            response = model.generate_images(
                prompt=detailed_prompt,
                number_of_images=1,
                height=1024,
                width=1024,
            )
            
            if response.images:
                # Save the image
                img_data = response.images[0]
                filename = f"image_{i+1:03d}.png"
                filepath = out_dir / filename
                
                # Write image data
                with open(filepath, "wb") as f:
                    f.write(img_data._image.tobytes() if hasattr(img_data._image, 'tobytes') else img_data._image)
                
                print(f"    Saved: {filename}")
                prompts_data.append({
                    "index": i + 1,
                    "prompt": prompt,
                    "file": filename
                })
            else:
                print(f"    Failed to generate image {i+1}")
        
    except Exception as e:
        print(f"Error generating images: {e}")
        print("\nNote: Image generation capabilities may require specific API access or account status.")
        sys.exit(1)
    
    # Save prompts mapping
    prompts_file = out_dir / "prompts.json"
    with open(prompts_file, "w") as f:
        json.dump(prompts_data, f, indent=2)
    
    # Generate simple HTML gallery
    html_content = generate_gallery_html(prompts_data, out_dir.name)
    html_file = out_dir / "index.html"
    with open(html_file, "w") as f:
        f.write(html_content)
    
    print(f"\nGenerated {len(prompts_data)} image(s)")
    print(f"View gallery: {html_file}")

def generate_gallery_html(prompts_data, title):
    """Generate a simple HTML gallery."""
    html = f"""<!DOCTYPE html>
<html>
<head>
    <title>Gemini Image Gallery - {title}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            margin: 0;
            padding: 20px;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
        }}
        h1 {{
            color: #333;
            margin-bottom: 30px;
        }}
        .gallery {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }}
        .item {{
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: transform 0.2s;
        }}
        .item:hover {{
            transform: translateY(-5px);
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        }}
        .item img {{
            width: 100%;
            height: 400px;
            object-fit: cover;
            display: block;
        }}
        .item-info {{
            padding: 15px;
            background: white;
        }}
        .prompt {{
            font-size: 14px;
            color: #666;
            margin: 0;
            line-height: 1.4;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🖼️ Gemini Image Gallery</h1>
        <p>Generated with Gemini Nano</p>
        <div class="gallery">
"""
    
    for item in prompts_data:
        html += f"""            <div class="item">
                <img src="{item['file']}" alt="Generated image">
                <div class="item-info">
                    <p class="prompt">{item['prompt']}</p>
                </div>
            </div>
"""
    
    html += """        </div>
    </div>
</body>
</html>"""
    
    return html

def main():
    parser = argparse.ArgumentParser(description="Generate images using Google Gemini API")
    parser.add_argument("--prompt", type=str, required=True, help="Prompt for image generation")
    parser.add_argument("--count", type=int, default=1, help="Number of images to generate (default: 1)")
    parser.add_argument("--out-dir", type=str, help="Output directory")
    parser.add_argument("--api-key", type=str, help="Gemini API key (can use GEMINI_API_KEY env var)")
    
    args = parser.parse_args()
    
    generate_images(
        prompt=args.prompt,
        count=args.count,
        api_key=args.api_key,
        out_dir=args.out_dir
    )

if __name__ == "__main__":
    main()
