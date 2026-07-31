import React, { useState } from 'react';
import { mergeAttributes } from '@tiptap/core';
import Image, { type ImageOptions } from '@tiptap/extension-image';

interface StrapiImageOptions extends ImageOptions {
  enableContentCheck: boolean;
}

export type ImageSize = 'default' | 'wide';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    strapiImageSize: {
      /** Sets the layout size of the selected image node. */
      setImageSize: (size: ImageSize) => ReturnType;
    };
  }
}
import { ReactNodeViewRenderer, NodeViewWrapper, useEditorState } from '@tiptap/react';
import type { NodeViewProps, Editor } from '@tiptap/react';
import { useIntl } from 'react-intl';
import { Image as ImageIcon } from '@strapi/icons';
import { ToolbarButton } from '../components/ToolbarButton';
import { MediaLibraryWrapper, StrapiFile } from '../components/MediaLibraryWrapper';
import { ImageNodeView } from '../components/ImageAltPopover';

export function ImageNodeViewReadOnly({ node }: NodeViewProps) {
  const rawWidth = node.attrs.width;
  const rawHeight = node.attrs.height;
  const width = typeof rawWidth === 'number' ? rawWidth : null;
  const height = typeof rawHeight === 'number' ? rawHeight : null;

  return (
    <NodeViewWrapper
      data-drag-handle
      data-size={node.attrs.size !== 'default' ? node.attrs.size : undefined}
    >
      <img
        src={node.attrs.src}
        alt={node.attrs.alt ?? ''}
        style={{
          maxWidth: width ? undefined : '100%',
          display: 'block',
          width: width ? `${width}px` : undefined,
          height: height ? `${height}px` : undefined,
        }}
        draggable={false}
      />
      {node.attrs.caption ? (
        <div style={{ textAlign: 'center', fontSize: '1.2rem', color: '#666', fontStyle: 'italic' }}>
          {node.attrs.caption}
        </div>
      ) : null}
    </NodeViewWrapper>
  );
}

export const StrapiImage = Image.extend<StrapiImageOptions>({
  addOptions() {
    return {
      ...(this as any).parent?.(),
      enableContentCheck: false,
    };
  },

  addAttributes() {
    return {
      ...(this as any).parent?.(),
      'data-asset-id': {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const raw = element.getAttribute('data-asset-id');
          if (raw === null) return null;
          const parsed = parseInt(raw, 10);
          return isNaN(parsed) ? null : parsed;
        },
        renderHTML: (attributes: Record<string, unknown>) => {
          const id = attributes['data-asset-id'];
          if (id === null || id === undefined) return {};
          return { 'data-asset-id': String(id) };
        },
      },
      // Optional figcaption text (replaces the former captionedImage node).
      // Not an HTML attribute: the node-level renderHTML emits it as a
      // <figcaption> element; parse recovers it from a wrapping <figure>.
      caption: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          element.closest('figure')?.querySelector('figcaption')?.textContent?.trim() || null,
        renderHTML: () => ({}),
      },
      // Layout size: 'default' = content column, 'wide' = symmetric breakout.
      // Default markup stays clean — data-size only emitted when non-default.
      size: {
        default: 'default',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-size') ?? 'default',
        renderHTML: (attributes: Record<string, unknown>) => {
          const size = attributes.size;
          if (!size || size === 'default') return {};
          return { 'data-size': size };
        },
      },
    };
  },

  addCommands() {
    return {
      setImageSize:
        (size: ImageSize) =>
        ({ commands }) =>
          commands.updateAttributes(this.name, { size }),
    };
  },

  renderHTML({ node, HTMLAttributes }) {
    const caption = typeof node.attrs.caption === 'string' && node.attrs.caption.trim() !== ''
      ? node.attrs.caption
      : null;
    const imgAttrs = mergeAttributes(this.options.HTMLAttributes, HTMLAttributes);
    if (!caption) {
      return ['img', imgAttrs];
    }
    return ['figure', { 'data-image-figure': '' }, ['img', imgAttrs], ['figcaption', caption]];
  },

  addNodeView() {
    if (this.options.enableContentCheck) {
      return ReactNodeViewRenderer(ImageNodeViewReadOnly);
    }
    return ReactNodeViewRenderer(ImageNodeView);
  },
});

export function useImage(
  editor: Editor | null,
  props: { disabled?: boolean } = { disabled: false }
) {
  const [showPicker, setShowPicker] = useState(false);
  const { formatMessage } = useIntl();

  const editorState = useEditorState({
    editor,
    selector: (ctx) => ({
      isInCodeBlock: ctx.editor?.isActive('codeBlock') ?? false,
    }),
  });

  function handleSelectAssets(assets: StrapiFile[]) {
    const asset = assets[0];
    const src = asset?.url?.trim();
    if (!asset || !editor || !src) {
      setShowPicker(false);
      return;
    }

    // Alt text fallback chain (IMG-03)
    const altText = asset.alternativeText ?? asset.name ?? '';
    // Tooltip title from the Media Library caption field, when the asset has one
    const title = asset.caption?.trim() || null;

    // Insert image and ensure a paragraph follows (research pitfall 2: cursor trapped at end of doc)
    editor
      .chain()
      .focus()
      .setImage({ src, alt: altText, title, 'data-asset-id': asset.id } as any)
      .createParagraphNear()
      .run();

    setShowPicker(false);
  }

  const imageButton = (
    <ToolbarButton
      onClick={() => setShowPicker(true)}
      icon={<ImageIcon />}
      active={false}
      disabled={props.disabled || !editor || (editorState?.isInCodeBlock ?? false)}
      tooltip={formatMessage({
        id: 'tiptap-editor.toolbar.insertImage',
        defaultMessage: 'Insert image',
      })}
    />
  );

  const imageDialog = (
    <MediaLibraryWrapper
      open={showPicker}
      onClose={() => setShowPicker(false)}
      onSelectAssets={handleSelectAssets}
    />
  );

  return { imageButton, imageDialog };
}
