#!/bin/bash

# Script to generate all required icon sizes from kspace.png
# Usage: ./scripts/generate-icons.sh

set -e

SOURCE_IMAGE="frontend/public/kspace.png"
ANDROID_RES="frontend/android/app/src/main/res"
FAVICON_DIR="frontend/public/favicon_io"
RESOURCES_DIR="frontend/resources"

echo "🎨 Generating icons from $SOURCE_IMAGE..."

# Check if source image exists
if [ ! -f "$SOURCE_IMAGE" ]; then
    echo "❌ Error: $SOURCE_IMAGE not found!"
    exit 1
fi

# Create directories if they don't exist
mkdir -p "$FAVICON_DIR"
mkdir -p "$RESOURCES_DIR"

echo "📱 Generating web favicons..."
# Web favicons - use -resize with geometry to contain (not crop)
convert "$SOURCE_IMAGE" -background none -gravity center -resize 16x16 -extent 16x16 "$FAVICON_DIR/favicon-16x16.png"
convert "$SOURCE_IMAGE" -background none -gravity center -resize 32x32 -extent 32x32 "$FAVICON_DIR/favicon-32x32.png"
convert "$SOURCE_IMAGE" -background white -gravity center -resize 180x180 -extent 180x180 "$FAVICON_DIR/apple-touch-icon.png"
convert "$SOURCE_IMAGE" -background none -gravity center -resize 192x192 -extent 192x192 "$FAVICON_DIR/android-chrome-192x192.png"
convert "$SOURCE_IMAGE" -background none -gravity center -resize 512x512 -extent 512x512 "$FAVICON_DIR/android-chrome-512x512.png"

# Generate .ico file with multiple sizes
convert "$SOURCE_IMAGE" -background none -gravity center -resize 48x48 -extent 48x48 "$FAVICON_DIR/favicon.ico"

echo "📱 Generating Android app icons..."
# Android launcher icons - contain the image, don't crop
# Background should be transparent or match app theme
# Using -resize with ^ to fill, then -gravity center -extent to crop excess while keeping center

# mipmap-mdpi (48x48)
convert "$SOURCE_IMAGE" -background none -gravity center -resize 48x48 -extent 48x48 "$ANDROID_RES/mipmap-mdpi/ic_launcher.png"
convert "$SOURCE_IMAGE" -background none -gravity center -resize 48x48 -extent 48x48 "$ANDROID_RES/mipmap-mdpi/ic_launcher_foreground.png"
convert "$SOURCE_IMAGE" -background none -gravity center -resize 48x48 -extent 48x48 "$ANDROID_RES/mipmap-mdpi/ic_launcher_round.png"

# mipmap-hdpi (72x72)
convert "$SOURCE_IMAGE" -background none -gravity center -resize 72x72 -extent 72x72 "$ANDROID_RES/mipmap-hdpi/ic_launcher.png"
convert "$SOURCE_IMAGE" -background none -gravity center -resize 72x72 -extent 72x72 "$ANDROID_RES/mipmap-hdpi/ic_launcher_foreground.png"
convert "$SOURCE_IMAGE" -background none -gravity center -resize 72x72 -extent 72x72 "$ANDROID_RES/mipmap-hdpi/ic_launcher_round.png"

# mipmap-xhdpi (96x96)
convert "$SOURCE_IMAGE" -background none -gravity center -resize 96x96 -extent 96x96 "$ANDROID_RES/mipmap-xhdpi/ic_launcher.png"
convert "$SOURCE_IMAGE" -background none -gravity center -resize 96x96 -extent 96x96 "$ANDROID_RES/mipmap-xhdpi/ic_launcher_foreground.png"
convert "$SOURCE_IMAGE" -background none -gravity center -resize 96x96 -extent 96x96 "$ANDROID_RES/mipmap-xhdpi/ic_launcher_round.png"

# mipmap-xxhdpi (144x144)
convert "$SOURCE_IMAGE" -background none -gravity center -resize 144x144 -extent 144x144 "$ANDROID_RES/mipmap-xxhdpi/ic_launcher.png"
convert "$SOURCE_IMAGE" -background none -gravity center -resize 144x144 -extent 144x144 "$ANDROID_RES/mipmap-xxhdpi/ic_launcher_foreground.png"
convert "$SOURCE_IMAGE" -background none -gravity center -resize 144x144 -extent 144x144 "$ANDROID_RES/mipmap-xxhdpi/ic_launcher_round.png"

# mipmap-xxxhdpi (192x192)
convert "$SOURCE_IMAGE" -background none -gravity center -resize 192x192 -extent 192x192 "$ANDROID_RES/mipmap-xxxhdpi/ic_launcher.png"
convert "$SOURCE_IMAGE" -background none -gravity center -resize 192x192 -extent 192x192 "$ANDROID_RES/mipmap-xxxhdpi/ic_launcher_foreground.png"
convert "$SOURCE_IMAGE" -background none -gravity center -resize 192x192 -extent 192x192 "$ANDROID_RES/mipmap-xxxhdpi/ic_launcher_round.png"

echo "🖼️  Generating Capacitor resources..."
# Capacitor icon (1024x1024 recommended) - contain the full image
convert "$SOURCE_IMAGE" -background none -gravity center -resize 1024x1024 -extent 1024x1024 "$RESOURCES_DIR/icon.png"

# Capacitor splash screen (2732x2732 recommended for universal compatibility)
# For splash, we want the icon centered on a solid background
convert "$SOURCE_IMAGE" -background "#1a1a2e" -gravity center -resize 800x800 -extent 2732x2732 "$RESOURCES_DIR/splash.png"

echo "✨ Generating SVG favicon..."
# Copy kspace.png to favicon location for reference
cp "$SOURCE_IMAGE" "frontend/public/favicon.png"

echo ""
echo "✅ All icons generated successfully!"
echo ""
echo "Generated files:"
echo "  📱 Web favicons: $FAVICON_DIR/"
echo "  🤖 Android icons: $ANDROID_RES/mipmap-*/"
echo "  📦 Capacitor resources: $RESOURCES_DIR/"
echo ""
echo "Note: You may want to run 'npx capacitor-assets generate' for optimized Android icons"
