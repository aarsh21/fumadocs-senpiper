#!/bin/bash

# Migration script: Add frontmatter to markdown files and convert to MDX
# This script processes documentation files and moves them to content/docs

set -e

SOURCE_DIR="documentation"
TARGET_DIR="content/docs"

# Function to extract title from first # heading
get_title() {
    local file=$1
    grep -m 1 "^# " "$file" | sed 's/^# //'
}

# Function to generate description from first paragraph
get_description() {
    local file=$1
    local title=$2
    # Get second non-empty line (first line after title)
    sed -n '/^# /,/^$/!p' "$file" | grep -v "^$" | head -1 | sed 's/^[#>* ]*//' | head -c 150
}

# Function to add frontmatter to a file
add_frontmatter() {
    local source=$1
    local target=$2
    local title=$(get_title "$source")
    local desc=$(get_description "$source" "$title")
    
    # Create frontmatter and append original content (excluding first # heading)
    {
        echo "---"
        echo "title: \"$title\""
        echo "description: \"$desc\""
        echo "---"
        echo ""
        # Skip the first # heading line
        sed '1{/^# /d}' "$source"
    } > "$target"
}

# Function to fix internal links
fix_links() {
    local file=$1
    # Convert .md links to no extension and fix relative paths
    sed -i \
        -e 's/](\.\.\/concepts\//](\/docs\/concepts\//g' \
        -e 's/](\.\.\/recipes\//](\/docs\/recipes\//g' \
        -e 's/](\.\.\/reference\//](\/docs\/reference\//g' \
        -e 's/](\.\.\/schema\//](\/docs\/schema\//g' \
        -e 's/](\.\.\/evolution\//](\/docs\/evolution\//g' \
        -e 's/](\.\.\/design\//](\/docs\/design\//g' \
        -e 's/](\.\/\([^)]*\)\.md)/](\/docs\/\1)/g' \
        -e 's/](\([^)]*\)\.md)/](\1)/g' \
        "$file"
}

echo "Starting documentation migration..."

# Create target directories
mkdir -p "$TARGET_DIR"/{concepts,recipes,reference/field-types,schema,evolution,design,development,test-schemas}

# Process concepts
echo "Processing concepts..."
for file in "$SOURCE_DIR"/concepts/*.md; do
    filename=$(basename "$file" .md)
    target="$TARGET_DIR/concepts/$filename.mdx"
    add_frontmatter "$file" "$target"
    fix_links "$target"
    echo "  ✓ $filename"
done

# Process recipes
echo "Processing recipes..."
for file in "$SOURCE_DIR"/recipes/*.md; do
    filename=$(basename "$file" .md)
    target="$TARGET_DIR/recipes/$filename.mdx"
    add_frontmatter "$file" "$target"
    fix_links "$target"
    echo "  ✓ $filename"
done

# Process reference/field-types
echo "Processing field-types..."
for file in "$SOURCE_DIR"/reference/field-types/*.md; do
    filename=$(basename "$file" .md)
    # Handle README.md specially
    if [ "$filename" = "README" ]; then
        target="$TARGET_DIR/reference/field-types/index.mdx"
    else
        target="$TARGET_DIR/reference/field-types/$filename.mdx"
    fi
    add_frontmatter "$file" "$target"
    fix_links "$target"
    echo "  ✓ $filename"
done

# Process schema
echo "Processing schema..."
for file in "$SOURCE_DIR"/schema/*.md; do
    filename=$(basename "$file" .md)
    target="$TARGET_DIR/schema/$filename.mdx"
    add_frontmatter "$file" "$target"
    fix_links "$target"
    echo "  ✓ $filename"
done

# Process evolution
echo "Processing evolution..."
for file in "$SOURCE_DIR"/evolution/*.md; do
    filename=$(basename "$file" .md)
    target="$TARGET_DIR/evolution/$filename.mdx"
    add_frontmatter "$file" "$target"
    fix_links "$target"
    echo "  ✓ $filename"
done

# Process design
echo "Processing design..."
for file in "$SOURCE_DIR"/design/*.md; do
    filename=$(basename "$file" .md)
    target="$TARGET_DIR/design/$filename.mdx"
    add_frontmatter "$file" "$target"
    fix_links "$target"
    echo "  ✓ $filename"
done

# Process overview
echo "Processing overview..."
if [ -f "$SOURCE_DIR/overview/introduction.md" ]; then
    mkdir -p "$TARGET_DIR/overview"
    add_frontmatter "$SOURCE_DIR/overview/introduction.md" "$TARGET_DIR/overview/introduction.mdx"
    fix_links "$TARGET_DIR/overview/introduction.mdx"
    echo "  ✓ introduction"
fi

# Process root-level files
echo "Processing root-level files..."

# README.md -> index.mdx
if [ -f "$SOURCE_DIR/README.md" ]; then
    add_frontmatter "$SOURCE_DIR/README.md" "$TARGET_DIR/index.mdx"
    fix_links "$TARGET_DIR/index.mdx"
    echo "  ✓ README -> index"
fi

# schema-properties.md -> reference/schema-properties.mdx
if [ -f "$SOURCE_DIR/schema-properties.md" ]; then
    add_frontmatter "$SOURCE_DIR/schema-properties.md" "$TARGET_DIR/reference/schema-properties.mdx"
    fix_links "$TARGET_DIR/reference/schema-properties.mdx"
    echo "  ✓ schema-properties"
fi

# ai-development-guide.md -> development/ai-development-guide.mdx
if [ -f "$SOURCE_DIR/ai-development-guide.md" ]; then
    add_frontmatter "$SOURCE_DIR/ai-development-guide.md" "$TARGET_DIR/development/ai-development-guide.mdx"
    fix_links "$TARGET_DIR/development/ai-development-guide.mdx"
    echo "  ✓ ai-development-guide"
fi

# v2-runtime-development-strategy.md -> development/v2-runtime-strategy.mdx
if [ -f "$SOURCE_DIR/v2-runtime-development-strategy.md" ]; then
    add_frontmatter "$SOURCE_DIR/v2-runtime-development-strategy.md" "$TARGET_DIR/development/v2-runtime-strategy.mdx"
    fix_links "$TARGET_DIR/development/v2-runtime-strategy.mdx"
    echo "  ✓ v2-runtime-strategy"
fi

# KMM development plan
if [ -f "$SOURCE_DIR/KMM_V2_RUNTIME_DEVELOPMENT_PLAN.md" ]; then
    add_frontmatter "$SOURCE_DIR/KMM_V2_RUNTIME_DEVELOPMENT_PLAN.md" "$TARGET_DIR/development/kmm-development-plan.mdx"
    fix_links "$TARGET_DIR/development/kmm-development-plan.mdx"
    echo "  ✓ kmm-development-plan"
fi

# test-schemas README
if [ -f "$SOURCE_DIR/test-schemas/README.md" ]; then
    add_frontmatter "$SOURCE_DIR/test-schemas/README.md" "$TARGET_DIR/test-schemas/index.mdx"
    fix_links "$TARGET_DIR/test-schemas/index.mdx"
    echo "  ✓ test-schemas/index"
fi

echo ""
echo "Migration complete! Files are in $TARGET_DIR"
echo "Next steps:"
echo "  1. Create meta.json files for navigation"
echo "  2. Run 'bun run build' to verify"
