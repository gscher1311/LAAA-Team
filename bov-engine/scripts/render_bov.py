#!/usr/bin/env python3
"""
BOV Template Engine — Renders a JSON data file into a complete BOV HTML page.

Usage:
    python render_bov.py <data.json> [--output <path>] [--template <path>]

Examples:
    python scripts/render_bov.py sample-data/2341-beach.json
    python scripts/render_bov.py sample-data/2341-beach.json --output output/2341-beach.html
    python scripts/render_bov.py sample-data/2341-beach.json --template templates/bov.html
"""

import json
import sys
import os
import argparse
from pathlib import Path

try:
    from jinja2 import Environment, FileSystemLoader, select_autoescape
except ImportError:
    print("ERROR: Jinja2 is not installed. Run: pip install jinja2")
    sys.exit(1)


def load_data(data_path: str) -> dict:
    """Load and validate the JSON data file."""
    path = Path(data_path)
    if not path.exists():
        print(f"ERROR: Data file not found: {data_path}")
        sys.exit(1)

    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Validate required top-level keys
    required_keys = ['meta', 'cover', 'team', 'property', 'building_systems',
                     'regulatory', 'transaction_history', 'coordinates',
                     'sale_comps', 'active_comps', 'rent_comps', 'financials',
                     'agents', 'office', 'disclaimer']

    missing = [k for k in required_keys if k not in data]
    if missing:
        print(f"WARNING: Missing keys in data file: {', '.join(missing)}")
        print("The template may not render correctly.")

    return data


def render_bov(data: dict, template_dir: str, template_name: str = 'bov.html') -> str:
    """Render the BOV HTML from JSON data and Jinja2 template."""
    env = Environment(
        loader=FileSystemLoader(template_dir),
        autoescape=select_autoescape(['html']),
        trim_blocks=True,
        lstrip_blocks=True,
    )

    template = env.get_template(template_name)
    html = template.render(**data)
    return html


def main():
    parser = argparse.ArgumentParser(description='Render a BOV HTML from JSON data')
    parser.add_argument('data', help='Path to the JSON data file')
    parser.add_argument('--output', '-o', help='Output HTML file path (default: output/<repo_name>.html)')
    parser.add_argument('--template', '-t', help='Path to the template directory (default: templates/)')
    parser.add_argument('--template-name', default='bov.html', help='Template filename (default: bov.html)')

    args = parser.parse_args()

    # Resolve paths relative to the bov-engine directory
    engine_dir = Path(__file__).parent.parent
    data_path = Path(args.data)
    if not data_path.is_absolute():
        data_path = engine_dir / data_path

    template_dir = Path(args.template) if args.template else engine_dir / 'templates'
    if not template_dir.is_absolute():
        template_dir = engine_dir / template_dir

    # Load data
    print(f"Loading data from: {data_path}")
    data = load_data(str(data_path))

    # Render
    print(f"Rendering template: {template_dir / args.template_name}")
    html = render_bov(data, str(template_dir), args.template_name)

    # Determine output path
    if args.output:
        output_path = Path(args.output)
        if not output_path.is_absolute():
            output_path = engine_dir / output_path
    else:
        repo_name = data.get('meta', {}).get('repo_name', 'bov-output')
        output_path = engine_dir / 'output' / f'{repo_name}.html'

    # Ensure output directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Write output
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)

    file_size = output_path.stat().st_size
    print(f"BOV rendered successfully!")
    print(f"  Output: {output_path}")
    print(f"  Size: {file_size:,} bytes ({file_size / 1024:.1f} KB)")
    print(f"\nTo preview locally:")
    print(f"  live-server \"{output_path.parent}\"")
    print(f"\nTo export PDF:")
    print(f"  node scripts/export_pdf.js \"{output_path}\"")


if __name__ == '__main__':
    main()
