import { Extensions } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import { TableKit } from '@tiptap/extension-table';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle, Color } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import { BaseHeadingWithSEOTag } from '../extensions/Heading';
import { PasteStripper } from '../extensions/PasteStripper';
import { StrapiImage } from '../extensions/Image';
import { CodeBlockWithFilename } from '../extensions/CodeBlock';
import { ColorHighlighter } from '../extensions/ColorHighlighter';
import { YoutubeEmbed } from '../extensions/Youtube';
import { Callout } from '../extensions/Callout';
import { CaptionedImage } from '../extensions/CaptionedImage';
import { CtaButton } from '../extensions/CtaButton';
import { TiptapPresetConfig, isFeatureEnabled, getFeatureOptions } from '../../../shared/types';

// Helper: converts a preset feature value to StarterKit's expected format
// false = disable the sub-extension, {} = enable with defaults
const starterKitFeatureValue = (
  value: TiptapPresetConfig[keyof TiptapPresetConfig]
): false | Record<string, unknown> => {
  if (!isFeatureEnabled(value)) {
    return false;
  }
  return getFeatureOptions(value, {}) ?? {};
};

export function buildExtensions(config: TiptapPresetConfig): Extensions {
  const starterKitConfig: Record<string, unknown> = {
    heading: false as const, // ALWAYS false — heading handled separately via BaseHeadingWithSEOTag
    codeBlock: false as const, // ALWAYS false — replaced by CodeBlockWithFilename below
    bold: starterKitFeatureValue(config.bold),
    italic: starterKitFeatureValue(config.italic),
    strike: starterKitFeatureValue(config.strike),
    code: starterKitFeatureValue(config.code),
    blockquote: starterKitFeatureValue(config.blockquote),
    bulletList: starterKitFeatureValue(config.bulletList),
    orderedList: starterKitFeatureValue(config.orderedList),
    hardBreak: starterKitFeatureValue(config.hardBreak),
    horizontalRule: starterKitFeatureValue(config.horizontalRule),
    // StarterKit v3 bundles these (v2 had them standalone): underline replaces
    // the @tiptap/extension-underline import, undoRedo is the renamed history,
    // gapcursor stays on by default.
    underline: starterKitFeatureValue(config.underline),
    undoRedo: starterKitFeatureValue(config.history),
    link: !isFeatureEnabled(config.link)
      ? false
      : {
          openOnClick: false,
          ...getFeatureOptions(config.link, {}),
        },
  };

  // ColorHighlighter is decoration-only (hex color chips, no schema impact),
  // so it is always on — like gapcursor — rather than preset-gated.
  const extensions: Extensions = [StarterKit.configure(starterKitConfig), ColorHighlighter];

  if (isFeatureEnabled(config.codeBlock)) {
    // StarterKit's codeBlock is always off (see starterKitConfig): the custom
    // version adds the renderer-side `filename` attribute + a node view with
    // language/filename inputs.
    extensions.push(CodeBlockWithFilename.configure(getFeatureOptions(config.codeBlock, {}) ?? {}));
  }

  if (isFeatureEnabled(config.heading)) {
    const headingConfig = getFeatureOptions(config.heading, {
      levels: [1, 2, 3, 4, 5, 6] as const,
    });
    const levels = headingConfig?.levels || [1, 2, 3, 4, 5, 6];
    extensions.push(BaseHeadingWithSEOTag.configure({ levels }));
  }

  if (isFeatureEnabled(config.superscript)) {
    extensions.push(Superscript);
  }

  if (isFeatureEnabled(config.subscript)) {
    extensions.push(Subscript);
  }

  if (isFeatureEnabled(config.table)) {
    extensions.push(
      TableKit.configure({
        table: {
          resizable: true,
          ...getFeatureOptions(config.table, {}),
        },
      })
    );
  }

  if (isFeatureEnabled(config.textAlign)) {
    const textAlignConfig = getFeatureOptions(config.textAlign, {
      types: ['heading', 'paragraph'],
      alignments: ['left', 'center', 'right', 'justify'],
    });
    extensions.push(
      TextAlign.configure({
        types: textAlignConfig?.types || ['heading', 'paragraph'],
        alignments: textAlignConfig?.alignments || ['left', 'center', 'right', 'justify'],
      })
    );
  }

  const needsTextStyle =
    isFeatureEnabled(config.textColor) || isFeatureEnabled(config.highlightColor);
  if (needsTextStyle) {
    extensions.push(TextStyle);
    extensions.push(PasteStripper);
  }
  if (isFeatureEnabled(config.textColor)) {
    extensions.push(Color);
  }
  if (isFeatureEnabled(config.highlightColor)) {
    extensions.push(Highlight.configure({ multicolor: true }));
  }
  if (isFeatureEnabled(config.mediaLibrary)) {
    const mediaOpts = getFeatureOptions(config.mediaLibrary, {});
    extensions.push(StrapiImage.configure(mediaOpts ?? {}));
  } else {
    extensions.push(StrapiImage.configure({ enableContentCheck: true }));
  }

  // Custom block nodes shared with the web renderer
  // (apps/web/app/tiptap/{youtube,custom-nodes}.ts — keep schemas in sync).
  if (isFeatureEnabled(config.youtube)) {
    extensions.push(YoutubeEmbed);
  }
  if (isFeatureEnabled(config.callout)) {
    extensions.push(Callout);
  }
  if (isFeatureEnabled(config.captionedImage)) {
    extensions.push(CaptionedImage);
  }
  if (isFeatureEnabled(config.ctaButton)) {
    extensions.push(CtaButton);
  }

  return extensions;
}
