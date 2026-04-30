---
name: web-asset-generator
description: Generate web assets including favicons, app icons (PWA), and social media meta images (Open Graph) for Facebook, Twitter, WhatsApp, and LinkedIn. Use when users need icons, favicons, social sharing images, or Open Graph images from logos or text slogans. Handles image resizing, text-to-image generation, and provides proper HTML meta tags.
---

# Web Asset Generator

Generate professional web assets from logos or text slogans, including favicons, app icons, and social media meta images.

## Quick Start

When a user requests web assets:

1. **Use AskUserQuestion tool to clarify needs** if not specified:
   - What type of assets they need (favicons, app icons, social images, or everything)
   - Whether they have source material (logo image vs text/slogan)
   - For text-based images: color preferences

2. **Check for source material**:
   - If user uploaded an image: use it as the source
   - If user provides text/slogan: generate text-based images

3. **Run the appropriate script(s)**:
   - Favicons/icons: `scripts/generate_favicons.py`
   - Social media images: `scripts/generate_og_images.py`

4. **Provide the generated assets and HTML tags** to the user

## Using Interactive Questions

**IMPORTANT**: Always use the AskUserQuestion tool to gather requirements instead of plain text questions. This provides a better user experience with visual selection UI.

### Question Patterns

### Question Pattern 1: Asset Type Selection

When the user's request is vague (e.g., "create web assets", "I need icons"), use AskUserQuestion:

**Question**: "What type of web assets do you need?"
**Header**: "Asset type"
**Options**:
- **"Favicons only"** - Description: "Browser tab icons (16x16, 32x32, 96x96) and favicon.ico"
- **"App icons only"** - Description: "PWA icons for iOS/Android (180x180, 192x192, 512x512)"
- **"Social images only"** - Description: "Open Graph images for Facebook, Twitter, WhatsApp, LinkedIn"
- **"Everything"** - Description: "Complete package: favicons + app icons + social images"

### Question Pattern 2: Source Material

**Question**: "What source material will you provide?"
**Header**: "Source"
**Options**:
- **"Logo image"** - Description: "I have or will upload a logo/image file"
- **"Emoji"** - Description: "Generate favicon from an emoji character"
- **"Text/slogan"** - Description: "Create images from text only"
- **"Logo + text"** - Description: "Combine logo with text overlay (for social images)"

### Question Pattern 3: Platform Selection (for social images)

**Question**: "Which social media platforms do you need images for?"
**Header**: "Platforms"
**Multi-select**: true
**Options**:
- **"Facebook/WhatsApp/LinkedIn"** - Description: "Standard 1200x630 Open Graph format"
- **"Twitter"** - Description: "1200x675 (16:9 ratio) for large image cards"
- **"All platforms"** - Description: "Generate all variants including square format"

### Question Pattern 4: Color Preferences (for text-based images)

**Question**: "What colors should we use for your social images?"
**Header**: "Colors"
**Options**:
- **"I'll provide colors"** - Description: "Let me specify exact hex codes for brand colors"
- **"Default theme"** - Description: "Use default purple background (#4F46E5) with white text"
- **"Extract from logo"** - Description: "Auto-detect brand colors from uploaded logo"
- **"Custom gradient"** - Description: "Let me choose gradient colors"

### Question Pattern 5: Icon Type Clarification

**Question**: "What kind of icons do you need?"
**Header**: "Icon type"
**Options**:
- **"Website favicon"** - Description: "Small browser tab icon"
- **"App icons (PWA)"** - Description: "Mobile home screen icons"
- **"Both"** - Description: "Favicon + app icons"

### Question Pattern 6: Emoji Selection

**Step 1**: Ask for project description (free text), then:

```bash
python scripts/generate_favicons.py --suggest "coffee shop" output/ all
```

**Step 2**: Use AskUserQuestion to present the 4 suggested emojis, then:

```bash
python scripts/generate_favicons.py --emoji "?" output/ all
python scripts/generate_favicons.py --emoji "?" --emoji-bg "#F5DEB3" output/ all
```

### Question Pattern 7: Code Integration Offer

After generating assets:

**Question**: "Would you like me to add these HTML tags to your codebase?"
**Header**: "Integration"
**Options**:
- **"Yes, auto-detect my setup"** - Description: "Find and update my HTML/framework files automatically"
- **"Yes, I'll tell you where"** - Description: "I'll specify which file to update"
- **"No, I'll do it manually"** - Description: "Just show me the code, I'll add it myself"

**Framework Detection Priority:**
- Next.js: `app/layout.tsx` or `pages/_app.tsx`
- Astro: `src/layouts/` layout files
- SvelteKit: `src/app.html`
- Vue/Nuxt: `app.vue` or `nuxt.config.ts`
- Plain HTML: `index.html` or `*.html`
- Gatsby: `gatsby-ssr.js`

### Question Pattern 8: Testing Links Offer

**Question**: "Would you like to test your meta tags now?"
**Header**: "Testing"
**Options**:
- **"Facebook Debugger"** - https://developers.facebook.com/tools/debug/
- **"Twitter Card Validator"** - https://cards-dev.twitter.com/validator
- **"LinkedIn Post Inspector"** - https://www.linkedin.com/post-inspector/
- **"All testing tools"** - Get links to all validators
- **"No, skip testing"**

## Workflows

### Generate Favicons and App Icons from Logo

```bash
python scripts/generate_favicons.py <source_image> <output_dir> [icon_type]
# icon_type: 'favicon', 'app', or 'all' (default: 'all')
```

Generates: `favicon-16x16.png`, `favicon-32x32.png`, `favicon-96x96.png`, `favicon.ico`, `apple-touch-icon.png` (180x180), `android-chrome-192x192.png`, `android-chrome-512x512.png`

### Generate Favicons from Emoji

```bash
# Get suggestions first
python scripts/generate_favicons.py --suggest "coffee shop" /home/claude/output all

# Generate with selected emoji
python scripts/generate_favicons.py --emoji "?" <output_dir> [icon_type] [--emoji-bg COLOR]
```

Requires: `pip install pilmoji emoji`

### Generate Social Media Meta Images

From logo:
```bash
python scripts/generate_og_images.py <output_dir> --image <source_image>
```

From text (with optional logo):
```bash
python scripts/generate_og_images.py <output_dir> \
  --text "Transform Your Business with AI" \
  --logo /path/to/logo.png \
  --bg-color "#4F46E5"
```

Generates: `og-image.png` (1200x630), `twitter-image.png` (1200x675), `og-square.png` (1200x1200)

### Delivering Assets

```bash
cp /home/claude/output/* /mnt/user-data/outputs/
```

Show generated HTML tags (favicons + Open Graph), then offer code integration (Pattern 7) and testing links (Pattern 8).

## Validation

Both scripts support `--validate` flag to check file sizes, dimensions, format, and WCAG contrast ratios before deployment:

```bash
python scripts/generate_og_images.py output/ --text "My Site" --validate
python scripts/generate_favicons.py logo.png output/ all --validate
```

Platform limits: Facebook/LinkedIn <8MB, Twitter <5MB. Contrast: WCAG AA minimum 4.5:1.

## Best Practices

- **Text length auto-scales font**: <=20 chars = 144px, 21-40 = 120px, 41-60 = 102px, >60 = 84px
- Logos should be square/nearly square PNG with transparency
- OG images must be accessible via HTTPS (not localhost) in production
- URLs in meta tags must be absolute

## Dependencies

```bash
pip install Pillow --break-system-packages
pip install pilmoji emoji --break-system-packages  # Only for emoji features
```
