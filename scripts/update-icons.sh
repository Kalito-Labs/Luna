#!/bin/bash

# Script to update all app icons with new Luna icon
# Requires ImageMagick to be installed

set -e

SOURCE_ICON="/home/kalito/kalito-labs/luna-repo/frontend/resources/new-bg.png"
ANDROID_RES="/home/kalito/kalito-labs/luna-repo/frontend/android/app/src/main/res"
FRONTEND_RESOURCES="/home/kalito/kalito-labs/luna-repo/frontend/resources"
FRONTEND_PUBLIC="/home/kalito/kalito-labs/luna-repo/frontend/public/favicon_io"

echo "🚀 Starting icon update process..."

# Check if source icon exists
if [ ! -f "$SOURCE_ICON" ]; then
    echo "❌ Error: Source icon not found at $SOURCE_ICON"
    exit 1
fi

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "❌ Error: ImageMagick (convert command) not found. Please install ImageMagick."
    exit 1
fi

echo "✅ Source icon found: $SOURCE_ICON"
echo "✅ ImageMagick is available"

# Function to create directory if it doesn't exist
ensure_dir() {
    if [ ! -d "$1" ]; then
        mkdir -p "$1"
    fi
}

# Remove old Android mipmap icons
echo "🗑️  Removing old Android icons..."
rm -f "$ANDROID_RES"/mipmap-*/ic_launcher*.png 2>/dev/null || true

# Remove old drawable splash icons
rm -f "$ANDROID_RES"/drawable*/splash.png 2>/dev/null || true

# Remove old resource icons
rm -f "$FRONTEND_RESOURCES"/{icon.png,splash.png} 2>/dev/null || true

