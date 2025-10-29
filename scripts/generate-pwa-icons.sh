#!/bin/bash

# PWA Icon Generator Script
# Creates placeholder icons for Kalito Space PWA

echo "🎨 Generating PWA icons for Kalito Space..."

# Create icons directory
mkdir -p frontend/public/icons

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick not found. Please install it:"
    echo "   Ubuntu/Debian: sudo apt install imagemagick"
    echo "   macOS: brew install imagemagick"
    echo "   Or use an online tool: https://realfavicongenerator.net/"
    exit 1
fi

# Create main app icons with gradient and initials
echo "📦 Creating main app icons..."
for size in 72 96 128 144 152 192 384 512; do
  echo "  → Generating ${size}x${size} icon..."
  convert -size ${size}x${size} \
    -define gradient:angle=135 \
    gradient:'#42a5f5-#667eea' \
    -pointsize $((size / 4)) \
    -font Arial-Bold \
    -fill white \
    -gravity center \
    -annotate +0+0 'KS' \
    frontend/public/icons/icon-${size}x${size}.png
done

# Create shortcut icons (emojis rendered as images)
echo "🔗 Creating shortcut icons..."

# Chat shortcut
convert -size 96x96 \
  -define gradient:angle=135 \
  gradient:'#667eea-#764ba2' \
  -pointsize 48 \
  -font Arial-Bold \
  -fill white \
  -gravity center \
  -annotate +0+0 '💬' \
  frontend/public/icons/chat-shortcut.png 2>/dev/null || \
  convert -size 96x96 \
    -define gradient:angle=135 \
    gradient:'#667eea-#764ba2' \
    -pointsize 48 \
    -fill white \
    -gravity center \
    -annotate +0+0 'CHAT' \
    frontend/public/icons/chat-shortcut.png

# Medication shortcut
convert -size 96x96 \
  -define gradient:angle=135 \
  gradient:'#66bb6a-#43a047' \
  -pointsize 48 \
  -font Arial-Bold \
  -fill white \
  -gravity center \
  -annotate +0+0 '💊' \
  frontend/public/icons/meds-shortcut.png 2>/dev/null || \
  convert -size 96x96 \
    -define gradient:angle=135 \
    gradient:'#66bb6a-#43a047' \
    -pointsize 48 \
    -fill white \
    -gravity center \
    -annotate +0+0 'MEDS' \
    frontend/public/icons/meds-shortcut.png

# Appointment shortcut
convert -size 96x96 \
  -define gradient:angle=135 \
  gradient:'#ffa726-#f57c00' \
  -pointsize 48 \
  -font Arial-Bold \
  -fill white \
  -gravity center \
  -annotate +0+0 '📅' \
  frontend/public/icons/appointment-shortcut.png 2>/dev/null || \
  convert -size 96x96 \
    -define gradient:angle=135 \
    gradient:'#ffa726-#f57c00' \
    -pointsize 48 \
    -fill white \
    -gravity center \
    -annotate +0+0 'APPT' \
    frontend/public/icons/appointment-shortcut.png

echo "✅ PWA icons generated successfully!"
echo ""
echo "📁 Icons created in: frontend/public/icons/"
echo "🔍 You can replace these with custom designs later."
echo ""
echo "Next steps:"
echo "  1. pnpm run build"
echo "  2. pnpm run preview"
echo "  3. Test PWA installation in browser"
