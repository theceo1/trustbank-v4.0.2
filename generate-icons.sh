#!/bin/bash

# Create a simple SVG icon
cat > icon.svg << 'EOF'
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#16A34A"/>
  <text x="50%" y="50%" font-family="Arial" font-size="240" fill="#fff" text-anchor="middle" dominant-baseline="middle">tB</text>
</svg>
EOF

# Convert SVG to PNG files
npx svgexport icon.svg public/icons/icon-192x192.png 192:192
npx svgexport icon.svg public/icons/icon-512x512.png 512:512
npx svgexport icon.svg public/favicon.ico 32:32

# Create apple touch icon
npx svgexport icon.svg public/apple-touch-icon.png 180:180

# Clean up
rm icon.svg 