# Remove old favicon icons
rm -f "$FRONTEND_PUBLIC"/*.png "$FRONTEND_PUBLIC"/*.ico 2>/dev/null || true

echo "🎨 Generating new icons..."

# Generate Android mipmap icons (app launcher icons)
echo "📱 Creating Android launcher icons..."

# MDPI (48x48) - baseline density
ensure_dir "$ANDROID_RES/mipmap-mdpi"
convert "$SOURCE_ICON" -resize 48x48 "$ANDROID_RES/mipmap-mdpi/ic_launcher.png"
convert "$SOURCE_ICON" -resize 48x48 "$ANDROID_RES/mipmap-mdpi/ic_launcher_round.png"
convert "$SOURCE_ICON" -resize 48x48 "$ANDROID_RES/mipmap-mdpi/ic_launcher_foreground.png"

# HDPI (72x72) - 1.5x
ensure_dir "$ANDROID_RES/mipmap-hdpi"
convert "$SOURCE_ICON" -resize 72x72 "$ANDROID_RES/mipmap-hdpi/ic_launcher.png"
convert "$SOURCE_ICON" -resize 72x72 "$ANDROID_RES/mipmap-hdpi/ic_launcher_round.png"
convert "$SOURCE_ICON" -resize 72x72 "$ANDROID_RES/mipmap-hdpi/ic_launcher_foreground.png"

# XHDPI (96x96) - 2x
ensure_dir "$ANDROID_RES/mipmap-xhdpi"
convert "$SOURCE_ICON" -resize 96x96 "$ANDROID_RES/mipmap-xhdpi/ic_launcher.png"
convert "$SOURCE_ICON" -resize 96x96 "$ANDROID_RES/mipmap-xhdpi/ic_launcher_round.png"
convert "$SOURCE_ICON" -resize 96x96 "$ANDROID_RES/mipmap-xhdpi/ic_launcher_foreground.png"

# XXHDPI (144x144) - 3x
ensure_dir "$ANDROID_RES/mipmap-xxhdpi"
convert "$SOURCE_ICON" -resize 144x144 "$ANDROID_RES/mipmap-xxhdpi/ic_launcher.png"
convert "$SOURCE_ICON" -resize 144x144 "$ANDROID_RES/mipmap-xxhdpi/ic_launcher_round.png"
convert "$SOURCE_ICON" -resize 144x144 "$ANDROID_RES/mipmap-xxhdpi/ic_launcher_foreground.png"

# XXXHDPI (192x192) - 4x
ensure_dir "$ANDROID_RES/mipmap-xxxhdpi"
convert "$SOURCE_ICON" -resize 192x192 "$ANDROID_RES/mipmap-xxxhdpi/ic_launcher.png"
convert "$SOURCE_ICON" -resize 192x192 "$ANDROID_RES/mipmap-xxxhdpi/ic_launcher_round.png"
convert "$SOURCE_ICON" -resize 192x192 "$ANDROID_RES/mipmap-xxxhdpi/ic_launcher_foreground.png"

# Generate splash screens
echo "💫 Creating splash screens..."

# Create a simple splash screen with the icon centered on a background
# Using the background color from capacitor.config.ts (#0f0f1e)
ensure_dir "$ANDROID_RES/drawable"
convert -size 1080x1920 xc:"#0f0f1e" \
        \( "$SOURCE_ICON" -resize 200x200 \) \
        -gravity center -composite \
        "$ANDROID_RES/drawable/splash.png"

# Generate different orientations and densities
ensure_dir "$ANDROID_RES/drawable-land-hdpi"
convert -size 1920x1080 xc:"#0f0f1e" \
        \( "$SOURCE_ICON" -resize 200x200 \) \
        -gravity center -composite \
        "$ANDROID_RES/drawable-land-hdpi/splash.png"

ensure_dir "$ANDROID_RES/drawable-land-mdpi"
convert -size 1280x720 xc:"#0f0f1e" \
        \( "$SOURCE_ICON" -resize 150x150 \) \
        -gravity center -composite \
        "$ANDROID_RES/drawable-land-mdpi/splash.png"

ensure_dir "$ANDROID_RES/drawable-land-xhdpi"
convert -size 1920x1080 xc:"#0f0f1e" \
        \( "$SOURCE_ICON" -resize 250x250 \) \
        -gravity center -composite \
        "$ANDROID_RES/drawable-land-xhdpi/splash.png"

ensure_dir "$ANDROID_RES/drawable-land-xxhdpi"
convert -size 2560x1440 xc:"#0f0f1e" \
        \( "$SOURCE_ICON" -resize 300x300 \) \
        -gravity center -composite \
        "$ANDROID_RES/drawable-land-xxhdpi/splash.png"

ensure_dir "$ANDROID_RES/drawable-land-xxxhdpi"
convert -size 3840x2160 xc:"#0f0f1e" \
        \( "$SOURCE_ICON" -resize 400x400 \) \
        -gravity center -composite \
        "$ANDROID_RES/drawable-land-xxxhdpi/splash.png"

ensure_dir "$ANDROID_RES/drawable-port-hdpi"
convert -size 1080x1920 xc:"#0f0f1e" \
        \( "$SOURCE_ICON" -resize 200x200 \) \
        -gravity center -composite \
        "$ANDROID_RES/drawable-port-hdpi/splash.png"

ensure_dir "$ANDROID_RES/drawable-port-mdpi"
convert -size 720x1280 xc:"#0f0f1e" \
        \( "$SOURCE_ICON" -resize 150x150 \) \
        -gravity center -composite \
        "$ANDROID_RES/drawable-port-mdpi/splash.png"

ensure_dir "$ANDROID_RES/drawable-port-xhdpi"
convert -size 1080x1920 xc:"#0f0f1e" \
        \( "$SOURCE_ICON" -resize 250x250 \) \
        -gravity center -composite \
        "$ANDROID_RES/drawable-port-xhdpi/splash.png"

ensure_dir "$ANDROID_RES/drawable-port-xxhdpi"
convert -size 1440x2560 xc:"#0f0f1e" \
        \( "$SOURCE_ICON" -resize 300x300 \) \
        -gravity center -composite \
        "$ANDROID_RES/drawable-port-xxhdpi/splash.png"

ensure_dir "$ANDROID_RES/drawable-port-xxxhdpi"
convert -size 2160x3840 xc:"#0f0f1e" \
        \( "$SOURCE_ICON" -resize 400x400 \) \
        -gravity center -composite \
        "$ANDROID_RES/drawable-port-xxxhdpi/splash.png"

# Generate Capacitor resource icons
echo "⚡ Creating Capacitor resources..."
ensure_dir "$FRONTEND_RESOURCES"
convert "$SOURCE_ICON" -resize 1024x1024 "$FRONTEND_RESOURCES/icon.png"
convert -size 2732x2732 xc:"#0f0f1e" \
        \( "$SOURCE_ICON" -resize 400x400 \) \
        -gravity center -composite \
        "$FRONTEND_RESOURCES/splash.png"

# Generate web/PWA icons
echo "🌐 Creating web and PWA icons..."
ensure_dir "$FRONTEND_PUBLIC"
convert "$SOURCE_ICON" -resize 192x192 "$FRONTEND_PUBLIC/android-chrome-192x192.png"
convert "$SOURCE_ICON" -resize 512x512 "$FRONTEND_PUBLIC/android-chrome-512x512.png"
convert "$SOURCE_ICON" -resize 180x180 "$FRONTEND_PUBLIC/apple-touch-icon.png"
convert "$SOURCE_ICON" -resize 16x16 "$FRONTEND_PUBLIC/favicon-16x16.png"
convert "$SOURCE_ICON" -resize 32x32 "$FRONTEND_PUBLIC/favicon-32x32.png"

# Generate favicon.ico (multi-size)
convert "$SOURCE_ICON" \
        \( -clone 0 -resize 16x16 \) \
        \( -clone 0 -resize 32x32 \) \
        \( -clone 0 -resize 48x48 \) \
        -delete 0 \
        "$FRONTEND_PUBLIC/favicon.ico"

echo "✅ All icons have been successfully updated!"
echo ""
echo "📋 Summary:"
echo "   • Android launcher icons (all densities): ✅"
echo "   • Android splash screens (all orientations/densities): ✅"
echo "   • Capacitor resources: ✅"
echo "   • Web/PWA icons: ✅"
echo "   • Favicon: ✅"
echo ""
echo "🚀 You can now build your Android app with the new Luna icons!"